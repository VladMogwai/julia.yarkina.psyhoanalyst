export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://yarkina-psy.online"
).replace(/\/$/, "");

/**
 * Contact and social links. Empty values are hidden on the site.
 * TODO: fill in once the real links are known.
 */
export const contacts = {
  telegram: "https://t.me/yarkinayuliya",
  whatsapp: "",
  instagram: "https://www.instagram.com/yarkina.psyhoanalytic/",
  facebook: "",
  youtube: "https://www.youtube.com/@%D0%AE%D0%BB%D1%96%D1%8F%D0%AF%D1%80%D0%BA%D1%96%D0%BD%D0%B0",
  email: "",
};

export type ContactKey = keyof typeof contacts;

/** Link used by every «Записаться» button: the first messenger that is set. */
export const bookingUrl =
  contacts.telegram || contacts.whatsapp || (contacts.email && `mailto:${contacts.email}`) || "";

export const portrait = {
  src: "/images/portrait.jpg",
  width: 1200,
  height: 1800,
};
