import type { GalleryEffectName } from "@/scroll-gallery/GalleryEffect";
import type { GalleryFlipOptions } from "@/scroll-gallery/scroll-galleries";

/**
 * Desktop only: the scroll gallery effect that leads from question N to the next screen
 * (the last one leads to the result), in the order of the Codrops demo.
 */
export const QUIZ_TRANSITIONS: GalleryEffectName[] = ["row", "grid", "scatter", "deck", "zoom"];

/** Shorter than the demo: a transition, not a showcase. */
export const QUIZ_TRANSITION_FLIP: GalleryFlipOptions = { end: "+=200%" };
