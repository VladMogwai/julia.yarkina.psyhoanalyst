/**
 * The promo page /{uk,ru}/52 for Instagram traffic: the questionnaire told in slides that look like
 * Julia's posts. Its main texts come from `what-you-dont-see.ts`; here only the page's own words, taken
 * from the site's texts and Julia's Instagram bio.
 */
export type PromoLocale = "uk" | "ru";

export const promoLocales: PromoLocale[] = ["uk", "ru"];

export interface Promo52Text {
  handle: string;
  /** Hero button that scrolls to the purchase block. */
  getQuestions: string;
  whysTitle: string;
  /** "1/5" over each slide of the carousel. */
  slideOf: string;
  swipeHint: string;
  insideTitle: string;
  inside: string[];
  aboutTitle: string;
  about: string[];
  aboutMore: string;
  /** Picked from the full notice on the questionnaire page. */
  noticeLines: { notice: number[]; help: number[] };
  noticeMore: string;
  buyTitle: string;
}

export const promo52: Record<PromoLocale, Promo52Text> = {
  uk: {
    handle: "yarkina.psyhoanalytic",
    getQuestions: "Отримати питання",
    whysTitle: "Знайомо?",
    slideOf: "{n}/{total}",
    swipeHint: "Гортайте →",
    insideTitle: "Що всередині",
    inside: [
      "52 психоаналітичні питання для самодослідження",
      "Бажання, страхи, захисти, внутрішні конфлікти та повторювані сценарії",
      "Без тестів, діагнозів і готових відповідей",
      "Доступ одразу після оплати — з телефону чи комп’ютера",
    ],
    aboutTitle: "Про авторку",
    about: [
      "Психоаналітична консультантка",
      "Психологія та психоаналіз, МІГП · магістратура Côte d’Azur, Ніцца",
      "Членкиня Української Асоціації Психоаналізу (УАП) та Міжнародної Федерації Психоаналізу (IFP)",
    ],
    aboutMore: "Докладніше про мене",
    noticeLines: { notice: [0], help: [0, 2] },
    noticeMore: "Повний текст і умови",
    buyTitle: "Почати самодослідження",
  },
  ru: {
    handle: "yarkina.psyhoanalytic",
    getQuestions: "Получить вопросы",
    whysTitle: "Знакомо?",
    slideOf: "{n}/{total}",
    swipeHint: "Листайте →",
    insideTitle: "Что внутри",
    inside: [
      "52 психоаналитических вопроса для самоисследования",
      "Желания, страхи, защиты, внутренние конфликты и повторяющиеся сценарии",
      "Без тестов, диагнозов и готовых ответов",
      "Доступ сразу после оплаты — с телефона или компьютера",
    ],
    aboutTitle: "Об авторе",
    about: [
      "Психоаналитический консультант",
      "Психология и психоанализ, МИГП · магистратура Côte d’Azur, Ницца",
      "Член Украинской Ассоциации Психоанализа (УАП) и Международной Федерации Психоанализа (IFP)",
    ],
    aboutMore: "Подробнее обо мне",
    noticeLines: { notice: [0], help: [0, 2] },
    noticeMore: "Полный текст и условия",
    buyTitle: "Начать самоисследование",
  },
};
