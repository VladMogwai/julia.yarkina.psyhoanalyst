"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { quizLocales, type QuizLocale } from "../config";
import type { IllustrationName, QuizContent } from "../content/types";
import { Illustration } from "./Illustration";

gsap.registerPlugin(useGSAP, SplitText);

type Answer = "yes" | "no";

interface QuizProps {
  locale: QuizLocale;
  content: QuizContent;
}

const RESULT_ACCENT = "#2E7A55";
const RESULT_ILLUSTRATION: IllustrationName = "seed";
/** Dragging further than this answers the question. */
const DRAG_THRESHOLD = 100;
const SIDE_WORD_OPACITY = 0.22;
const FRAME_COUNT = 5;
const BACK_CARD_COUNT = 3;

const pad = (value: number) => String(value).padStart(2, "0");

export function Quiz({ locale, content }: QuizProps) {
  const { questions, labels } = content;
  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleSplitRef = useRef<SplitText | null>(null);
  const lockedRef = useRef(false);
  /** Set by the exit animation: the overlay covers the window and must shrink into the new card. */
  const revealPendingRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; dx: number } | null>(null);

  const isResult = step >= total;
  const question = isResult ? null : questions[step];
  const accent = question?.accent ?? RESULT_ACCENT;
  const yesCount = answers.filter((answer) => answer === "yes").length;
  const result = [...content.results].sort((a, b) => b.minYes - a.minYes).find((item) => yesCount >= item.minYes);

  const title = question ? question.title : (result?.title ?? "");
  const body = question ? question.body : result?.text;
  const eyebrow = question ? labels.questionEyebrow.replace("{n}", pad(step + 1)) : labels.resultEyebrow;
  const backCards = isResult ? [] : questions.slice(step + 1, step + 1 + BACK_CARD_COUNT);

  const accentForStep = useCallback(
    (index: number) => (index >= total ? RESULT_ACCENT : questions[index].accent),
    [questions, total],
  );

  // Text and card entrance: on first load and after every transition.
  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const root = rootRef.current!;
      const pending = revealPendingRef.current;

      if (reduced) {
        gsap.fromTo(root.querySelector("[data-stage]"), { opacity: 0 }, { opacity: 1, duration: 0.2 });
        lockedRef.current = false;
        return;
      }

      const intro = gsap.timeline({ delay: pending ? 0.45 : 0.1 });

      // Question/headline lines rise out of masks; autoSplit keeps lines correct on resize.
      titleSplitRef.current = SplitText.create(titleRef.current!, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        // Return a standalone tween: on re-split SplitText reverts it, so it must not be the whole intro.
        onSplit: (self) => {
          const tween = gsap.from(self.lines, { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.08 });
          intro.add(tween, 0);
          return tween;
        },
      });

      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
        SplitText.create(bodyRef.current.querySelectorAll("p"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            const tween = gsap.from(self.lines, { yPercent: 110, duration: 0.8, ease: "expo.out", stagger: 0.025 });
            intro.add(tween, 0.15);
            return tween;
          },
        });
      }

      const labelSplit = SplitText.create(root.querySelectorAll("[data-anim='label']"), { type: "chars" });
      intro.from(labelSplit.chars, { opacity: 0, y: 6, duration: 0.4, stagger: 0.015 }, 0.25);

      intro.from(root.querySelectorAll("[data-card-part]"), {
        scale: 0.85,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.07,
      }, pending ? 0.35 : 0.1);

      intro.from(root.querySelectorAll("[data-back-card]"), { opacity: 0, y: 12, duration: 0.5, stagger: 0.06 }, 0.2);

      intro.fromTo(
        [yesRef.current, noRef.current].filter(Boolean),
        { x: (index) => (index === 0 ? -30 : 30), opacity: 0 },
        { x: 0, opacity: SIDE_WORD_OPACITY, duration: 0.6, ease: "power3.out" },
        0.2,
      );

      // Numbers count up from zero and keep their two-digit format.
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((element) => {
        const target = Number(element.dataset.count);
        const counter = { value: 0 };
        intro.to(counter, {
          value: target,
          duration: 1.2,
          ease: "power3.out",
          onUpdate: () => {
            element.textContent = pad(Math.round(counter.value));
          },
        }, 0);
      });

      const newDot = root.querySelector("[data-dot-new]");
      if (newDot) intro.fromTo(newDot, { scale: 0.6 }, { scale: 1, duration: 0.35, ease: "back.out(4)" }, 0.1);

    },
    { scope: rootRef, dependencies: [step], revertOnUpdate: true },
  );

  // Kept outside useGSAP on purpose: its automatic revert would put the covering overlay back on screen.
  useLayoutEffect(() => {
    if (!revealPendingRef.current) return;
    revealPendingRef.current = false;
    const overlay = overlayRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(overlay, { display: "none" });
      lockedRef.current = false;
      return;
    }
    // The overlay that covered the window shrinks into the new card, then fades to reveal it.
    const card = cardRef.current!.getBoundingClientRect();
    // Radius in px from the current circle size, so it can tween down to the card's 12px corners.
    gsap.set(overlay, { borderRadius: `${overlay.offsetWidth / 2}px` });
    gsap
      .timeline()
      .to(overlay.querySelectorAll("[data-frame]"), { opacity: 0, duration: 0.3 }, 0)
      .to(overlay, {
        left: card.left + card.width / 2,
        top: card.top + card.height / 2,
        width: card.width,
        height: card.height,
        borderRadius: "12px",
        duration: 0.68,
        ease: "power4.inOut",
      }, 0)
      .to(overlay, { opacity: 0, duration: 0.42 })
      .set(overlay, { display: "none" })
      // Input unlocks as soon as the new card is visible; the text keeps animating in.
      .call(() => {
        lockedRef.current = false;
      });
  }, [step]);

  const answer = useCallback(
    (choice: Answer | "restart") => {
      if (lockedRef.current) return;
      lockedRef.current = true;

      const nextStep = choice === "restart" ? 0 : step + 1;
      const commit = () => {
        setAnswers((current) => (choice === "restart" ? [] : [...current, choice]));
        setStep(nextStep);
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.to(rootRef.current!.querySelector("[data-stage]"), { opacity: 0, duration: 0.2, onComplete: commit });
        revealPendingRef.current = true;
        return;
      }

      const card = cardRef.current!;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const coverSize =
        2 * Math.hypot(Math.max(centerX, innerWidth - centerX), Math.max(centerY, innerHeight - centerY));
      const direction = choice === "yes" ? -1 : 1;
      const overlay = overlayRef.current!;
      const frames = overlay.querySelectorAll("[data-frame]");

      gsap.set(overlay, {
        display: "block",
        left: centerX,
        top: centerY,
        xPercent: -50,
        yPercent: -50,
        width: 0,
        height: 0,
        borderRadius: "9999px",
        opacity: 1,
        backgroundColor: accentForStep(nextStep),
      });
      gsap.set(frames, { xPercent: -50, yPercent: -50, scale: 0.05, opacity: 1 });

      const exit = gsap.timeline({
        onComplete: () => {
          revealPendingRef.current = true;
          commit();
        },
      });

      if (choice === "restart") {
        exit.to(card, { scale: 0.9, opacity: 0, duration: 0.42, ease: "power2.in" }, 0);
      } else {
        exit.to(card, { x: direction * 460, rotation: direction * 28, opacity: 0, duration: 0.42, ease: "power2.in" }, 0);
      }
      if (titleSplitRef.current) {
        exit.to(titleSplitRef.current.lines, { yPercent: -110, duration: 0.4, ease: "power2.in", stagger: 0.04 }, 0);
      }
      exit
        .to(
          [bodyRef.current, deckRef.current?.querySelectorAll("[data-back-card]"), yesRef.current, noRef.current,
            textRef.current?.querySelectorAll("[data-anim='label']")].filter(Boolean).flatMap((item) =>
            item instanceof NodeList ? [...item] : [item]),
          { opacity: 0, duration: 0.3 },
          0,
        )
        .to(overlay, { width: 300, height: 300, duration: 0.48, ease: "power2.out" }, 0.3)
        .to(frames, { scale: 2.4, duration: 0.7, ease: "power1.in", stagger: 0.08 }, 0.3)
        .to(overlay, { width: coverSize, height: coverSize, duration: 0.42, ease: "power3.inOut" }, 0.78);
    },
    [accentForStep, step],
  );

  // Arrow keys answer: left is "yes", right is "no".
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isResult) return;
      if (event.key === "ArrowLeft") answer("yes");
      if (event.key === "ArrowRight") answer("no");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, isResult]);

  function setSideWordOpacity(dx: number) {
    const pull = Math.min(Math.abs(dx) / DRAG_THRESHOLD, 1);
    const toward = dx < 0 ? yesRef.current : noRef.current;
    const away = dx < 0 ? noRef.current : yesRef.current;
    gsap.set(toward, { opacity: SIDE_WORD_OPACITY + pull * (1 - SIDE_WORD_OPACITY) });
    gsap.set(away, { opacity: SIDE_WORD_OPACITY });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (isResult || lockedRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0 };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.dx = dx;
    gsap.set(cardRef.current, { x: dx, y: dy * 0.3, rotation: dx / 14 });
    setSideWordOpacity(dx);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (Math.abs(drag.dx) > DRAG_THRESHOLD) {
      answer(drag.dx < 0 ? "yes" : "no");
      return;
    }
    gsap.to(cardRef.current, { x: 0, y: 0, rotation: 0, duration: 0.55, ease: "back.out(2)" });
    gsap.to([yesRef.current, noRef.current], { opacity: SIDE_WORD_OPACITY, duration: 0.3 });
  }

  const sideWordClass =
    "display border-b border-forest pb-1 text-[40px] leading-none opacity-[0.22] transition-opacity hover:!opacity-60 lg:text-[56px]";

  return (
    <div ref={rootRef} className="relative flex min-h-dvh flex-col px-5 py-5 sm:px-10 sm:py-8">
      <header className="flex items-center justify-between">
        <span className="display text-xl">{content.wordmark}</span>
        <nav aria-label={labels.languageLabel} className="quiz-label flex gap-4">
          {quizLocales.map((code) => (
            <a
              key={code}
              href={`/quiz/${code}`}
              hrefLang={code}
              aria-current={code === locale ? "true" : undefined}
              className={code === locale ? "text-forest" : "text-muted hover:text-forest"}
            >
              {code === "uk" ? "UA" : code.toUpperCase()}
            </a>
          ))}
        </nav>
      </header>

      {/* Announces the new question to screen readers; the visible title is split into animated lines. */}
      <p aria-live="polite" className="sr-only">
        {title}
      </p>

      <main
        data-stage
        className="grid flex-1 content-start gap-10 py-8 lg:min-h-0 lg:grid-cols-[minmax(300px,420px)_1fr] lg:content-stretch lg:gap-16 lg:py-10"
      >
        <section
          ref={textRef}
          key={`text-${step}`}
          className="flex min-h-0 flex-col lg:max-h-[calc(100dvh-11rem)]"
        >
          <p data-anim="label" className="quiz-label text-muted">
            {eyebrow}
          </p>
          <h1 ref={titleRef} aria-hidden="true" className="display mt-4 text-[clamp(28px,3vw,44px)] text-balance">
            {title}
          </h1>
          {body && body.length > 0 && (
            <div
              ref={bodyRef}
              className="scroll-fade mt-6 max-h-[36dvh] min-h-0 space-y-4 overflow-y-auto pr-3 pb-10 text-[15px] leading-[1.55] text-muted lg:max-h-none lg:flex-1"
            >
              {body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}
          <div className="mt-6 shrink-0">
            <p data-anim="label" className="quiz-label text-muted">
              {isResult ? labels.restartHint : labels.dragHint}
            </p>
            <ol aria-label={labels.progressLabel} className="mt-3 flex gap-2">
              {questions.map((item, index) => (
                <li
                  key={item.id}
                  data-dot-new={index === answers.length - 1 ? "" : undefined}
                  className={`size-1.5 rounded-full border border-forest ${index < answers.length ? "bg-forest" : ""}`}
                />
              ))}
            </ol>
          </div>
        </section>

        <section className="grid grid-cols-2 items-center justify-items-center gap-y-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-12">
          <div
            ref={deckRef}
            key={`deck-${step}`}
            className="relative col-span-2 mt-6 aspect-[17/24] w-[60vw] max-w-[260px] lg:col-span-1 lg:col-start-2 lg:w-[200px]"
          >
            {backCards
              .map((item, index) => (
                <div
                  key={item.id}
                  data-back-card
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl border-[6px] bg-cream"
                  style={{
                    borderColor: item.accent,
                    transform: `translateY(${-8 * (index + 1)}px) scale(${1 - 0.04 * (index + 1)})`,
                    zIndex: BACK_CARD_COUNT - index,
                  }}
                />
              ))
              .reverse()}

            <button
              ref={cardRef}
              type="button"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={isResult ? () => answer("restart") : undefined}
              aria-label={
                isResult
                  ? `${labels.resultCardTitle}. ${labels.resultCardCaption}`
                  : `${eyebrow}: ${question!.caption}. ${labels.dragHint}`
              }
              className="absolute inset-0 z-10 flex touch-none flex-col justify-between rounded-xl border-[6px] bg-cream p-3 text-left select-none"
              style={{ borderColor: accent, cursor: isResult ? "pointer" : "grab" }}
            >
              <span data-card-part className="quiz-label text-muted">
                {isResult ? (
                  labels.resultEyebrow
                ) : (
                  <>
                    <span data-count={step + 1}>{pad(step + 1)}</span> / {pad(total)}
                  </>
                )}
              </span>
              <span data-card-part className="mx-auto block aspect-square w-3/4">
                <Illustration name={question?.illustration ?? RESULT_ILLUSTRATION} accent={accent} />
              </span>
              <span data-card-part className="display block text-[18px] leading-tight">
                {isResult ? labels.resultCardTitle : question!.caption}
              </span>
            </button>
          </div>

          {!isResult && (
            <>
              <button
                ref={yesRef}
                type="button"
                onClick={() => answer("yes")}
                aria-label={`${labels.yes}: ${title}`}
                className={`${sideWordClass} lg:col-start-1 lg:row-start-1 lg:justify-self-end`}
              >
                {labels.yes}
              </button>
              <button
                ref={noRef}
                type="button"
                onClick={() => answer("no")}
                aria-label={`${labels.no}: ${title}`}
                className={`${sideWordClass} lg:col-start-3 lg:row-start-1 lg:justify-self-start`}
              >
                {labels.no}
              </button>
            </>
          )}
        </section>
      </main>

      <footer className="quiz-label flex items-end justify-between gap-6 text-muted">
        <span key={`counter-${step}`}>
          <span data-count={isResult ? total : step + 1}>{pad(isResult ? total : step + 1)}</span> / {pad(total)}
        </span>
        {/* The keyboard hint is useless on touch screens, so it only shows on wider ones. */}
        <span key={`hint-${step}`} data-anim="label" className={`text-right ${isResult ? "" : "hidden sm:inline"}`}>
          {isResult ? labels.restartHint : labels.keysHint}
        </span>
      </footer>

      {/* Transition: a circle in the next accent grows from the card, covers the window and shrinks into the next card. */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-50 hidden overflow-hidden"
      >
        {Array.from({ length: FRAME_COUNT }, (_, index) => (
          <div
            key={index}
            data-frame
            className="absolute top-1/2 left-1/2 aspect-[17/24] w-[120px] rounded-xl border-[3px]"
            style={{ borderColor: index % 2 === 0 ? "#FBF6EE" : "#0F1C17" }}
          />
        ))}
      </div>
    </div>
  );
}
