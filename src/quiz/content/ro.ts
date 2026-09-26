import type { QuizTexts } from "./types";

// `questions` and `results` are placeholders of the mobile cards; the desktop flow loads the paid questions from Supabase.
export const ro: QuizTexts = {
  meta: {
    title: "Întrebări pentru tine — Iulia Iarkina",
    description:
      "52 de întrebări pentru tine, în opt teme: anxietate, vinovăție, rușine, supărare, singurătate, relații, împlinire de sine, limite.",
  },
  wordmark: "Iulia Iarkina",
  labels: {
    yes: "Da",
    no: "Nu",
    questionEyebrow: "Întrebarea {n}",
    dragHint: "Trage cardul",
    keysHint: "sau apasă ← / →",
    resultEyebrow: "Rezultat",
    resultCardTitle: "Profilul tău este gata",
    resultCardCaption: "Atinge ca să începi din nou",
    restartHint: "Atinge cardul ca să începi din nou",
    languageLabel: "Limbă",
    progressLabel: "Progres",
    scrollHint: "Derulează mai departe",
    rowQuestion: "Întrebare",
    rowTopic: "Temă",
    rowContext: "Context",
    rowAnswer: "Răspuns",
    restart: "Începe din nou",
  },
  questions: [
    {
      id: "state",
      title: "Ți se întâmplă să stai mult timp trează din cauza gândurilor?",
      body: [
        "Înainte să răspunzi, oprește-te un minut. Acest chestionar nu este un diagnostic și nici un test cu răspunsuri corecte. El te ajută să privești puțin mai atent ce se întâmplă cu tine acum.",
        "Uneori gândurile de dinainte de somn sunt doar o zi care încă nu s-a încheiat înăuntru. Alteori sunt ceva ce își caută de mult cuvintele: o neliniște fără cauză clară, o discuție care n-a avut loc, o decizie amânată de luni de zile.",
        "Răspunde așa cum simți, nu așa cum „trebuie”. Aici nu există răspunsuri bune sau rele — doar ale tale.",
      ],
      mobileBody: [
        "Trage cardul la stânga pentru „da” și la dreapta pentru „nu”. Poți și să atingi cuvântul de lângă card sau să folosești săgețile.",
      ],
      caption: "Gânduri înainte de somn",
      accent: "#B39AE8",
      illustration: "moon",
      media: "state",
    },
    {
      id: "patterns",
      title: "Observi că în relațiile tale se repetă aceeași poveste?",
      caption: "Repetiție",
      accent: "#2E7A55",
      illustration: "leaf",
      media: "patterns",
    },
    {
      id: "feelings",
      title: "Îți este greu să vorbești despre sentimentele tale, chiar și cu cei apropiați?",
      caption: "Cuvinte pentru sentimente",
      accent: "#8B6CC9",
      illustration: "flower",
      media: "feelings",
    },
    {
      id: "change",
      title: "Au avut loc schimbări mari în viața ta în ultimul an?",
      caption: "Schimbări",
      accent: "#0F1C17",
      illustration: "sprout",
      media: "change",
    },
    {
      id: "desire",
      title: "Ți-ar plăcea să înțelegi mai bine ce îți dorești cu adevărat?",
      caption: "Dorință",
      accent: "#B39AE8",
      illustration: "seed",
      media: "desire",
    },
  ],
  results: [
    {
      minYes: 4,
      title: "Multe cer atenție",
      text: [
        "Se pare că acum multe lucruri din viața ta cer putere și nu își găsesc cuvintele. Nu este nici o sentință, nici o slăbiciune — este un semn că un spațiu în care să privești liniștit la toate acestea te-ar putea ajuta.",
        "Dacă vrei, programează o primă ședință: vom vorbi despre ce te-a adus aici.",
      ],
    },
    {
      minYes: 2,
      title: "Există despre ce vorbi",
      text: [
        "Unele întrebări au rezonat. Poate sunt teme la care voiai de mult să te întorci.",
        "O primă ședință nu te obligă la nimic — este o ocazie să te privim împreună mai atent.",
      ],
    },
    {
      minYes: 0,
      title: "Ești în contact cu tine",
      text: [
        "Acum pari să te descurci destul de bine. Totuși, curiozitatea față de tine este un motiv bun de a vorbi, chiar și atunci când nimic nu doare.",
      ],
    },
  ],
  reflection: {
    introTitle: "Întrebări pe care merită să ți le pui",
    introText:
      "Alege o temă. Fiecare întrebare se deschide pas cu pas: mai întâi întrebarea, apoi ce s-ar putea să nu observi și trei întrebări mai profunde.",
    topicsLabel: "Teme",
    questionsCount: "{n} întrebări",
    notSeeingLabel: "Ce s-ar putea să nu observi",
    deeperLabel: "Mai adânc",
    nextStep: "Mai departe",
    swipeHint: "sau glisează în sus",
    nextQuestion: "Întrebarea următoare",
    finish: "Încheie",
    endEyebrow: "Sfârșitul temei",
    endTitle: "Tema „{category}” este încheiată",
    endText: [
      "Nu te grăbi cu răspunsurile: te poți întoarce la aceste întrebări.",
      "Dacă o întrebare te-a atins, putem vorbi despre ea într-o ședință.",
    ],
    book: "Programează o ședință",
    otherTopic: "Alege altă temă",
    lockedTitle: "Întrebări pentru tine",
    lockedText:
      "Chestionarul se deschide după cumpărare, în rubrica „Cunoaștere de sine”. Dacă l-ai cumpărat deja, conectează-te cu același e-mail.",
    lockedCta: "Mergi la rubrică",
  },
};
