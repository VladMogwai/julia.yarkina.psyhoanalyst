"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

const labels: Record<Locale, string> = { ru: "RU", uk: "UA" };

/**
 * Swaps the locale prefix of the current path. Articles exist in one language only,
 * so on an article page the switcher leads to the article list instead.
 */
function pathForLocale(pathname: string, locale: Locale): string {
  const [, , section, slug] = pathname.split("/");
  if (section === "articles" && slug) return `/${locale}/articles`;
  const rest = pathname.split("/").slice(2).join("/");
  return rest ? `/${locale}/${rest}` : `/${locale}`;
}

export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-xs font-semibold tracking-wider">
      {locales.map((locale) =>
        locale === current ? (
          <span key={locale} aria-current="true" className="rounded-full bg-sand px-2.5 py-1 text-ink">
            {labels[locale]}
          </span>
        ) : (
          <Link
            key={locale}
            href={pathForLocale(pathname, locale)}
            hrefLang={locale}
            lang={locale}
            className="rounded-full px-2.5 py-1 text-muted transition-colors hover:text-ink"
          >
            {labels[locale]}
          </Link>
        ),
      )}
    </nav>
  );
}
