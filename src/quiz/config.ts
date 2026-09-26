/**
 * The questionnaire is a self-contained mini app: it only lives in `src/quiz/` and `src/app/quiz/`.
 * From outside it uses only `src/premium/` (the paid-access module): its questions are paid content
 * from the "Self-knowledge" section, loaded from Supabase for buyers.
 *
 * To switch it off, set the build variable QUIZ_ENABLED=false: every /quiz page then renders a 404.
 * To remove it completely, delete both folders and `public/quiz/` (the /quiz → /quiz/uk redirect page).
 */
export const quizEnabled = process.env.QUIZ_ENABLED !== "false";

export const quizSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://yarkina-psy.online").replace(/\/$/, "");

/** "Book a session" at the end of a topic: Julia's Telegram, the same as on the main site. */
export const quizBookingUrl = "https://t.me/yarkinayuliya";

/** Hidden from search engines while the texts are placeholders. */
export const quizIndexable = false;

/** Ukrainian is the main language: /quiz opens it. */
export const quizLocales = ["uk", "en", "fr", "ru", "ro"] as const;

export const defaultQuizLocale = "uk";

export type QuizLocale = (typeof quizLocales)[number];

export function isQuizLocale(value: string): value is QuizLocale {
  return (quizLocales as readonly string[]).includes(value);
}
