import type { QuizTexts } from "./types";

// `questions` and `results` are placeholders of the mobile cards; the desktop flow loads the paid questions from Supabase.
export const en: QuizTexts = {
  meta: {
    title: "Questions to ask yourself — Yuliia Yarkina",
    description:
      "52 questions to ask yourself in eight topics: anxiety, guilt, shame, resentment, loneliness, relationships, self-realisation, boundaries.",
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
  reflection: {
    introTitle: "Questions worth asking yourself",
    introText:
      "Choose a topic. Each question opens step by step: first the question itself, then what you may not be noticing, and three deeper questions.",
    topicsLabel: "Topics",
    questionsCount: "{n} questions",
    notSeeingLabel: "What you may not be noticing",
    deeperLabel: "Deeper",
    nextStep: "Next",
    swipeHint: "or swipe up",
    nextQuestion: "Next question",
    finish: "Finish",
    endEyebrow: "End of topic",
    endTitle: "You have finished “{category}”",
    endText: [
      "There is no need to hurry with the answers: you can come back to these questions.",
      "If a question touched something, you can talk about it in a session.",
    ],
    book: "Book a session",
    otherTopic: "Choose another topic",
    lockedTitle: "Questions to ask yourself",
    lockedText:
      "The questionnaire opens after purchase in the “Self-knowledge” section. If you have already bought it, sign in with the same email.",
    lockedCta: "Go to the section",
  },
};
