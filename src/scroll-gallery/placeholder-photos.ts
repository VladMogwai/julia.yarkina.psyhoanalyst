/** Placeholder Pexels photos for the gallery effects until the real ones are chosen. */
const PHOTO_IDS = [
  3965534, 1333742, 15128321, 37423357, 16550173, 4787231, 27990818, 8869381, 2563810, 30520816, 35485859,
  28830006, 13061431, 6186376, 11197155, 2158504, 2268519, 2158400, 2486900, 32368621, 14146745, 2157881,
  36379320, 2158455,
];

export function pexelsPhoto(index: number, width: number): string {
  const id = PHOTO_IDS[index % PHOTO_IDS.length];
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}
