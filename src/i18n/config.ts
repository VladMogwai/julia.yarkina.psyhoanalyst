/** Ukrainian is the main language: "/" opens it. */
export const locales = ["uk", "en", "fr", "ro", "ru"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export const openGraphLocales: Record<Locale, string> = {
  uk: "uk_UA",
  en: "en_US",
  fr: "fr_FR",
  ro: "ro_RO",
  ru: "ru_RU",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
