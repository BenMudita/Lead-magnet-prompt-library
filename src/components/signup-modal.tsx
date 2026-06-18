"use client";

import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { SessionForm } from "@/components/session-form";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  redirectTo: string;
  promptTitle?: string;
};

export function SignupModal({ open, onClose, redirectTo, promptTitle }: SignupModalProps) {
  if (!open) return null;

  return <SignupModalContent onClose={onClose} redirectTo={redirectTo} promptTitle={promptTitle} />;
}

function SignupModalContent({ onClose, redirectTo, promptTitle }: Omit<SignupModalProps, "open">) {
  const titleId = useId();
  const [hasRequestedLink, setHasRequestedLink] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="signup-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="signup-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="signup-modal-head">
          <div>
            <p className="eyebrow">Free account</p>
            <h2 id={titleId}>{hasRequestedLink ? "Check your email" : "Unlock every prompt"}</h2>
          </div>
          <button type="button" className="secondary-action icon-only modal-close" onClick={onClose} aria-label="Close signup">
            <X className="icon-sm" aria-hidden="true" />
          </button>
        </div>
        <p className="signup-modal-copy">
          {hasRequestedLink
            ? "Verify the link and this page will reopen with the prompt unlocked."
            : "Enter your email once. After verification, every prompt in the library unlocks."}
        </p>
        {promptTitle && !hasRequestedLink ? (
          <p className="signup-modal-note">
            <span>Unlocking</span>
            {promptTitle}
          </p>
        ) : null}
        <SessionForm
          mode="signup"
          redirectTo={redirectTo}
          submitLabel="Email me access"
          className="modal-auth-form"
          onPendingConfirmation={() => setHasRequestedLink(true)}
        />
      </section>
    </div>
  );
}

export function SignupModalTrigger({
  children,
  className,
  redirectTo,
  promptTitle,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  redirectTo: string;
  promptTitle?: string;
  ariaLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setIsOpen(true)} aria-label={ariaLabel}>
        {children}
      </button>
      <SignupModal open={isOpen} onClose={() => setIsOpen(false)} redirectTo={redirectTo} promptTitle={promptTitle} />
    </>
  );
}
