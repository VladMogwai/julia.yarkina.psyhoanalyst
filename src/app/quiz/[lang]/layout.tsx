import { Onest, Source_Serif_4 } from "next/font/google";
import { notFound } from "next/navigation";
import { isQuizLocale, quizLocales } from "@/quiz/config";
import "../quiz.css";

// Newsreader and DM Sans from the design have no Cyrillic; these are the closest Cyrillic-capable matches.
// latin-ext carries the Romanian ș, ț, ă, î, â.
const display = Source_Serif_4({
  subsets: ["latin", "latin-ext", "cyrillic"],
  axes: ["opsz"],
  variable: "--font-quiz-display",
});

const sans = Onest({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-quiz-sans",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return quizLocales.map((lang) => ({ lang }));
}

export default async function QuizLayout({ children, params }: LayoutProps<"/quiz/[lang]">) {
  const { lang } = await params;
  if (!isQuizLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
