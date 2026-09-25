import type { QuizContent } from "./types";

// TODO: placeholder texts — replace with the real questions when they are ready.
export const fr: QuizContent = {
  meta: {
    title: "Questionnaire — Yuliia Yarkina",
    description: "Un court questionnaire : cinq questions sur ce que vous vivez en ce moment.",
  },
  wordmark: "Yuliia Yarkina",
  labels: {
    yes: "Oui",
    no: "Non",
    questionEyebrow: "Question {n}",
    dragHint: "Faites glisser la carte",
    keysHint: "ou appuyez sur ← / →",
    resultEyebrow: "Résultat",
    resultCardTitle: "Votre profil est prêt",
    resultCardCaption: "Touchez pour recommencer",
    restartHint: "Touchez la carte pour recommencer",
    languageLabel: "Langue",
    progressLabel: "Progression",
  },
  questions: [
    {
      id: "state",
      title: "Vous arrive-t-il de ne pas trouver le sommeil à cause de vos pensées ?",
      body: [
        "Avant de répondre, arrêtez-vous une minute. Ce questionnaire n’est ni un diagnostic ni un test avec de bonnes réponses. Il sert à regarder un peu plus attentivement ce qui se passe pour vous en ce moment.",
        "Parfois, les pensées du soir ne sont que la journée qui ne s’est pas encore terminée en nous. Et parfois, c’est quelque chose qui cherche ses mots depuis longtemps : une angoisse sans cause claire, une conversation qui n’a jamais eu lieu, une décision repoussée depuis des mois.",
        "Répondez comme vous le ressentez, pas comme il « faudrait ». Il n’y a ni bonnes ni mauvaises réponses : seulement les vôtres.",
        "Faites glisser la carte vers la gauche pour « oui » et vers la droite pour « non ». Vous pouvez aussi toucher le mot à côté de la carte ou utiliser les flèches du clavier.",
      ],
      caption: "Pensées du soir",
      accent: "#B39AE8",
      illustration: "moon",
    },
    {
      id: "patterns",
      title: "Remarquez-vous que la même histoire se répète dans vos relations ?",
      caption: "Répétition",
      accent: "#2E7A55",
      illustration: "leaf",
    },
    {
      id: "feelings",
      title: "Vous est-il difficile de parler de vos sentiments, même avec vos proches ?",
      caption: "Des mots pour les sentiments",
      accent: "#8B6CC9",
      illustration: "flower",
    },
    {
      id: "change",
      title: "Avez-vous vécu de grands changements dans votre vie cette année ?",
      caption: "Changements",
      accent: "#0F1C17",
      illustration: "sprout",
    },
    {
      id: "desire",
      title: "Aimeriez-vous mieux comprendre ce que vous désirez vraiment ?",
      caption: "Désir",
      accent: "#B39AE8",
      illustration: "seed",
    },
  ],
  results: [
    {
      minYes: 4,
      title: "Beaucoup de choses demandent votre attention",
      text: [
        "Il semble qu’en ce moment beaucoup de choses vous demandent de la force sans trouver de mots. Ce n’est ni une fatalité ni une faiblesse : c’est le signe qu’un espace pour y réfléchir calmement pourrait vous aider.",
        "Si vous le souhaitez, prenez rendez-vous pour une première rencontre : nous parlerons de ce qui vous amène.",
      ],
    },
    {
      minYes: 2,
      title: "Il y a de quoi parler",
      text: [
        "Certaines questions ont résonné. Ce sont peut-être des sujets auxquels vous vouliez revenir depuis longtemps.",
        "Une première rencontre n’engage à rien : c’est une occasion de vous regarder ensemble.",
      ],
    },
    {
      minYes: 0,
      title: "Vous êtes en contact avec vous-même",
      text: [
        "En ce moment, vous semblez plutôt bien vous en sortir. Pourtant, s’intéresser à soi est une bonne raison de parler, même quand rien ne fait mal.",
      ],
    },
  ],
};
