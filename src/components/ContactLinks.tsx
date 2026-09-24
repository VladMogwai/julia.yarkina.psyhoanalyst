import { contacts, type ContactKey } from "@/config/site";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

function contactHref(key: ContactKey, value: string): string {
  return key === "email" ? `mailto:${value}` : value;
}

export function ContactLinks({ locale, className = "" }: { locale: Locale; className?: string }) {
  const labels = getDictionary(locale).contacts;
  const links = (Object.entries(contacts) as [ContactKey, string][]).filter(([, value]) => value);

  if (links.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 ${className}`}>
      {links.map(([key, value]) => (
        <li key={key}>
          <a
            href={contactHref(key, value)}
            target={key === "email" ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="link-underline"
          >
            {labels[key]}
          </a>
        </li>
      ))}
    </ul>
  );
}
