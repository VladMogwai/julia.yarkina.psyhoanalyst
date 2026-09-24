export const locales = ["ru", "uk"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const openGraphLocales: Record<Locale, string> = {
  ru: "ru_RU",
  uk: "uk_UA",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
