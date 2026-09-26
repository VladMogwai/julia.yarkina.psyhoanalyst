"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import { useCallback, useEffect, useRef, useState } from "react";
import { GalleryEffect } from "@/scroll-gallery/GalleryEffect";
import { pexelsPhoto } from "@/scroll-gallery/placeholder-photos";
import {
  animateGallery,
  createSmoothScroll,
  prefersReducedMotion,
  refreshOnResize,
  waitForGalleryImages,
} from "@/scroll-gallery/scroll-galleries";
import "@/scroll-gallery/scroll-gallery.css";
import { quizLocales, type QuizLocale } from "../config";
import type { QuizContent, QuizQuestion } from "../content/types";
import { QUIZ_TRANSITION_FLIP, QUIZ_TRANSITIONS } from "../transitions";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type Answer = "yes" | "no";

const pad = (value: number) => String(value).padStart(2, "0");

interface ScrollQuizProps {
  locale: QuizLocale;
  content: QuizContent;
}

/**
 * Desktop questionnaire as one long page. Nothing exists below the current question until it is
 * answered, so the page cannot be scrolled further; each answer appends a scroll-scrubbed gallery
 * transition and the next question (or the result).
 */
export function ScrollQuiz({ locale, content }: ScrollQuizProps) {
  const { questions, labels } = content;
  const total = questions.length;
  const [answers, setAnswers] = useState<Answer[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const galleryCleanups = useRef(new Map<number, () => void>());

  const yesCount = answers.filter((answer) => answer === "yes").length;
  const result = [...content.results].sort((a, b) => b.minYes - a.minYes).find((item) => yesCount >= item.minYes);
  const finished = answers.length === total;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const smooth = createSmoothScroll();
    lenisRef.current = smooth.lenis;
    const stopRefreshing = refreshOnResize();
    const cleanups = galleryCleanups.current;
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
      stopRefreshing();
      smooth.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Every answer appends a gallery; animate it once its photos are decoded.
  useEffect(() => {
    const root = rootRef.current!;
    let cancelled = false;
    root.querySelectorAll<HTMLElement>("[data-transition]").forEach((wrap) => {
      const index = Number(wrap.dataset.transition);
      if (galleryCleanups.current.has(index)) return;
      galleryCleanups.current.set(index, () => {});
      waitForGalleryImages(wrap).then(() => {
        if (cancelled) return;
        galleryCleanups.current.set(index, animateGallery(wrap.querySelector<HTMLElement>(".gallery")!));
        ScrollTrigger.refresh();
      });
    });
    return () => {
      cancelled = true;
    };
  }, [answers.length]);

  const answer = useCallback(
    (index: number, choice: Answer) => {
      setAnswers((current) => (current.length === index ? [...current, choice] : current));
    },
    [],
  );

  // Arrow keys answer the current question: left is "yes", right is "no".
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (finished) return;
      if (event.key === "ArrowLeft") answer(answers.length, "yes");
      if (event.key === "ArrowRight") answer(answers.length, "no");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, answers.length, finished]);

  function restart() {
    // Galleries must be reverted before React removes their pinned wrappers.
    galleryCleanups.current.forEach((cleanup) => cleanup());
    galleryCleanups.current.clear();
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    setAnswers([]);
  }

  const visible = questions.slice(0, Math.min(answers.length + 1, total));

  return (
    <div ref={rootRef} className="codrops relative min-h-dvh text-white">
      <header className="flex items-center gap-8 p-4 text-[0.85em] opacity-70">
        <span>{content.wordmark}</span>
        <nav aria-label={labels.languageLabel} className="flex gap-4">
          {quizLocales.map((code) => (
            <a
              key={code}
              href={`/quiz/${code}`}
              hrefLang={code}
              aria-current={code === locale ? "true" : undefined}
              className={code === locale ? "text-white" : "text-[#aaa] underline hover:no-underline"}
            >
              {code === "uk" ? "UA" : code.toUpperCase()}
            </a>
          ))}
        </nav>
      </header>

      {visible.map((question, index) => {
        const next = questions[index + 1];
        return (
          <div key={question.id}>
            <QuestionScreen
              question={question}
              index={index}
              total={total}
              answer={answers[index]}
              showScrollHint={index === answers.length - 1}
              labels={labels}
              onAnswer={(choice) => answer(index, choice)}
            />
            {answers[index] && (
              <div data-transition={index}>
                <GalleryEffect
                  effect={QUIZ_TRANSITIONS[index % QUIZ_TRANSITIONS.length]}
                  caption={next ? next.caption : result?.title}
                  flip={QUIZ_TRANSITION_FLIP}
                  photo={(item, width) => pexelsPhoto(item + index * 5, width)}
                />
              </div>
            )}
          </div>
        );
      })}

      {finished && result && (
        <section className="project">
          <span className="project__label">{labels.resultEyebrow}</span>
          <h2 className="project__title">{result.title}</h2>
          <div className="project__columns col-start-2">
            {result.text.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <button type="button" onClick={restart} className="col-start-2 mt-12 justify-self-start underline hover:no-underline">
            {labels.restart}
          </button>
        </section>
      )}
    </div>
  );
}

interface QuestionScreenProps {
  question: QuizQuestion;
  index: number;
  total: number;
  answer?: Answer;
  showScrollHint: boolean;
  labels: QuizContent["labels"];
  onAnswer: (choice: Answer) => void;
}

/** One question laid out like a Codrops project block: labels on the left, values on the right. */
function QuestionScreen({ question, index, total, answer, showScrollHint, labels, onAnswer }: QuestionScreenProps) {
  const sectionRef = useRef<HTMLElement>(null);

  // Headline lines rise out of masks as the block scrolls into view.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const section = sectionRef.current!;
      const trigger = { trigger: section, start: "top 75%", once: true };
      SplitText.create(section.querySelector("h2")!, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, { yPercent: 110, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: trigger }),
      });
      gsap.from(section.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        y: 12,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
        delay: 0.25,
        scrollTrigger: trigger,
      });
    },
    { scope: sectionRef },
  );

  const choices: { value: Answer; label: string }[] = [
    { value: "yes", label: labels.yes },
    { value: "no", label: labels.no },
  ];

  return (
    <section ref={sectionRef} className="project">
      <span data-reveal className="project__label">{labels.rowQuestion}</span>
      <span data-reveal>
        {pad(index + 1)} / {pad(total)}
      </span>
      <span data-reveal className="project__label">{labels.rowTopic}</span>
      <span data-reveal>{question.caption}</span>

      <h2 className="project__title">{question.title}</h2>

      {question.body && (
        <>
          <span data-reveal className="project__label">{labels.rowContext}</span>
          <div data-reveal className="project__columns">
            {question.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </>
      )}

      <span data-reveal className="project__label mt-16 self-end">{labels.rowAnswer}</span>
      <div data-reveal className="mt-16 flex items-end gap-12">
        {choices.map((choice) => {
          const chosen = answer === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              disabled={Boolean(answer)}
              aria-pressed={chosen}
              aria-label={`${choice.label}: ${question.title}`}
              onClick={() => onAnswer(choice.value)}
              className={`text-[clamp(2.5rem,6vw,5rem)] leading-none transition-colors duration-500 ${
                answer
                  ? chosen
                    ? "text-white underline decoration-1 underline-offset-[0.2em]"
                    : "text-[#575757]"
                  : "text-[#adadad] hover:text-white focus-visible:text-white"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {showScrollHint && (
        <div className="scroll-hint col-start-2 mt-10 flex items-center gap-4 text-[#adadad]">
          <span className="scroll-hint__line" aria-hidden="true" />
          <span>{labels.scrollHint}</span>
        </div>
      )}
    </section>
  );
}
