/**
 * Looping card videos in public/quiz/media/<name>.{webm,mp4,jpg}: 400×564 (the card's 17:24),
 * played forwards then backwards so the loop has no jump.
 *
 * Sources (Pexels, free for commercial use): state — moon 15615248, patterns — water ripples 38405596,
 * feelings — violet ink 15168378, change — clouds 29719718, desire — candle 34807184,
 * result — sunlight through leaves 12293034.
 */
export interface CardMedia {
  webm: string;
  mp4: string;
  poster: string;
}

export function cardMedia(name: string): CardMedia {
  const base = `/quiz/media/${name}`;
  return { webm: `${base}.webm`, mp4: `${base}.mp4`, poster: `${base}.jpg` };
}

export const resultMedia = cardMedia("result");
