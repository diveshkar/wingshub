"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Status = "idle" | "submitting" | "success" | "error";

type ContactFormProps = {
  /** Must match the static form declared in public/__forms.html. */
  formName: string;
  endpoint: string;
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

/**
 * Posts to the static form declared in public/__forms.html, which is how Netlify Forms
 * picks up submissions from a Next.js app. Nothing is sent anywhere until deployed on Netlify.
 */
export function ContactForm({ formName, endpoint, fallbackEmail, copy }: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
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

    // Plain text only, trimmed and cut to the same limits the fields have.
    const body = new URLSearchParams({ "form-name": formName });
    for (const [key, value] of data.entries()) {
      if (typeof value !== "string" || !(key in LIMITS)) continue;
      body.append(key, value.trim().slice(0, LIMITS[key]));
    }
    lastSent.current = Date.now();

    setStatus("submitting");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(`Form submission failed (${response.status})`);
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
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

        {status === "error" && (
          <p
            role="alert"
            className="rounded-md bg-flame-500/10 px-4 py-3 text-sm font-medium text-ember-600"
          >
            Something went wrong sending your message. Please try again, or email us directly at{" "}
            <a href={`mailto:${fallbackEmail}`} className="underline underline-offset-4">
              {fallbackEmail}
            </a>
            .
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
