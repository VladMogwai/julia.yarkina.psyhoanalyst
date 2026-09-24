import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingButton } from "@/components/BookingButton";
import { portrait } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { about } = getDictionary(lang);
  return pageMetadata({
    locale: lang,
    path: "/about",
    title: about.metaTitle,
    description: about.metaDescription,
    image: portrait.src,
  });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const { person, about } = getDictionary(locale);

  return (
    <>
      {/* Portrait and introduction */}
      <section className="container-page grid gap-12 pt-14 pb-20 md:grid-cols-[0.9fr_1.1fr] md:pt-20">
        <Image
          src={portrait.src}
          width={portrait.width}
          height={portrait.height}
          alt={`${person.name}, ${person.role.toLowerCase()}`}
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="aspect-[4/5] w-full rounded-t-full object-cover object-top"
        />
        <div className="md:pt-10">
          <p className="eyebrow">{person.role}</p>
          <h1 className="mt-4 font-serif text-5xl font-medium sm:text-6xl">{person.name}</h1>
          <div className="mt-8 space-y-5 text-lg leading-relaxed">
            {about.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-2">
            {about.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="eyebrow">{fact.label}</dt>
                <dd className="mt-1">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <BookingButton locale={locale} className="mt-10" />
        </div>
      </section>

      {/* Topics */}
      <section className="border-y border-line/70 bg-sand/40">
        <div className="container-page py-20 md:py-24">
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">{about.topicsTitle}</h2>
          <ul className="mt-10 grid gap-x-10 md:grid-cols-2">
            {about.topics.map((topic) => (
              <li key={topic} className="border-t border-line py-5 text-lg leading-snug">
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Approach */}
      <section className="container-page grid gap-10 py-20 md:grid-cols-[0.8fr_1.2fr] md:py-24">
        <h2 className="font-serif text-4xl font-medium sm:text-5xl">{about.approachTitle}</h2>
        <div className="space-y-6 text-lg leading-relaxed">
          {about.approach.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="container-page grid gap-10 border-t border-line/70 py-20 md:grid-cols-[0.8fr_1.2fr] md:py-24">
        <h2 className="font-serif text-4xl font-medium sm:text-5xl">{about.educationTitle}</h2>
        <div>
          <ul className="space-y-5 leading-relaxed">
            {about.education.map((item) => (
              <li
                key={item}
                className="relative pl-6 before:absolute before:top-3 before:left-0 before:h-px before:w-3 before:bg-accent"
              >
                {item}
              </li>
            ))}
          </ul>
          <Link href={`/${locale}/certificates`} className="link-underline mt-10 inline-block font-semibold">
            {about.certificatesLink} →
          </Link>
        </div>
      </section>
    </>
  );
}
