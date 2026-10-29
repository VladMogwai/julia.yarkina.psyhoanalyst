// Cover and intro rendering, shared by make.mjs (command line) and the studio server.
import { execFile as execFileCb } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { PALETTE, THEORY, coverHtml } from "./cover.mjs";
import { SECONDS, introHtml } from "./intro.mjs";
import { writeMidi } from "./piano.mjs";

const execFile = promisify(execFileCb);
const here = dirname(fileURLToPath(import.meta.url));
// The packaged app (studio/app/) points these at its own copies; otherwise the repo's.
export const ASSETS = process.env.STUDIO_ASSETS || join(here, "../assets");
const CHROME = process.env.STUDIO_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BIN = process.env.STUDIO_BIN; // compiled face/blurbg instead of running the Swift sources
const swiftTool = (name, args) => (BIN ? execFile(join(BIN, name), args) : execFile("swift", [join(here, `${name}.swift`), ...args]));
export const LABELS = { int: "Інтерв'ю", tema: "Тема · Юлія Яркіна", teor: "Теорія психоаналізу" };

/**
 * Size and face box of a photo, found by macOS Vision. Without a face (a profile, a tiny face, no person) the photo is
 * centred on its upper middle instead, and noFace is set so the studio can say so.
 */
async function photo(file) {
  const { stdout } = await swiftTool("face", [file]);
  const [w, h, ...face] = stdout.trim().split("\n").pop().split(" ").slice(1).map(Number);
  if (!w || !h) throw new Error(`Cannot read the photo ${file}`);
  if (face.length < 4 || face.some(Number.isNaN)) {
    const side = Math.min(w, h) * 0.35;
    return { src: pathToFileURL(file).href, w, h, face: [(w - side) / 2, h * 0.2, side, side], noFace: true };
  }
  return { src: pathToFileURL(file).href, w, h, face };
}

/**
 * The cover spec from what the user gives: { kind, title, label?, guests? (1–3 photo files), julia? (name in assets/julia), color? (0–4) }.
 * Guest photos get their background blurred into workDir.
 */
export async function buildSpec(o, workDir) {
  const guests = [o.guests ?? o.guest ?? []].flat().filter(Boolean);
  if (!LABELS[o.kind]) throw new Error("kind must be int, tema or teor");
  if (!o.title) throw new Error("title is required");
  if (guests.length > 3) throw new Error("at most 3 guests fit on a cover");
  const colors = o.kind === "teor" ? THEORY : { ...PALETTE[(+o.color || 0) % PALETTE.length], titleColor: "#fff" };
  const spec = {
    kind: o.kind,
    ...colors,
    labelColor: colors.labelColor ?? colors.accent,
    label: o.label || LABELS[o.kind],
    title: o.title,
    photo: await photo(join(ASSETS, "julia", `${o.julia || (o.kind === "tema" ? 11 : 7)}.jpg`)),
  };
  if (o.kind === "int") {
    mkdirSync(workDir, { recursive: true });
    spec.guests = [];
    for (const [i, file] of guests.entries()) {
      const blurred = join(workDir, `guest${i + 1}-blurred.jpg`);
      await swiftTool("blurbg", [resolve(file), blurred, "20"]);
      spec.guests.push(await photo(blurred));
    }
  }
  return spec;
}

/** Transparent PNGs of whole-frame pages (text and photos laid over the video); each page sets window.ready. */
export async function renderLayers(pages, dir, width, height) {
  mkdirSync(dir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    const out = [];
    for (const [i, html] of pages.entries()) {
      const file = join(dir, `layer${i}.html`), png = join(dir, `layer${i}.png`);
      writeFileSync(file, html);
      await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle0" });
      await page.waitForFunction("window.ready === true");
      await page.screenshot({ path: png, omitBackground: true });
      out.push(png);
    }
    return out;
  } finally {
    await browser.close();
  }
}

async function withPage(html, file, scale, fn) {
  writeFileSync(file, html);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: scale });
    await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle0" });
    await page.waitForFunction("window.ready === true");
    return await fn(page);
  } finally {
    await browser.close();
  }
}

export async function renderCover(spec, out) {
  await withPage(coverHtml(spec), out.replace(/\.\w+$/, ".html"), 1, (page) => page.screenshot({ path: out, type: "jpeg", quality: 92 }));
  return out;
}

// The music as it sounds in the intro: cut at the end of the intro, faded out, at YouTube loudness.
const MUSIC_AF = `atrim=0:${SECONDS},afade=t=out:st=${SECONDS - 0.3}:d=0.3,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000`;
const playMidi = (mid, wav) => execFile("fluidsynth", ["-ni", "-q", "-r", "48000", "-g", "0.6", "-F", wav, join(ASSETS, "GeneralUser-GS.sf2"), mid]);

/** A music file (see piano.mjs) played as it will sound in the intro, as WAV; for the studio's music editor. */
export async function renderMusic(music, out) {
  const mid = out.replace(/\.\w+$/, ".mid"), raw = out.replace(/\.\w+$/, "-raw.wav");
  writeMidi(mid, music);
  await playMidi(mid, raw);
  await execFile("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-af", MUSIC_AF, "-ac", "2", out]);
  rmSync(mid, { force: true });
  rmSync(raw, { force: true });
  return out;
}

/**
 * The 5-second intro as MP4 with piano. width/fps follow the video it goes in front of (16:9 is assumed for the picture;
 * the studio pads other shapes). Audio is 48 kHz stereo AAC, silent if the soundfont is missing.
 */
export async function renderIntro(spec, out, { width = 1920, fps = 30, onProgress } = {}) {
  const frames = out.replace(/\.\w+$/, "-frames");
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const total = Math.round(fps * SECONDS);
  await withPage(introHtml(spec), out.replace(/\.\w+$/, ".html"), width / 1280, async (page) => {
    for (let i = 0; i < total; i++) {
      await page.evaluate((t) => window.render(t), i / fps);
      await page.screenshot({ path: join(frames, `${String(i).padStart(4, "0")}.png`) });
      onProgress?.(i / total);
    }
  });
  const video = ["-framerate", String(fps), "-i", join(frames, "%04d.png")];
  const sf2 = join(ASSETS, "GeneralUser-GS.sf2");
  const ready = join(ASSETS, "piano.wav"); // the packaged app ships the piano already played
  let audio = ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"];
  let af = `atrim=0:${SECONDS}`;
  if (existsSync(ready) || existsSync(sf2)) {
    let wav = ready;
    if (!existsSync(ready)) {
      const mid = join(frames, "piano.mid");
      wav = join(frames, "piano.wav");
      writeMidi(mid);
      await playMidi(mid, wav);
    }
    audio = ["-i", wav];
    af = MUSIC_AF;
  }
  await execFile("ffmpeg", ["-loglevel", "error", "-y", ...video, ...audio, "-af", af, "-ac", "2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-r", String(fps), "-c:a", "aac", "-b:a", "192k", "-t", String(SECONDS), out]);
  rmSync(frames, { recursive: true, force: true });
  return out;
}
