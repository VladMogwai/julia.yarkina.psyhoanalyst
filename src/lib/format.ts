import type { Locale } from "@/i18n/config";

const dateLocales: Record<Locale, string> = { ru: "ru-RU", uk: "uk-UA" };

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocales[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
