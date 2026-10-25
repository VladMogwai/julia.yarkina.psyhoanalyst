import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import Image from "next/image";
import { ProductCta } from "@/components/self-knowledge/ProductCta";
import { StickyBuy } from "@/components/self-knowledge/StickyBuy";
import { portrait } from "@/config/site";
import { promo52, promoLocales, type PromoLocale } from "@/content/promo-52";
import { whatYouDontSee } from "@/content/what-you-dont-see";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";

// The font of Julia's Instagram posts.
const comfortaa = Comfortaa({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "600"],
  variable: "--font-comfortaa",
});

const PRODUCT = "questions-to-self";
const BUY_ID = "buy";

export const dynamicParams = false;

/** Only in the languages of Julia's Instagram. */
export function generateStaticParams() {
  return promoLocales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/52">): Promise<Metadata> {
  const { lang } = await params;
  const text = whatYouDontSee[lang as PromoLocale];
  return pageMetadata({
    locale: lang as PromoLocale,
    path: "/52",
    title: text.metaTitle,
    description: text.metaDescription,
    translated: false,
    image: portrait.src,
  });
}

/** Removes the marker syntax (==…==) of the questionnaire page's text. */
const plain = (value: string) => value.replaceAll("==", "");

/** One square-cornered plate of text over a photo, as on Julia's posts. */
function Plate({ children }: { children: React.ReactNode }) {
  return <div className="bg-white/95 px-5 py-4 text-center">{children}</div>;
}

/**
 * Promo page of the questionnaire for Instagram traffic (link in bio and stories): one action, phone
 * first, and the look of Julia's posts — black-and-white photo, white plates, raspberry accent, Comfortaa.
 * The purchase block is the questionnaire page's, restyled by `.promo` in globals.css.
 */
export default async function Promo52Page({ params }: PageProps<"/[lang]/52">) {
  const { lang } = await params;
  const locale = lang as PromoLocale;
  const { selfKnowledge: texts, person } = getDictionary(locale);
  const text = whatYouDontSee[locale];
  const promo = promo52[locale];

  return (
    <div className={`promo ${comfortaa.variable} bg-white pb-28`}>
      <div className="mx-auto max-w-md">
        <section className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={portrait.src}
            alt={person.name}
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover object-[50%_30%]"
          />
          <div className="absolute inset-x-4 bottom-6">
            <Plate>
              <h1 className="text-3xl font-light">{text.title}</h1>
              <p className="mt-2 text-sm leading-relaxed">{text.subtitle}</p>
            </Plate>
          </div>
        </section>

        <div className="grid justify-items-center gap-3 px-5 py-8 text-center">
          <p className="text-sm">
            {person.name} · {person.role}
          </p>
          <a href={`#${BUY_ID}`} className="promo-button">
            {promo.getQuestions}
          </a>
        </div>

        <section aria-label={promo.whysTitle}>
          <div className="flex items-baseline justify-between px-5 pb-3">
            <h2 className="text-xl">{promo.whysTitle}</h2>
            <span className="text-xs text-neutral-500">{promo.swipeHint}</span>
          </div>
          <ol className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]">
            {text.whys.map((why, index) => (
              <li
                key={why}
                className="relative flex aspect-[4/5] w-[88%] shrink-0 snap-center items-center border-r border-neutral-200 bg-white px-8 first:ml-[6%] last:mr-[6%] last:border-r-0"
              >
                <span className="absolute top-4 right-4 rounded-full bg-promo-ink/80 px-2.5 py-1 text-xs text-white">
                  {promo.slideOf
                    .replace("{n}", String(index + 1))
                    .replace("{total}", String(text.whys.length))}
                </span>
                <p className="absolute top-4 left-4 text-xs text-promo-accent">{promo.handle}</p>
                <blockquote className="text-center text-2xl leading-snug text-promo-accent">«{why}»</blockquote>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 flex aspect-[4/5] flex-col justify-center bg-promo-ink px-8 text-center text-white">
          <p className="text-xl leading-relaxed font-light">{text.optics}</p>
          <p className="mt-10 text-sm text-promo-accent">{promo.handle}</p>
        </section>

        <section className="px-5 pt-14">
          <h2 className="text-2xl">{promo.insideTitle}</h2>
          <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
            {promo.inside.map((item) => (
              <li key={item} className="flex gap-4 py-4 leading-relaxed">
                <span className="text-promo-accent">—</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-2xl leading-snug font-light">{plain(text.intro[2])}</p>
        </section>

        <section className="mx-5 mt-14 bg-neutral-100 p-7">
          <h2 className="text-xs tracking-[0.2em] text-promo-accent uppercase">{promo.aboutTitle}</h2>
          <p className="mt-4 text-2xl">{person.name}</p>
          <ul className="mt-4 grid gap-2 text-sm leading-relaxed">
            {promo.about.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <a href={`/${locale}/about`} className="mt-5 inline-block text-sm underline underline-offset-4">
            {promo.aboutMore}
          </a>
        </section>

        <section className="px-5 pt-14 text-sm leading-relaxed text-neutral-600">
          <h2 className="text-lg text-promo-ink">{text.noticeTitle}</h2>
          <div className="mt-3 grid gap-3">
            {promo.noticeLines.notice.map((index) => (
              <p key={`notice-${index}`}>{text.notice[index]}</p>
            ))}
            {promo.noticeLines.help.map((index) => (
              <p key={`help-${index}`}>{text.help[index]}</p>
            ))}
          </div>
          <a href={`/${locale}/self-knowledge`} className="mt-4 inline-block underline underline-offset-4">
            {promo.noticeMore}
          </a>
        </section>

        <section id={BUY_ID} className="scroll-mt-6 px-5 pt-14">
          <h2 className="mb-6 text-2xl">{promo.buyTitle}</h2>
          <ProductCta
            product={PRODUCT}
            locale={locale}
            texts={texts}
            openLabel={text.goToQuestions}
            soonLabel={text.soon}
            withSignIn
          />
        </section>
      </div>

      <StickyBuy product={PRODUCT} locale={locale} label={texts.buy} target={BUY_ID} />
    </div>
  );
}
