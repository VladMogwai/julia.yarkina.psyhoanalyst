import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageIntro } from "@/components/PageIntro";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getArticles } from "@/lib/content/articles";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/articles">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { articles } = getDictionary(lang);
  return pageMetadata({
    locale: lang,
    path: "/articles",
    title: articles.metaTitle,
    description: articles.metaDescription,
  });
}

export default async function ArticlesPage({ params }: PageProps<"/[lang]/articles">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = getDictionary(locale).articles;
  const articles = await getArticles(locale);

  return (
    <>
      <PageIntro title={dict.title} intro={dict.intro} />

      {articles.length === 0 ? (
        <EmptyState text={dict.empty} />
      ) : (
        <ul className="container-page grid gap-x-10 gap-y-14 md:grid-cols-2">
          {articles.map((article) => (
            <li key={article.id}>
              <article className="group">
                <Link href={`/${locale}/articles/${article.slug}`} className="block">
                  {article.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Supabase image, static export
                    <img
                      src={article.cover_url}
                      alt=""
                      loading="lazy"
                      className="mb-6 aspect-[3/2] w-full rounded-2xl object-cover"
                    />
                  )}
                  <time dateTime={article.published_at} className="text-sm text-muted">
                    {formatDate(article.published_at, locale)}
                  </time>
                  <h2 className="mt-2 font-serif text-3xl leading-tight font-medium group-hover:text-accent">
                    {article.title}
                  </h2>
                  {article.excerpt && <p className="mt-3 leading-relaxed text-muted">{article.excerpt}</p>}
                  <span className="link-underline mt-4 inline-block text-sm font-semibold">{dict.readMore}</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
