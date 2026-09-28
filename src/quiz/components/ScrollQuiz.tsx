"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createSmoothScroll, prefersReducedMotion, refreshOnResize } from "@/scroll-gallery/scroll-galleries";
import {
  auroraPalette,
  daylight,
  LIGHT_TONE_FROM,
  paintAurora,
  setDaylight,
  showBackdrop,
  startAuroraDrift,
  startKaleidoscope,
  type AuroraDrift,
  type Kaleidoscope,
} from "../aurora";
import { quizBookingUrl, quizLocales, type QuizLocale } from "../config";
import type { QuizContent, ReflectionLabels, ReflectionQuestion } from "../content/types";
import { quizPhoto } from "../photos";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Steps a question opens in: "what you may not be noticing", then three deeper questions. */
const STEPS = 4;

/** Trackpads keep firing wheel events after a gesture; ignore them for a moment after each arrival. */
const WHEEL_COOLDOWN_MS = 600;
const WHEEL_THRESHOLD = 12;
/** Wheel events closer than this belong to one gesture, which counts as one step. */
const WHEEL_GESTURE_GAP_MS = 250;

/** The one transition between screens: the text dissolves into a blur, the next screen comes into focus. */
const DISSOLVE_SECONDS = 0.5;
const APPEAR_SECONDS = 0.7;
/** The aurora takes a little longer than the text to flow into the next screen's colours. */
const AURORA_SECONDS = 2.4;

/** How long the pointer rests on a topic before the first screen takes on its colours. */
const PREVIEW_DELAY_MS = 200;

/** The quiet pause with a question. */
const PAUSE_SECONDS = 30;

/** Opacity of the blurred abstraction behind the aurora; it fades as the page grows lighter, so it never muddies the ground. */
const BACKDROP_OPACITY = 0.3;
const backdropOpacity = (light: number) => BACKDROP_OPACITY * (1 - 0.7 * light);

/** The abstract photo behind a screen (kaleidoscopes, prisms, soap films, bokeh), a different one for every screen. */
const abstraction = (item: number) => quizPhoto("abstract", item, 400);

/** The abstraction a topic opens with; hovering the topic on the first screen already shows it. */
const topicAbstraction = (topicIndex: number, screen: number) => abstraction(topicIndex * 3 + screen + 1);

/** Next or previous screen from the current scroll position; a screen taller than the viewport also stops at its bottom. */
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

/** The screen whose top is at this scroll position. */
function screenAt(root: HTMLElement, scrollTop: number) {
  return [...root.querySelectorAll<HTMLElement>("[data-screen]")].find(
    (screen) => Math.abs(screen.getBoundingClientRect().top + window.scrollY - scrollTop) < 4,
  );
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
 * questions one at a time, followed by the closing question of the whole set and the end of the topic.
 * A question opens step by step in place; the page never scrolls freely, it dissolves from one screen
 * into the next.
 */
export function ScrollQuiz({ locale, content }: ScrollQuizProps) {
  const { labels, reflection } = content;
  const all = content.reflectionQuestions;
  const closing = all[all.length - 1];
  const topics = [...new Set(all.slice(0, -1).map((question) => question.category))];

  const [topic, setTopic] = useState<string | null>(null);
  /** Steps opened per appended question; the last entry is the question in progress. */
  const [revealed, setRevealed] = useState<number[]>([]);
  const [pausing, setPausing] = useState(false);
  /** Question the page rests on (-1 on the topics, run.length on the end); null until the first move. */
  const [current, setCurrent] = useState<number | null>(null);
  /** Counts topic choices: every choice starts a fresh run, even of the same topic. */
  const [runId, setRunId] = useState(0);
  const run = topic ? [...all.filter((question) => question.category === topic && question !== closing), closing] : [];
  const topicIndex = topic ? topics.indexOf(topic) : -1;
  const done = run.length > 0 && revealed.length === run.length && revealed[revealed.length - 1] === STEPS;

  const rootRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<AuroraDrift | null>(null);
  const kaleidoscopeRef = useRef<Kaleidoscope | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const movingRef = useRef(false);
  const arrivedAtRef = useRef(0);
  const lastWheelRef = useRef(0);
  const pausingRef = useRef(false);
  const pauseTimerRef = useRef(0);
  const previewTimerRef = useRef(0);
  const stateRef = useRef({ revealed });
  useEffect(() => {
    stateRef.current = { revealed };
  });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const smooth = createSmoothScroll();
    // Stopped Lenis swallows wheel scrolling; the page only moves screen to screen via goToScreen.
    smooth.lenis.stop();
    lenisRef.current = smooth.lenis;
    const light = startAuroraDrift(auroraRef.current!);
    lightRef.current = light;
    const kaleidoscope = startKaleidoscope(auroraRef.current!.querySelector("canvas.aurora__kaleidoscope")!);
    kaleidoscopeRef.current = kaleidoscope;
    const stopRefreshing = refreshOnResize();
    return () => {
      stopRefreshing();
      light.stop();
      kaleidoscope.stop();
      smooth.destroy();
      lenisRef.current = null;
      window.clearTimeout(pauseTimerRef.current);
      window.clearTimeout(previewTimerRef.current);
    };
  }, []);

  // The first screen's abstraction is shown at once; the ones its topics open with are fetched ahead,
  // so hovering a topic shows its abstraction without waiting.
  const topicCount = topics.length;
  useEffect(() => {
    showBackdrop(auroraRef.current!, abstraction(0), BACKDROP_OPACITY);
    for (let index = 0; index < topicCount; index++) new Image().src = topicAbstraction(index, 0);
  }, [topicCount]);

  /** Dissolves the current screen and brings the next or previous one into focus. */
  const goToScreen = useCallback((direction: 1 | -1) => {
    const lenis = lenisRef.current;
    const root = rootRef.current!;
    if (!lenis || movingRef.current) return;
    // Lenis measures the page lazily; right after screens are appended its scroll limit is stale.
    lenis.resize();
    const target = nextStop(root, direction);
    if (target === undefined) return;

    movingRef.current = true;
    const leaving = screenAt(root, window.scrollY);
    const arriving = screenAt(root, target);
    const aurora = auroraRef.current!;
    const light = Number(arriving?.dataset.light ?? 0);
    paintAurora(aurora, arriving?.dataset.palette, AURORA_SECONDS);
    setDaylight(aurora, light);
    showBackdrop(aurora, arriving?.dataset.backdrop, backdropOpacity(light));
    lightRef.current?.setDepth(Number(arriving?.dataset.depth ?? 0));

    const arrive = () => {
      lenis.scrollTo(target, { immediate: true, force: true });
      // Screens are the topics, then the questions, then the end: the question's index is one less.
      if (arriving) setCurrent([...root.querySelectorAll("[data-screen]")].indexOf(arriving) - 1);
      // The text changes colour only while no screen is visible.
      root.dataset.tone = light >= LIGHT_TONE_FROM ? "light" : "dark";
      if (leaving) gsap.set(leaving, { clearProps: "opacity,filter" });
      if (arriving) gsap.fromTo(arriving, { opacity: 0 }, { opacity: 1, duration: APPEAR_SECONDS, ease: "power2.out", clearProps: "opacity" });
      movingRef.current = false;
      arrivedAtRef.current = performance.now();
    };
    if (!leaving) return arrive();
    gsap.to(leaving, { opacity: 0, filter: "blur(12px)", duration: DISSOLVE_SECONDS, ease: "power2.in", onComplete: arrive });
  }, []);

  // After choosing a topic, its first question is appended on the next render; move there once it is.
  useEffect(() => {
    if (runId > 0 && !prefersReducedMotion()) goToScreen(1);
  }, [runId, goToScreen]);

  // The deeper a question is opened, the more the light gathers and dims.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || movingRef.current) return;
    const resting = screenAt(root, window.scrollY);
    if (resting) lightRef.current?.setDepth(Number(resting.dataset.depth ?? 0));
  }, [revealed]);

  /** Opens the next step of the question in progress; the last step appends the next question. */
  const revealStep = useCallback(() => {
    setRevealed((current) => {
      const next = [...current];
      const last = next.length - 1;
      if (last < 0 || next[last] === STEPS) return current;
      next[last] += 1;
      if (next[last] === STEPS && next.length < run.length) next.push(0);
      return next;
    });
  }, [run.length]);

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

  const endPause = useCallback(() => {
    if (!pausingRef.current) return;
    pausingRef.current = false;
    setPausing(false);
    lightRef.current?.breathe(false);
    kaleidoscopeRef.current?.show(false);
    window.clearTimeout(pauseTimerRef.current);
    arrivedAtRef.current = performance.now();
  }, []);

  /** Half a minute with the question: the text fades away and the light breathes slowly. */
  function startPause() {
    pausingRef.current = true;
    setPausing(true);
    lightRef.current?.breathe(true);
    kaleidoscopeRef.current?.show(true);
    pauseTimerRef.current = window.setTimeout(endPause, PAUSE_SECONDS * 1000);
  }

  useEffect(() => {
    if (prefersReducedMotion()) return;
    function onWheel(event: WheelEvent) {
      const now = performance.now();
      const sameGesture = now - lastWheelRef.current < WHEEL_GESTURE_GAP_MS;
      lastWheelRef.current = now;
      if (pausingRef.current) return endPause();
      if (sameGesture || movingRef.current || now - arrivedAtRef.current < WHEEL_COOLDOWN_MS) return;
      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return;
      if (event.deltaY > 0) forward();
      else goToScreen(-1);
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [forward, goToScreen, endPause]);

  // Down, Page Down and Space go forward; up and Page Up go back. Any key ends the pause.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (pausingRef.current) {
        event.preventDefault();
        return endPause();
      }
      if (prefersReducedMotion() || isKeyForTarget(event)) return;
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
  }, [forward, goToScreen, endPause]);

  function reset() {
    const aurora = auroraRef.current;
    if (aurora) {
      paintAurora(aurora, "intro", 1.5);
      setDaylight(aurora, 0);
      showBackdrop(aurora, abstraction(0), BACKDROP_OPACITY);
    }
    if (rootRef.current) rootRef.current.dataset.tone = "dark";
    lightRef.current?.setDepth(0);
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }

  function chooseTopic(next: string) {
    if (topic) reset();
    setTopic(next);
    setRevealed([0]);
    setRunId((id) => id + 1);
  }

  function otherTopic() {
    reset();
    setTopic(null);
    setRevealed([]);
  }

  /** Hovering a topic on the first screen tints the aurora in its colours and shows the abstraction it opens with. */
  // Only a topic the pointer rests on changes the colours; sweeping across the list changes nothing.
  function previewTopic(name: string | null) {
    window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = window.setTimeout(() => {
      const aurora = auroraRef.current;
      if (!aurora || movingRef.current || window.scrollY > 4) return;
      const index = name ? topics.indexOf(name) : -1;
      paintAurora(aurora, index >= 0 ? `topic-${index}` : "intro", AURORA_SECONDS);
      showBackdrop(aurora, index >= 0 ? topicAbstraction(index, 0) : abstraction(0), BACKDROP_OPACITY);
    }, PREVIEW_DELAY_MS);
  }

  return (
    <div ref={rootRef} data-pausing={pausing} data-tone="dark" className="codrops relative min-h-dvh">
      <div
        ref={auroraRef}
        aria-hidden="true"
        className="aurora"
        style={Object.fromEntries(auroraPalette("intro").map((colour, index) => [`--aurora-${index + 1}`, colour]))}
      >
        <canvas className="aurora__backdrop" />
        <canvas className="aurora__backdrop" />
        <canvas className="aurora__backdrop" />
        <canvas className="aurora__kaleidoscope" />
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
              href={`/questions/${code}`}
              hrefLang={code}
              aria-current={code === locale ? "true" : undefined}
              className={code === locale ? "text-[var(--ink)]" : "text-[var(--ink-2)] underline hover:no-underline"}
            >
              {code === "uk" ? "UA" : code.toUpperCase()}
            </a>
          ))}
        </nav>
      </header>

      {/* Stories-like progress: a segment per question, filling step by step. */}
      {topic && (
        <div className="progress" aria-hidden="true">
          {run.map((question, index) => (
            <span key={question.number} className="progress__segment">
              {/* Questions after the one on screen, already gone through, stay dim: the bar shows where you are. */}
              <span
                className="progress__fill"
                data-ahead={current !== null && index > current}
                style={{ transform: `scaleX(${(revealed[index] ?? 0) / STEPS})` }}
              />
            </span>
          ))}
        </div>
      )}

      <div className="screens">
        <IntroScreen
          labels={reflection}
          topics={topics.map((name) => ({ name, count: all.filter((question) => question.category === name).length }))}
          current={topic}
          onChoose={chooseTopic}
          onPreview={previewTopic}
        />

        {revealed.map((steps, index) => {
          const question = run[index];
          return (
            <QuestionScreen
              key={`${runId}-${question.number}`}
              ref={index === revealed.length - 1 ? activeRef : undefined}
              question={question}
              palette={`topic-${topicIndex}-${index}`}
              backdrop={topicAbstraction(topicIndex, index)}
              light={daylight(index / run.length)}
              steps={steps}
              labels={labels}
              texts={reflection}
              nextLabel={index === run.length - 1 ? reflection.finish : reflection.nextQuestion}
              onStep={revealStep}
              onNext={() => goToScreen(1)}
              onBack={index > 0 ? () => goToScreen(-1) : undefined}
              onPause={startPause}
            />
          );
        })}

        {done && (
          <EndScreen
            topic={topic!}
            palette={`topic-${topicIndex}`}
            backdrop={topicAbstraction(topicIndex, run.length)}
            light={daylight(1)} questions={run} texts={reflection} onOtherTopic={otherTopic} />
        )}
      </div>

      <div className="pause" data-visible={pausing} inert={!pausing} onClick={endPause}>
        <p>{reflection.pauseHint}</p>
        {pausing && <span className="pause__line" style={{ animationDuration: `${PAUSE_SECONDS}s` }} />}
      </div>
    </div>
  );
}

/** Smallest type scale a screen may shrink to; below that the screen grows and scrolls instead. */
const MIN_FIT = 0.6;

/**
 * Keeps a whole screen within one viewport: when it does not fit, the block's type scale (--fit)
 * is narrowed down by bisection until it does. Hidden steps already take their space, so opening
 * them never changes the fit. Declared before the headline split so words are measured at the final size.
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

/**
 * The headline comes into focus word by word, then the marked rows fade in, when the screen arrives.
 * `delay` holds the rows back, e.g. until a longer headline has settled.
 */
function useScreenReveal(ref: React.RefObject<HTMLElement | null>, { wordStagger = 0.05, delay = 0.3 } = {}) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const section = ref.current!;
      const trigger = { trigger: section, start: "top 75%", once: true };
      SplitText.create(section.querySelector("h1, h2")!, {
        type: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            opacity: 0,
            filter: "blur(10px)",
            y: 8,
            duration: 1.1,
            ease: "power2.out",
            stagger: wordStagger,
            scrollTrigger: trigger,
          }),
      });
      gsap.from(section.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        y: 12,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
        delay,
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
  onPreview: (topic: string | null) => void;
}

/** Opens with the product's own question, slowly, before the topics appear. */
function IntroScreen({ labels, topics, current, onChoose, onPreview }: IntroScreenProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useFitToViewport(sectionRef);
  useScreenReveal(sectionRef, { wordStagger: 0.18, delay: 1.4 });

  return (
    <section ref={sectionRef} data-screen data-palette="intro" data-backdrop={abstraction(0)} data-depth="0" className="project">
      <h1 className="project__title project__title--hook">{labels.lockedTitle}</h1>
      <p data-reveal className="project__subtitle">
        {labels.introTitle}
      </p>
      <span data-reveal className="project__label">
        {labels.topicsLabel}
      </span>
      <p data-reveal className="project__lead">
        {labels.introText}
      </p>
      <ul data-reveal className="topics col-start-2" onMouseLeave={() => onPreview(null)}>
        {topics.map(({ name, count }) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onChoose(name)}
              onMouseEnter={() => onPreview(name)}
              onFocus={() => onPreview(name)}
              onBlur={() => onPreview(null)}
              aria-pressed={current === name}
              className="topic"
            >
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
  /** Blurred abstraction behind the aurora while this screen is shown. */
  backdrop: string;
  /** How light the page is on this screen, 0 to 1. */
  light: number;
  /** How many steps are open, 0 to STEPS. */
  steps: number;
  labels: QuizContent["labels"];
  texts: ReflectionLabels;
  nextLabel: string;
  onStep: () => void;
  onNext: () => void;
  /** Back to the question before; not on a topic's first question. */
  onBack?: () => void;
  onPause: () => void;
}

/**
 * One question laid out like a Codrops project block: labels on the left, values on the right.
 * Every step is in the layout from the start and only comes into focus when opened, so nothing shifts.
 */
function QuestionScreen({
  ref,
  question,
  palette,
  backdrop,
  light,
  steps,
  labels,
  texts,
  nextLabel,
  onStep,
  onNext,
  onBack,
  onPause,
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
    <section
      ref={setRefs}
      data-screen
      data-palette={palette}
      data-backdrop={backdrop}
      data-light={light}
      data-depth={steps / STEPS}
      className="project"
    >
      <span data-reveal className="project__label">
        {labels.rowQuestion}
      </span>
      <span data-reveal>{question.category}</span>

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

      {/* The way back sits in the labels' column, level with the way on; an empty cell keeps the grid on the first question. */}
      {onBack ? (
        <button type="button" onClick={onBack} data-reveal className="step-back">
          <span aria-hidden="true">↑</span> {texts.previousQuestion}
        </button>
      ) : (
        <span />
      )}
      {/* "Next" and "Next question" share one cell, so switching between them never shifts the block. */}
      <div className="step-controls col-start-2">
        <button type="button" onClick={onStep} inert={finished} data-visible={!finished} className="scroll-hint">
          <span className="scroll-hint__line" aria-hidden="true" />
          <span>{texts.nextStep}</span>
        </button>
        <button type="button" onClick={onNext} inert={!finished} data-visible={finished} className="scroll-hint">
          <span className="scroll-hint__line" aria-hidden="true" />
          <span>{nextLabel}</span>
        </button>
        <button
          type="button"
          onClick={onPause}
          inert={!finished}
          data-visible={finished}
          className="scroll-hint step-controls__pause"
        >
          {texts.pause}
        </button>
      </div>
    </section>
  );
}

interface EndScreenProps {
  topic: string;
  palette: string;
  backdrop: string;
  light: number;
  questions: ReflectionQuestion[];
  texts: ReflectionLabels;
  onOtherTopic: () => void;
}

/**
 * The end of a topic, the moment that is remembered: the questions gone through gather one by one,
 * stay for a while, and only then the invitation to a session comes into focus.
 */
function EndScreen({ topic, palette, backdrop, light, questions, texts, onOtherTopic }: EndScreenProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useFitToViewport(sectionRef);
  useScreenReveal(sectionRef);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const section = sectionRef.current!;
      const focus = { opacity: 0, filter: "blur(10px)", ease: "power2.out" };
      gsap
        .timeline({ scrollTrigger: { trigger: section, start: "top 75%", once: true }, delay: 0.8 })
        .from(section.querySelectorAll("[data-passed]"), { ...focus, y: 8, duration: 1, stagger: 0.3 })
        .from(section.querySelectorAll("[data-after]"), { ...focus, duration: 1.4, stagger: 0.3 }, "+=1.6");
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} data-screen data-palette={palette} data-backdrop={backdrop} data-light={light} data-depth="0" className="project">
      <span data-reveal className="project__label">
        {texts.endEyebrow}
      </span>
      <span data-reveal>{topic}</span>
      <h2 className="project__title project__title--question">{texts.endTitle.replace("{category}", topic)}</h2>

      <span data-passed className="project__label">
        {texts.endPassed.replace("{n}", String(questions.length))}
      </span>
      <ol className="passed">
        {questions.map((question) => (
          <li key={question.number} data-passed>
            {question.question}
          </li>
        ))}
      </ol>

      <div data-after className="project__columns col-start-2">
        {texts.endText.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div data-after className="project__answer-row col-start-2 flex flex-wrap items-baseline gap-x-10 gap-y-4">
        <a
          href={quizBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="project__choice underline decoration-1 underline-offset-[0.2em] hover:no-underline"
        >
          {texts.book}
        </a>
        <button type="button" onClick={onOtherTopic} className="text-[var(--ink-2)] underline hover:text-[var(--ink)] hover:no-underline">
          {texts.otherTopic}
        </button>
      </div>
    </section>
  );
}
