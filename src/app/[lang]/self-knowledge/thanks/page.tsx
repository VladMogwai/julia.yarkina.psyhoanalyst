import type { Metadata } from "next";
import { ThanksStatus } from "@/components/self-knowledge/ThanksStatus";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/self-knowledge/thanks">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).selfKnowledge.thanksTitle, robots: { index: false, follow: false } };
}

/** WayForPay returns the buyer here (through the Worker) with ?order=<reference>. */
export default async function ThanksPage({ params }: PageProps<"/[lang]/self-knowledge/thanks">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const texts = getDictionary(locale).selfKnowledge;

  return (
    <section className="container-page pt-14 pb-20 md:pt-20">
      <h1 className="font-serif text-5xl font-medium sm:text-6xl">{texts.thanksTitle}</h1>
      <div className="mt-8 max-w-2xl">
        <ThanksStatus locale={locale} texts={texts} />
      </div>
    </section>
  );
}
