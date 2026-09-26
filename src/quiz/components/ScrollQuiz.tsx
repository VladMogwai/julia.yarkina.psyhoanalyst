"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GalleryEffect, type GalleryEffectName } from "@/scroll-gallery/GalleryEffect";
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
import { QUIZ_TRANSITION_FLIP, QUIZ_TRANSITION_SPEED, QUIZ_TRANSITIONS } from "../transitions";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type Answer = "yes" | "no";

const pad = (value: number) => String(value).padStart(2, "0");

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Trackpads keep firing wheel events after a gesture; ignore them for a moment after each arrival. */
const WHEEL_COOLDOWN_MS = 600;
const WHEEL_THRESHOLD = 12;

/** Playback speed of the move between screens (and the gallery played along the way); 1 = original. */
const TRANSITION_SPEED = 0.7;

/**
 * Where the page settles next. Screens are the stops; galleries between them are only passed through.
 * Forward goes to the next screen, or to the bottom of the current one when it is taller than the
 * viewport and nothing follows yet (the answer buttons are down there). Back steps through both.
 */
function nextStop(root: HTMLElement, direction: 1 | -1): number | undefined {
  const current = window.scrollY;
  const screens = [...root.querySelectorAll<HTMLElement>("[data-screen]")].map((screen) => {
    const top = Math.round(screen.getBoundingClientRect().top + current);
    return { top, bottom: top + Math.max(0, screen.offsetHeight - window.innerHeight) };
  });

  if (direction > 0) {
    const nextScreen = screens.find((screen) => screen.top > current + 4);
    const ownBottom = screens.find((screen) => screen.top <= current + 4 && screen.bottom > current + 4);
    return nextScreen?.top ?? ownBottom?.bottom;
  }
  const stops = screens.flatMap((screen) => (screen.bottom > screen.top ? [screen.top, screen.bottom] : [screen.top]));
  return stops.reverse().find((stop) => stop < current - 4);
}

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
  const movingRef = useRef(false);
  const arrivedAtRef = useRef(0);

  const yesCount = answers.filter((answer) => answer === "yes").length;
  const result = [...content.results].sort((a, b) => b.minYes - a.minYes).find((item) => yesCount >= item.minYes);
  const finished = answers.length === total;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const smooth = createSmoothScroll();
    // Stopped Lenis swallows wheel scrolling; the page only moves screen to screen via goToScreen.
    smooth.lenis.stop();
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

  /** Glides to the next or previous screen; the gallery transitions in between play on the way. */
  const goToScreen = useCallback((direction: 1 | -1) => {
    const lenis = lenisRef.current;
    if (!lenis || movingRef.current) return;
    const target = nextStop(rootRef.current!, direction);
    if (target === undefined) return;

    movingRef.current = true;
    const [from, to] = [window.scrollY, target].sort((a, b) => a - b);
    const crossedSpeeds = [...rootRef.current!.querySelectorAll<HTMLElement>("[data-transition]")]
      .filter((wrap) => {
        const top = wrap.getBoundingClientRect().top + window.scrollY;
        return top >= from && top < to;
      })
      .map((wrap) => QUIZ_TRANSITION_SPEED[wrap.dataset.effect as GalleryEffectName] ?? 1);
    const speed = TRANSITION_SPEED * Math.min(1, ...crossedSpeeds);
    const screens = (to - from) / window.innerHeight;
    lenis.scrollTo(target, {
      duration: Math.min(2.4, Math.max(0.7, screens * 0.55)) / speed,
      easing: easeInOutCubic,
      force: true,
      lock: true,
      onComplete: () => {
        movingRef.current = false;
        arrivedAtRef.current = performance.now();
      },
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    function onWheel(event: WheelEvent) {
      if (movingRef.current || performance.now() - arrivedAtRef.current < WHEEL_COOLDOWN_MS) return;
      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return;
      goToScreen(event.deltaY > 0 ? 1 : -1);
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [goToScreen]);

  // Left/right answer the current question ("yes"/"no"); up/down, Page keys and Space move between screens.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && !finished) answer(answers.length, "yes");
      if (event.key === "ArrowRight" && !finished) answer(answers.length, "no");
      if (prefersReducedMotion()) return;
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goToScreen(1);
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToScreen(-1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, answers.length, finished, goToScreen]);

  function restart() {
    // Galleries must be reverted before React removes their pinned wrappers.
    galleryCleanups.current.forEach((cleanup) => cleanup());
    galleryCleanups.current.clear();
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    setAnswers([]);
  }

  const visible = questions.slice(0, Math.min(answers.length + 1, total));

  return (
    <div ref={rootRef} className="codrops relative min-h-dvh text-white">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-8 p-4 text-[0.85em] opacity-70">
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
              onNext={() => goToScreen(1)}
            />
            {answers[index] && (
              <div data-transition={index} data-effect={QUIZ_TRANSITIONS[index % QUIZ_TRANSITIONS.length]}>
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
        <section data-screen className="project">
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

/** Smallest type scale a question may shrink to; below that the screen grows and scrolls instead. */
const MIN_FIT = 0.6;

/**
 * Keeps a whole question (text and answer buttons) within one viewport: when it does not fit,
 * the block's type scale (--fit) is narrowed down by bisection until it does.
 * Declared before the headline split so lines are measured at the final size.
 */
function useFitToViewport(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const section = ref.current!;
    const fits = () => section.offsetHeight <= window.innerHeight;
    function fit() {
      section.style.setProperty("--fit", "1");
      if (fits()) return;
      let [low, high] = [MIN_FIT, 1];
      for (let step = 0; step < 7; step++) {
        const middle = (low + high) / 2;
        section.style.setProperty("--fit", String(middle));
        if (fits()) low = middle;
        else high = middle;
      }
      section.style.setProperty("--fit", String(low));
    }
    fit();
    document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref]);
}

interface QuestionScreenProps {
  question: QuizQuestion;
  index: number;
  total: number;
  answer?: Answer;
  showScrollHint: boolean;
  labels: QuizContent["labels"];
  onAnswer: (choice: Answer) => void;
  onNext: () => void;
}

/** One question laid out like a Codrops project block: labels on the left, values on the right. */
function QuestionScreen({ question, index, total, answer, showScrollHint, labels, onAnswer, onNext }: QuestionScreenProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useFitToViewport(sectionRef);

  // Headline lines rise out of masks as the block scrolls into view.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const section = sectionRef.current!;
      const trigger = { trigger: section, start: "top 75%", once: true };
      SplitText.create(section.querySelector("h2")!, {
        type: "lines",
        mask: "lines",
        linesClass: "title-line",
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
    <section ref={sectionRef} data-screen className="project">
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
            {[0, 1].map((column) => (
              <div key={column}>
                {question.body!
                  .filter((_, paragraph) => paragraph % 2 === column)
                  .map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
              </div>
            ))}
          </div>
        </>
      )}

      <span data-reveal className="project__label project__answer-row self-end">{labels.rowAnswer}</span>
      <div data-reveal className="project__answer-row flex items-end gap-[2.5em]">
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
              className={`project__choice leading-none transition-colors duration-500 ${
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

      {/* Always in the layout so answering never shifts the block; it only comes into focus. */}
      <button
        type="button"
        onClick={onNext}
        inert={!showScrollHint}
        data-visible={showScrollHint}
        className="scroll-hint col-start-2 mt-[1.5em] flex items-center gap-4 justify-self-start text-[#adadad] hover:text-white"
      >
        <span className="scroll-hint__line" aria-hidden="true" />
        <span>{labels.scrollHint}</span>
      </button>
    </section>
  );
}
