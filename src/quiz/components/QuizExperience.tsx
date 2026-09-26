"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { loadPremiumContent } from "@/premium/access";
import type { QuizLocale } from "../config";
import type { QuizTexts, ReflectionQuestion } from "../content/types";
import { MobileQuiz } from "./MobileQuiz";
import { ScrollQuiz } from "./ScrollQuiz";

/** Wide screens with a mouse get the scroll version; phones and tablets get the card over drifting streams. */
const DESKTOP_QUERY = "(min-width: 1024px) and (pointer: fine)";

/** The product in the "Self-knowledge" section that unlocks the questions. */
const PRODUCT = "questions-to-self";

/** The section lives on the main site, which has Ukrainian, Russian and French. */
const sectionUrl = (locale: QuizLocale) => `/${locale === "uk" || locale === "ru" ? locale : "fr"}/self-knowledge/`;

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

  // The questions are paid: the database returns them only to a signed-in buyer.
  const [questions, setQuestions] = useState<ReflectionQuestion[] | null | undefined>(undefined);
  useEffect(() => {
    loadPremiumContent<ReflectionQuestion[]>(PRODUCT, locale).then(setQuestions);
  }, [locale]);

  if (isDesktop === null || questions === undefined) return null;
  if (questions === null) return <Locked locale={locale} content={content} />;

  const full = { ...content, reflectionQuestions: questions };
  return isDesktop ? <ScrollQuiz locale={locale} content={full} /> : <MobileQuiz locale={locale} content={full} />;
}

function Locked({ locale, content }: { locale: QuizLocale; content: QuizTexts }) {
  const { reflection } = content;
  return (
    <main className="grid min-h-dvh place-items-center bg-forest px-6 text-cream">
      <div className="max-w-md">
        <p className="text-sm tracking-[0.12em] uppercase opacity-70">{content.wordmark}</p>
        <h1 className="display mt-4 text-5xl">{reflection.lockedTitle}</h1>
        <p className="mt-6 text-lg leading-relaxed opacity-80">{reflection.lockedText}</p>
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
