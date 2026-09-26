"use client";

import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { auroraPalette, startAuroraLight } from "../aurora";
import { quizBookingUrl, quizLocales, type QuizLocale } from "../config";
import type { QuizContent, ReflectionQuestion } from "../content/types";
import { quizPhoto } from "../photos";

/** Steps a question opens in: "what you may not be noticing", then three deeper questions. */
const STEPS = 4;
/** Main cards take turns in the colours of the reference design. */
const CARD_TONES = ["cream", "mint", "lavender"] as const;
/** A swipe up counts once the card travelled this far (px), or less with a quick flick. */
const SWIPE_DISTANCE = 90;
const FLICK_DISTANCE = 30;
const FLICK_SPEED = 0.4; // px per ms

const pad = (value: number) => String(value).padStart(2, "0");

type Card = { kind: "intro" } | { kind: "question"; index: number } | { kind: "end" };

const cardKey = (card: Card, topic: string | null) =>
  card.kind === "question" ? `${topic}-${card.index}` : `${topic}-${card.kind}`;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const toneOf = (card: Card) =>
  card.kind === "question" ? CARD_TONES[card.index % CARD_TONES.length] : card.kind === "end" ? "lavender" : "cream";

/**
 * The next card comes out of the stream: the tile of its colour nearest to the middle of the screen
 * lifts out of the blur and unfolds into the main card, whose text then fades in.
 * Returns a cleanup; `onDone` runs once the card is in place.
 */
function flyFromStream(slot: HTMLElement, tone: string, onDone: () => void) {
  const card = slot.querySelector<HTMLElement>(".m-card")!;
  const contents = [...card.querySelectorAll<HTMLElement>(".m-card__top, .m-card__body > *")];
  const target = card.getBoundingClientRect();
  const distance = (tile: HTMLElement) => {
    const box = tile.getBoundingClientRect();
    return Math.hypot(
      box.left + box.width / 2 - window.innerWidth / 2,
      box.top + box.height / 2 - window.innerHeight / 2,
    );
  };
  const tile = [...document.querySelectorAll<HTMLElement>(`.m-tile--${tone}`)]
    .filter((candidate) => {
      const box = candidate.getBoundingClientRect();
      return box.top > 0 && box.bottom < window.innerHeight && box.right > 0 && box.left < window.innerWidth;
    })
    .sort((a, b) => distance(a) - distance(b))[0];

  if (!tile) {
    const tween = gsap.from(card, { y: 60, opacity: 0, duration: 0.6, ease: "power3.out", onComplete: onDone });
    return () => tween.kill();
  }

  const from = tile.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "m-ghost";
  Object.assign(ghost.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    background: getComputedStyle(tile).backgroundColor,
  });
  slot.parentElement!.appendChild(ghost);
  tile.style.visibility = "hidden";
  const restore = () => {
    ghost.remove();
    tile.style.visibility = "";
  };

  // Text fades in without moving: a transform would push the bottom button out of the card for a moment
  // and make the card's fit shrink the type.
  gsap.set(card, { opacity: 0 });
  gsap.set(contents, { opacity: 0, filter: "blur(6px)" });
  const timeline = gsap
    .timeline({ onComplete: onDone })
    .fromTo(
      ghost,
      { filter: "blur(5px)" },
      {
        left: target.left,
        top: target.top,
        width: target.width,
        height: target.height,
        borderRadius: 28,
        filter: "blur(0px)",
        duration: 0.85,
        ease: "power3.inOut",
      },
    )
    .set(card, { opacity: 1 })
    .add(restore)
    .to(contents, { opacity: 1, filter: "blur(0px)", duration: 0.5, stagger: 0.05, ease: "power2.out" });

  return () => {
    timeline.kill();
    restore();
    gsap.set([card, ...contents], { clearProps: "opacity,filter" });
  };
}

/** The card being replaced leaves upwards, from wherever a swipe left it. */
function LeavingSlot({ fromY, onDone, children }: { fromY: number; onDone: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      onDone();
      return;
    }
    const tween = gsap.fromTo(
      ref.current,
      { y: fromY, rotate: fromY * 0.015 },
      { y: -window.innerHeight, rotate: -6, opacity: 0, duration: 0.6, ease: "power2.in", onComplete: onDone },
    );
    return () => {
      tween.kill();
    };
  }, [fromY, onDone]);

  return (
    <div ref={ref} className="m-slot" inert>
      {children}
    </div>
  );
}

interface MobileQuizProps {
  locale: QuizLocale;
  content: QuizContent;
}

/**
 * Phones and tablets: one main card with the question over endless streams of secondary cards,
 * which drift in opposite directions under a blur and an aurora in the colours of the reference.
 * Same flow as the desktop page: a topic, then its questions opened step by step, then the end card.
 */
export function MobileQuiz({ locale, content }: MobileQuizProps) {
  const { labels, reflection } = content;
  const all = content.reflectionQuestions;
  const closing = all[all.length - 1];
  const topics = [...new Set(all.slice(0, -1).map((question) => question.category))];

  const [topic, setTopic] = useState<string | null>(null);
  const [card, setCard] = useState<Card>({ kind: "intro" });
  const [steps, setSteps] = useState(0);
  const [leaving, setLeaving] = useState<{ card: Card; topic: string | null; steps: number; fromY: number } | null>(
    null,
  );
  const run = topic ? [...all.filter((question) => question.category === topic && question !== closing), closing] : [];

  const auroraRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const light = startAuroraLight(auroraRef.current!);
    return () => light.stop();
  }, []);

  const slotRef = useRef<HTMLDivElement>(null);
  /** Set by show(): the card about to mount comes out of the stream. Cleared once it has landed. */
  const flyRef = useRef(false);
  const dragRef = useRef<{
    x0: number;
    y0: number;
    dy: number;
    dragging: boolean;
    /** Recent positions, to tell a quick flick from a slow pull. */
    samples: { dy: number; t: number }[];
  } | null>(null);
  const suppressClickRef = useRef(false);
  const clearLeaving = useCallback(() => setLeaving(null), []);

  function show(next: Card, nextTopic = topic, fromY = 0) {
    setLeaving({ card, topic, steps, fromY });
    setTopic(nextTopic);
    setCard(next);
    setSteps(0);
    flyRef.current = true;
  }

  /** Opens the next step, or replaces the card once all steps are open. */
  function next(fromY = 0) {
    if (card.kind !== "question") return;
    if (steps < STEPS) setSteps(steps + 1);
    else if (card.index < run.length - 1) show({ kind: "question", index: card.index + 1 }, topic, fromY);
    else show({ kind: "end" }, topic, fromY);
  }

  const currentKey = cardKey(card, topic);
  useLayoutEffect(() => {
    if (!flyRef.current || prefersReducedMotion()) return;
    return flyFromStream(slotRef.current!, toneOf(card), () => {
      flyRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one flight per new card
  }, [currentKey]);

  // Swipe: the card follows the finger; a swipe up works like the "Next" button.
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = {
      x0: event.clientX,
      y0: event.clientY,
      dy: 0,
      dragging: false,
      samples: [{ dy: 0, t: performance.now() }],
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = event.clientY - drag.y0;
    if (!drag.dragging) {
      // Taps on buttons stay taps; only a clearly vertical move becomes a drag.
      if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(event.clientX - drag.x0)) return;
      drag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    drag.dy = dy < 0 ? dy : dy * 0.25;
    const now = performance.now();
    drag.samples = [...drag.samples.filter((sample) => now - sample.t < 120), { dy: drag.dy, t: now }];
    gsap.set(event.currentTarget, { y: drag.dy, rotate: drag.dy * 0.015 });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.dragging) return;
    suppressClickRef.current = true;
    const [first] = drag.samples;
    const speed = -(drag.dy - first.dy) / Math.max(1, performance.now() - first.t);
    const swiped =
      card.kind === "question" && (drag.dy < -SWIPE_DISTANCE || (drag.dy < -FLICK_DISTANCE && speed > FLICK_SPEED));
    if (swiped && steps === STEPS) {
      next(drag.dy);
      return;
    }
    if (swiped) next();
    gsap.to(event.currentTarget, { y: 0, rotate: 0, duration: 0.6, ease: "elastic.out(1, 0.6)" });
  }

  const render = (shown: Card, shownTopic: string | null, shownSteps: number) => {
    if (shown.kind === "intro") {
      return (
        <IntroCard
          content={content}
          locale={locale}
          topics={topics.map((name) => ({ name, count: all.filter((question) => question.category === name).length }))}
          onChoose={(name) => show({ kind: "question", index: 0 }, name)}
        />
      );
    }
    if (shown.kind === "end") {
      return (
        <CardShell tone="lavender" top={<span>{reflection.endEyebrow}</span>}>
          <h2 className="m-title">{reflection.endTitle.replace("{category}", shownTopic ?? "")}</h2>
          <div className="m-text">
            {reflection.endText.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="m-actions">
            <a href={quizBookingUrl} target="_blank" rel="noopener noreferrer" className="m-button">
              {reflection.book}
            </a>
            <button type="button" onClick={() => show({ kind: "intro" }, null)} className="m-link">
              {reflection.otherTopic}
            </button>
          </div>
        </CardShell>
      );
    }
    const shownRun = shownTopic === topic ? run : [];
    const question = shownRun[shown.index];
    if (!question) return null;
    const isLast = shown.index === shownRun.length - 1;
    return (
      <QuestionCard
        question={question}
        position={shown.index + 1}
        total={shownRun.length}
        steps={shownSteps}
        tone={CARD_TONES[shown.index % CARD_TONES.length]}
        texts={reflection}
        nextLabel={shownSteps < STEPS ? reflection.nextStep : isLast ? reflection.finish : reflection.nextQuestion}
        onNext={() => next()}
        rowQuestion={labels.rowQuestion}
        swipeHint={reflection.swipeHint}
      />
    );
  };

  // Secondary cards of the current topic, or of every topic on the first card.
  const streamQuestions = topic ? run : topics.map((name) => all.find((question) => question.category === name)!);
  const palette = topic ? `topic-${topics.indexOf(topic)}` : "intro";

  return (
    <div className="mobile-quiz">
      <Streams questions={streamQuestions} palette={palette} key={palette} />
      <div className="mobile-quiz__veil" aria-hidden="true" />
      <div
        ref={auroraRef}
        aria-hidden="true"
        className="aurora mobile-quiz__aurora"
        style={Object.fromEntries(auroraPalette("mobile").map((colour, index) => [`--aurora-${index + 1}`, colour]))}
      >
        <span className="aurora__blob" />
        <span className="aurora__blob" />
        <span className="aurora__blob" />
        <span className="aurora__grain" />
      </div>

      <main className="mobile-quiz__stage">
        {leaving && (
          <LeavingSlot key={`out-${cardKey(leaving.card, leaving.topic)}`} fromY={leaving.fromY} onDone={clearLeaving}>
            {render(leaving.card, leaving.topic, leaving.steps)}
          </LeavingSlot>
        )}
        <div
          key={currentKey}
          ref={slotRef}
          className="m-slot m-slot--current"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={(event) => {
            // A drag that ends over a button must not press it.
            if (suppressClickRef.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClickRef.current = false;
            }
          }}
        >
          {render(card, topic, steps)}
        </div>
      </main>
    </div>
  );
}

/** The main card: 80% of the screen, its type scaled down (--fit) when a long question would not fit. */
function CardShell({ tone, top, children }: { tone: string; top: ReactNode; children: ReactNode }) {
  const cardRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const card = cardRef.current!;
    const body = card.querySelector<HTMLElement>(".m-card__body")!;
    const fits = () => body.scrollHeight <= body.clientHeight;
    function fit() {
      card.style.setProperty("--fit", "1");
      if (fits()) return;
      let [low, high] = [0.6, 1];
      for (let step = 0; step < 7; step++) {
        const middle = (low + high) / 2;
        card.style.setProperty("--fit", String(middle));
        if (fits()) low = middle;
        else high = middle;
      }
      card.style.setProperty("--fit", String(low));
    }
    fit();
    document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <article ref={cardRef} className={`m-card m-card--${tone}`}>
      <header className="m-card__top">{top}</header>
      <div className="m-card__body">{children}</div>
    </article>
  );
}

interface IntroCardProps {
  content: QuizContent;
  locale: QuizLocale;
  topics: { name: string; count: number }[];
  onChoose: (topic: string) => void;
}

function IntroCard({ content, locale, topics, onChoose }: IntroCardProps) {
  const { reflection, labels } = content;
  return (
    <CardShell
      tone="cream"
      top={
        <>
          <span>{content.wordmark}</span>
          <nav aria-label={labels.languageLabel} className="m-langs">
            {quizLocales.map((code) => (
              <a key={code} href={`/quiz/${code}`} hrefLang={code} aria-current={code === locale ? "true" : undefined}>
                {code === "uk" ? "UA" : code.toUpperCase()}
              </a>
            ))}
          </nav>
        </>
      }
    >
      <h1 className="m-title">{reflection.introTitle}</h1>
      <p className="m-text">{reflection.introText}</p>
      <ul className="m-topics">
        {topics.map(({ name, count }, index) => (
          <li key={name}>
            <button type="button" onClick={() => onChoose(name)}>
              <span className="m-topics__number">{pad(index + 1)}</span>
              <span className="m-topics__name">{name}</span>
              <span className="m-topics__count">{reflection.questionsCount.replace("{n}", String(count))}</span>
            </button>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

interface QuestionCardProps {
  question: ReflectionQuestion;
  position: number;
  total: number;
  steps: number;
  tone: string;
  texts: QuizContent["reflection"];
  nextLabel: string;
  onNext: () => void;
  rowQuestion: string;
  swipeHint: string;
}

/** Every step is in the layout from the start and only comes into focus when opened, so nothing shifts. */
function QuestionCard({
  question,
  position,
  total,
  steps,
  tone,
  texts,
  nextLabel,
  onNext,
  rowQuestion,
  swipeHint,
}: QuestionCardProps) {
  const step = (index: number) => ({ "data-visible": steps >= index, inert: steps < index });
  return (
    <CardShell
      tone={tone}
      top={
        <>
          <span>
            {rowQuestion} · {question.category}
          </span>
          <span>
            {pad(position)} / {pad(total)}
          </span>
        </>
      }
    >
      <h2 className="m-title">{question.question}</h2>
      <div {...step(1)} className="step m-step">
        <p className="m-label">{texts.notSeeingLabel}</p>
        <p className="m-text">{question.notSeeing}</p>
      </div>
      <ol className="m-deeper">
        {question.deeper.map((line, index) => (
          <li key={line} {...step(index + 2)} className="step">
            <span className="m-deeper__number">{pad(index + 1)}</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>
      <button type="button" onClick={onNext} className="m-button m-next">
        {nextLabel}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="m-hint" aria-hidden="true">
        ↑ {swipeHint}
      </p>
    </CardShell>
  );
}

/**
 * Three columns of secondary cards drifting endlessly, neighbours in opposite directions.
 * Each column holds its cards twice, so moving it by half its height loops without a seam.
 */
function Streams({ questions, palette }: { questions: ReflectionQuestion[]; palette: string }) {
  const tiles = questions.flatMap((question, index) => [
    <div key={`n${index}`} className="m-tile m-tile--lavender">
      <span className="m-tile__numeral">{pad(index + 1)}</span>
      <span className="m-tile__caption">{question.category}</span>
    </div>,
    <div key={`p${index}`} className="m-tile m-tile--cream">
      <span className="m-tile__photo" style={{ backgroundImage: `url(${quizPhoto(palette, index, 400)})` }} />
      <span className="m-tile__text">{question.notSeeing}</span>
    </div>,
    <div key={`d${index}`} className="m-tile m-tile--mint">
      <span className="m-tile__small">{pad(index + 1)}</span>
      <span className="m-tile__text">{question.deeper[index % question.deeper.length]}</span>
    </div>,
    <div key={`w${index}`} className="m-tile m-tile--cream m-tile--word">
      <span>{question.category}</span>
    </div>,
  ]);
  const columns = [0, 1, 2].map((column) => tiles.filter((_, index) => index % 3 === column));

  return (
    <div className="streams" aria-hidden="true">
      {columns.map((column, index) => (
        <div key={index} className={`streams__column streams__column--${index}`}>
          <div className="streams__track">
            {column}
            {column.map((tile) => (
              <div key={`copy-${tile.key}`} className="contents">
                {tile}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
