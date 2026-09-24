import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { siteUrl } from "@/config/site";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import "../globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { person } = getDictionary(lang);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${person.name} — ${person.role}`,
      template: `%s — ${person.name}`,
    },
    authors: [{ name: person.name }],
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header locale={lang} />
        <main className="flex-1">{children}</main>
        <Footer locale={lang} />
      </body>
    </html>
  );
}
