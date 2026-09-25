import type { QuizLocale } from "../config";
import { fr } from "./fr";
import { ru } from "./ru";
import type { QuizContent } from "./types";
import { uk } from "./uk";

const contents: Record<QuizLocale, QuizContent> = { ru, uk, fr };

export function getQuizContent(locale: QuizLocale): QuizContent {
  return contents[locale];
}
