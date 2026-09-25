import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(Flip, ScrollTrigger);

/** Per-gallery Flip options, read from the gallery's `data-flip` JSON attribute. */
export interface GalleryFlipOptions {
  absolute?: boolean;
  absoluteOnLeave?: boolean;
  scale?: boolean;
  simple?: boolean;
  stagger?: number;
  end?: string;
}

const DEFAULTS: Required<GalleryFlipOptions> = {
  absolute: false,
  absoluteOnLeave: false,
  scale: true,
  simple: true,
  stagger: 0,
  end: "+=300%",
};

export const SWITCH_CLASS = "gallery--switch";

/**
 * Scroll-scrubbed layout animations. Each `.gallery` describes its start layout in CSS and its
 * end layout under `.gallery--switch`; Flip animates between them while the wrapper is pinned.
 * Returns a cleanup function that kills every trigger and stops smooth scrolling.
 */
export function initScrollGalleries(root: HTMLElement): () => void {
  const galleries = [...root.querySelectorAll<HTMLElement>(".gallery")];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    galleries.forEach((gallery) => gallery.classList.add(SWITCH_CLASS));
    return () => galleries.forEach((gallery) => gallery.classList.remove(SWITCH_CLASS));
  }

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  let frame = requestAnimationFrame(function loop(time) {
    lenis.raf(time);
    frame = requestAnimationFrame(loop);
  });

  const context = gsap.context(() => {
    for (const gallery of galleries) {
      const options = { ...DEFAULTS, ...(JSON.parse(gallery.dataset.flip ?? "{}") as GalleryFlipOptions) };
      const targets = gallery.querySelectorAll(".gallery__item, .caption");
      const scrollTrigger = {
        trigger: gallery,
        start: "center center",
        end: options.end,
        pin: gallery.parentElement,
        scrub: true,
      };

      // Record the end layout, then return to the start layout and animate towards the recorded state.
      gallery.classList.add(SWITCH_CLASS);
      const state = Flip.getState(targets, { props: "filter, opacity" });
      gallery.classList.remove(SWITCH_CLASS);

      Flip.to(state, {
        ease: "none",
        absolute: options.absolute,
        absoluteOnLeave: options.absoluteOnLeave,
        scale: options.scale,
        simple: options.simple,
        stagger: options.stagger,
        scrollTrigger,
      });

      const inner = gallery.querySelectorAll(".gallery__item-inner");
      if (inner.length > 0) {
        gsap.fromTo(inner, { scale: 2 }, { scale: 1, ease: "none", scrollTrigger: { ...scrollTrigger, pin: false } });
      }
    }
  }, root);

  let resizeTimer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  };
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    clearTimeout(resizeTimer);
    context.revert();
    cancelAnimationFrame(frame);
    lenis.destroy();
  };
}

/** Resolves once every background image inside `root` is downloaded and decoded. */
export function waitForGalleryImages(root: HTMLElement): Promise<void> {
  const urls = new Set<string>();
  root.querySelectorAll<HTMLElement>("[style*='background-image']").forEach((element) => {
    const match = /url\(["']?([^"')]+)["']?\)/.exec(element.style.backgroundImage);
    if (match) urls.add(match[1]);
  });
  return Promise.all(
    [...urls].map((url) => {
      const image = new Image();
      image.src = url;
      return image.decode().catch(() => undefined);
    }),
  ).then(() => undefined);
}
