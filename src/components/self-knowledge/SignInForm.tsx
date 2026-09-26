"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { sendCode, verifyCode } from "@/premium/access";

type Texts = Dictionary["selfKnowledge"];

/** Passwordless sign-in: an email, then the one-time code from the letter. */
export function SignInForm({ texts }: { texts: Texts }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendCode(email.trim());
      setStep("code");
    } catch {
      setError(texts.sendError);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verifyCode(email.trim(), code.trim());
    } catch {
      setError(texts.wrongCode);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-medium">{texts.signInTitle}</h2>
      {step === "email" ? (
        <form onSubmit={submitEmail} className="mt-4">
          <p className="text-muted">{texts.signInText}</p>
          <label className="mt-5 block text-sm font-semibold" htmlFor="sign-in-email">
            {texts.emailLabel}
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="sign-in-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1 rounded-full border border-line px-5 py-3"
            />
            <button type="submit" disabled={busy} className="button-primary disabled:opacity-60">
              {texts.sendCode}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-4">
          <p className="text-muted">{texts.codeSent.replace("{email}", email)}</p>
          <label className="mt-5 block text-sm font-semibold" htmlFor="sign-in-code">
            {texts.codeLabel}
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="sign-in-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="[0-9]{6,10}"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="min-w-0 flex-1 rounded-full border border-line px-5 py-3 tracking-[0.3em]"
            />
            <button type="submit" disabled={busy} className="button-primary disabled:opacity-60">
              {texts.verify}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
            className="link-underline mt-4 text-sm"
          >
            {texts.otherEmail}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
