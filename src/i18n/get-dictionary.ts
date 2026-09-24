import type { Locale } from "./config";
import { ru, type Dictionary } from "./dictionaries/ru";
import { uk } from "./dictionaries/uk";

const dictionaries: Record<Locale, Dictionary> = { ru, uk };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
