import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/PageIntro";
import { legal, legalPages, type LegalPage } from "@/content/legal";
import { isLocale, type Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return legalPages.map((page) => ({ page }));
}

const isLegalPage = (page: string): page is LegalPage => (legalPages as string[]).includes(page);

export async function generateMetadata({ params }: PageProps<"/[lang]/legal/[page]">): Promise<Metadata> {
  const { lang, page } = await params;
  if (!isLocale(lang) || !isLegalPage(page)) return {};
  const text = legal[lang][page];
  return {
    ...pageMetadata({ locale: lang, path: `/legal/${page}`, title: text.title, description: text.description }),
    // Drafts until the seller's details are filled in and a lawyer has read them.
    robots: { index: false, follow: true },
  };
}

/** Public offer, refunds and privacy of the "Self-knowledge" section (src/content/legal.ts). */
export default async function LegalPageView({ params }: PageProps<"/[lang]/legal/[page]">) {
  const { lang, page } = await params;
  if (!isLegalPage(page)) notFound();
  const text = legal[lang as Locale][page];

  return (
    <article className="pb-24">
      <PageIntro title={text.title} intro={text.updated} />
      <div className="container-page">
        <div className="grid max-w-3xl gap-10 leading-relaxed">
          {text.sections.map((section) => (
            <section key={section.title} className="grid gap-3">
              <h2 className="font-serif text-2xl font-medium">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
