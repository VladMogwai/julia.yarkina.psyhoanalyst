// The intro's music as a MIDI file, timed to the animation in intro.mjs. Played by FluidSynth in lib.mjs.
//
// The notes live in music/*.json, made in the studio's music editor (/music); music/intro.json is the one in the intro.
// A music file: { title, tracks: [{ name, program (General MIDI instrument), volume (0–127), pedal?: [s…],
//   notes: [[start s, end s, note, velocity]…] }] }. The pedal is lifted and pressed again at each pedal time.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MUSIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "music");
export const loadMusic = (name = "intro") => JSON.parse(readFileSync(join(MUSIC_DIR, `${name}.json`), "utf8"));

const TPQ = 480, TEMPO = 500000; // 120 bpm: one tick is 1/960 s
const tick = (s) => Math.round(s * 960);
const vlq = (n) => {
  const out = [n & 0x7f];
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
  return out;
};
const u32 = (n) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];

export function writeMidi(path, music = loadMusic()) {
  const events = [];
  music.tracks.forEach((t, i) => {
    const ch = i < 9 ? i : i + 1; // channel 10 is drums in General MIDI
    events.push([0, [0xc0 | ch, t.program]], [0, [0xb0 | ch, 7, t.volume ?? 100]]);
    for (const [a, b, n, v] of t.notes) events.push([tick(a), [0x90 | ch, n, v]], [tick(b), [0x80 | ch, n, 0]]);
    (t.pedal || []).forEach((s, k) => {
      if (k) events.push([tick(s), [0xb0 | ch, 64, 0]]);
      events.push([tick(s) + 10, [0xb0 | ch, 64, 127]]);
    });
    if (t.pedal?.length) events.push([tick(5.6), [0xb0 | ch, 64, 0]]);
  });
  // Same moment: note-offs first, so a repeated note is not cut by its own end.
  events.sort((x, y) => x[0] - y[0] || ((x[1][0] & 0xf0) === 0x80 ? -1 : 0) - ((y[1][0] & 0xf0) === 0x80 ? -1 : 0));

  const track = [0, 0xff, 0x51, 3, TEMPO >> 16, (TEMPO >> 8) & 255, TEMPO & 255];
  let last = 0;
  for (const [t, bytes] of events) {
    track.push(...vlq(t - last), ...bytes);
    last = t;
  }
  track.push(0, 0xff, 0x2f, 0);
  writeFileSync(path, Buffer.from([
    ...Buffer.from("MThd"), ...u32(6), 0, 0, 0, 1, TPQ >> 8, TPQ & 255,
    ...Buffer.from("MTrk"), ...u32(track.length), ...track,
  ]));
}
