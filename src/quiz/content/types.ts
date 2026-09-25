export type IllustrationName = "leaf" | "sprout" | "flower" | "moon" | "seed";

export interface QuizQuestion {
  id: string;
  /** Shown in the text column and read out by screen readers. */
  title: string;
  /** Optional long text under the title; each item is a paragraph. The column scrolls if it is long. */
  body?: string[];
  /** Short serif line at the bottom of the card. */
  caption: string;
  /** Card border and transition color. */
  accent: string;
  illustration: IllustrationName;
}

export interface QuizResult {
  /** The result applies when the number of "yes" answers is at least this. Results are checked from the highest. */
  minYes: number;
  title: string;
  text: string[];
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
  };
  questions: QuizQuestion[];
  results: QuizResult[];
}
