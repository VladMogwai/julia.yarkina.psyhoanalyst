"use client";

import { useSyncExternalStore } from "react";
import type { QuizLocale } from "../config";
import type { QuizContent } from "../content/types";
import { Quiz } from "./Quiz";
import { ScrollQuiz } from "./ScrollQuiz";

/** Wide screens with a mouse get the scroll version; phones and tablets keep the swipeable cards. */
const DESKTOP_QUERY = "(min-width: 1024px) and (pointer: fine)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function QuizExperience({ locale, content }: { locale: QuizLocale; content: QuizContent }) {
  // null on the server: the layout depends on the device, so it is decided in the browser.
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null,
  );

  if (isDesktop === null) return null;
  return isDesktop ? <ScrollQuiz locale={locale} content={content} /> : <Quiz locale={locale} content={content} />;
}
