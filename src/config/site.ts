export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://julia-yarkina.pages.dev"
).replace(/\/$/, "");

/**
 * Contact and social links. Empty values are hidden on the site.
 * TODO: fill in once the real links are known.
 */
export const contacts = {
  telegram: "https://t.me/yarkinayuliya",
  whatsapp: "",
  instagram: "",
  facebook: "",
  youtube: "",
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
