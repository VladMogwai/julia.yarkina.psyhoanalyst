import type { Locale } from "@/i18n/config";

const dateLocales: Record<Locale, string> = { uk: "uk-UA", en: "en-GB", fr: "fr-FR", ro: "ro-RO", ru: "ru-RU" };

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocales[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
