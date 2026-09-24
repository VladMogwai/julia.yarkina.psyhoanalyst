import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { getSupabase } from "@/lib/supabase/client";
import type { Article } from "@/lib/supabase/types";

/** Published articles for a locale, newest first. Runs at build time, once per locale. */
export const getArticles = cache(async (locale: Locale): Promise<Article[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("locale", locale)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Failed to load articles: ${error.message}`);
  return data as Article[];
});

export async function getArticle(locale: Locale, slug: string): Promise<Article | null> {
  const articles = await getArticles(locale);
  return articles.find((article) => article.slug === slug) ?? null;
}
