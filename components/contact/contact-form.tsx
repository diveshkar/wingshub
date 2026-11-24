"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Status = "idle" | "submitting" | "success" | "error";

type ContactFormProps = {
  /** Where the message is posted: the site's own Cloudflare Function (functions/api/contact.ts). */
  endpoint: string;
  /** The public key of the Cloudflare Turnstile check. Empty means the check is switched off. */
  turnstileSiteKey: string;
  fallbackEmail: string;
  copy: {
    title: string;
    description: string;
    submitLabel: string;
    successTitle: string;
    successMessage: string;
    privacyNote: string | null;
  };
};

/** Longest value each field may have. Fields that are not listed here are not sent. */
const LIMITS: Record<string, number> = { name: 100, email: 254, phone: 30, message: 5000 };

const card = "rounded-xl border border-ink-900/10 bg-bone-50 p-6 sm:p-8";

const controlStyles =
  "w-full rounded-md border border-ink-900/25 bg-white px-4 text-base text-ink-900 transition-colors hover:border-ink-900/50 focus:border-ink-900";

type FieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  required?: boolean;
  rows?: number;
  /** The most characters the field accepts. Enforced here and again before sending. */
  maxLength: number;
};

/** Five seconds of grace after a send, so a double click or a script cannot post the form twice. */
const MIN_GAP_MS = 5000;

function Field({ label, name, type = "text", autoComplete, required, rows, maxLength }: FieldProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-display text-sm font-bold">
        {label}
        {required && (
          <span aria-hidden="true" className="text-ember-600">
            {" "}
            *
          </span>
        )}
      </label>
      {rows ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          required={required}
          maxLength={maxLength}
          className={cn(controlStyles, "min-h-36 resize-y py-3")}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={cn(controlStyles, "h-12")}
        />
      )}
    </div>
  );
}

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare Turnstile: a free, usually invisible check that the visitor is a person. It hands back a token
 * that the Function verifies on the server. The token works once, so the parent replaces this component
 * (by changing its key) after every send.
 */
function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    let widgetId: string | undefined;
    let stopped = false;
    let retry: number | undefined;

    const draw = () => {
      if (stopped || widgetId || !window.turnstile) return;
      widgetId = window.turnstile.render(element, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onToken(""),
        // The check could not run (for example the connection dropped). Try again in a few seconds,
        // so the visitor is not left waiting for a token that will never come.
        "error-callback": () => {
          onToken("");
          window.clearTimeout(retry);
          retry = window.setTimeout(() => {
            if (!stopped && widgetId) window.turnstile?.reset(widgetId);
          }, 4000);
        },
      });
    };

    let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (window.turnstile) {
      draw();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = TURNSTILE_SRC;
        script.async = true;
        script.dataset.turnstile = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", draw);
    }

    return () => {
      stopped = true;
      window.clearTimeout(retry);
      script?.removeEventListener("load", draw);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken]);

  return <div ref={box} />;
}

/**
 * Sends the message to the site's own Cloudflare Function, which checks it again and emails it to the
 * restaurant (see functions/api/contact.ts). Nothing is sent to anyone else.
 */
export function ContactForm({ endpoint, turnstileSiteKey, fallbackEmail, copy }: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [problem, setProblem] = useState<"send" | "check">("send");
  const [token, setToken] = useState("");
  const [challenge, setChallenge] = useState(0);
  const lastSent = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (status === "submitting" || Date.now() - lastSent.current < MIN_GAP_MS) return;

    const data = new FormData(form);
    // Real visitors never see the hidden field. If it has anything in it, a script filled it in:
    // pretend it worked and send nothing.
    if (String(data.get("bot-field") ?? "").trim() !== "") {
      form.reset();
      setStatus("success");
      return;
    }

    if (!endpoint) {
      setProblem("send");
      setStatus("error");
      return;
    }

    // The security check has not finished yet: ask the visitor to wait a moment. The check is also started
    // again, in case the first one never got going (a connection that dropped, for example).
    if (turnstileSiteKey && !token) {
      setProblem("check");
      setStatus("error");
      setChallenge((count) => count + 1);
      return;
    }

    // Plain text only, trimmed and cut to the same limits the fields have.
    const message: Record<string, string> = {};
    for (const [key, value] of data.entries()) {
      if (typeof value !== "string" || !(key in LIMITS)) continue;
      message[key] = value.trim().slice(0, LIMITS[key]);
    }
    if (turnstileSiteKey) message.turnstileToken = token;
    lastSent.current = Date.now();

    setStatus("submitting");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error(`Form submission failed (${response.status})`);
      form.reset();
      setStatus("success");
    } catch {
      setProblem("send");
      setStatus("error");
    } finally {
      // The token can only be used once: get a fresh check ready for the next try.
      setToken("");
      setChallenge((count) => count + 1);
    }
  }

  if (status === "success") {
    return (
      <div role="status" className={cn(card, "text-center sm:py-12")}>
        <CircleCheck aria-hidden="true" className="mx-auto size-10 text-ember-600" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-2xl font-extrabold">{copy.successTitle}</h2>
        <p className="mx-auto mt-2 max-w-sm font-serif text-lg text-ink-500">{copy.successMessage}</p>
        <Button variant="outline-dark" className="mt-6" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className={card}>
      <h2 className="font-display text-2xl font-extrabold">{copy.title}</h2>
      <p className="mt-1.5 font-serif text-lg text-ink-500">{copy.description}</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" name="name" autoComplete="name" maxLength={LIMITS.name} required />
          <Field label="Email" name="email" type="email" autoComplete="email" maxLength={LIMITS.email} required />
        </div>
        <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" maxLength={LIMITS.phone} />
        <Field label="Message" name="message" rows={5} maxLength={LIMITS.message} required />

        <p className="hidden" aria-hidden="true">
          <label>
            Leave this field empty
            <input name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </p>

        {turnstileSiteKey && <Turnstile key={challenge} siteKey={turnstileSiteKey} onToken={setToken} />}

        {status === "error" && (
          <p
            role="alert"
            className="rounded-md bg-flame-500/10 px-4 py-3 text-sm font-medium text-ember-600"
          >
            {problem === "check" ? (
              "Please wait a moment for the security check to finish, then send your message again."
            ) : (
              <>
                Something went wrong sending your message. Please try again, or email us directly at{" "}
                <a href={`mailto:${fallbackEmail}`} className="underline underline-offset-4">
                  {fallbackEmail}
                </a>
                .
              </>
            )}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Button type="submit" size="lg" disabled={status === "submitting"}>
            {status === "submitting" && (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            )}
            {status === "submitting" ? "Sending..." : copy.submitLabel}
          </Button>
          {copy.privacyNote && <p className="text-sm text-ink-500">{copy.privacyNote}</p>}
        </div>
      </form>
    </div>
  );
}
