import type { Metadata } from "next";
import { contacts, portrait, siteUrl } from "@/config/site";
import { defaultLocale, locales, openGraphLocales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export function localizedUrl(locale: Locale, path = ""): string {
  return `${siteUrl}/${locale}${path}`;
}

/** hreflang map for a page that exists in every locale. */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizedUrl(locale, path)])),
    "x-default": localizedUrl(defaultLocale, path),
  };
}

interface PageMetadataOptions {
  locale: Locale;
  /** Path after the locale prefix, e.g. "/articles". Empty for the home page. */
  path: string;
  title: string;
  description: string;
  /** False for pages that exist in one locale only (articles). */
  translated?: boolean;
  type?: "website" | "article";
  image?: string | null;
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  translated = true,
  type = "website",
  image,
}: PageMetadataOptions): Metadata {
  const url = localizedUrl(locale, path);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: translated ? languageAlternates(path) : undefined,
    },
    openGraph: {
      type,
      url,
      title,
      description,
      locale: openGraphLocales[locale],
      siteName: getDictionary(locale).person.name,
      images: image ? [image] : undefined,
    },
  };
}

/** schema.org description of Julia and her practice, rendered on the home page. */
export function personJsonLd(locale: Locale) {
  const { person, home, about } = getDictionary(locale);
  const sameAs = Object.entries(contacts)
    .filter(([key, value]) => value && key !== "email")
    .map(([, value]) => value);

  const personId = `${siteUrl}/#person`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": personId,
      name: person.name,
      jobTitle: person.role,
      description: home.metaDescription,
      url: localizedUrl(locale),
      image: `${siteUrl}${portrait.src}`,
      knowsLanguage: ["uk", "ru"],
      knowsAbout: about.topics,
      memberOf: [
        { "@type": "Organization", name: "Українська Асоціація Психоаналізу" },
        { "@type": "Organization", name: "Fédération Internationale de Psychanalyse" },
      ],
      sameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: `${person.name} — ${person.role}`,
      url: localizedUrl(locale),
      image: `${siteUrl}${portrait.src}`,
      description: home.metaDescription,
      founder: { "@id": personId },
      sameAs,
    },
  ];
}
