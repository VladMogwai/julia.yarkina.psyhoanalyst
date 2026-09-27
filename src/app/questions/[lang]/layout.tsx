import { Golos_Text, Unbounded } from "next/font/google";
import { notFound } from "next/navigation";
import { isQuizLocale, quizLocales } from "@/quiz/config";
import "../quiz.css";

// Both carry Cyrillic and latin-ext (the Romanian ș, ț, ă, î, â and French accents).
// Unbounded, a wide modern grotesque, for questions and headings; Golos Text for everything else.
const display = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-quiz-display",
});

const sans = Golos_Text({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-quiz-sans",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return quizLocales.map((lang) => ({ lang }));
}

export default async function QuizLayout({ children, params }: LayoutProps<"/questions/[lang]">) {
  const { lang } = await params;
  if (!isQuizLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
