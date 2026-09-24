import Link from "next/link";
import { BookingButton } from "@/components/BookingButton";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

export function Header({ locale }: { locale: Locale }) {
  const { person, nav } = getDictionary(locale);
  const links = [
    { href: `/${locale}/about`, label: nav.about },
    { href: `/${locale}/articles`, label: nav.articles },
    { href: `/${locale}/videos`, label: nav.videos },
    { href: `/${locale}/certificates`, label: nav.certificates },
  ];

  return (
    <header className="border-b border-line/70">
      <div className="container-page flex h-20 items-center justify-between gap-6">
        <Link href={`/${locale}`} className="group flex flex-col leading-none">
          <span className="font-serif text-2xl font-medium tracking-tight">{person.name}</span>
          <span className="mt-1 text-[0.65rem] font-semibold tracking-[0.25em] text-muted uppercase">
            {person.role}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher current={locale} label={nav.languageLabel} />
          <BookingButton locale={locale} className="hidden !px-5 !py-2.5 sm:inline-flex" />

          <MobileMenu label={nav.menu}>
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 hover:bg-sand">
                {link.label}
              </Link>
            ))}
            <BookingButton locale={locale} className="mt-2" />
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
