export type IllustrationName = "leaf" | "sprout" | "flower" | "moon" | "seed";

export interface QuizQuestion {
  id: string;
  /** Shown in the text column and read out by screen readers. */
  title: string;
  /** Optional long text under the title; each item is a paragraph. The column scrolls if it is long. */
  body?: string[];
  /** Extra paragraphs for the mobile swipe cards only (how to drag the card). */
  mobileBody?: string[];
  /** Short serif line at the bottom of the card. */
  caption: string;
  /** Card border and transition color. */
  accent: string;
  illustration: IllustrationName;
  /** Looping video from public/quiz/media, by file name without extension; replaces the illustration. */
  media?: string;
}

export interface QuizResult {
  /** The result applies when the number of "yes" answers is at least this. Results are checked from the highest. */
  minYes: number;
  title: string;
  text: string[];
}

/** One question of the desktop flow, exactly as delivered in questions.<locale>.json. */
export interface ReflectionQuestion {
  number: number;
  category: string;
  question: string;
  /** "What you may not be noticing": opens after the question. */
  notSeeing: string;
  /** Three follow-up questions, opened one by one. */
  deeper: string[];
  /** Closing prompt; not shown for now. */
  final: string;
  /** Media for the question, chosen later by the site owner. */
  file: string;
}

/** Interface texts of the desktop flow. */
export interface ReflectionLabels {
  introTitle: string;
  introText: string;
  topicsLabel: string;
  /** "{n}" is replaced with the number of questions in the topic. */
  questionsCount: string;
  notSeeingLabel: string;
  deeperLabel: string;
  nextStep: string;
  /** Phones: under the "Next" button, a swipe up does the same. */
  swipeHint: string;
  nextQuestion: string;
  finish: string;
  endEyebrow: string;
  /** "{category}" is replaced with the topic name. */
  endTitle: string;
  endText: string[];
  book: string;
  otherTopic: string;
  /** Shown instead of the questionnaire to people who have not bought it. */
  lockedTitle: string;
  lockedText: string;
  lockedCta: string;
}

export interface QuizContent {
  meta: { title: string; description: string };
  wordmark: string;
  labels: {
    yes: string;
    no: string;
    /** "{n}" is replaced with the question number. */
    questionEyebrow: string;
    dragHint: string;
    keysHint: string;
    resultEyebrow: string;
    resultCardTitle: string;
    resultCardCaption: string;
    restartHint: string;
    languageLabel: string;
    progressLabel: string;
    /** Desktop: shown after an answer, inviting to scroll on to the next question. */
    scrollHint: string;
    /** Desktop: row labels of a question screen. */
    rowQuestion: string;
    rowTopic: string;
    rowContext: string;
    rowAnswer: string;
    restart: string;
  };
  /** Placeholder questions of the mobile swipe cards, until the mobile app gets its own design. */
  questions: QuizQuestion[];
  results: QuizResult[];
  reflection: ReflectionLabels;
  /** The desktop flow: topics in order, the last entry is the closing question of every topic. */
  reflectionQuestions: ReflectionQuestion[];
}

/** Everything that ships with the site; the questions are added in the browser for buyers. */
export type QuizTexts = Omit<QuizContent, "reflectionQuestions">;
