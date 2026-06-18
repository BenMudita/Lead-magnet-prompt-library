"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountStatus, UserRole } from "@/lib/types";

type SessionFormProps = {
  mode: "signup" | "login";
  defaultEmail?: string;
  admin?: boolean;
  redirectTo?: string;
  submitLabel?: string;
  className?: string;
  onPendingConfirmation?: (email: string) => void;
};

export function SessionForm({
  mode,
  defaultEmail = "",
  admin = false,
  redirectTo = "/promptlibrary",
  submitLabel,
  className,
  onPendingConfirmation,
}: SessionFormProps) {
  const emailInputId = useId();
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const accountStatus: AccountStatus = admin ? "pro" : "free";
    const role: UserRole = admin ? "admin" : "member";
    const params = new URLSearchParams(window.location.search);

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(admin ? "/api/session/admin-demo" : "/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          admin
            ? { email }
            : {
                accountStatus,
                role,
                email,
                redirectTo,
                signupUrl: window.location.href,
                referrer: document.referrer,
                utmSource: params.get("utm_source") ?? undefined,
                utmMedium: params.get("utm_medium") ?? undefined,
                utmCampaign: params.get("utm_campaign") ?? undefined,
              },
        ),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        if (payload.pendingConfirmation) {
          setMessage(payload.message ?? "Check your email for the sign-in link.");
          onPendingConfirmation?.(email);
          return;
        }
        router.push(redirectTo);
        router.refresh();
      } else {
        setMessage(payload.message ?? `${mode === "signup" ? "Signup" : "Login"} failed.`);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={className ? `auth-form ${className}` : "auth-form"} onSubmit={submit}>
      <label className="field-label" htmlFor={emailInputId}>
        Email
      </label>
      <input id={emailInputId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <button type="submit" className="primary-action" disabled={isSubmitting}>
        {isSubmitting
          ? "Sending..."
          : submitLabel ?? (admin ? "Enter admin demo" : mode === "signup" ? "Create free account" : "Email me a sign-in link")}
      </button>
      {!admin && mode === "signup" ? <p className="form-reassurance">No payment required.</p> : null}
      {message ? <p className="inline-status">{message}</p> : null}
    </form>
  );
}
