"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadPremiumContent, sendCode, signOut, useSession, verifyCode } from "@/premium/access";
import type { QuizLocale } from "../config";
import type { QuizTexts, ReflectionQuestion } from "../content/types";
import { MobileQuiz } from "./MobileQuiz";
import { ScrollQuiz } from "./ScrollQuiz";

/** Wide screens with a mouse get the scroll version; phones and tablets get the card over drifting streams. */
const DESKTOP_QUERY = "(min-width: 1024px) and (pointer: fine)";

/** The product in the "Self-knowledge" section that unlocks the questions. */
const PRODUCT = "questions-to-self";

/** The section lives on the main site, in the same five languages. */
const sectionUrl = (locale: QuizLocale) => `/${locale}/self-knowledge/`;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function QuizExperience({ locale, content }: { locale: QuizLocale; content: QuizTexts }) {
  // null on the server: the layout depends on the device, so it is decided in the browser.
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null,
  );

  // The questions are paid: the database returns them only to a signed-in buyer. Signing in on the
  // locked screen asks for them again.
  const [questions, setQuestions] = useState<ReflectionQuestion[] | null | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    loadPremiumContent<ReflectionQuestion[]>(PRODUCT, locale).then(setQuestions);
  }, [locale, attempt]);

  if (isDesktop === null || questions === undefined) return null;
  if (questions === null) {
    return <Locked locale={locale} content={content} onSignedIn={() => setAttempt((count) => count + 1)} />;
  }

  const full = { ...content, reflectionQuestions: questions };
  return isDesktop ? <ScrollQuiz locale={locale} content={full} /> : <MobileQuiz locale={locale} content={full} />;
}

/**
 * Shown instead of the questions to people without access. Signed out, it lets them sign in right here
 * (a returning buyer needs nothing else); signed in without access, it says so and leads to the section
 * to get the questions, or lets them sign out to try another email.
 */
function Locked({ locale, content, onSignedIn }: { locale: QuizLocale; content: QuizTexts; onSignedIn: () => void }) {
  const { reflection } = content;
  const texts = getDictionary(locale).selfKnowledge;
  const session = useSession();

  // Once someone signs in here, the questions are asked for again: a buyer sees them at once.
  const wasSignedOut = useRef(false);
  useEffect(() => {
    if (session === null) wasSignedOut.current = true;
    else if (session && wasSignedOut.current) {
      wasSignedOut.current = false;
      onSignedIn();
    }
  }, [session, onSignedIn]);

  return (
    <main className="grid min-h-dvh place-items-center bg-forest px-6 py-12 text-cream">
      <div className="w-full max-w-md">
        <p className="text-sm tracking-[0.12em] uppercase opacity-70">{content.wordmark}</p>
        <h1 className="display mt-4 text-4xl sm:text-5xl">{reflection.lockedTitle}</h1>
        {session === null && (
          <>
            <p className="mt-6 text-lg leading-relaxed opacity-80">{reflection.lockedText}</p>
            <LockedSignIn texts={texts} />
          </>
        )}
        {session && (
          <>
            <p className="mt-6 text-lg leading-relaxed opacity-80">
              {reflection.lockedNoAccess.replace("{email}", session.user.email ?? "")}
            </p>
            <button type="button" onClick={() => signOut()} className="mt-4 text-sm underline opacity-70 hover:opacity-100">
              {texts.signOut}
            </button>
          </>
        )}
        <a
          href={sectionUrl(locale)}
          className="mt-10 inline-flex rounded-full bg-cream px-7 py-4 text-forest transition-colors hover:bg-mint"
        >
          {reflection.lockedCta}
        </a>
      </div>
    </main>
  );
}

type SignInTexts = ReturnType<typeof getDictionary>["selfKnowledge"];

/** Passwordless sign-in in the questionnaire's own look: an email, then the code (or the button) from the letter. */
function LockedSignIn({ texts }: { texts: SignInTexts }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "email") {
        await sendCode(email.trim());
        setStep("code");
      } else await verifyCode(email.trim(), code.trim());
    } catch {
      setError(step === "email" ? texts.sendError : texts.wrongCode);
    } finally {
      setBusy(false);
    }
  }

  const field = "min-w-0 flex-1 rounded-full border border-cream/25 bg-cream/10 px-5 py-3 text-cream placeholder:text-cream/40";
  return (
    <form onSubmit={submit} className="mt-8 grid gap-3">
      <label className="text-sm opacity-80" htmlFor={step === "email" ? "locked-email" : "locked-code"}>
        {step === "email" ? texts.emailLabel : texts.codeSent.replace("{email}", email)}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        {step === "email" ? (
          <input
            id="locked-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={field}
          />
        ) : (
          <input
            id="locked-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="[0-9]{6,10}"
            aria-label={texts.codeLabel}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className={`${field} tracking-[0.3em]`}
          />
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full border border-cream/60 px-6 py-3 transition-colors hover:bg-cream hover:text-forest disabled:opacity-60"
        >
          {step === "email" ? texts.sendCode : texts.verify}
        </button>
      </div>
      {step === "code" && (
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError("");
          }}
          className="justify-self-start text-sm underline opacity-70 hover:opacity-100"
        >
          {texts.otherEmail}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-[#f3b4a8]">
          {error}
        </p>
      )}
    </form>
  );
}
