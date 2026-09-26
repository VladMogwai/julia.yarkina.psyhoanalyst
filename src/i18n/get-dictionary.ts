import type { Locale } from "./config";
import { ru, type Dictionary } from "./dictionaries/ru";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { ro } from "./dictionaries/ro";
import { uk } from "./dictionaries/uk";

const dictionaries: Record<Locale, Dictionary> = { uk, en, fr, ro, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
