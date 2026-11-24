/**
 * Cloudflare Pages Function: receives the contact form (POST /api/contact) and emails it to the restaurant.
 *
 * The rest of the site is static files, so this is the only code that runs on a server. It is deliberately
 * small and strict: it only accepts a JSON POST from the site's own address, checks every field again (the
 * browser's checks can be skipped by anyone), optionally checks a Cloudflare Turnstile token, and sends one
 * plain-text email through Brevo. Nothing is stored.
 *
 * Settings (Cloudflare Pages > Settings > Variables and secrets):
 *   BREVO_API_KEY         secret. An API key from brevo.com (SMTP & API > API keys). Required.
 *   CONTACT_TO            who receives the messages. Default info@wingshub.ca
 *   CONTACT_FROM_EMAIL    the sender address. It must be a verified sender in Brevo. Default info@wingshub.ca
 *   CONTACT_FROM_NAME     the sender name shown in the inbox. Default "Wings Hub website"
 *   ALLOWED_ORIGINS       comma-separated addresses the form may be sent from. Default https://wingshub.ca,https://www.wingshub.ca
 *   TURNSTILE_SECRET_KEY  secret. When set, every message must carry a valid Turnstile token.
 */

type Env = {
  BREVO_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
  ALLOWED_ORIGINS?: string;
  TURNSTILE_SECRET_KEY?: string;
};

type Context = { request: Request; env: Env };

const DEFAULT_TO = "info@wingshub.ca";
const DEFAULT_FROM_EMAIL = "info@wingshub.ca";
const DEFAULT_FROM_NAME = "Wings Hub website";
const DEFAULT_ORIGINS = "https://wingshub.ca,https://www.wingshub.ca";

/** The same limits as the form in the browser (components/contact/contact-form.tsx). */
const LIMITS = { name: 100, email: 254, phone: 30, message: 5000 } as const;
/** The whole request, in characters. A real message is a few hundred. */
const MAX_BODY = 16_000;

const EMAIL = /^[^\s@<>"',;:()[\]\\]+@[^\s@<>"',;:()[\]\\]+\.[^\s@<>"',;:()[\]\\]{2,}$/;
const PHONE = /^[0-9+()\-.\s]*$/;
/** Control characters have no place in a name or an email address. */
const CONTROL = /[\u0000-\u001f\u007f]/;
/** In the message, new lines and tabs are fine and the rest are not. */
const MESSAGE_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function reply(status: number, body: { ok: boolean; error?: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const asText = (value: unknown): string | null => (typeof value === "string" ? value.trim() : null);

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS)
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

async function passesTurnstile(secret: string, token: string, request: Request): Promise<boolean> {
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const result = (await response.json()) as { success?: boolean } | null;
    return result?.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  // 1. Only the site itself may post here, and only JSON.
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(env).includes(origin)) return reply(403, { ok: false, error: "forbidden" });
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) {
    return reply(415, { ok: false, error: "unsupported" });
  }

  // 2. Read a bounded amount, then parse.
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > MAX_BODY * 4) return reply(413, { ok: false, error: "too_large" });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply(413, { ok: false, error: "too_large" });

  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    data = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, error: "invalid" });
  }

  // 3. A hidden field only a script would fill in: say thanks and send nothing.
  const trap = asText(data["bot-field"]);
  if (trap) return reply(200, { ok: true });

  // 4. Check every field again.
  const name = asText(data.name);
  const email = asText(data.email);
  const phone = asText(data.phone) ?? "";
  const message = asText(data.message);

  if (!name || name.length > LIMITS.name || CONTROL.test(name)) return reply(400, { ok: false, error: "invalid_name" });
  if (!email || email.length > LIMITS.email || CONTROL.test(email) || !EMAIL.test(email)) {
    return reply(400, { ok: false, error: "invalid_email" });
  }
  if (phone.length > LIMITS.phone || !PHONE.test(phone)) return reply(400, { ok: false, error: "invalid_phone" });
  if (!message || message.length > LIMITS.message || MESSAGE_CONTROL.test(message)) {
    return reply(400, { ok: false, error: "invalid_message" });
  }

  // 5. Is it a person? (Only when Turnstile is set up.)
  if (env.TURNSTILE_SECRET_KEY) {
    const token = asText(data.turnstileToken);
    if (!token || token.length > 2048) return reply(400, { ok: false, error: "check_required" });
    if (!(await passesTurnstile(env.TURNSTILE_SECRET_KEY, token, request))) {
      return reply(403, { ok: false, error: "check_failed" });
    }
  }

  // 6. Send the email. The subject is fixed; the visitor's text only goes in the body.
  if (!env.BREVO_API_KEY) {
    console.error("contact: BREVO_API_KEY is not set");
    return reply(500, { ok: false, error: "not_configured" });
  }

  const body = [`Name: ${name}`, `Email: ${email}`, `Phone: ${phone || "not given"}`, "", message].join("\n");

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: env.CONTACT_FROM_NAME ?? DEFAULT_FROM_NAME, email: env.CONTACT_FROM_EMAIL ?? DEFAULT_FROM_EMAIL },
        to: [{ email: env.CONTACT_TO ?? DEFAULT_TO }],
        replyTo: { email, name },
        subject: "New message from the Wings Hub website",
        textContent: body,
      }),
    });
    if (!response.ok) {
      console.error(`contact: Brevo answered ${response.status}`);
      return reply(502, { ok: false, error: "send_failed" });
    }
  } catch (error) {
    console.error("contact: could not reach Brevo", error);
    return reply(502, { ok: false, error: "send_failed" });
  }

  return reply(200, { ok: true });
}

/** Anything other than POST. (Only POST has a handler above, so this answers the rest.) */
export function onRequest(): Response {
  return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json; charset=utf-8", Allow: "POST", "Cache-Control": "no-store" },
  });
}
