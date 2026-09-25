export const locales = ["ru", "uk", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const openGraphLocales: Record<Locale, string> = {
  ru: "ru_RU",
  uk: "uk_UA",
  fr: "fr_FR",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
