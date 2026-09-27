import Link from "next/link";
import { ContactLinks } from "@/components/ContactLinks";
import { contacts } from "@/config/site";
import { legal, legalPages } from "@/content/legal";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export function Footer({ locale }: { locale: Locale }) {
  const { person, nav, footer } = getDictionary(locale);

  return (
    <footer className="mt-24 border-t border-line/70 py-12 text-sm text-muted">
      <div className="container-page grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-ink">{person.name}</p>
          <p className="mt-1">{person.role}</p>
        </div>

        <nav className="flex flex-col gap-2">
          <Link href={`/${locale}`} className="hover:text-ink">
            {nav.home}
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-ink">
            {nav.about}
          </Link>
          <Link href={`/${locale}/articles`} className="hover:text-ink">
            {nav.articles}
          </Link>
          <Link href={`/${locale}/videos`} className="hover:text-ink">
            {nav.videos}
          </Link>
          <Link href={`/${locale}/certificates`} className="hover:text-ink">
            {nav.certificates}
          </Link>
          <Link href={`/${locale}/self-knowledge`} className="hover:text-ink">
            {nav.selfKnowledge}
          </Link>
        </nav>

        {Object.values(contacts).some(Boolean) && (
          <div>
            <p className="eyebrow mb-3">{footer.contacts}</p>
            <ContactLinks locale={locale} className="text-ink" />
          </div>
        )}
      </div>

      <div className="container-page mt-10 flex flex-wrap justify-between gap-x-8 gap-y-3">
        <p>
          © {new Date().getFullYear()} {person.name}. {footer.rights}
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {legalPages.map((page) => (
            <Link key={page} href={`/${locale}/legal/${page}`} className="hover:text-ink">
              {legal[locale][page].linkLabel}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
