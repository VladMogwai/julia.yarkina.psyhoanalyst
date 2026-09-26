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

/** "topic-<index>" for a topic screen, "mobile" for the phone layout, anything else for the neutral palette. */
export function auroraPalette(key: string | undefined): [string, string, string] {
  if (key === "mobile") return MOBILE_PALETTE;
  const match = key?.match(/^topic-(\d+)$/);
  return (match && TOPIC_PALETTES[Number(match[1])]) || NEUTRAL_PALETTE;
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
