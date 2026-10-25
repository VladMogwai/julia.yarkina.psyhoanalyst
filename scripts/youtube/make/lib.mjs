// Cover and intro rendering, shared by make.mjs (command line) and the studio server.
import { execFile as execFileCb, execFileSync } from "node:child_process";
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
export const ASSETS = join(here, "../assets");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const LABELS = { int: "Інтерв'ю", tema: "Тема · Юлія Яркіна", teor: "Теорія психоаналізу" };

/** Size and face box of a photo, found by macOS Vision. */
async function photo(file) {
  const { stdout } = await execFile("swift", [join(here, "face.swift"), file]);
  const [w, h, ...face] = stdout.trim().split("\n").pop().split(" ").slice(1).map(Number);
  if (face.length < 4 || face.some(Number.isNaN)) throw new Error(`No face found in ${file}`);
  return { src: pathToFileURL(file).href, w, h, face };
}

/**
 * The cover spec from what the user gives: { kind, title, label?, guest? (photo file), julia? (name in assets/julia), color? (0–4) }.
 * A guest photo gets its background blurred into workDir.
 */
export async function buildSpec(o, workDir) {
  if (!LABELS[o.kind]) throw new Error("kind must be int, tema or teor");
  if (!o.title) throw new Error("title is required");
  if (o.kind === "int" && !o.guest) throw new Error("an interview needs a guest photo");
  const colors = o.kind === "teor" ? THEORY : { ...PALETTE[(+o.color || 0) % PALETTE.length], titleColor: "#fff" };
  const spec = {
    kind: o.kind,
    ...colors,
    labelColor: colors.labelColor ?? colors.accent,
    label: o.label || LABELS[o.kind],
    title: o.title,
    photo: await photo(join(ASSETS, "julia", `${o.julia || (o.kind === "tema" ? 11 : 7)}.jpg`)),
  };
  if (o.guest) {
    mkdirSync(workDir, { recursive: true });
    const blurred = join(workDir, "guest-blurred.jpg");
    await execFile("swift", [join(here, "blurbg.swift"), resolve(o.guest), blurred, "20"]);
    spec.guest = await photo(blurred);
  }
  return spec;
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
  let audio = ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"];
  let af = `atrim=0:${SECONDS}`;
  if (existsSync(sf2)) {
    const mid = join(frames, "piano.mid");
    const wav = join(frames, "piano.wav");
    writeMidi(mid);
    execFileSync("fluidsynth", ["-ni", "-q", "-r", "48000", "-g", "0.6", "-F", wav, sf2, mid]);
    audio = ["-i", wav];
    af = `atrim=0:${SECONDS},afade=t=out:st=${SECONDS - 0.3}:d=0.3,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000`;
  }
  await execFile("ffmpeg", ["-loglevel", "error", "-y", ...video, ...audio, "-af", af, "-ac", "2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-r", String(fps), "-c:a", "aac", "-b:a", "192k", "-t", String(SECONDS), out]);
  rmSync(frames, { recursive: true, force: true });
  return out;
}
