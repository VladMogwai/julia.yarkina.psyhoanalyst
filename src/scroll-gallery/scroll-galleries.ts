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

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lenis smooth scrolling wired to ScrollTrigger. */
export function createSmoothScroll(): { lenis: Lenis; destroy: () => void } {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  let frame = requestAnimationFrame(function loop(time) {
    lenis.raf(time);
    frame = requestAnimationFrame(loop);
  });
  return {
    lenis,
    destroy: () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    },
  };
}

/**
 * Scroll-scrubbed layout animation of one `.gallery`: its start layout is in CSS, its end layout
 * under `.gallery--switch`, and Flip animates between them while the wrapper is pinned.
 * With reduced motion the end layout is shown right away. Returns a cleanup function.
 */
export function animateGallery(gallery: HTMLElement, overrides: GalleryFlipOptions = {}): () => void {
  if (prefersReducedMotion()) {
    gallery.classList.add(SWITCH_CLASS);
    return () => gallery.classList.remove(SWITCH_CLASS);
  }

  const context = gsap.context(() => {
    const options = {
      ...DEFAULTS,
      ...(JSON.parse(gallery.dataset.flip ?? "{}") as GalleryFlipOptions),
      ...overrides,
    };
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
  }, gallery);

  return () => context.revert();
}

/** Refreshes every ScrollTrigger (debounced) when the window is resized. Returns a cleanup function. */
export function refreshOnResize(): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), 200);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
    clearTimeout(timer);
  };
}

/** Animates every `.gallery` inside `root` with smooth scrolling. Returns a cleanup function. */
export function initScrollGalleries(root: HTMLElement): () => void {
  const galleries = [...root.querySelectorAll<HTMLElement>(".gallery")];
  const cleanups = galleries.map((gallery) => animateGallery(gallery));
  if (!prefersReducedMotion()) {
    cleanups.push(createSmoothScroll().destroy, refreshOnResize());
  }
  return () => cleanups.reverse().forEach((cleanup) => cleanup());
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
