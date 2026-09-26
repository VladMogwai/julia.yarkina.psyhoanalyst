import type { Metadata } from "next";
import Link from "next/link";
import { ProductCta } from "@/components/self-knowledge/ProductCta";
import { whatYouDontSee } from "@/content/what-you-dont-see";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";

const PRODUCT = "questions-to-self";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/self-knowledge/what-you-dont-see">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const text = whatYouDontSee[lang];
  return pageMetadata({
    locale: lang,
    path: "/self-knowledge/what-you-dont-see",
    title: text.metaTitle,
    description: text.metaDescription,
  });
}

/** Free page of the paid questionnaire: what it is, what it is not, and how to get it. */
export default async function WhatYouDontSeePage({
  params,
}: PageProps<"/[lang]/self-knowledge/what-you-dont-see">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const texts = getDictionary(locale).selfKnowledge;
  const text = whatYouDontSee[locale];
  const cta = {
    product: PRODUCT,
    locale,
    texts,
    openLabel: text.goToQuestions,
    soonLabel: text.soon,
  };

  return (
    <article className="pb-24">
      <header className="container-page pt-14 pb-14 md:pt-20">
        <Link
          href={`/${locale}/self-knowledge`}
          className="eyebrow link-underline"
        >
          {texts.title}
        </Link>
        <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium sm:text-7xl">
          {text.title}
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted">
          {text.subtitle}
        </p>
        <div className="mt-10">
          <ProductCta {...cta} />
        </div>
      </header>

      <section className="container-page">
        <div className="grid max-w-3xl gap-6 text-lg leading-relaxed">
          <h2 className="font-serif text-3xl font-medium">{text.welcome}</h2>
          <p>{text.intro[0]}</p>
          <p>{text.intro[1]}</p>
          <p className="font-serif text-3xl">{text.intro[2]}</p>
          <p>{text.intro[3]}</p>
          <ul className="my-4 grid gap-4">
            {text.whys.map((why) => (
              <li
                key={why}
                className="border-l-2 border-accent pl-5 font-serif text-2xl leading-snug italic"
              >
                {why}
              </li>
            ))}
          </ul>
          <p>{text.optics}</p>
        </div>
      </section>

      <section className="container-page mt-16">
        <div className="max-w-3xl rounded-2xl bg-sand p-7 sm:p-10">
          <h2 className="font-serif text-3xl font-medium">
            {text.noticeTitle}
          </h2>
          <div className="mt-6 grid gap-4 leading-relaxed">
            {text.notice.map((paragraph, index) => (
              <p
                key={paragraph}
                className={index === 0 ? "font-semibold" : undefined}
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-8 grid gap-4 rounded-xl border border-line bg-white p-6 leading-relaxed">
            {text.help.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <ProductCta {...cta} withSignIn />
      </section>

      <footer className="container-page mt-20">
        <div className="max-w-3xl border-t border-line pt-10 text-sm leading-relaxed text-muted">
          <h2 className="font-serif text-2xl font-medium text-ink">
            {text.copyrightTitle}
          </h2>
          <p className="mt-4">{text.copyright}</p>
          <p className="mt-4">{text.license}</p>
          <p className="mt-4">{text.forbiddenIntro}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {text.forbidden.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 font-semibold">{text.personal}</p>
          <p className="mt-4">{text.enforcement}</p>
        </div>
      </footer>
    </article>
  );
}
