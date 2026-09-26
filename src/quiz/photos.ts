/**
 * Desktop only: Pexels photos (free licence) for the gallery transitions, per topic.
 * Each topic shows the opposite of what the feeling is about, in nature and abstraction, never people.
 * Topics are matched by their order in the questions file, like the aurora palettes.
 */
const TOPIC_PHOTOS: number[][] = [
  // Anxiety → stillness and safety: mist over still water, soft dunes, pastel horizons, smooth stones.
  [
    18386434, 14499187, 2462775, 2382941, 8476580, 19577351, 30682253, 16936446, 20435748, 8869381, 33775045, 18730006,
    30923401, 30923399, 26417214, 32846096, 4021693,
  ],
  // Guilt → cleansing and forgiveness: fresh snow, dew, clear streams, white blossom against the sky.
  [
    35799431, 35799414, 15918771, 12174393, 7450390, 3039071, 12956764, 8553521, 14858466, 31702663, 30929762, 36312916,
    11640607,
  ],
  // Shame → being gently seen: flowers opening to the light, unfurling ferns, soft petals.
  [
    33988886, 33902255, 38965902, 35260533, 6747064, 31231177, 37737665, 37892416, 32506350, 38734880, 38215476,
    37954601, 12329402, 36685898, 15066472,
  ],
  // Resentment → letting go: dandelion seeds in the wind, a feather or a leaf carried by water, drifting clouds.
  [
    34284233, 27499831, 134066, 11235280, 31587121, 8966855, 15698445, 24372788, 16765175, 29014796, 28160669, 9109231,
    8413729, 37431641, 13095100, 33312310,
  ],
  // Loneliness → belonging: murmurations and flocks, tree crowns together, schools of fish.
  [
    29181531, 10718795, 39732634, 20451791, 33709157, 35913275, 10871503, 32547467, 7315078, 14267350, 3911695,
    15857262, 37091163,
  ],
  // Relationships → meeting and harmony: inks blending in water, two trees side by side, waves meeting the shore.
  [
    6402524, 9669044, 5606167, 7577806, 12284657, 11734088, 14748289, 32079670, 19770576, 1709996, 2345681, 39011244,
    2340720,
  ],
  // Self-realisation → growth: seedlings, peaks above the clouds, nautilus and fern spirals, sunflowers.
  [
    36488378, 985628, 22610716, 36541765, 401213, 30322595, 13551535, 156784, 13860281, 13017970, 9457343, 4457904,
    10090474, 16768323, 35967027,
  ],
  // Boundaries → a protected space of one's own: nests, shells, a shoreline, moss on stone.
  [
    6074155, 972994, 29239781, 20476255, 38334223, 38334251, 9802220, 8547009, 1576655, 4963562, 28458008, 5912780,
    28458012,
  ],
];

/**
 * The first screen and the closing question ("what repeats again and again"): kaleidoscopes,
 * like the hero of the main site, and light split by prisms, soap films and soft bokeh.
 */
const NEUTRAL_PHOTOS = [
  2157888, 2486904, 3845161, 3845162, 30880049, 34695694, 2612938, 36304042, 13151813, 37273248, 7630418, 5577419,
  6152745, 29215499, 31216477, 5112007, 3952982,
];

/** Photo `item` of a gallery leading to a screen with this palette key ("topic-<index>", or neutral). */
export function quizPhoto(paletteKey: string, item: number, width: number): string {
  const match = paletteKey.match(/^topic-(\d+)$/);
  const pool = (match && TOPIC_PHOTOS[Number(match[1])]) || NEUTRAL_PHOTOS;
  const id = pool[item % pool.length];
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}
