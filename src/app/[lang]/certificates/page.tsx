import type { Metadata } from "next";
import { EmptyState, PageIntro } from "@/components/PageIntro";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCertificates } from "@/lib/content/certificates";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/certificates">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { certificates } = getDictionary(lang);
  return pageMetadata({
    locale: lang,
    path: "/certificates",
    title: certificates.metaTitle,
    description: certificates.metaDescription,
  });
}

export default async function CertificatesPage({ params }: PageProps<"/[lang]/certificates">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = getDictionary(locale).certificates;
  const certificates = await getCertificates();

  return (
    <>
      <PageIntro title={dict.title} intro={dict.intro} />

      {certificates.length === 0 ? (
        <EmptyState text={dict.empty} />
      ) : (
        <ul className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => {
            const title = locale === "uk" ? certificate.title_uk : certificate.title_ru;
            return (
              <li key={certificate.id}>
                <figure>
                  {/* Opens the full-size scan in a new tab */}
                  <a
                    href={certificate.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-line bg-white p-3 transition-shadow hover:shadow-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase image, static export */}
                    <img
                      src={certificate.image_url}
                      alt={title}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-contain"
                    />
                  </a>
                  <figcaption className="mt-4">
                    <p className="font-serif text-xl leading-snug font-medium">{title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {[certificate.issuer, certificate.year].filter(Boolean).join(" · ")}
                    </p>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
