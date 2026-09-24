const cyrillicToLatin: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", ё: "e", є: "ye", ж: "zh",
  з: "z", и: "i", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** URL slug from a Russian or Ukrainian title: «Тревога и сон» → "trevoga-i-son". */
export function slugify(text: string): string {
  return [...text.toLowerCase()]
    .map((char) => cyrillicToLatin[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
