import type { QuizLocale } from "../config";
import { en } from "./en";
import { fr } from "./fr";
import { ru } from "./ru";
import type { QuizContent } from "./types";
import { uk } from "./uk";

const contents: Record<QuizLocale, QuizContent> = { uk, en, fr, ru };

export function getQuizContent(locale: QuizLocale): QuizContent {
  return contents[locale];
}
