"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function CheckoutButton({ redirect = "/promptlibrary" }: { redirect?: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function checkout() {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirect }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      if (payload.redirectUrl) {
        window.location.href = payload.redirectUrl;
        return;
      }
      setMessage(payload.message ?? "Free account access is ready.");
      router.push(payload.redirect ?? redirect);
      router.refresh();
    } else {
      if (payload.redirectUrl) {
        router.push(payload.redirectUrl);
        return;
      }
      setMessage(payload.message ?? "Create a free account to use the library.");
    }
  }

  return (
    <div>
      <button type="button" className="primary-action" onClick={checkout}>
        <Sparkles className="icon-sm" aria-hidden="true" />
        Continue free
      </button>
      {message ? <p className="inline-status">{message}</p> : null}
    </div>
  );
}
