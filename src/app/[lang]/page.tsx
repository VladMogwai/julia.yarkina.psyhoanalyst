import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingButton } from "@/components/BookingButton";
import { JsonLd } from "@/components/JsonLd";
import { SectionTile } from "@/components/SectionTile";
import { images, pexelsSrcSet, pexelsUrl } from "@/config/images";
import { bookingUrl, portrait } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata, personJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { home } = getDictionary(lang);

  return {
    ...pageMetadata({
      locale: lang,
      path: "",
      title: home.metaTitle,
      description: home.metaDescription,
      image: portrait.src,
    }),
    title: { absolute: home.metaTitle },
  };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const { person, nav, home } = getDictionary(locale);

  const tiles = [
    { label: nav.about, href: `/${locale}/about`, imageSrc: portrait.src, showWholeImage: true },
    {
      label: home.howLink,
      href: "#how",
      imageSrc: pexelsUrl(images.approach, 1280),
      imageSrcSet: pexelsSrcSet(images.approach),
    },
    {
      label: nav.articles,
      href: `/${locale}/articles`,
      imageSrc: pexelsUrl(images.articles, 1280),
      imageSrcSet: pexelsSrcSet(images.articles),
    },
    {
      label: nav.videos,
      href: `/${locale}/videos`,
      imageSrc: pexelsUrl(images.videos, 1280),
      imageSrcSet: pexelsSrcSet(images.videos),
    },
    {
      label: nav.certificates,
      href: `/${locale}/certificates`,
      imageSrc: pexelsUrl(images.certificates, 1280),
      imageSrcSet: pexelsSrcSet(images.certificates),
    },
    {
      label: nav.book,
      href: bookingUrl || "#contact",
      isExternal: Boolean(bookingUrl),
      imageSrc: pexelsUrl(images.booking, 1280),
      imageSrcSet: pexelsSrcSet(images.booking),
    },
  ];

  return (
    <>
      <JsonLd data={personJsonLd(locale)} />

      {/* Hero: full-width artwork with the key message */}
      <section className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-24 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image, static export */}
        <img
          src={pexelsUrl(images.hero, 1920)}
          srcSet={pexelsSrcSet(images.hero)}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-ink/55" aria-hidden="true" />
        <div className="max-w-3xl text-cream">
          <p className="eyebrow !text-cream/80">{person.role}</p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] font-medium text-balance sm:text-6xl lg:text-7xl">
            {home.heroTitle}
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-cream/85">{home.heroText}</p>
          <BookingButton locale={locale} className="mt-10 !bg-cream !text-accent hover:!bg-sand" />
        </div>
      </section>

      {/* Section tiles */}
      <nav aria-label={person.name} className="grid gap-1 bg-cream py-1 md:grid-cols-2">
        {tiles.map((tile) => (
          <SectionTile key={tile.label} {...tile} />
        ))}
      </nav>

      {/* About teaser */}
      <section className="container-page grid items-center gap-12 py-20 md:grid-cols-[0.8fr_1.2fr] md:py-28">
        <Image
          src={portrait.src}
          width={portrait.width}
          height={portrait.height}
          alt={`${person.name}, ${person.role.toLowerCase()}`}
          sizes="(min-width: 768px) 24rem, 100vw"
          className="mx-auto aspect-[4/5] w-full max-w-sm rounded-t-full object-cover object-top"
        />
        <div>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">{home.aboutTitle}</h2>
          <p className="mt-8 text-lg leading-relaxed">{home.aboutTeaser}</p>
          <Link href={`/${locale}/about`} className="link-underline mt-8 inline-block font-semibold">
            {home.aboutMore}
          </Link>
        </div>
      </section>

      {/* How the work goes */}
      <section id="how" className="scroll-mt-8 border-y border-line/70 bg-sand/40">
        <div className="container-page py-20 md:py-28">
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">{home.howTitle}</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {home.howSteps.map((step, index) => (
              <li key={step.title} className="border-t border-line pt-6">
                <span className="font-serif text-lg text-accent italic">0{index + 1}</span>
                <h3 className="mt-3 font-serif text-2xl font-medium">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="container-page mt-20 scroll-mt-8 md:mt-28">
        <div className="rounded-[2rem] bg-accent px-8 py-16 text-center text-cream sm:px-16">
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">{home.contactTitle}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/80">{home.contactText}</p>
          <BookingButton locale={locale} className="mt-9 !bg-cream !text-accent hover:!bg-sand" />
        </div>
      </section>
    </>
  );
}
