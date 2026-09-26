"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GalleryEffect, galleryPhotoUrls, type GalleryEffectName } from "@/scroll-gallery/GalleryEffect";
import {
  animateGallery,
  createSmoothScroll,
  prefersReducedMotion,
  refreshOnResize,
  waitForGalleryImages,
} from "@/scroll-gallery/scroll-galleries";
import "@/scroll-gallery/scroll-gallery.css";
import { auroraPalette, paintAurora, startAuroraLight, type AuroraLight } from "../aurora";
import { quizBookingUrl, quizLocales, type QuizLocale } from "../config";
import type { QuizContent, ReflectionLabels, ReflectionQuestion } from "../content/types";
import { quizPhoto } from "../photos";
import { QUIZ_TRANSITION_FLIP, QUIZ_TRANSITION_SPEED, QUIZ_TRANSITIONS } from "../transitions";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Steps a question opens in: "what you may not be noticing", then three deeper questions. */
const STEPS = 4;

const pad = (value: number) => String(value).padStart(2, "0");

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Trackpads keep firing wheel events after a gesture; ignore them for a moment after each arrival. */
const WHEEL_COOLDOWN_MS = 600;
const WHEEL_THRESHOLD = 12;
/** Wheel events closer than this belong to one gesture, which counts as one step. */
const WHEEL_GESTURE_GAP_MS = 250;

/** Playback speed of the move between screens (and the gallery played along the way); 1 = original. */
const TRANSITION_SPEED = 0.7;

/**
 * Where the page settles next. Screens are the stops; galleries between them are only passed through.
 * Forward goes to the next screen, or to the bottom of the current one when it is taller than the
 * viewport and nothing follows yet. Back steps through both.
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

/** Space on a focused control presses the control instead of moving the page. */
function isKeyForTarget(event: KeyboardEvent) {
  return event.key === " " && event.target instanceof HTMLElement && Boolean(event.target.closest("button, a"));
}

interface ScrollQuizProps {
  locale: QuizLocale;
  content: QuizContent;
}

/**
 * Desktop questionnaire as one long page. The first screen lists the topics; choosing one appends its
 * questions one at a time, followed by the closing question of the whole set. A question opens
 * step by step in place; once its last deeper question is open, a scroll-scrubbed gallery and the next question
 * are appended below.
 */
export function ScrollQuiz({ locale, content }: ScrollQuizProps) {
  const { labels, reflection } = content;
  const all = content.reflectionQuestions;
  const closing = all[all.length - 1];
  const topics = [...new Set(all.slice(0, -1).map((question) => question.category))];

  const [topic, setTopic] = useState<string | null>(null);
  /** Steps opened per appended question; the last entry is the question in progress. */
  const [revealed, setRevealed] = useState<number[]>([]);
  const run = topic ? [...all.filter((question) => question.category === topic && question !== closing), closing] : [];
  const done = run.length > 0 && revealed.length === run.length && revealed[revealed.length - 1] === STEPS;

  const rootRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<AuroraLight | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const galleryCleanups = useRef(new Map<string, () => void>());
  const movingRef = useRef(false);
  const arrivedAtRef = useRef(0);
  const lastWheelRef = useRef(0);
  /** Galleries whose photos are decoded and whose animation is set up. */
  const readyRef = useRef(new Set<string>());
  /** A move asked for while a gallery on the way was still loading; it starts once the gallery is ready. */
  const moveWhenReadyRef = useRef<1 | -1 | null>(null);
  const stateRef = useRef({ revealed, runLength: run.length });
  useEffect(() => {
    stateRef.current = { revealed, runLength: run.length };
  });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const smooth = createSmoothScroll();
    // Stopped Lenis swallows wheel scrolling; the page only moves screen to screen via goToScreen.
    smooth.lenis.stop();
    lenisRef.current = smooth.lenis;
    const light = startAuroraLight(auroraRef.current!);
    lightRef.current = light;
    const stopRefreshing = refreshOnResize();
    const cleanups = galleryCleanups.current;
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
      stopRefreshing();
      light.stop();
      smooth.destroy();
      lenisRef.current = null;
    };
  }, []);

  /** Glides to the next or previous screen; the gallery transitions in between play on the way. */
  const goToScreen = useCallback((direction: 1 | -1) => {
    const lenis = lenisRef.current;
    if (!lenis || movingRef.current) return;
    const target = nextStop(rootRef.current!, direction);
    if (target === undefined) return;
    // Lenis measures the page lazily; right after screens are appended its scroll limit is stale.
    lenis.resize();

    const [from, to] = [window.scrollY, target].sort((a, b) => a - b);
    const crossed = [...rootRef.current!.querySelectorAll<HTMLElement>("[data-transition]")].filter((wrap) => {
      const top = wrap.getBoundingClientRect().top + window.scrollY;
      return top >= from && top < to;
    });
    // Never glide through a gallery that is still loading: it would get pinned in the middle of the move.
    if (crossed.some((wrap) => !readyRef.current.has(wrap.dataset.transition!))) {
      moveWhenReadyRef.current = direction;
      return;
    }

    movingRef.current = true;
    const crossedSpeeds = crossed.map((wrap) => QUIZ_TRANSITION_SPEED[wrap.dataset.effect as GalleryEffectName] ?? 1);
    const speed = TRANSITION_SPEED * Math.min(1, ...crossedSpeeds);
    const screens = (to - from) / window.innerHeight;
    const duration = Math.min(2.4, Math.max(0.7, screens * 0.55)) / speed;

    // The aurora flows into the colours of the screen being approached, for as long as the move lasts.
    const arriving = [...rootRef.current!.querySelectorAll<HTMLElement>("[data-screen]")].find(
      (screen) => Math.abs(screen.getBoundingClientRect().top + window.scrollY - target) < 4,
    );
    if (arriving && auroraRef.current) {
      paintAurora(auroraRef.current, arriving.dataset.palette, duration);
      lightRef.current?.surge(duration);
    }

    lenis.scrollTo(target, {
      duration,
      easing: easeInOutCubic,
      force: true,
      lock: true,
      onComplete: () => {
        movingRef.current = false;
        arrivedAtRef.current = performance.now();
      },
    });
  }, []);

  // Every appended gallery is animated once its photos are decoded. Loading keeps going when more
  // screens are appended meanwhile; only a gallery removed by a reset is left alone.
  useEffect(() => {
    const root = rootRef.current!;
    root.querySelectorAll<HTMLElement>("[data-transition]").forEach((wrap) => {
      const key = wrap.dataset.transition!;
      if (galleryCleanups.current.has(key)) return;
      galleryCleanups.current.set(key, () => {});
      waitForGalleryImages(wrap).then(() => {
        if (!wrap.isConnected || !galleryCleanups.current.has(key)) return;
        galleryCleanups.current.set(key, animateGallery(wrap.querySelector<HTMLElement>(".gallery")!));
        readyRef.current.add(key);
        ScrollTrigger.refresh();
        const pending = moveWhenReadyRef.current;
        if (pending) {
          moveWhenReadyRef.current = null;
          goToScreen(pending);
        }
      });
    });
  }, [revealed.length, done, topic, goToScreen]);

  /** Opens the next step of the question in progress; the last step appends the next question. */
  const revealStep = useCallback(() => {
    setRevealed((current) => {
      const next = [...current];
      const last = next.length - 1;
      if (last < 0 || next[last] === STEPS) return current;
      next[last] += 1;
      if (next[last] === STEPS && next.length < stateRef.current.runLength) next.push(0);
      return next;
    });
  }, []);

  /** Forward: open the next step while the page rests on an unfinished question, otherwise move on. */
  const forward = useCallback(() => {
    const { revealed: steps } = stateRef.current;
    const active = activeRef.current;
    const unfinished = steps.length > 0 && steps[steps.length - 1] < STEPS;
    if (unfinished && active && Math.abs(active.getBoundingClientRect().top) < 8) {
      revealStep();
      arrivedAtRef.current = performance.now();
      return;
    }
    goToScreen(1);
  }, [goToScreen, revealStep]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    function onWheel(event: WheelEvent) {
      const now = performance.now();
      const sameGesture = now - lastWheelRef.current < WHEEL_GESTURE_GAP_MS;
      lastWheelRef.current = now;
      if (sameGesture || movingRef.current || now - arrivedAtRef.current < WHEEL_COOLDOWN_MS) return;
      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return;
      if (event.deltaY > 0) forward();
      else goToScreen(-1);
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [forward, goToScreen]);

  // Down, Page Down and Space go forward; up and Page Up go back.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    function onKeyDown(event: KeyboardEvent) {
      if (isKeyForTarget(event)) return;
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        if (!movingRef.current) forward();
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToScreen(-1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [forward, goToScreen]);

  function reset() {
    if (auroraRef.current) paintAurora(auroraRef.current, "intro", 1.5);
    // Galleries must be reverted before React removes their pinned wrappers.
    galleryCleanups.current.forEach((cleanup) => cleanup());
    galleryCleanups.current.clear();
    readyRef.current.clear();
    moveWhenReadyRef.current = null;
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }

  function chooseTopic(next: string) {
    if (topic) reset();
    setTopic(next);
    setRevealed([0]);
    if (!prefersReducedMotion()) moveWhenReadyRef.current = 1;
  }

  function otherTopic() {
    reset();
    setTopic(null);
    setRevealed([]);
  }

  /** The gallery leading to a screen shows photos of that screen's topic. */
  const transitionPhoto = (index: number, palette: string) => (item: number, width: number) =>
    quizPhoto(palette, item + index * 5, width);
  const paletteOf = (question: ReflectionQuestion) =>
    question === closing ? "closing" : `topic-${topics.indexOf(question.category)}`;

  // While a question is being read, the photos of the gallery after it are already fetched,
  // so moving on never has to wait for them.
  const upcoming = revealed.length;
  const upcomingPalette =
    !topic || upcoming > run.length
      ? null
      : upcoming < run.length
        ? paletteOf(run[upcoming])
        : `topic-${topics.indexOf(topic)}`;
  useEffect(() => {
    if (!upcomingPalette) return;
    const effect = QUIZ_TRANSITIONS[upcoming % QUIZ_TRANSITIONS.length];
    galleryPhotoUrls(effect, transitionPhoto(upcoming, upcomingPalette)).forEach((src) => {
      new Image().src = src;
    });
  }, [upcoming, upcomingPalette]);

  const transition = (index: number, caption: string, palette: string) => {
    const effect = QUIZ_TRANSITIONS[index % QUIZ_TRANSITIONS.length];
    return (
      <div data-transition={`${topic}-${index}`} data-effect={effect}>
        <GalleryEffect
          effect={effect}
          caption={caption}
          flip={QUIZ_TRANSITION_FLIP}
          photo={transitionPhoto(index, palette)}
        />
      </div>
    );
  };

  return (
    <div ref={rootRef} className="codrops relative min-h-dvh text-white">
      <div
        ref={auroraRef}
        aria-hidden="true"
        className="aurora"
        style={Object.fromEntries(auroraPalette("intro").map((colour, index) => [`--aurora-${index + 1}`, colour]))}
      >
        <span className="aurora__blob" />
        <span className="aurora__blob" />
        <span className="aurora__blob" />
        <span className="aurora__grain" />
      </div>
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

      <IntroScreen
        labels={reflection}
        topics={topics.map((name) => ({ name, count: all.filter((question) => question.category === name).length }))}
        current={topic}
        onChoose={chooseTopic}
      />

      {revealed.map((steps, index) => {
        const question = run[index];
        const isLast = index === run.length - 1;
        const palette = paletteOf(question);
        return (
          <div key={`${topic}-${question.number}`}>
            {transition(index, question.category, palette)}
            <QuestionScreen
              ref={index === revealed.length - 1 ? activeRef : undefined}
              question={question}
              palette={palette}
              position={index + 1}
              total={run.length}
              steps={steps}
              labels={labels}
              texts={reflection}
              nextLabel={isLast ? reflection.finish : reflection.nextQuestion}
              onStep={revealStep}
              onNext={() => goToScreen(1)}
            />
          </div>
        );
      })}

      {done && (
        <>
          {transition(run.length, reflection.endEyebrow, `topic-${topics.indexOf(topic!)}`)}
          <section data-screen data-palette={`topic-${topics.indexOf(topic!)}`} className="project">
            <span className="project__label">{reflection.endEyebrow}</span>
            <span>{topic}</span>
            <h2 className="project__title">{reflection.endTitle.replace("{category}", topic!)}</h2>
            <div className="project__columns col-start-2">
              {reflection.endText.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="project__answer-row col-start-2 flex flex-wrap items-baseline gap-x-10 gap-y-4">
              <a
                href={quizBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project__choice text-white underline decoration-1 underline-offset-[0.2em] hover:no-underline"
              >
                {reflection.book}
              </a>
              <button
                type="button"
                onClick={otherTopic}
                className="text-[#adadad] underline hover:text-white hover:no-underline"
              >
                {reflection.otherTopic}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/** Smallest type scale a screen may shrink to; below that the screen grows and scrolls instead. */
const MIN_FIT = 0.6;

/**
 * Keeps a whole screen within one viewport: when it does not fit, the block's type scale (--fit)
 * is narrowed down by bisection until it does. Hidden steps already take their space, so opening
 * them never changes the fit. Declared before the headline split so lines are measured at the final size.
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

/** Headline lines rise out of masks, and the marked rows fade in, as the block scrolls into view. */
function useScreenReveal(ref: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const section = ref.current!;
      const trigger = { trigger: section, start: "top 75%", once: true };
      SplitText.create(section.querySelector("h1, h2")!, {
        type: "lines",
        mask: "lines",
        linesClass: "title-line",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: trigger,
          }),
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
    { scope: ref },
  );
}

interface IntroScreenProps {
  labels: ReflectionLabels;
  topics: { name: string; count: number }[];
  current: string | null;
  onChoose: (topic: string) => void;
}

function IntroScreen({ labels, topics, current, onChoose }: IntroScreenProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useFitToViewport(sectionRef);
  useScreenReveal(sectionRef);

  return (
    <section ref={sectionRef} data-screen data-palette="intro" className="project">
      <h1 className="project__title project__title--question">{labels.introTitle}</h1>
      <span data-reveal className="project__label">
        {labels.topicsLabel}
      </span>
      <p data-reveal className="project__lead">
        {labels.introText}
      </p>
      <ul data-reveal className="topics col-start-2">
        {topics.map(({ name, count }) => (
          <li key={name}>
            <button type="button" onClick={() => onChoose(name)} aria-pressed={current === name} className="topic">
              <span className="topic__name">{name}</span>
              <span className="topic__count">{labels.questionsCount.replace("{n}", String(count))}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface QuestionScreenProps {
  ref?: React.Ref<HTMLElement>;
  question: ReflectionQuestion;
  /** Aurora palette of this screen. */
  palette: string;
  position: number;
  total: number;
  /** How many steps are open, 0 to STEPS. */
  steps: number;
  labels: QuizContent["labels"];
  texts: ReflectionLabels;
  nextLabel: string;
  onStep: () => void;
  onNext: () => void;
}

/**
 * One question laid out like a Codrops project block: labels on the left, values on the right.
 * Every step is in the layout from the start and only comes into focus when opened, so nothing shifts.
 */
function QuestionScreen({
  ref,
  question,
  palette,
  position,
  total,
  steps,
  labels,
  texts,
  nextLabel,
  onStep,
  onNext,
}: QuestionScreenProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useFitToViewport(sectionRef);
  useScreenReveal(sectionRef);

  const setRefs = (node: HTMLElement | null) => {
    sectionRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const step = (index: number) => ({ "data-visible": steps >= index, inert: steps < index });
  const finished = steps === STEPS;

  return (
    <section ref={setRefs} data-screen data-palette={palette} className="project">
      <span data-reveal className="project__label">
        {labels.rowQuestion}
      </span>
      <span data-reveal>
        {pad(position)} / {pad(total)} · {question.category}
      </span>

      <h2 className="project__title project__title--question">{question.question}</h2>

      <span {...step(1)} className="step project__label">
        {texts.notSeeingLabel}
      </span>
      <p {...step(1)} className="step project__lead">
        {question.notSeeing}
      </p>

      <span {...step(2)} className="step project__label project__step-row">
        {texts.deeperLabel}
      </span>
      <ol className="deeper project__step-row">
        {question.deeper.map((line, index) => (
          <li key={line} {...step(index + 2)} className="step">
            {line}
          </li>
        ))}
      </ol>

      {/* Both controls share one cell, so switching between them never shifts the block. */}
      <div className="step-controls col-start-2">
        <button type="button" onClick={onStep} inert={finished} data-visible={!finished} className="scroll-hint">
          <span className="scroll-hint__line" aria-hidden="true" />
          <span>{texts.nextStep}</span>
        </button>
        <button type="button" onClick={onNext} inert={!finished} data-visible={finished} className="scroll-hint">
          <span className="scroll-hint__line" aria-hidden="true" />
          <span>{nextLabel}</span>
        </button>
      </div>
    </section>
  );
}
