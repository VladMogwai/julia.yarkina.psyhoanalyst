import type { Certificate } from "@/lib/supabase/types";

/**
 * Certificates from Julia's profile, shipped with the site so they show even before
 * Supabase is set up. New ones are added through /admin and listed after these.
 * Issuers are written as on the documents themselves.
 */
export const builtInCertificates: Certificate[] = [
  {
    id: "migp-diploma-2025",
    title_ru: "Диплом о повышении квалификации: практическая психология, психоанализ",
    title_uk: "Диплом про підвищення кваліфікації: практична психологія, психоаналіз",
    title_fr: "Diplôme de perfectionnement professionnel : psychologie pratique, psychanalyse",
    title_en: "Advanced training diploma: practical psychology, psychoanalysis",
    title_ro: "Diplomă de perfecționare: psihologie practică, psihanaliză",
    issuer: "International Institute of Depth Psychology",
    year: 2025,
    image_url: "/images/certificates/migp-diploma-2025.jpg",
  },
  {
    id: "fip-strasbourg-2024",
    title_ru: "Круглый стол «Pendant la guerre, penser l’après», Страсбург",
    title_uk: "Круглий стіл «Pendant la guerre, penser l’après», Страсбург",
    title_fr: "Table ronde « Pendant la guerre, penser l’après », Strasbourg",
    title_en: "Round table “Pendant la guerre, penser l’après”, Strasbourg",
    title_ro: "Masă rotundă „Pendant la guerre, penser l’après”, Strasbourg",
    issuer: "Fédération Internationale de Psychanalyse",
    year: 2024,
    image_url: "/images/certificates/fip-strasbourg-2024.jpg",
  },
  {
    id: "sablina-military-psychology-2024",
    title_ru: "Психологическая помощь и работа психолога с военными и их семьями во время войны. Военная психология",
    title_uk: "Психологічна допомога та робота психолога з військовими та їх родинами в дні війни. Військова психологія",
    title_fr: "Aide psychologique et travail du psychologue auprès des militaires et de leurs familles en temps de guerre. Psychologie militaire",
    title_en: "Psychological help and the psychologist’s work with military personnel and their families in wartime. Military psychology",
    title_ro: "Ajutor psihologic și munca psihologului cu militarii și familiile lor în timp de război. Psihologie militară",
    issuer: "Natalia Sablina Training Center",
    year: 2024,
    image_url: "/images/certificates/sablina-military-psychology-2024.jpg",
  },
  {
    id: "sablina-life-over-the-abyss-2024",
    title_ru: "Жизнь над пропастью. Зависимость, ПТСР и суицидальные мысли у военного/ветерана",
    title_uk: "Життя над прірвою. Залежність, ПТСР та суїцидальні думки у військового/ветерана",
    title_fr: "La vie au bord du gouffre. Addictions, TSPT et pensées suicidaires chez les militaires et vétérans",
    title_en: "Life over the abyss. Addiction, PTSD and suicidal thoughts in military personnel and veterans",
    title_ro: "Viața deasupra prăpastiei. Dependență, TSPT și gânduri suicidare la militari și veterani",
    issuer: "Natalia Sablina Training Center",
    year: 2024,
    image_url: "/images/certificates/sablina-life-over-the-abyss-2024.jpg",
  },
  {
    id: "sablina-dad-is-a-hero-2024",
    title_ru: "Мама, мой папа — герой! Как говорить с ребёнком, у которого близкий человек на фронте",
    title_uk: "Мамо, мій тато — герой! Як говорити з дитиною, в якої близька людина на фронті",
    title_fr: "Maman, mon papa est un héros ! Comment parler à un enfant dont un proche est au front",
    title_en: "Mum, my dad is a hero! How to talk to a child whose loved one is at the front",
    title_ro: "Mamă, tata e un erou! Cum să vorbești cu un copil al cărui apropiat este pe front",
    issuer: "Natalia Sablina Training Center",
    year: 2024,
    image_url: "/images/certificates/sablina-dad-is-a-hero-2024.jpg",
  },
];
