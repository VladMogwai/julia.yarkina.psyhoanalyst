"use client";

import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { auroraPalette, daylight, LIGHT_TONE_FROM, startAuroraLight } from "../aurora";
import { startDust, type Dust } from "../dust";
import { quizBookingUrl, quizLocales, type QuizLocale } from "../config";
import type { QuizContent, ReflectionQuestion } from "../content/types";
import { quizPhoto } from "../photos";

/** Steps a question opens in: "what you may not be noticing", then three deeper questions. */
const STEPS = 4;
/** A swipe up counts once the card travelled this far (px), or less with a quick flick. */
const SWIPE_DISTANCE = 90;
const FLICK_DISTANCE = 30;
const FLICK_SPEED = 0.4; // px per ms
/** The end card follows a sideways pull only partly, so it never slides out of view before the swipe counts. */
const SIDE_FOLLOW = 0.6;
/** How much the end card tilts per px it is pulled sideways. */
const SIDE_TILT = 0.03;

/**
 * How far the end card is pulled towards each way, as plain numbers for its CSS: the glow on a side
 * grows with its pull, and the name of the way fades in past a quarter of it. Computed here rather than
 * with max()/clamp() over variables in CSS, which some mobile browsers get wrong (both names showed).
 */
function sidePull(dx: number) {
  const swipe = Math.max(-1, Math.min(1, dx / SWIPE_DISTANCE));
  const [left, right] = [Math.max(0, -swipe), Math.max(0, swipe)];
  return { "--pull-left": left, "--pull-right": right };
}

/**
 * The names of the two ways, faded in on the element itself (hidden by default in CSS), so no browser
 * can show them unpulled.
 */
function showWays(slot: HTMLElement, dx: number, animate = false) {
  const swipe = Math.max(-1, Math.min(1, dx / SWIPE_DISTANCE));
  const shown = (pull: number) => Math.max(0, Math.min(1, (pull - 0.25) * 2.5));
  for (const [side, pull] of [
    ["left", Math.max(0, -swipe)],
    ["right", Math.max(0, swipe)],
  ] as const) {
    const way = slot.querySelector<HTMLElement>(`.m-way--${side}`);
    if (!way) continue;
    const look = { opacity: shown(pull), scale: 0.92 + 0.08 * shown(pull) };
    if (animate) gsap.to(way, { ...look, duration: 0.4 });
    else gsap.set(way, look);
  }
}

/** Colours drawn from each card's abstraction, by its photo's URL. */
const coverColours = new Map<string, string[]>();

/**
 * The liveliest colours of an abstraction, lifted to pastel for light: the photo is shrunk to a few pixels,
 * and the most colourful ones with clearly different hues are kept. Pexels allows reading its images
 * (CORS), so the canvas stays readable.
 */
function learnCoverColours(url: string) {
  if (coverColours.has(url)) return;
  coverColours.set(url, []);
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 12;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    context.drawImage(image, 0, 0, 12, 12);
    let data: Uint8ClampedArray;
    try {
      data = context.getImageData(0, 0, 12, 12).data;
    } catch {
      return;
    }
    const pixels: { hue: number; saturation: number; lightness: number }[] = [];
    for (let index = 0; index < data.length; index += 4) {
      const [r, g, b] = [data[index] / 255, data[index + 1] / 255, data[index + 2] / 255];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lightness = (max + min) / 2;
      const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
      const hue =
        max === min ? 0 : max === r ? ((g - b) / (max - min) + 6) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
      pixels.push({ hue: hue * 60, saturation, lightness });
    }
    const picked: typeof pixels = [];
    for (const pixel of pixels.sort((a, b) => b.saturation - a.saturation)) {
      const apart = picked.every((other) => Math.min(Math.abs(other.hue - pixel.hue), 360 - Math.abs(other.hue - pixel.hue)) > 28);
      if (apart) picked.push(pixel);
      if (picked.length === 6) break;
    }
    coverColours.set(
      url,
      picked.map(
        ({ hue, saturation, lightness }) =>
          `hsl(${Math.round(hue)} ${Math.round(Math.min(90, Math.max(45, saturation * 100)))}% ${Math.round(Math.max(66, lightness * 100))}%)`,
      ),
    );
  };
  image.src = url;
}

/** Hue for the dust before its card's colours are known; turns by the golden angle on each tap. */
let dustHue = Math.random() * 360;
const GOLDEN_ANGLE = 137.5;

/** Three of the card's colours in a new order on every tap, or three spread hues until they are known. */
function dustColours(card: HTMLElement | null | undefined) {
  const url = card?.dataset.cover;
  const known = (url && coverColours.get(url)) || [];
  if (known.length >= 3) return [...known].sort(() => Math.random() - 0.5).slice(0, 3);
  dustHue = (dustHue + GOLDEN_ANGLE) % 360;
  return [0, 1, 2].map((index) => `hsl(${(dustHue + index * 110) % 360} 70% 74%)`);
}

/** A tap throws this many motes of dust; a moving finger leaves one every few px. */
const TAP_DUST = 36;
const TRAIL_SPACING = 5;
/** On the light half: seeds let go by a tap, one every so many px of a moving finger, and how many a leaving card turns into. */
const TAP_SEEDS = 7;
const SEED_SPACING = 26;
const SCATTER_SEEDS = 40;
/** The end card's hinting sway: first this long after it lands, then again every so often (ms). */
const SWAY_FIRST_MS = 1800;
const SWAY_EVERY_MS = 4500;
/** A move up this long (px) on the end card counts as an attempt to swipe up. */
const UP_ATTEMPT = 24;
/** A sideways pull this long (px) blows the end card's dandelion, in the direction of the pull. */
const BLOW_PULL = 30;

const isLight = (card: Element | null | undefined) => Boolean(card?.classList.contains("m-card--light"));

/** A fully open question lifts a little and settles back on a tap: moving on is a swipe up. */
function nudgeUp(slot: HTMLElement) {
  if (prefersReducedMotion()) return;
  gsap.fromTo(slot, { y: 0 }, { y: -22, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 });
}

/** Opens the booking chat in a new tab, or in this one where new tabs are blocked. */
function openBooking() {
  const opened = window.open(quizBookingUrl, "_blank");
  if (opened) opened.opener = null;
  else window.location.href = quizBookingUrl;
}

const pad = (value: number) => String(value).padStart(2, "0");

type Card = { kind: "intro" } | { kind: "question"; index: number } | { kind: "end" };

/** The blurred abstraction on top of a card, a different one for every card. */
const abstraction = (item: number) => quizPhoto("abstract", item, 400);

const cardKey = (card: Card, topic: string | null) =>
  card.kind === "question" ? `${topic}-${card.index}` : `${topic}-${card.kind}`;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A card's cover while light floods it, and at rest (as in quiz.css). */
const COVER_FLOOD = { height: "135%", filter: "blur(22px) saturate(1.5) brightness(1.4)" };
const COVER_REST = { height: "55%", filter: "blur(16px) saturate(1.25) brightness(0.86)" };

/** What of a card is meant to be seen: steps not yet opened, the end card's glows and way names keep their own visibility. */
const visibleContents = (card: HTMLElement) => [
  ...card.querySelectorAll<HTMLElement>(
    '.m-card__top, .m-card__body > :not(.step:not([data-visible="true"]), .m-edge, .m-way, .sr-only)',
  ),
];

/**
 * The next card rises from below still flooded with the light of its abstraction; the light settles
 * back into the cover, and then the text comes into focus. Returns a cleanup; `onDone` runs once it is in place.
 */
function riseIntoLight(slot: HTMLElement, onDone: () => void) {
  const card = slot.querySelector<HTMLElement>(".m-card")!;
  const cover = card.querySelector<HTMLElement>(".m-card__cover")!;
  const contents = visibleContents(card);
  // Text fades in without moving: a transform would make the card's fit shrink the type.
  gsap.set(contents, { opacity: 0, filter: "blur(6px)" });
  gsap.set(cover, COVER_FLOOD);
  const timeline = gsap
    .timeline({ onComplete: onDone })
    .fromTo(slot, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.72, ease: "power3.out" }, 0.26)
    .to(cover, { ...COVER_REST, duration: 0.85, ease: "sine.inOut" }, 0.55)
    .to(contents, { opacity: 1, filter: "blur(0px)", duration: 0.5, stagger: 0.07, ease: "power2.out" }, 0.82)
    // Hand the looks back to CSS, which knows what each element should rest at.
    .set([cover, ...contents], { clearProps: "height,filter,opacity" })
    .set(slot, { clearProps: "opacity" });
  return () => {
    timeline.kill();
    gsap.set([cover, ...contents], { clearProps: "height,filter,opacity" });
    gsap.set(slot, { clearProps: "opacity,transform" });
  };
}

/**
 * The card being replaced sinks into the depth, from wherever a swipe left it, dissolving in the light of
 * its own abstraction as its text melts away. Swiped left or right (fromX), it leaves sideways instead.
 */
function LeavingSlot({
  fromY,
  fromX,
  onDone,
  onScatter,
  children,
}: {
  fromY: number;
  fromX: number;
  onDone: () => void;
  /** On the light half the card is blown away like a dandelion: this lets its down go. */
  onScatter: (card: HTMLElement) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      onDone();
      return;
    }
    const slot = ref.current!;
    const side = Math.sign(fromX);
    if (side) {
      const tween = gsap.fromTo(
        slot,
        { x: fromX, rotate: fromX * SIDE_TILT },
        { x: side * window.innerWidth * 1.2, rotate: side * 14, opacity: 0, duration: 0.5, ease: "power2.in", onComplete: onDone },
      );
      return () => {
        tween.kill();
      };
    }
    const card = slot.querySelector<HTMLElement>(".m-card")!;
    if (isLight(card)) {
      // Blown away: the card lets its down go and fades where it is, while the seeds float off.
      gsap.set(slot, { y: fromY });
      onScatter(card);
      const blown = gsap
        .timeline({ onComplete: onDone })
        .to(visibleContents(card), { opacity: 0, filter: "blur(4px)", duration: 0.3, ease: "power1.in" }, 0)
        .to(slot, { y: fromY * 0.5 - 20, scale: 0.97, opacity: 0, duration: 0.55, ease: "power2.in" }, 0);
      return () => {
        blown.kill();
      };
    }
    const tween = gsap
      .timeline({ onComplete: onDone })
      .to(visibleContents(card), { opacity: 0, filter: "blur(6px)", duration: 0.32, ease: "power1.in" }, 0)
      .to(card.querySelector(".m-card__cover"), { ...COVER_FLOOD, duration: 0.6, ease: "sine.inOut" }, 0)
      .fromTo(
        slot,
        { y: fromY, scale: 1, rotate: fromY * 0.015 },
        {
          keyframes: [
            // Sinking into the depth draws the card back towards the middle, wherever the swipe left it.
            { y: fromY * 0.55 - 12, scale: 0.93, rotate: 0, duration: 0.32, ease: "sine.in" },
            { y: fromY * 0.25 - 34, scale: 0.8, opacity: 0, duration: 0.4, ease: "sine.inOut" },
          ],
        },
        0,
      );
    return () => {
      tween.kill();
    };
  }, [fromY, fromX, onDone, onScatter]);

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
  /** The tap hint shows on the first question only, until the reader has moved on to a second one. */
  const [taught, setTaught] = useState(false);
  const [card, setCard] = useState<Card>({ kind: "intro" });
  const [steps, setSteps] = useState(0);
  const [leaving, setLeaving] = useState<{
    card: Card;
    topic: string | null;
    steps: number;
    fromY: number;
    fromX: number;
  } | null>(null);
  const run = topic ? [...all.filter((question) => question.category === topic && question !== closing), closing] : [];

  const auroraRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const light = startAuroraLight(auroraRef.current!);
    return () => light.stop();
  }, []);

  const dustCanvasRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<Dust | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const dust = startDust(dustCanvasRef.current!);
    dustRef.current = dust;
    return () => dust.stop();
  }, []);
  /** Where and when the trail of the moving finger was last dropped. */
  const trailRef = useRef<{ x: number; y: number; t: number } | null>(null);

  /**
   * Leaves a trail along the finger's way since the last drop, in the colours of the card under it:
   * dust on the dark half; on the light half seeds that the finger's wind carries along, as it does
   * the ones already floating.
   */
  function trailDust(event: React.PointerEvent<HTMLElement>) {
    const dust = dustRef.current;
    const from = trailRef.current;
    const to = { x: event.clientX, y: event.clientY, t: performance.now() };
    if (!dust || !from) return void (trailRef.current = to);
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const card = event.currentTarget.querySelector<HTMLElement>(".m-card");
    const colours = dustColours(card);
    if (isLight(card)) {
      const seconds = Math.max(0.001, (to.t - from.t) / 1000);
      const [windX, windY] = [(to.x - from.x) / seconds, (to.y - from.y) / seconds];
      dust.blow(to.x, to.y, windX, windY);
      if (distance < SEED_SPACING) return;
      dust.release(to.x, to.y, 1, colours, { vx: windX * 0.5, vy: windY * 0.5, spread: 0.4 });
      trailRef.current = to;
      return;
    }
    if (distance < TRAIL_SPACING) return;
    const drops = Math.min(10, Math.ceil(distance / TRAIL_SPACING));
    for (let drop = 0; drop < drops; drop++) {
      const along = drop / drops;
      dust.sprinkle(from.x + (to.x - from.x) * along, from.y + (to.y - from.y) * along, 1, colours, "trail");
    }
    trailRef.current = to;
  }

  /** The end card's dandelion, until it is blown. */
  const [blown, setBlown] = useState(false);

  /** A leaving card on the light half lets its down go over its whole face, drifting off on one wind. */
  const scatter = useCallback((card: HTMLElement) => {
    const dust = dustRef.current;
    if (!dust) return;
    const box = card.getBoundingClientRect();
    const colours = dustColours(card);
    const drift = (40 + Math.random() * 50) * (Math.random() < 0.5 ? -1 : 1);
    for (let seed = 0; seed < SCATTER_SEEDS; seed++) {
      dust.release(box.left + Math.random() * box.width, box.top + Math.random() * box.height, 1, colours, {
        vx: drift,
        vy: -60,
        spread: 0.7,
      });
    }
  }, []);

  /**
   * Blows the end card's dandelion: its seeds let go from the head in three soft waves and float off on
   * the wind (px/s, sideways), like letting go of what the topic stirred up.
   */
  function blowDandelion(windX: number) {
    const dust = dustRef.current;
    const head = slotRef.current?.querySelector(".m-dandelion__core");
    if (blown || !dust || !head) return;
    setBlown(true);
    const box = head.getBoundingClientRect();
    const [x, y] = [box.left + box.width / 2, box.top + box.height / 2];
    const radius = DANDELION_REACH * (box.width / DANDELION_CORE_SIZE);
    const colours = dustColours(slotRef.current?.querySelector<HTMLElement>(".m-card"));
    DANDELION_ANGLES.forEach((angle, index) =>
      window.setTimeout(
        () =>
          dust.release(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 1, colours, {
            vx: windX + Math.cos(angle) * 25,
            vy: Math.sin(angle) * 25 - 15,
            spread: 0.35,
            life: 1.5,
          }),
        (index % 3) * 110,
      ),
    );
  }

  const slotRef = useRef<HTMLDivElement>(null);
  /** Set by show(): the card about to mount rises into place. Cleared once it has. */
  const arriveRef = useRef(false);
  const dragRef = useRef<{
    x0: number;
    y0: number;
    dy: number;
    dx: number;
    dragging: boolean;
    /** Recent positions, to tell a quick flick from a slow pull. */
    samples: { dy: number; dx: number; t: number }[];
  } | null>(null);
  const suppressClickRef = useRef(false);
  const clearLeaving = useCallback(() => setLeaving(null), []);

  function show(next: Card, nextTopic = topic, fromY = 0, fromX = 0) {
    setLeaving({ card, topic, steps, fromY, fromX });
    setTopic(nextTopic);
    setCard(next);
    setSteps(0);
    setBlown(false);
    arriveRef.current = true;
  }

  /** Opens the next step, or replaces the card once all steps are open. */
  function next(fromY = 0) {
    if (card.kind !== "question") return;
    if (steps < STEPS) setSteps(steps + 1);
    else if (card.index < run.length - 1) {
      setTaught(true);
      show({ kind: "question", index: card.index + 1 }, topic, fromY);
    }
    else show({ kind: "end" }, topic, fromY);
  }

  const currentKey = cardKey(card, topic);
  useLayoutEffect(() => {
    if (!arriveRef.current || prefersReducedMotion()) return;
    return riseIntoLight(slotRef.current!, () => {
      arriveRef.current = false;
    });
  }, [currentKey]);

  /** Set once the reader has pulled the end card sideways: from then on it stops swaying as a hint. */
  const sidewaysLearnedRef = useRef(false);
  const swayRef = useRef<gsap.core.Tween | null>(null);

  /** The end card sways left and right: its two ways are to the sides, not up. */
  function swayHint() {
    const slot = slotRef.current;
    if (!slot || prefersReducedMotion() || dragRef.current?.dragging || swayRef.current?.isActive()) return;
    swayRef.current = gsap.to(slot, {
      keyframes: [
        { x: 18, rotate: 18 * SIDE_TILT, duration: 0.45 },
        { x: -18, rotate: -18 * SIDE_TILT, duration: 0.7 },
        { x: 0, rotate: 0, duration: 0.45 },
      ],
      ease: "sine.inOut",
    });
  }

  // The end card keeps swaying now and then until the reader first pulls it sideways; a tap or a swipe up
  // (the habit of the questions before) makes it sway at once, as an answer to where to go.
  useEffect(() => {
    if (card.kind !== "end" || prefersReducedMotion()) return;
    const first = window.setTimeout(() => !sidewaysLearnedRef.current && swayHint(), SWAY_FIRST_MS);
    const again = window.setInterval(() => !sidewaysLearnedRef.current && swayHint(), SWAY_EVERY_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(again);
      swayRef.current?.kill();
    };
  }, [card.kind]);

  // Swipe: the card follows the finger; a swipe up works like the "Next" button. The end card is
  // swiped sideways instead: right books a session, left goes back to the topics.
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    gsap.killTweensOf(event.currentTarget);
    // A touch stops the hinting sway where it is: the card settles back in the middle.
    if (card.kind === "end") gsap.set(event.currentTarget, { x: 0, rotate: 0 });
    // A swipe by touch is followed by no click, so the "ignore the click after a drag" mark of the last
    // swipe must not outlive it: it would swallow the first tap after it.
    suppressClickRef.current = false;
    trailRef.current = { x: event.clientX, y: event.clientY, t: performance.now() };
    dragRef.current = {
      x0: event.clientX,
      y0: event.clientY,
      dy: 0,
      dx: 0,
      dragging: false,
      samples: [{ dy: 0, dx: 0, t: performance.now() }],
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = event.clientY - drag.y0;
    const dx = event.clientX - drag.x0;
    const sideways = card.kind === "end";
    if (!drag.dragging) {
      // Taps on buttons stay taps; only a clear move along the card's swipe direction becomes a drag.
      const [along, across] = sideways ? [dx, dy] : [dy, dx];
      // On the end card a swipe up, out of habit, is answered by a sway towards its real ways.
      if (sideways && Math.abs(dy) > UP_ATTEMPT && Math.abs(dy) > Math.abs(dx)) swayHint();
      if (Math.abs(along) < 8 || Math.abs(along) < Math.abs(across)) return;
      drag.dragging = true;
      if (sideways) sidewaysLearnedRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    trailDust(event);
    const now = performance.now();
    if (sideways) {
      if (Math.abs(dx) > BLOW_PULL) blowDandelion(Math.sign(dx) * 140);
      drag.dx = dx;
      drag.samples = [...drag.samples.filter((sample) => now - sample.t < 120), { dy: 0, dx, t: now }];
      gsap.set(event.currentTarget, {
        x: dx * SIDE_FOLLOW,
        rotate: dx * SIDE_FOLLOW * SIDE_TILT,
        ...sidePull(dx),
      });
      showWays(event.currentTarget, dx);
      return;
    }
    drag.dy = dy < 0 ? dy : dy * 0.25;
    drag.samples = [...drag.samples.filter((sample) => now - sample.t < 120), { dy: drag.dy, dx: 0, t: now }];
    gsap.set(event.currentTarget, { y: drag.dy, rotate: drag.dy * 0.015 });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.dragging) return;
    suppressClickRef.current = true;
    const [first] = drag.samples;
    if (card.kind === "end") {
      const speedX = (drag.dx - first.dx) / Math.max(1, performance.now() - first.t);
      const pulled = (direction: 1 | -1) =>
        direction * drag.dx > SWIPE_DISTANCE || (direction * drag.dx > FLICK_DISTANCE && direction * speedX > FLICK_SPEED);
      if (pulled(-1)) {
        show({ kind: "intro" }, null, 0, drag.dx * SIDE_FOLLOW);
        return;
      }
      if (pulled(1)) openBooking();
      gsap.to(event.currentTarget, { x: 0, rotate: 0, ...sidePull(0), duration: 0.6, ease: "elastic.out(1, 0.6)" });
      showWays(event.currentTarget, 0, true);
      return;
    }
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
    const topicIndex = shownTopic ? topics.indexOf(shownTopic) : 0;
    if (shown.kind === "intro") {
      return (
        <IntroCard
          cover={abstraction(0)}
          content={content}
          locale={locale}
          topics={topics.map((name) => ({ name, count: all.filter((question) => question.category === name).length }))}
          onChoose={(name) => show({ kind: "question", index: 0 }, name)}
        />
      );
    }
    if (shown.kind === "end") {
      return (
        <CardShell cover={abstraction(topicIndex * 3 + 9)} light={daylight(1)} top={<span>{reflection.endEyebrow}</span>}>
          <h2 className="m-title">{reflection.endTitle.replace("{category}", shownTopic ?? "")}</h2>
          <div className="m-text">
            {reflection.endText.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Dandelion blown={blown} />
          {/*
            No buttons: the two ways on glow at the card's edges, and pulling the card towards one makes
            its glow grow and name the way. The hidden buttons are for screen readers.
          */}
          <span className="m-edge m-edge--left" aria-hidden="true" />
          <span className="m-edge m-edge--right" aria-hidden="true" />
          <span className="m-way m-way--left" aria-hidden="true">
            ← {reflection.otherTopic}
          </span>
          <span className="m-way m-way--right" aria-hidden="true">
            {reflection.book} →
          </span>
          <button type="button" onClick={() => show({ kind: "intro" }, null)} className="sr-only">
            {reflection.otherTopic}
          </button>
          <a href={quizBookingUrl} target="_blank" rel="noopener noreferrer" className="sr-only">
            {reflection.book}
          </a>
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
        cover={abstraction(topicIndex * 3 + shown.index + 1)}
        light={daylight(shown.index / shownRun.length)}
        texts={reflection}
        nextLabel={shownSteps < STEPS ? reflection.nextStep : isLast ? reflection.finish : reflection.nextQuestion}
        onNext={() => next()}
        rowQuestion={labels.rowQuestion}
        hint={shownSteps < STEPS ? (taught ? null : reflection.tapHint) : reflection.swipeUpHint}
      />
    );
  };

  // The page clears up question by question, like the desktop: from night on the first card to day at the end.
  const pageLight = card.kind === "intro" ? 0 : card.kind === "end" ? daylight(1) : daylight(card.index / run.length);

  // Secondary cards of the current topic, or of every topic on the first card.
  const streamQuestions = topic ? run : topics.map((name) => all.find((question) => question.category === name)!);
  const palette = topic ? `topic-${topics.indexOf(topic)}` : "intro";

  return (
    <div
      className="mobile-quiz"
      data-tone={pageLight >= LIGHT_TONE_FROM ? "light" : "dark"}
      style={{ "--daylight": pageLight } as React.CSSProperties}
    >
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
          <LeavingSlot
            key={`out-${cardKey(leaving.card, leaving.topic)}`}
            fromY={leaving.fromY}
            fromX={leaving.fromX}
            onDone={clearLeaving}
            onScatter={scatter}
          >
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
          onClick={(event) => {
            const tapped = (event.target as HTMLElement).closest<HTMLElement>(".m-card");
            if (card.kind === "end" && !(event.target as HTMLElement).closest(".m-dandelion")) swayHint();
            if ((event.target as HTMLElement).closest(".m-dandelion")) blowDandelion((Math.random() - 0.5) * 80);
            else if (isLight(tapped)) dustRef.current?.release(event.clientX, event.clientY, TAP_SEEDS, dustColours(tapped));
            else if (tapped) dustRef.current?.sprinkle(event.clientX, event.clientY, TAP_DUST, dustColours(tapped));
            // A tap on a question card opens its next step. Moving on to the next question takes a swipe
            // up, so quick taps never skip a question; a tap on a fully open card only lifts it as a hint.
            if (card.kind !== "question" || (event.target as HTMLElement).closest("button, a")) return;
            if (steps < STEPS) next();
            else nudgeUp(event.currentTarget);
          }}
        >
          {render(card, topic, steps)}
        </div>
      </main>
      <canvas ref={dustCanvasRef} className="mobile-quiz__dust" aria-hidden="true" />
    </div>
  );
}

/** The main card: 80% of the screen, its type scaled down (--fit) when a long question would not fit. */
/** The main card; `light` (0 night … 1 day, like the page) decides whether its glass is dark or light. */
function CardShell({
  cover,
  light = 0,
  top,
  children,
}: {
  cover: string;
  light?: number;
  top: ReactNode;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const card = cardRef.current!;
    const body = card.querySelector<HTMLElement>(".m-card__body")!;
    const fits = () => body.scrollHeight <= body.clientHeight;
    function fit() {
      card.style.setProperty("--fit", "1");
      if (fits()) return;
      // Down to half size, so even the smallest phones in an in-app browser show the whole card.
      let [low, high] = [0.5, 1];
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

  // The light of a tap takes its colours from this card's abstraction.
  useEffect(() => learnCoverColours(cover), [cover]);

  return (
    <article
      ref={cardRef}
      className={`m-card${light >= LIGHT_TONE_FROM ? " m-card--light" : ""}`}
      data-cover={cover}
      data-light={light}
      style={{ "--cover": `url(${cover})` } as React.CSSProperties}
    >
      <span className="m-card__cover" aria-hidden="true" />
      <header className="m-card__top">{top}</header>
      <div className="m-card__body">{children}</div>
    </article>
  );
}

interface IntroCardProps {
  cover: string;
  content: QuizContent;
  locale: QuizLocale;
  topics: { name: string; count: number }[];
  onChoose: (topic: string) => void;
}

function IntroCard({ cover, content, locale, topics, onChoose }: IntroCardProps) {
  const { reflection, labels } = content;
  return (
    <CardShell
      cover={cover}
      top={
        <>
          <span>{content.wordmark}</span>
          <nav aria-label={labels.languageLabel} className="m-langs">
            {quizLocales.map((code) => (
              <a key={code} href={`/questions/${code}`} hrefLang={code} aria-current={code === locale ? "true" : undefined}>
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
  cover: string;
  light: number;
  texts: QuizContent["reflection"];
  nextLabel: string;
  onNext: () => void;
  rowQuestion: string;
  /** Shown at the foot of the first question to teach the tap; null once learnt. */
  hint: string | null;
}

/** Every step is in the layout from the start and only comes into focus when opened, so nothing shifts. */
function QuestionCard({
  question,
  position,
  total,
  steps,
  cover,
  light,
  texts,
  nextLabel,
  onNext,
  rowQuestion,
  hint,
}: QuestionCardProps) {
  const step = (index: number) => ({ "data-visible": steps >= index, inert: steps < index });
  return (
    <CardShell
      cover={cover}
      light={light}
      top={
        <>
          {/* Stories-like segments: a question each, the current one filling step by step. */}
          <span className="m-stories" aria-hidden="true">
            {Array.from({ length: total }, (_, index) => (
              <span key={index} className="m-stories__segment">
                <span
                  className="m-stories__fill"
                  style={{ transform: `scaleX(${index < position - 1 ? 1 : index === position - 1 ? steps / STEPS : 0})` }}
                />
              </span>
            ))}
          </span>
          <span>
            {rowQuestion} · {question.category}
          </span>
          <span className="sr-only">
            {position} / {total}
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
      {/* The whole card is the control (a tap opens the next step); this button is for screen readers. */}
      <button type="button" onClick={onNext} className="sr-only">
        {nextLabel}
      </button>
      {/* Always in the layout, empty or not, so the card's fit already leaves room for the hint that comes later. */}
      <p className="m-tap-hint" data-empty={!hint} aria-hidden="true">
        {hint && (steps < STEPS ? <span className="m-tap-hint__dot" /> : <span className="m-tap-hint__arrow">↑</span>)}
        {hint ?? "\u00a0"}
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

/** The end card's dandelion: seeds around its head (angles in radians), how far they reach, and the core's size, in SVG units. */
const DANDELION_ANGLES = Array.from({ length: 36 }, (_, index) => (index / 36) * 2 * Math.PI);
const DANDELION_REACH = 32;
const DANDELION_CORE_SIZE = 10;

/**
 * A dandelion clock on the end card, swaying a little. Tapping it, or pulling the card sideways, blows
 * it: its seeds leave the head (MobileQuiz lets them float off) and only the bare stem stays.
 */
function Dandelion({ blown }: { blown: boolean }) {
  return (
    <svg className="m-dandelion" data-blown={blown} viewBox="0 0 120 220" aria-hidden="true">
      <path className="m-dandelion__stem" d="M60 64 C 57 120, 67 165, 62 220" />
      <g transform="translate(60 58)">
        <g className="m-dandelion__seeds">
          {DANDELION_ANGLES.map((angle, index) => {
            const reach = index % 2 ? DANDELION_REACH - 4 : DANDELION_REACH;
            const [x, y] = [Math.cos(angle) * reach, Math.sin(angle) * reach];
            return (
              <g key={index}>
                <line x1={0} y1={0} x2={x} y2={y} />
                {[-2, -1, 0, 1, 2].map((ray) => (
                  <line
                    key={ray}
                    x1={x}
                    y1={y}
                    x2={x + Math.cos(angle + ray * 0.38) * 7}
                    y2={y + Math.sin(angle + ray * 0.38) * 7}
                  />
                ))}
              </g>
            );
          })}
        </g>
        <circle className="m-dandelion__core" r={DANDELION_CORE_SIZE / 2} />
      </g>
    </svg>
  );
}
