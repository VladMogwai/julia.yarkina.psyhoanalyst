import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Quiz } from "@/quiz/components/Quiz";
import { defaultQuizLocale, isQuizLocale, quizEnabled, quizIndexable, quizLocales, quizSiteUrl } from "@/quiz/config";
import { getQuizContent } from "@/quiz/content";

export async function generateMetadata({ params }: PageProps<"/quiz/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isQuizLocale(lang) || !quizEnabled) return {};
  const { meta } = getQuizContent(lang);

  return {
    metadataBase: new URL(quizSiteUrl),
    title: meta.title,
    description: meta.description,
    robots: quizIndexable ? undefined : { index: false, follow: false },
    alternates: {
      canonical: `/quiz/${lang}`,
      languages: {
        ...Object.fromEntries(quizLocales.map((locale) => [locale, `/quiz/${locale}`])),
        "x-default": `/quiz/${defaultQuizLocale}`,
      },
    },
  };
}

export default async function QuizPage({ params }: PageProps<"/quiz/[lang]">) {
  const { lang } = await params;
  if (!isQuizLocale(lang) || !quizEnabled) notFound();

  return <Quiz locale={lang} content={getQuizContent(lang)} />;
}
