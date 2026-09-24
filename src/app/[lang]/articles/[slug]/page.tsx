import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingButton } from "@/components/BookingButton";
import { JsonLd } from "@/components/JsonLd";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getArticle, getArticles } from "@/lib/content/articles";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { localizedUrl, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

/**
 * `output: "export"` refuses a dynamic route with no params, so while a locale has
 * no articles yet we emit one placeholder route that renders the 404 page.
 */
const NO_ARTICLES_SLUG = "_";

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return [];
  const articles = await getArticles(params.lang);
  if (articles.length === 0) return [{ slug: NO_ARTICLES_SLUG }];
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/articles/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const article = await getArticle(lang, slug);
  if (!article) return {};

  return pageMetadata({
    locale: lang,
    path: `/articles/${slug}`,
    title: article.title,
    description: article.excerpt,
    translated: false,
    type: "article",
    image: article.cover_url,
  });
}

export default async function ArticlePage({ params }: PageProps<"/[lang]/articles/[slug]">) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const article = await getArticle(locale, slug);
  if (!article) notFound();

  const { person, articles: dict } = getDictionary(locale);

  return (
    <article className="container-page max-w-3xl pt-14 md:pt-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          image: article.cover_url ?? undefined,
          datePublished: article.published_at,
          dateModified: article.updated_at,
          inLanguage: locale,
          mainEntityOfPage: localizedUrl(locale, `/articles/${slug}`),
          author: { "@type": "Person", name: person.name, url: localizedUrl(locale) },
        }}
      />

      <Link href={`/${locale}/articles`} className="link-underline text-sm text-muted">
        ← {dict.backToList}
      </Link>

      <header className="mt-8">
        <time dateTime={article.published_at} className="text-sm text-muted">
          {formatDate(article.published_at, locale)}
        </time>
        <h1 className="mt-3 font-serif text-4xl leading-tight font-medium sm:text-5xl">{article.title}</h1>
        {article.excerpt && <p className="mt-5 text-xl leading-relaxed text-muted">{article.excerpt}</p>}
      </header>

      {article.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase image, static export
        <img src={article.cover_url} alt="" className="mt-10 aspect-[3/2] w-full rounded-2xl object-cover" />
      )}

      <div
        className="prose prose-lg prose-stone mt-10 max-w-none prose-headings:font-serif prose-headings:font-medium prose-a:text-accent"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
      />

      <footer className="mt-16 border-t border-line pt-10">
        <p className="font-serif text-2xl">{person.name}</p>
        <p className="text-muted">{person.role}</p>
        <BookingButton locale={locale} className="mt-6" />
      </footer>
    </article>
  );
}
