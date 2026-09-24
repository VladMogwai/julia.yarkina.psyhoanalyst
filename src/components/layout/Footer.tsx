import Link from "next/link";
import { ContactLinks } from "@/components/ContactLinks";
import { contacts } from "@/config/site";
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
        </nav>

        {Object.values(contacts).some(Boolean) && (
          <div>
            <p className="eyebrow mb-3">{footer.contacts}</p>
            <ContactLinks locale={locale} className="text-ink" />
          </div>
        )}
      </div>

      <p className="container-page mt-10">
        © {new Date().getFullYear()} {person.name}. {footer.rights}
      </p>
    </footer>
  );
}
