import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getArticles } from "@/lib/content/articles";
import { languageAlternates, localizedUrl } from "@/lib/seo";

export const dynamic = "force-static";

const translatedPaths = ["", "/about", "/articles", "/videos", "/certificates"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = locales.flatMap((locale) =>
    translatedPaths.map((path) => ({
      url: localizedUrl(locale, path),
      alternates: { languages: languageAlternates(path) },
    })),
  );

  const articles = (await Promise.all(locales.map((locale) => getArticles(locale)))).flat();
  const articlePages = articles.map((article) => ({
    url: localizedUrl(article.locale, `/articles/${article.slug}`),
    lastModified: article.updated_at,
  }));

  return [...pages, ...articlePages];
}
