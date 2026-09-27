/**
 * Desktop only: colours of the drifting aurora behind the questions, three per palette.
 * Topics are matched by their order in the questions file, so the palettes do not depend on the language.
 */
const TOPIC_PALETTES: [string, string, string][] = [
  ["#5b4bc4", "#2d6f8f", "#8a4a7a"], // Anxiety: indigo, cold teal, plum
  ["#a0702a", "#8a3f2a", "#5d5a2a"], // Guilt: ochre, rust, olive
  ["#b0566e", "#6e3f6e", "#b87a5e"], // Shame: dusty rose, mauve, peach
  ["#7a2338", "#5a2a5e", "#9a5a3a"], // Resentment: burgundy, wine violet, copper
  ["#3a5a8a", "#4a6272", "#2a3470"], // Loneliness: slate blue, steel, navy
  ["#b0583a", "#9a3f5a", "#a87a3a"], // Relationships: terracotta, rose, amber
  ["#b08a2a", "#3f7a4a", "#2d7a72"], // Self-realisation: gold, green, teal
  ["#2d8a72", "#3a4a6a", "#5a7a5a"], // Boundaries: mint teal, graphite blue, sage
];

/** The first screen and the closing question: a calm mix of all topics. */
const NEUTRAL_PALETTE: [string, string, string] = ["#6a4ab4", "#2d7a8a", "#9a4a6a"];

/** Phones: the lavender, mint and violet of the reference design, over its dark forest green. */
const MOBILE_PALETTE: [string, string, string] = ["#b39ae8", "#dcede3", "#8b6cc9"];

/**
 * "topic-<index>" for a topic, "topic-<index>-<screen>" for one screen of it, "mobile" for the phone
 * layout, anything else for the neutral palette. Every screen of a topic gets its own mix: the topic's
 * colours in another order, one of them borrowed from a neighbouring topic, so screens differ yet stay related.
 */
export function auroraPalette(key: string | undefined): [string, string, string] {
  if (key === "mobile") return MOBILE_PALETTE;
  const match = key?.match(/^topic-(\d+)(?:-(\d+))?$/);
  const base = match && TOPIC_PALETTES[Number(match[1])];
  if (!base) return NEUTRAL_PALETTE;
  const screen = Number(match[2] ?? 0);
  if (screen === 0) return base;
  const neighbour = TOPIC_PALETTES[(Number(match[1]) + screen) % TOPIC_PALETTES.length];
  return [base[screen % 3], neighbour[(screen + 1) % 3], base[(screen + 2) % 3]];
}

/** Lets the aurora's colours flow into a palette over `seconds` (the length of the move between screens). */
export function paintAurora(aurora: HTMLElement, key: string | undefined, seconds: number) {
  aurora.style.setProperty("--aurora-duration", `${seconds}s`);
  auroraPalette(key).forEach((colour, index) => aurora.style.setProperty(`--aurora-${index + 1}`, colour));
}

/** Where each patch of light falls on the "wall", as a share of the viewport. */
const ANCHORS = [
  [0.18, 0.18],
  [0.86, 0.4],
  [0.42, 0.92],
] as const;

/** Height of the light above the wall, as a share of the viewport diagonal: lower means longer, sharper streaks. */
const LIGHT_HEIGHT = 0.32;
/** The longest a patch may stretch when the light hits it at a grazing angle. */
const MAX_STRETCH = 2.6;

export interface AuroraLight {
  /** Moves the light faster and back to calm over `seconds`, for the length of a move between screens. */
  surge: (seconds: number) => void;
  stop: () => void;
}

/**
 * The patches behave like pools of light from one lamp that wanders slowly over the page.
 * Right under the lamp a patch is round and bright; the further the lamp moves away, the more the
 * light arrives at a grazing angle, so the patch stretches away from the lamp, turns with it and dims.
 */
export function startAuroraLight(aurora: HTMLElement): AuroraLight {
  const blobs = [...aurora.querySelectorAll<HTMLElement>(".aurora__blob")];
  let time = 0;
  let last = performance.now();
  let surgeStart = 0;
  let surgeLength = 0;
  let frameId = requestAnimationFrame(frame);

  function frame(now: number) {
    const surgeProgress = surgeLength ? (now - surgeStart) / surgeLength : 1;
    const speed = surgeProgress < 1 ? 1 + 5 * Math.sin(Math.PI * surgeProgress) : 1;
    time += ((now - last) / 1000) * speed;
    last = now;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const size = Math.max(width, height) * 0.6;
    const lightHeight = Math.hypot(width, height) * LIGHT_HEIGHT;
    // A slow Lissajous path, so the lamp never repeats a straight line.
    const lightX = width * (0.5 + 0.45 * Math.sin(time * 0.11));
    const lightY = height * (0.45 + 0.4 * Math.sin(time * 0.07 + 1.3));

    blobs.forEach((blob, index) => {
      const [anchorX, anchorY] = ANCHORS[index];
      const dx = anchorX * width - lightX;
      const dy = anchorY * height - lightY;
      const distance = Math.hypot(dx, dy) || 1;
      const incidence = Math.atan(distance / lightHeight);
      const stretch = Math.min(MAX_STRETCH, 1 / Math.cos(incidence));
      const push = distance * 0.18;
      const x = anchorX * width + (dx / distance) * push - size / 2;
      const y = anchorY * height + (dy / distance) * push - size / 2;
      blob.style.transform = `translate(${x}px, ${y}px) rotate(${Math.atan2(dy, dx)}rad) scale(${stretch}, ${1 / Math.sqrt(stretch)})`;
      blob.style.opacity = String(0.3 + 0.5 * Math.cos(incidence));
    });
    frameId = requestAnimationFrame(frame);
  }

  return {
    surge(seconds) {
      surgeStart = performance.now();
      surgeLength = seconds * 1000;
    },
    stop() {
      cancelAnimationFrame(frameId);
    },
  };
}

/**
 * How light the page is at a point of a topic (0 first question, 1 its end), on desktop and phones alike:
 * it clears up question by question, a hint that more comes into view. Halfway it steps over to light,
 * where the text turns dark, so no screen sits on a grey that neither white nor dark text would read well on.
 */
export function daylight(progress: number) {
  return progress < 0.5 ? progress * 0.6 : 0.72 + (progress - 0.5) * 0.56;
}

/** From this daylight on, the text is dark on a light ground. */
export const LIGHT_TONE_FROM = 0.5;

/** Desktop: how light the ground behind the aurora is, 0 (night) to 1 (daylight); it flows there like the colours. */
export function setDaylight(aurora: HTMLElement, amount: number) {
  aurora.style.setProperty("--daylight", String(amount));
}

/** Width the backdrop is drawn at: it is blurred anyway, so a small canvas stretched to the screen is enough and cheap. */
const BACKDROP_WIDTH = 200;
const BACKDROP_BLUR_PX = 7;

/**
 * Desktop: an abstract photo far behind the light, blurred beyond recognition. It is blurred once into a
 * small canvas (a blur filter over a full-screen layer would stall weaker machines). Three canvases take
 * turns and a new photo is always drawn into the one that has faded out most, so quick changes never
 * redraw a layer that is still visible. Without `url` the backdrop fades out.
 */
export function showBackdrop(aurora: HTMLElement, url: string | undefined, opacity: number) {
  const layers = [...aurora.querySelectorAll<HTMLCanvasElement>(".aurora__backdrop")];
  if (layers.length < 3) return;
  const shown = layers.find((layer) => layer.dataset.visible === "true");
  if (!url) {
    aurora.dataset.backdrop = "";
    shown?.setAttribute("data-visible", "false");
    return;
  }
  if (shown && shown.dataset.src === url) {
    shown.style.setProperty("--backdrop-opacity", String(opacity));
    return;
  }
  // Only the latest request is shown; a photo that loads after a newer one was asked for is dropped.
  aurora.dataset.backdrop = url;
  const image = new Image();
  image.onload = () => {
    if (aurora.dataset.backdrop !== url) return;
    const next = layers
      .filter((layer) => layer !== shown)
      .sort((a, b) => Number(getComputedStyle(a).opacity) - Number(getComputedStyle(b).opacity))[0];
    next.width = BACKDROP_WIDTH;
    next.height = Math.round((BACKDROP_WIDTH * window.innerHeight) / window.innerWidth);
    const context = next.getContext("2d")!;
    context.filter = `blur(${BACKDROP_BLUR_PX}px)`;
    // Cover the canvas with a margin, so the blur never shows a see-through edge.
    const scale = Math.max(next.width / image.width, next.height / image.height) * 1.25;
    const [width, height] = [image.width * scale, image.height * scale];
    context.drawImage(image, (next.width - width) / 2, (next.height - height) / 2, width, height);
    next.dataset.src = url;
    next.style.setProperty("--backdrop-opacity", String(opacity));
    next.dataset.visible = "true";
    shown?.setAttribute("data-visible", "false");
  };
  image.src = url;
}

/** Desktop drift of each patch: resting place, how far and how slowly it wanders, how slowly it grows and shrinks. */
const DRIFTS = [
  { x: 0.24, y: 0.28, reach: 0.07, period: 70, growth: 46, phase: 0 },
  { x: 0.76, y: 0.42, reach: 0.06, period: 86, growth: 53, phase: 2.1 },
  { x: 0.46, y: 0.78, reach: 0.07, period: 64, growth: 39, phase: 4.2 },
] as const;

/** One breath of the pause: in for four seconds, out for six (a longer breath out calms). */
const BREATH_IN = 4;
const BREATH_OUT = 6;

/** 0 to 1 over one breath: rising softly on the breath in, sinking slower on the breath out. */
function breathAt(seconds: number) {
  const t = seconds % (BREATH_IN + BREATH_OUT);
  const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
  return t < BREATH_IN ? ease(t / BREATH_IN) : 1 - ease((t - BREATH_IN) / BREATH_OUT);
}

/** In the pause the patches gather into one glow; these small offsets keep its colours apart. */
const GLOW_OFFSETS = [
  [-0.04, -0.03],
  [0.045, 0.005],
  [-0.01, 0.045],
] as const;
/** The colours inside the glow turn around its centre this slowly (seconds per turn). */
const GLOW_TURN_SECONDS = 48;

export interface AuroraDrift {
  /** 0 to 1: the deeper a question is opened, the more the light gathers to the centre and dims. */
  setDepth: (depth: number) => void;
  /**
   * The quiet pause with a question: the patches gather into one glow in the middle that grows with a
   * breath in and shrinks with a breath out, a pace to breathe along with. Off, they drift apart again.
   */
  breathe: (on: boolean) => void;
  stop: () => void;
}

/**
 * Desktop: the patches of light wander slowly around their places and grow and shrink a little, each at
 * its own pace. Kept slow and soft on purpose: no sudden speed, no stretching, nothing that could make
 * a reader queasy.
 */
export function startAuroraDrift(aurora: HTMLElement): AuroraDrift {
  const blobs = [...aurora.querySelectorAll<HTMLElement>(".aurora__blob")];
  const start = performance.now();
  let last = start;
  let depth = 0;
  let depthTarget = 0;
  let breathing = false;
  /** 0 while drifting, 1 once gathered into the glow; eases between the two over a few seconds. */
  let gathered = 0;
  let breathStart = 0;
  let frameId = requestAnimationFrame(frame);

  function frame(now: number) {
    const time = (now - start) / 1000;
    const elapsed = (now - last) / 1000;
    last = now;
    depth += (depthTarget - depth) * Math.min(1, elapsed * 0.8);
    gathered += ((breathing ? 1 : 0) - gathered) * Math.min(1, elapsed * 0.6);
    // The first breath starts once the glow has mostly gathered, from its smallest size.
    const breath = breathAt(Math.max(0, time - breathStart));

    const width = window.innerWidth;
    const height = window.innerHeight;
    const size = Math.max(width, height) * 0.6;
    blobs.forEach((blob, index) => {
      const drift = DRIFTS[index];
      const angle = (2 * Math.PI * time) / drift.period + drift.phase;
      // Deeper in a question the patches drift towards the centre and gather.
      const driftX = drift.x + (0.5 - drift.x) * 0.35 * depth + drift.reach * Math.sin(angle);
      const driftY = drift.y + (0.5 - drift.y) * 0.35 * depth + drift.reach * Math.cos(angle * 0.8);
      const driftScale = (1 + 0.15 * Math.sin((2 * Math.PI * time) / drift.growth + drift.phase)) * (1 - 0.25 * depth);
      const driftOpacity = 0.34 * (1 - 0.35 * depth);

      const turn = (2 * Math.PI * time) / GLOW_TURN_SECONDS;
      const [offsetX, offsetY] = GLOW_OFFSETS[index];
      const glowX = 0.5 + offsetX * Math.cos(turn) - offsetY * Math.sin(turn);
      const glowY = 0.5 + offsetX * Math.sin(turn) + offsetY * Math.cos(turn);
      const glowScale = 0.5 + 0.28 * breath;
      const glowOpacity = 0.4 + 0.18 * breath;

      const mix = (from: number, to: number) => from + (to - from) * gathered;
      const x = mix(driftX, glowX);
      const y = mix(driftY, glowY);
      blob.style.transform = `translate(${x * width - size / 2}px, ${y * height - size / 2}px) scale(${mix(driftScale, glowScale)})`;
      blob.style.opacity = String(mix(driftOpacity, glowOpacity));
    });
    frameId = requestAnimationFrame(frame);
  }

  return {
    setDepth(value) {
      depthTarget = value;
    },
    breathe(on) {
      if (on && !breathing) breathStart = (performance.now() - start) / 1000 + 2.5;
      breathing = on;
    },
    stop() {
      cancelAnimationFrame(frameId);
    },
  };
}

/** The pause's kaleidoscope: its picture, how many mirrored slices, and how slowly it turns (seconds per turn). */
// A magenta-and-gold abstraction from the questionnaire's own set (Pexels 36304042), chosen for the pause.
const KALEIDOSCOPE_IMAGE = "https://images.pexels.com/photos/36304042/pexels-photo-36304042.jpeg?auto=compress&cs=tinysrgb&w=800";
const KALEIDOSCOPE_SLICES = 8;
const KALEIDOSCOPE_TURN_SECONDS = 140;
/** Drawn small and blurred, then stretched to the screen: soft like footage out of focus, and cheap. */
const KALEIDOSCOPE_WIDTH = 240;
const KALEIDOSCOPE_BLUR_PX = 5;
/** Matches the canvas's fade-out in quiz.css, so drawing stops only once it is invisible. */
const KALEIDOSCOPE_FADE_MS = 2200;

export interface Kaleidoscope {
  show: (on: boolean) => void;
  stop: () => void;
}

/**
 * Desktop pause: a slowly turning kaleidoscope behind the breathing glow, blurred out of focus.
 * The picture is cut into mirrored slices around the centre while it turns and drifts underneath them,
 * so the pattern keeps changing without ever repeating a jump. It is drawn only while it is shown.
 */
export function startKaleidoscope(canvas: HTMLCanvasElement): Kaleidoscope {
  const image = new Image();
  image.src = KALEIDOSCOPE_IMAGE;
  const context = canvas.getContext("2d")!;
  let frameId = 0;
  let hideTimer = 0;
  const start = performance.now();

  function draw(now: number) {
    const time = (now - start) / 1000;
    canvas.width = KALEIDOSCOPE_WIDTH;
    canvas.height = Math.round((KALEIDOSCOPE_WIDTH * window.innerHeight) / window.innerWidth);
    const radius = Math.hypot(canvas.width, canvas.height) / 2 + 4;
    const slice = (2 * Math.PI) / KALEIDOSCOPE_SLICES;
    const turn = (2 * Math.PI * time) / KALEIDOSCOPE_TURN_SECONDS;
    // The picture under the slices drifts on a slow loop, which keeps the pattern changing.
    const scale = (radius * 2.2) / Math.min(image.width, image.height);
    const driftX = Math.sin(time / 23) * radius * 0.35;
    const driftY = Math.cos(time / 29) * radius * 0.35;

    context.filter = `blur(${KALEIDOSCOPE_BLUR_PX}px)`;
    for (let index = 0; index < KALEIDOSCOPE_SLICES; index++) {
      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(turn + index * slice);
      if (index % 2) context.scale(1, -1);
      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, radius, -slice / 2 - 0.01, slice / 2 + 0.01);
      context.closePath();
      context.clip();
      context.rotate(-turn * 0.6);
      context.drawImage(
        image,
        driftX - (image.width * scale) / 2,
        driftY - (image.height * scale) / 2,
        image.width * scale,
        image.height * scale,
      );
      context.restore();
    }
    frameId = requestAnimationFrame(draw);
  }

  return {
    show(on) {
      window.clearTimeout(hideTimer);
      canvas.dataset.visible = String(on);
      if (on && !frameId) {
        const begin = () => (frameId = requestAnimationFrame(draw));
        if (image.complete) begin();
        else image.onload = begin;
      }
      if (!on) {
        hideTimer = window.setTimeout(() => {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }, KALEIDOSCOPE_FADE_MS);
      }
    },
    stop() {
      window.clearTimeout(hideTimer);
      cancelAnimationFrame(frameId);
    },
  };
}
