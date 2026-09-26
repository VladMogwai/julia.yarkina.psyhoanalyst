import type { QuizLocale } from "../config";
import { en } from "./en";
import { fr } from "./fr";
import { ro } from "./ro";
import { ru } from "./ru";
import type { QuizTexts } from "./types";
import { uk } from "./uk";

// The questions themselves are paid content: they live in Supabase (supabase/seed/questions-to-self)
// and are loaded in the browser for buyers only, see QuizExperience.
const contents: Record<QuizLocale, QuizTexts> = { uk, en, fr, ru, ro };

export function getQuizContent(locale: QuizLocale): QuizTexts {
  return contents[locale];
}
