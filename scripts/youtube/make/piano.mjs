// The intro's piano part as a MIDI file, timed to the animation in intro.mjs. Played by FluidSynth in make.mjs.
import { writeFileSync } from "node:fs";

// [start s, end s, note, velocity]
const NOTES = [
  // Bars open: rising C major arpeggio.
  [0.05, 1.08, 60, 62], [0.17, 1.08, 64, 64], [0.29, 1.08, 67, 66], [0.41, 1.08, 72, 70],
  // Circles appear: Am7, then a melody note.
  [1.1, 2.38, 57, 48], [1.1, 2.38, 64, 46], [1.1, 2.38, 67, 46], [1.1, 2.38, 72, 50], [1.35, 2.38, 76, 62],
  // Hold: Fmaj7, G.
  [2.4, 3.48, 53, 42], [2.4, 3.48, 57, 40], [2.4, 3.48, 60, 40], [2.4, 3.48, 64, 42], [2.6, 3.48, 72, 52],
  [3.5, 4.38, 55, 42], [3.5, 4.38, 59, 40], [3.5, 4.38, 62, 42], [3.7, 4.38, 74, 52],
  // Logo: full C major.
  [4.4, 5.6, 48, 62], [4.4, 5.6, 55, 60], [4.42, 5.6, 60, 62], [4.44, 5.6, 64, 64], [4.46, 5.6, 67, 64], [4.48, 5.6, 72, 68],
];
const PEDAL = [0, 1.08, 2.38, 3.48, 4.38]; // pedal is lifted and pressed again at each chord change

const TPQ = 480, TEMPO = 500000; // 120 bpm: one tick is 1/960 s
const tick = (s) => Math.round(s * 960);
const events = [];
for (const [a, b, n, v] of NOTES) events.push([tick(a), [0x90, n, v]], [tick(b), [0x80, n, 0]]);
PEDAL.forEach((s, i) => {
  if (i) events.push([tick(s), [0xb0, 64, 0]]);
  events.push([tick(s) + 10, [0xb0, 64, 127]]);
});
events.push([tick(5.6), [0xb0, 64, 0]]);
events.sort((x, y) => x[0] - y[0]);

const vlq = (n) => {
  const out = [n & 0x7f];
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
  return out;
};
const track = [0, 0xff, 0x51, 3, TEMPO >> 16, (TEMPO >> 8) & 255, TEMPO & 255, 0, 0xc0, 0]; // tempo, program 0 = grand piano
let last = 0;
for (const [t, bytes] of events) {
  track.push(...vlq(t - last), ...bytes);
  last = t;
}
track.push(0, 0xff, 0x2f, 0);
const u32 = (n) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
export const writeMidi = (path) => writeFileSync(path, Buffer.from([
  ...Buffer.from("MThd"), ...u32(6), 0, 0, 0, 1, TPQ >> 8, TPQ & 255,
  ...Buffer.from("MTrk"), ...u32(track.length), ...track,
]));
