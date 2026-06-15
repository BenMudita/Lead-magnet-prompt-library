"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";

export function CheckoutButton({ redirect = "/promptlibrary" }: { redirect?: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function checkout() {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirect }),
    });
    if (response.ok) {
      setMessage("Demo checkout complete. Pro access unlocked.");
      router.push(redirect);
      router.refresh();
    } else {
      setMessage("Checkout could not start. Stripe keys are needed for production checkout.");
    }
  }

  return (
    <div>
      <button type="button" className="primary-action" onClick={checkout}>
        <CreditCard className="icon-sm" aria-hidden="true" />
        Unlock Pro
      </button>
      {message ? <p className="inline-status">{message}</p> : null}
    </div>
  );
}
