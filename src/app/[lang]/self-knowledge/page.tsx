import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
import { ProductList } from "@/components/self-knowledge/ProductList";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/self-knowledge">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { selfKnowledge } = getDictionary(lang);
  return pageMetadata({
    locale: lang,
    path: "/self-knowledge",
    title: selfKnowledge.metaTitle,
    description: selfKnowledge.metaDescription,
  });
}

/** "Self-knowledge": paid materials bought once. Products, sign-in and checkout run in the browser. */
export default async function SelfKnowledgePage({ params }: PageProps<"/[lang]/self-knowledge">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const texts = getDictionary(locale).selfKnowledge;

  return (
    <>
      <PageIntro title={texts.title} intro={texts.intro} />
      <ProductList locale={locale} texts={texts} />
    </>
  );
}
