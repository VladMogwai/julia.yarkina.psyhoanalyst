import { bookingUrl } from "@/config/site";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface BookingButtonProps {
  locale: Locale;
  className?: string;
}

/** Opens the messenger from `contacts`; falls back to the contact section until links are set. */
export function BookingButton({ locale, className = "" }: BookingButtonProps) {
  const label = getDictionary(locale).nav.book;
  const isExternal = Boolean(bookingUrl);

  return (
    <a
      href={bookingUrl || `/${locale}#contact`}
      className={`button-primary ${className}`}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {label}
    </a>
  );
}
