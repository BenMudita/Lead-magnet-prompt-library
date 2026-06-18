"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountStatus, UserRole } from "@/lib/types";

export function SessionForm({
  mode,
  defaultEmail = "member@muditastudios.com",
  admin = false,
  redirectTo = "/promptlibrary",
}: {
  mode: "signup" | "login";
  defaultEmail?: string;
  admin?: boolean;
  redirectTo?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accountStatus: AccountStatus = admin ? "pro" : "free";
    const role: UserRole = admin ? "admin" : "member";
    const response = await fetch(admin ? "/api/session/admin-demo" : "/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(admin ? { email } : { accountStatus, role, email, redirectTo }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      if (payload.pendingConfirmation) {
        setMessage(payload.message ?? "Check your email for the sign-in link.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } else {
      setMessage(payload.message ?? `${mode === "signup" ? "Signup" : "Login"} failed.`);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="field-label" htmlFor="email">
        Email
      </label>
      <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label className="check-row">
        <input type="checkbox" required />
        <span>I agree to the terms and privacy policy.</span>
      </label>
      <button type="submit" className="primary-action">
        {admin ? "Enter admin demo" : mode === "signup" ? "Create free account" : "Log in"}
      </button>
      {message ? <p className="inline-status">{message}</p> : null}
    </form>
  );
}
