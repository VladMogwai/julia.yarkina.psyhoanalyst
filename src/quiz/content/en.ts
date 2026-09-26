import type { QuizContent } from "./types";

// TODO: placeholder texts — replace with the real questions when they are ready.
export const en: QuizContent = {
  meta: {
    title: "Questionnaire — Yuliia Yarkina",
    description: "A short questionnaire: five questions about what is happening to you right now.",
  },
  wordmark: "Yuliia Yarkina",
  labels: {
    yes: "Yes",
    no: "No",
    questionEyebrow: "Question {n}",
    dragHint: "Drag the card",
    keysHint: "or press ← / →",
    resultEyebrow: "Result",
    resultCardTitle: "Your profile is ready",
    resultCardCaption: "Tap to start again",
    restartHint: "Tap the card to start again",
    languageLabel: "Language",
    progressLabel: "Progress",
    scrollHint: "Scroll on",
    rowQuestion: "Question",
    rowTopic: "Topic",
    rowContext: "Context",
    rowAnswer: "Answer",
    restart: "Start again",
  },
  questions: [
    {
      id: "state",
      title: "Do you sometimes lie awake for a long time because of your thoughts?",
      body: [
        "Before you answer, pause for a minute. This questionnaire is not a diagnosis or a test with right answers. It is here to help you look a little more closely at what is happening to you right now.",
        "Sometimes thoughts at bedtime are just a day that hasn’t ended inside yet. And sometimes they are something that has long been looking for words: anxiety without a clear cause, a conversation that never happened, a decision put off for months.",
        "Answer the way you feel, not the way it “should” be. There are no good or bad answers here — only yours.",
      ],
      mobileBody: [
        "Drag the card to the left for “yes” and to the right for “no”. You can also tap the word next to the card or use the arrow keys.",
      ],
      caption: "Bedtime thoughts",
      accent: "#B39AE8",
      illustration: "moon",
      media: "state",
    },
    {
      id: "patterns",
      title: "Do you notice the same story repeating in your relationships?",
      caption: "Repetition",
      accent: "#2E7A55",
      illustration: "leaf",
      media: "patterns",
    },
    {
      id: "feelings",
      title: "Is it hard for you to talk about your feelings, even with people close to you?",
      caption: "Words for feelings",
      accent: "#8B6CC9",
      illustration: "flower",
      media: "feelings",
    },
    {
      id: "change",
      title: "Have there been big changes in your life over the past year?",
      caption: "Changes",
      accent: "#0F1C17",
      illustration: "sprout",
      media: "change",
    },
    {
      id: "desire",
      title: "Would you like to understand better what you really want?",
      caption: "Desire",
      accent: "#B39AE8",
      illustration: "seed",
      media: "desire",
    },
  ],
  results: [
    {
      minYes: 4,
      title: "A lot is asking for attention",
      text: [
        "It seems that right now a lot in your life takes strength and doesn’t find words. This is neither a verdict nor a weakness — it is a sign that a space to calmly look into it might help you.",
        "If you like, book a first session: we’ll talk about what brought you here.",
      ],
    },
    {
      minYes: 2,
      title: "There is something to talk about",
      text: [
        "Some of the questions resonated. Perhaps these are topics you have long wanted to come back to.",
        "A first session commits you to nothing — it’s a chance to take a closer look at yourself together.",
      ],
    },
    {
      minYes: 0,
      title: "You are in touch with yourself",
      text: [
        "Right now you seem to be coping fairly well. Still, curiosity about yourself is a good reason to talk, even when nothing hurts.",
      ],
    },
  ],
};
