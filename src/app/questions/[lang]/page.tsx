import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizExperience } from "@/quiz/components/QuizExperience";
import { defaultQuizLocale, isQuizLocale, quizEnabled, quizIndexable, quizLocales, quizSiteUrl } from "@/quiz/config";
import { getQuizContent } from "@/quiz/content";

export async function generateMetadata({ params }: PageProps<"/questions/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isQuizLocale(lang) || !quizEnabled) return {};
  const { meta } = getQuizContent(lang);

  return {
    metadataBase: new URL(quizSiteUrl),
    title: meta.title,
    description: meta.description,
    robots: quizIndexable ? undefined : { index: false, follow: false },
    alternates: {
      canonical: `/questions/${lang}`,
      languages: {
        ...Object.fromEntries(quizLocales.map((locale) => [locale, `/questions/${locale}`])),
        "x-default": `/questions/${defaultQuizLocale}`,
      },
    },
  };
}

export default async function QuizPage({ params }: PageProps<"/questions/[lang]">) {
  const { lang } = await params;
  if (!isQuizLocale(lang) || !quizEnabled) notFound();

  return <QuizExperience locale={lang} content={getQuizContent(lang)} />;
}
