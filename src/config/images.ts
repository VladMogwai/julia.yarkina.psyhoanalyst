/**
 * Stock photos from Pexels (free for commercial use, attribution not required).
 * Served from the Pexels CDN, which resizes and compresses them on the fly.
 * Photo pages: https://www.pexels.com/photo/<id>/
 */
export const images = {
  approach: 3965534, // armchair with a throw in a white room
  articles: 1333742, // stack of old books
  videos: 15128321, // studio light and window shadow
  certificates: 37423357, // historic library hall
  booking: 16550173, // old wooden door with steps
} as const;

/**
 * Hero background: kaleidoscope loop by KTkaRAJFreeStock (Pixabay, free for commercial use),
 * https://pixabay.com/videos/kaleidoscope-mandala-pattern-loop-172413/ — re-encoded to 1280px, no audio.
 */
export const heroVideo = {
  webm: "/videos/hero-kaleidoscope.webm",
  mp4: "/videos/hero-kaleidoscope.mp4",
  poster: "/images/hero-kaleidoscope.jpg",
};

const widths = [640, 960, 1280, 1920];

export function pexelsUrl(id: number, width: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

export function pexelsSrcSet(id: number): string {
  return widths.map((width) => `${pexelsUrl(id, width)} ${width}w`).join(", ");
}
