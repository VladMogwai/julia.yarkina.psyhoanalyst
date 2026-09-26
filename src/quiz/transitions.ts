import type { GalleryEffectName } from "@/scroll-gallery/GalleryEffect";
import type { GalleryFlipOptions } from "@/scroll-gallery/scroll-galleries";

/**
 * Desktop only: the scroll gallery effects that lead from one screen to the next, used in turn.
 * All nine effects of the Codrops demo; a topic of 7 questions plus the closing one uses the first nine.
 */
export const QUIZ_TRANSITIONS: GalleryEffectName[] = ["row", "grid", "scatter", "deck", "depth", "glass", "wall", "bento", "zoom"];

/** Shorter than the demo: a transition, not a showcase. */
export const QUIZ_TRANSITION_FLIP: GalleryFlipOptions = { end: "+=200%" };

/** Extra slow-down for effects that feel rushed at the common speed (multiplies TRANSITION_SPEED). */
export const QUIZ_TRANSITION_SPEED: Partial<Record<GalleryEffectName, number>> = { scatter: 0.49, depth: 0.49 };
