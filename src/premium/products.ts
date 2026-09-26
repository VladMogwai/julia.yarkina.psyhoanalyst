/** Where a bought product opens, by product slug. The questionnaire has the site's languages too. */
const productLinks: Record<string, (locale: string) => string> = {
  "questions-to-self": (locale) => `/questions/${locale}`,
};

export function productLink(slug: string, locale: string): string | null {
  return productLinks[slug]?.(locale) ?? null;
}

/** The product's own page in the "Self-knowledge" section, when it has one. */
const productPages: Record<string, string> = {
  "questions-to-self": "what-you-dont-see",
};

export function productPage(slug: string, locale: string): string | null {
  return productPages[slug] ? `/${locale}/self-knowledge/${productPages[slug]}` : null;
}
