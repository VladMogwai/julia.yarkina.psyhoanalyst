/** Where a bought product opens, by product slug. The questionnaire has the site's languages too. */
const productLinks: Record<string, (locale: string) => string> = {
  "questions-to-self": (locale) => `/quiz/${locale}`,
};

export function productLink(slug: string, locale: string): string | null {
  return productLinks[slug]?.(locale) ?? null;
}
