import type { CSSProperties } from "react";
import type { GalleryFlipOptions } from "./scroll-galleries";

export type GalleryEffectName = "row" | "grid" | "scatter" | "deck" | "glass" | "depth" | "wall" | "bento" | "zoom";

interface EffectSpec {
  className: string;
  count: number;
  captionClass: string;
  flip?: GalleryFlipOptions;
  /** Items wrap an inner image that zooms out from scale 2 to 1. */
  inner?: boolean;
  /** Item index shown large (full screen) at the end, which gets a sharper image. */
  hero?: number;
}

/** Markup recipe of each effect; the layouts themselves live in scroll-gallery.css. */
const EFFECTS: Record<GalleryEffectName, EffectSpec> = {
  row: { className: "gallery--row", count: 7, captionClass: "caption--bottom", flip: { absoluteOnLeave: true, scale: false }, hero: 3 },
  grid: { className: "gallery--grid9", count: 9, captionClass: "caption--bottom", inner: true },
  scatter: {
    className: "gallery--scatter",
    count: 16,
    captionClass: "caption--title",
    flip: { absolute: true, scale: false, end: "+=900%", stagger: 0.05 },
  },
  deck: { className: "gallery--deck gallery--deck-dark", count: 6, captionClass: "" },
  glass: { className: "gallery--deck gallery--deck-glass", count: 6, captionClass: "" },
  depth: { className: "gallery--deck gallery--deck-depth", count: 6, captionClass: "" },
  wall: { className: "gallery--wall", count: 80, captionClass: "caption--title" },
  bento: { className: "gallery--bento", count: 8, captionClass: "caption--title", flip: { scale: false } },
  zoom: { className: "gallery--zoom", count: 1, captionClass: "caption--title", hero: 0 },
};

interface GalleryEffectProps {
  effect: GalleryEffectName;
  /** Image URLs by requested width; items cycle through the list. */
  photo: (index: number, width: number) => string;
  caption?: string;
  /** Overrides the effect's Flip options, e.g. a shorter scroll length. */
  flip?: GalleryFlipOptions;
}

export function GalleryEffect({ effect, photo, caption, flip }: GalleryEffectProps) {
  const spec = EFFECTS[effect];
  const width = (index: number) => (index === spec.hero ? 1920 : spec.count > 20 ? 400 : spec.inner ? 1600 : 800);
  const background = (index: number): CSSProperties => ({ backgroundImage: `url(${photo(index, width(index))})` });

  return (
    <div className="gallery-wrap">
      <div className={`gallery ${spec.className}`} data-flip={JSON.stringify({ ...spec.flip, ...flip })}>
        {Array.from({ length: spec.count }, (_, index) =>
          spec.inner ? (
            <div key={index} className="gallery__item">
              <div className="gallery__item-inner" style={background(index)} />
            </div>
          ) : (
            <div key={index} className="gallery__item" style={background(index)} />
          ),
        )}
        {caption && <div className={`caption ${spec.captionClass}`}>{caption}</div>}
      </div>
    </div>
  );
}
