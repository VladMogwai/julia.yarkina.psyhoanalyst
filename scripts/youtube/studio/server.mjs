// Studio: upload a video, cut out pauses and slips in the browser, get it back with the intro in front and a cover.
//
//   node --env-file=.env.local scripts/youtube/studio/server.mjs     → http://localhost:3300
//
// Needs STUDIO_PASSWORD in .env.local. Runs on the Mac (ffmpeg, Chrome and macOS Vision do the work); Cloudflare Tunnel
// can put it online. Jobs live in scripts/youtube/studio-data/ (git-ignored). See scripts/youtube/README.md.
import { createServer } from "node:http";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { spawn, execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ASSETS, buildSpec, introTrack, renderCover, renderIntro, renderLayers, renderMusic } from "../make/lib.mjs";
import { MUSIC_DIR } from "../make/piano.mjs";
import { FONTS } from "../make/cover.mjs";
import { SECONDS } from "../make/intro.mjs";
import { canTranscribe, subtitles, transcribe } from "./transcribe.mjs";
import { overlayHtml } from "./public/overlay.mjs";

const execFile = promisify(execFileCb);
const here = dirname(fileURLToPath(import.meta.url));
const OVERLAY_FILE = /^ov-[a-z0-9]{6,12}\.(?:jpg|png|webp)$/;
// STUDIO_LOCAL=1 is the packaged app: it listens only on this computer, so no password is asked.
const LOCAL = process.env.STUDIO_LOCAL === "1";
const DATA = process.env.STUDIO_DATA || join(here, "../studio-data");
const PUBLIC = join(here, "public");
const PORT = +(process.env.STUDIO_PORT || 3300);
const PASSWORD = process.env.STUDIO_PASSWORD;
if (!PASSWORD && !LOCAL) {
  console.error("Set STUDIO_PASSWORD in .env.local and start with: node --env-file=.env.local scripts/youtube/studio/server.mjs");
  process.exit(1);
}
mkdirSync(join(DATA, "jobs"), { recursive: true });

// Session cookie: "<expires>.<hmac>", signed with a secret kept next to the jobs.
const secretFile = join(DATA, "secret");
if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString("hex"));
const SECRET = readFileSync(secretFile, "utf8");
const sign = (v) => createHmac("sha256", SECRET).update(v).digest("hex");
const session = () => {
  const exp = String(Date.now() + 30 * 24 * 3600e3);
  return `${exp}.${sign(exp)}`;
};
const downloadToken = () => {
  const exp = String(Date.now() + 24 * 3600e3);
  return `${exp}.${sign("download:" + exp)}`;
};
function validToken(t) {
  const [exp, mac] = String(t || "").split(".");
  const good = Buffer.from(sign("download:" + exp));
  return mac?.length === good.length && timingSafeEqual(Buffer.from(mac), good) && +exp > Date.now();
}

function authed(req) {
  if (LOCAL) return true;
  const m = /(?:^|;\s*)studio=([^;]+)/.exec(req.headers.cookie || "");
  if (!m) return false;
  const [exp, mac] = m[1].split(".");
  const good = Buffer.from(sign(exp));
  return mac?.length === good.length && timingSafeEqual(Buffer.from(mac), good) && +exp > Date.now();
}

// Jobs: one folder each, state in job.json.
const jobDir = (id) => join(DATA, "jobs", id);
const load = (id) => JSON.parse(readFileSync(join(jobDir(id), "job.json"), "utf8"));
function save(job) {
  writeFileSync(join(jobDir(job.id), "job.json"), JSON.stringify(job, null, 1));
  return job;
}
const update = (id, patch) => save({ ...load(id), ...patch });
const validId = (id) => /^[a-z0-9-]+$/.test(id) && existsSync(join(jobDir(id), "job.json"));

/** In the Mac app, a macOS notification (the browser may be minimised). */
// Build stamps written by app/build.sh: the website offers its newest build, the app compares it with its own.
const readVersion = (file) => (existsSync(file) ? readFileSync(file, "utf8").trim() : "");
const OWN_VERSION = join(here, "../../../version.txt"); // in the app: Resources/app/version.txt
const LATEST_VERSION = join(here, "app/dist/version.txt"); // on the website: next to the installer
const UPDATES = process.env.STUDIO_UPDATES_URL || "https://studio.yarkina-psy.online/api/app-version";
let latest = { at: 0, version: "" }, announced = "";

function notify(text) {
  if (!LOCAL) return;
  const q = (x) => JSON.stringify(String(x)); // AppleScript strings take the same escaping as JSON
  spawn("osascript", ["-e", `display notification ${q(text)} with title "Pro Studio" sound name "Glass"`]).on("error", () => {});
}

/** Runs ffmpeg, reporting progress (0–1) from its -progress output against a known duration. */
function ffmpeg(args, duration, onProgress) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", ["-loglevel", "error", "-y", "-progress", "pipe:1", ...args]);
    let err = "";
    p.stdout.on("data", (d) => {
      const m = /out_time_us=(\d+)/.exec(String(d));
      if (m && duration) onProgress?.(Math.min(1, +m[1] / 1e6 / duration));
    });
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err.slice(-800) || `ffmpeg exited ${code}`))));
  });
}

async function probe(file) {
  const { stdout } = await execFile("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,avg_frame_rate:format=duration,bit_rate", "-of", "json", file]);
  const j = JSON.parse(stdout);
  const v = j.streams.find((s) => s.codec_type === "video");
  const [n, d] = v.avg_frame_rate.split("/").map(Number);
  return { width: v.width, height: v.height, fps: d ? n / d : 30, duration: +j.format.duration, bitrate: +j.format.bit_rate || 8e6, audio: j.streams.some((s) => s.codec_type === "audio") };
}

// ---- A ready-made intro (for example made in Blender) for interviews or for solo videos, used instead of the generated one. ----
const INTRO_DIR = join(DATA, "intro");
const introKey = (kind) => (kind === "int" ? "int" : "solo");
const introFile = (key) => join(INTRO_DIR, `${key}.mp4`);
/**
 * The uploaded intro made ready to go in front: its own sound at YouTube loudness, or, when it has none, the music chosen
 * for this kind of video, as long as the intro. Returns its length in seconds.
 */
async function fitIntro(file, kind, out) {
  const p = await probe(file);
  const track = introTrack(kind, p.duration);
  const audio = p.audio ? [] : track ? track.input : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"];
  const af = p.audio ? "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000" : track ? `${track.filter},apad` : "anull";
  await execFile("ffmpeg", ["-loglevel", "error", "-y", "-i", file, ...audio, "-map", "0:v:0", "-map", p.audio ? "0:a:0" : "1:a:0",
    "-af", af, "-ac", "2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-t", String(p.duration), out]);
  return p.duration;
}

/** Light copy for the editor, waveform peaks (100 a second) and long pauses suggested as cuts. */
async function prepare(id) {
  const dir = jobDir(id);
  const src = join(dir, "video");
  const step = (message, progress = 0) => update(id, { status: "preparing", message, progress });
  try {
    const info = await probe(src);
    update(id, { source: info });
    step("Легка копія для редактора");
    await ffmpeg(["-i", src, "-vf", "scale=-2:480", "-c:v", "h264_videotoolbox", "-b:v", String(Math.round(Math.min(1.2e6, Math.max(3e5, info.bitrate * 0.5)))), "-g", "30", "-c:a", "aac", "-b:a", "96k", "-ac", "1", "-movflags", "+faststart", join(dir, "proxy.mp4")],
      info.duration, (p) => step("Легка копія для редактора", p));

    step("Хвиля звуку");
    const pcm = await new Promise((resolve, reject) => {
      const chunks = [];
      const p = spawn("ffmpeg", ["-loglevel", "error", "-i", src, "-vn", "-ac", "1", "-ar", "8000", "-f", "s16le", "pipe:1"]);
      p.stdout.on("data", (d) => chunks.push(d));
      p.on("close", (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error("waveform failed"))));
    });
    const peaks = [];
    for (let i = 0; i + 160 <= pcm.length; i += 160) {
      let max = 0;
      for (let j = i; j < i + 160; j += 2) max = Math.max(max, Math.abs(pcm.readInt16LE(j)));
      peaks.push(+(max / 32768).toFixed(3));
    }
    writeFileSync(join(dir, "peaks.json"), JSON.stringify(peaks));

    // Frames for the timeline: one picture of up to 600 thumbnails, 10 per row.
    step("Кадри для таймлайну");
    const every = Math.max(2, Math.ceil(info.duration / 600));
    const count = Math.max(1, Math.ceil(info.duration / every));
    await execFile("ffmpeg", ["-loglevel", "error", "-y", "-i", join(dir, "proxy.mp4"), "-vf", `fps=1/${every},scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2,tile=10x${Math.ceil(count / 10)}`, "-frames:v", "1", "-q:v", "5", join(dir, "thumbs.jpg")]);
    update(id, { thumbs: { every, count, cols: 10, w: 160, h: 90 } });

    step("Пошук пауз");
    const { stderr } = await execFile("ffmpeg", ["-i", src, "-vn", "-af", "silencedetect=noise=-35dB:d=0.8", "-f", "null", "-"], { maxBuffer: 64 << 20 });
    const suggestions = [];
    for (const m of stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) {
      const [a, b] = [+m[1] + 0.15, +m[2] - 0.15]; // keep 0.3 s of the pause so speech does not run together
      if (b - a > 0.3) suggestions.push([+a.toFixed(2), +b.toFixed(2)]);
    }
    update(id, { suggestions });

    if (canTranscribe(ASSETS)) {
      step("Розпізнавання мови");
      const words = await transcribe(src, dir, ASSETS, peaks, (p) => step("Розпізнавання мови", p));
      writeFileSync(join(dir, "transcript.json"), JSON.stringify(words));
      update(id, { transcript: true, fillers: words.filter((x) => x.f).length });
    }
    // Nothing is cut until someone decides to: pauses and slips are only suggestions.
    update(id, { status: "ready", message: "", progress: 1, cuts: load(id).cuts ?? [] });
    notify(`«${load(id).form?.title || "Відео"}» готове до монтажу.`);
  } catch (e) {
    update(id, { status: "error", message: String(e.message || e) });
    notify("Не вдалося підготувати відео.");
  }
}

/** Final video: intro, then the source without the cuts, re-encoded on the Mac's hardware encoder; plus the cover. */
async function render(id) {
  const dir = jobDir(id);
  const job = load(id);
  const step = (message, progress = 0) => update(id, { status: "rendering", message, progress });
  try {
    step("Обкладинка");
    const guests = ["guest", "guest2", "guest3"].map((n) => join(dir, n)).filter(existsSync);
    const spec = await buildSpec({ ...job.form, guests: job.form.kind === "int" ? guests : [] }, join(dir, "work"));
    await renderCover(spec, join(dir, "cover.jpg"));

    const { width, height, fps, duration, bitrate, audio } = job.source;
    const rate = Math.round(fps) || 30;
    step("Інтро");
    let introSeconds = SECONDS;
    const custom = introFile(introKey(job.form.kind));
    if (existsSync(custom)) introSeconds = await fitIntro(custom, job.form.kind, join(dir, "intro.mp4"));
    else await renderIntro(spec, join(dir, "intro.mp4"), { width: Math.min(1920, Math.round((height * 16) / 9 / 2) * 2), fps: rate, onProgress: (p) => step("Інтро", p) });

    // Kept parts of the source = everything outside the cuts.
    const cuts = [...(job.cuts || [])].sort((a, b) => a[0] - b[0]);
    const keep = [];
    let t = 0;
    for (const [a, b] of cuts) {
      if (a > t + 0.05) keep.push([t, a]);
      t = Math.max(t, b);
    }
    if (duration > t + 0.05) keep.push([t, duration]);

    const fit = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${rate},format=yuv420p`;
    const parts = [`[0:v]${fit}[v0]`, `[0:a]aresample=48000,aformat=channel_layouts=stereo[a0]`];
    keep.forEach(([a, b], i) => {
      const len = (b - a).toFixed(3);
      parts.push(`[1:v]trim=${a}:${b},setpts=PTS-STARTPTS,${fit}[v${i + 1}]`);
      // 15 ms fades at each join so the cuts do not click.
      parts.push(audio
        ? `[1:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, len - 0.015)}:d=0.015[a${i + 1}]`
        : `anullsrc=r=48000:cl=stereo,atrim=0:${len}[a${i + 1}]`);
    });
    const n = keep.length + 1;
    parts.push(`${Array.from({ length: n }, (_, i) => `[v${i}][a${i}]`).join("")}concat=n=${n}:v=1:a=1[vc][a]`);

    // Text and photos: each a transparent full-frame picture, shown wherever its stretch of the source is kept.
    const layers = [];
    for (const o of job.overlays || []) {
      const spans = [];
      let at = introSeconds;
      for (const [a, b] of keep) {
        const x0 = Math.max(a, o.t0), x1 = Math.min(b, o.t1);
        if (x1 - x0 > 0.02) spans.push([at + x0 - a, at + x1 - a]);
        at += b - a;
      }
      if (spans.length) layers.push({ o, spans });
    }
    const pictures = layers.length ? await renderLayers(layers.map(({ o }) =>
      `<html><head><meta charset="utf-8">${FONTS}<style>html,body{margin:0;width:${width}px;height:${height}px;background:transparent;position:relative;overflow:hidden}</style></head>` +
      `<body>${overlayHtml(o, width, o.file && pathToFileURL(join(dir, o.file)).href)}<script>document.fonts.ready.then(() => (window.ready = true))</script></body></html>`), join(dir, "work", "layers"), width, height) : [];
    let last = "vc";
    layers.forEach(({ spans }, k) => {
      const on = spans.map(([a, b]) => `between(t,${a.toFixed(3)},${b.toFixed(3)})`).join("+");
      parts.push(`[${last}][${k + 2}:v]overlay=0:0:enable='${on}'[l${k}]`);
      last = `l${k}`;
    });
    parts.push(`[${last}]format=yuv420p[v]`);
    const script = join(dir, "filter.txt");
    writeFileSync(script, parts.join(";\n"));
    const total = introSeconds + keep.reduce((s, [a, b]) => s + b - a, 0);
    step("Монтаж", 0);
    await ffmpeg(["-i", join(dir, "intro.mp4"), "-i", join(dir, "video"), ...pictures.flatMap((p) => ["-i", p]), "-/filter_complex", script, "-map", "[v]", "-map", "[a]",
      "-c:v", "h264_videotoolbox", "-b:v", String(Math.max(4e6, Math.min(bitrate, 20e6))), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", join(dir, "final.mp4")],
      total, (p) => step("Монтаж", p));
    update(id, { status: "done", message: "", progress: 1, renderedAt: Date.now(), introSeconds });
    notify(`«${job.form?.title || "Відео"}» змонтовано: відео й обкладинка готові.`);
  } catch (e) {
    update(id, { status: "error", message: String(e.message || e) });
    notify("Монтаж не вдався.");
  }
}

// ---- Intro music: variants are files in make/music (in the repo, so they can be edited by hand too); intro.json is used. ----
const musicFile = (name) => join(MUSIC_DIR, `${name}.json`);
async function musicApi(req, res, path) {
  // The intro animation, to watch while listening: the newest one rendered.
  if (path === "/api/music/intro.mp4") {
    const withIntro = readdirSync(join(DATA, "jobs")).map((id) => join(jobDir(id), "intro.mp4")).filter(existsSync);
    withIntro.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    return withIntro.length ? sendFile(req, res, withIntro[0]) : json(res, 404, { error: "no intro yet" });
  }
  if (path === "/api/music/render" && req.method === "POST") {
    // Its own files: the editor may ask again before the previous sound is ready.
    const out = join(DATA, `music-preview-${randomBytes(4).toString("hex")}.wav`);
    try {
      await renderMusic(JSON.parse(String(await readBody(req))), out);
      return res.writeHead(200, { "Content-Type": "audio/wav" }).end(readFileSync(out));
    } finally {
      rmSync(out, { force: true });
    }
  }
  if (path === "/api/music" && req.method === "GET") {
    const list = readdirSync(MUSIC_DIR).filter((f) => f.endsWith(".json")).map((f) => {
      const name = f.slice(0, -5);
      return { name, title: JSON.parse(readFileSync(musicFile(name), "utf8")).title, mtime: statSync(musicFile(name)).mtimeMs };
    });
    return json(res, 200, list.sort((a, b) => (a.name === "intro" ? -1 : b.name === "intro" ? 1 : b.mtime - a.mtime)));
  }
  const m = /^\/api\/music\/([a-z0-9-]{1,40})(\/use)?$/.exec(path);
  if (!m) return json(res, 404, { error: "not found" });
  const [, name, use] = m, file = musicFile(name);
  if (req.method === "GET") return existsSync(file) ? json(res, 200, { music: JSON.parse(readFileSync(file, "utf8")), mtime: statSync(file).mtimeMs }) : json(res, 404, { error: "not found" });
  // The intro's own file changes only by putting a variant in: new intros then get that music.
  if (name === "intro") return json(res, 400, { error: "intro is changed with /use" });
  if (use && req.method === "POST") {
    writeFileSync(musicFile("intro"), readFileSync(file));
    return json(res, 200, { ok: true });
  }
  if (req.method === "PUT") {
    const music = JSON.parse(String(await readBody(req)));
    if (!Array.isArray(music.tracks)) return json(res, 400, { error: "bad music" });
    // One note per line, so the files stay easy to read and edit by hand.
    writeFileSync(file, JSON.stringify(music, null, 1).replace(/\[\n\s+([-\d.,\s]+?)\n\s+\]/g, (_, x) => `[${x.replace(/\s+/g, "")}]`) + "\n");
    return json(res, 200, { mtime: statSync(file).mtimeMs });
  }
  if (req.method === "DELETE") {
    rmSync(file, { force: true });
    return json(res, 200, { ok: true });
  }
  json(res, 405, { error: "method" });
}

// HTTP helpers.
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".mjs": "text/javascript", ".webp": "image/webp" };
const json = (res, code, body) => res.writeHead(code, { "Content-Type": "application/json" }).end(JSON.stringify(body));
const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => resolve(Buffer.concat(chunks)));
});

/** Serves a file with Range support, so the editor can seek in the video without loading it all. */
function sendFile(req, res, file, download) {
  if (!existsSync(file)) return json(res, 404, { error: "not found" });
  const size = statSync(file).size;
  const headers = { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };
  // filename* carries the Cyrillic name; filename is the plain fallback.
  if (download) headers["Content-Disposition"] = `attachment; filename="${{ ".jpg": "cover.jpg", ".pkg": "Pro-Studio.pkg" }[extname(file)] ?? "video.mp4"}"; filename*=UTF-8''${encodeURIComponent(download)}`;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (m) {
    const start = m[1] ? +m[1] : size - +m[2];
    const end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, "Content-Length": size });
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const path = url.pathname;
  try {
    if (path === "/login" && req.method === "GET") return sendFile(req, res, join(PUBLIC, "login.html"));
    // The install command downloads with a 24-hour token instead of the login cookie (Terminal has no cookie).
    if (path === "/download/Pro-Studio.pkg" && !LOCAL && validToken(url.searchParams.get("t"))) {
      return sendFile(req, res, join(here, "app/dist/Pro-Studio.pkg"), "Pro-Studio.pkg");
    }
    if (path === "/style.css") return sendFile(req, res, join(PUBLIC, "style.css"));
    if (path === "/api/app-version" && !LOCAL) return json(res, 200, { version: readVersion(LATEST_VERSION) });
    if (path === "/api/login" && req.method === "POST") {
      const { password } = JSON.parse(String(await readBody(req)) || "{}");
      const ok = typeof password === "string" && password.length === PASSWORD.length && timingSafeEqual(Buffer.from(password), Buffer.from(PASSWORD));
      if (!ok) {
        await new Promise((r) => setTimeout(r, 1000)); // slows down password guessing
        return json(res, 401, { error: "Невірний пароль" });
      }
      const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
      res.setHeader("Set-Cookie", `studio=${session()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 3600}${secure}`);
      return json(res, 200, { ok: true });
    }
    if (!authed(req)) {
      if (path.startsWith("/api/") || path.startsWith("/files/")) return json(res, 401, { error: "login" });
      return res.writeHead(302, { Location: "/login" }).end();
    }

    if (path === "/") return sendFile(req, res, join(PUBLIC, "index.html"));
    if (path === "/editor") return sendFile(req, res, join(PUBLIC, "editor.html"));
    if (path === "/download" && !LOCAL) return sendFile(req, res, join(PUBLIC, "download.html"));
    if (path.startsWith("/static/")) return sendFile(req, res, join(PUBLIC, path.slice(8).replace(/\.\./g, "")));
    if (path === "/api/logout" && req.method === "POST") {
      res.setHeader("Set-Cookie", "studio=; Path=/; Max-Age=0");
      return json(res, 200, { ok: true });
    }
    const appPkg = join(here, "app/dist/Pro-Studio.pkg");
    // The intro music editor works where the soundfont is: on the website's Mac, not in the app.
    const music = !LOCAL && existsSync(join(ASSETS, "GeneralUser-GS.sf2"));
    if (path === "/api/info") return json(res, 200, { local: LOCAL, app: !LOCAL && existsSync(appPkg), music });
    if (music && path === "/music") return sendFile(req, res, join(PUBLIC, "music.html"));
    if (music && path.startsWith("/api/music")) return await musicApi(req, res, path);
    if (path === "/download/Pro-Studio.pkg" && !LOCAL) return sendFile(req, res, appPkg, "Pro-Studio.pkg");
    // One Terminal command: curl leaves no "downloaded from the internet" mark, so macOS does not block the unsigned app.
    if (path === "/api/install-command" && !LOCAL) {
      const origin = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
      const link = `${origin}/download/Pro-Studio.pkg?t=${downloadToken()}`;
      return json(res, 200, {
        command: `curl -fL --progress-bar "${link}" -o /tmp/Pro-Studio.pkg && sudo installer -pkg /tmp/Pro-Studio.pkg -target / && rm /tmp/Pro-Studio.pkg && "/Applications/Pro Studio.app/Contents/Resources/stop.sh"; open "/Applications/Pro Studio.app"`,
      });
    }
    // In the app: is there a newer build on the website? Asked at most every 10 minutes; offline means no.
    if (path === "/api/update" && LOCAL) {
      if (Date.now() - latest.at > 10 * 60e3) {
        let version = "";
        try { version = (await (await fetch(UPDATES, { signal: AbortSignal.timeout(5000) })).json()).version || ""; } catch {}
        latest = { at: Date.now(), version };
      }
      const current = readVersion(OWN_VERSION);
      const available = !!current && latest.version > current;
      if (available && announced !== latest.version) {
        announced = latest.version;
        notify("Вийшла нова версія Pro Studio. Оновіть її на сторінці скачування.");
      }
      return json(res, 200, { current, latest: latest.version, available, url: new URL("/download", UPDATES).href });
    }
    // Intros: GET /api/intro (both kinds), PUT/DELETE /api/intro/int|solo (body: the video), GET /api/intro/int|solo/video,
    // GET /api/intro/int|solo/sound (the track's piece as the standard intro plays it).
    const intro = /^\/api\/intro(?:\/(int|solo)(?:\/(video|sound))?)?$/.exec(path);
    if (intro) {
      const [, key, part] = intro;
      const video = part === "video";
      if (part === "sound") {
        const track = introTrack(key === "int" ? "int" : "tema");
        if (!track) return json(res, 404, { error: "no track" });
        const { stdout } = await execFile("ffmpeg", ["-loglevel", "error", ...track.input, "-af", track.filter, "-ac", "2", "-c:a", "aac", "-b:a", "192k", "-f", "adts", "-"], { encoding: "buffer", maxBuffer: 16 << 20 });
        return res.writeHead(200, { "Content-Type": "audio/aac", "Content-Length": stdout.length }).end(stdout);
      }
      if (!key) {
        const about = async (k, kind) => {
          const f = introFile(k);
          return { custom: existsSync(f), seconds: existsSync(f) ? (await probe(f)).duration : SECONDS, music: introTrack(kind)?.title || "ноти з редактора музики" };
        };
        return json(res, 200, { int: await about("int", "int"), solo: await about("solo", "tema") });
      }
      const file = introFile(key);
      if (video) return sendFile(req, res, file);
      if (req.method === "PUT") {
        mkdirSync(INTRO_DIR, { recursive: true });
        const tmp = `${file}.new`;
        await new Promise((resolve, reject) => req.pipe(createWriteStream(tmp)).on("finish", resolve).on("error", reject));
        const p = await probe(tmp).catch(() => null);
        if (!p || !(p.duration > 0.5 && p.duration <= 60)) {
          rmSync(tmp, { force: true });
          return json(res, 400, { error: "Це не схоже на відео до 60 секунд" });
        }
        renameSync(tmp, file);
        return json(res, 200, { seconds: p.duration });
      }
      if (req.method === "DELETE") {
        rmSync(file, { force: true });
        return json(res, 200, { ok: true });
      }
    }
    if (path === "/api/reveal" && req.method === "POST" && LOCAL) {
      spawn("open", [join(DATA, "jobs")]);
      return json(res, 200, { ok: true });
    }
    if (path === "/api/julia") return json(res, 200, readdirSync(join(ASSETS, "julia")).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4)));
    const jm = /^\/julia\/([\w-]+)\.jpg$/.exec(path);
    if (jm) return sendFile(req, res, join(ASSETS, "julia", `${jm[1]}.jpg`));

    if (path === "/api/jobs" && req.method === "GET") {
      const jobs = readdirSync(join(DATA, "jobs")).filter(validId).map(load).sort((a, b) => b.createdAt - a.createdAt);
      return json(res, 200, jobs);
    }
    if (path === "/api/jobs" && req.method === "POST") {
      const form = JSON.parse(String(await readBody(req)));
      const id = `${new Date().toISOString().slice(0, 10)}-${randomBytes(3).toString("hex")}`;
      mkdirSync(jobDir(id), { recursive: true });
      return json(res, 200, save({ id, createdAt: Date.now(), status: "uploading", form, fileName: form.fileName }));
    }

    const m = /^\/api\/jobs\/([a-z0-9-]+)(?:\/(\w+))?$/.exec(path);
    if (m && validId(m[1])) {
      const [, id, action] = m;
      if (!action && req.method === "GET") return json(res, 200, load(id));
      // Deletes the video with everything made from it; not while it is being worked on.
      if (!action && req.method === "DELETE") {
        if (["preparing", "rendering"].includes(load(id).status)) return json(res, 409, { error: "Відео ще обробляється" });
        rmSync(jobDir(id), { recursive: true, force: true });
        return json(res, 200, { ok: true });
      }
      if (action === "form" && req.method === "PUT") return json(res, 200, update(id, { form: { ...load(id).form, ...JSON.parse(String(await readBody(req))) } }));
      // Chunked upload: PUT …/upload?name=video|guest|guest2|guest3|ov-….jpg&offset=N appends a chunk; a repeated chunk is ignored.
      if (action === "upload" && req.method === "PUT") {
        const name = url.searchParams.get("name");
        if (!["video", "guest", "guest2", "guest3"].includes(name) && !OVERLAY_FILE.test(name)) return json(res, 400, { error: "bad name" });
        const file = join(jobDir(id), name);
        const have = existsSync(file) ? statSync(file).size : 0;
        const offset = +url.searchParams.get("offset");
        if (offset !== have) {
          req.resume();
          return json(res, 200, { size: have });
        }
        await new Promise((resolve, reject) => req.pipe(createWriteStream(file, { flags: "a" })).on("finish", resolve).on("error", reject));
        return json(res, 200, { size: statSync(file).size });
      }
      if (action === "upload" && req.method === "DELETE") {
        const name = url.searchParams.get("name");
        if (!["guest", "guest2", "guest3"].includes(name) && !OVERLAY_FILE.test(name)) return json(res, 400, { error: "bad name" });
        rmSync(join(jobDir(id), name), { force: true });
        return json(res, 200, { ok: true });
      }
      // Cover preview while the form is being filled in.
      if (action === "preview" && req.method === "POST") {
        const job = load(id);
        const guests = ["guest", "guest2", "guest3"].map((n) => join(jobDir(id), n)).filter(existsSync);
        try {
          const spec = await buildSpec({ ...job.form, guests: job.form.kind === "int" ? guests : [] }, join(jobDir(id), "work"));
          await renderCover(spec, join(jobDir(id), "preview.jpg"));
          const missing = (spec.guests || []).map((g, i) => (g.noFace ? i + 1 : 0)).filter(Boolean);
          return json(res, 200, { ok: true, noFace: missing });
        } catch (e) {
          return json(res, 200, { error: String(e.message || e) });
        }
      }
      if (action === "prepare" && req.method === "POST") {
        update(id, { status: "preparing", message: "", progress: 0 });
        prepare(id);
        return json(res, 200, { ok: true });
      }
      // Body: { cuts: [[a, b]…], splits: [t…], overlays?: […] } (an array alone is taken as cuts).
      if (action === "cuts" && req.method === "PUT") {
        const body = JSON.parse(String(await readBody(req)));
        if (Array.isArray(body)) return json(res, 200, update(id, { cuts: body }));
        const overlays = (body.overlays ?? load(id).overlays ?? []).filter((o) => o.type === "text" || OVERLAY_FILE.test(o.file));
        return json(res, 200, update(id, { cuts: body.cuts, splits: body.splits, overlays }));
      }
      if (action === "transcribe" && req.method === "POST") {
        const job = load(id);
        if (!canTranscribe(ASSETS)) return json(res, 400, { error: "no speech model" });
        update(id, { status: "preparing", message: "Розпізнавання мови", progress: 0 });
        const peaks = JSON.parse(readFileSync(join(jobDir(id), "peaks.json"), "utf8"));
        transcribe(join(jobDir(id), "video"), jobDir(id), ASSETS, peaks, (p) => update(id, { progress: p }))
          .then((words) => {
            writeFileSync(join(jobDir(id), "transcript.json"), JSON.stringify(words));
            update(id, { status: job.status === "done" ? "done" : "ready", message: "", progress: 1, transcript: true, fillers: words.filter((x) => x.f).length });
          })
          .catch((e) => update(id, { status: "error", message: String(e.message || e) }));
        return json(res, 200, { ok: true });
      }
      if (action === "render" && req.method === "POST") {
        if (load(id).status === "rendering") return json(res, 409, { error: "already rendering" });
        update(id, { status: "rendering", message: "", progress: 0 });
        render(id);
        return json(res, 200, { ok: true });
      }
    }
    const srt = /^\/files\/([a-z0-9-]+)\/subtitles\.srt$/.exec(path);
    if (srt && validId(srt[1]) && existsSync(join(jobDir(srt[1]), "transcript.json"))) {
      const job = load(srt[1]);
      const words = JSON.parse(readFileSync(join(jobDir(srt[1]), "transcript.json"), "utf8"));
      const name = (job.form?.title || "video").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "video";
      res.writeHead(200, { "Content-Type": "application/x-subrip; charset=utf-8", "Content-Disposition": `attachment; filename="subtitles.srt"; filename*=UTF-8''${encodeURIComponent(name + ".srt")}` });
      return res.end(subtitles(words, job.cuts || [], job.introSeconds ?? SECONDS));
    }
    const f = /^\/files\/([a-z0-9-]+)\/(proxy\.mp4|peaks\.json|cover\.jpg|final\.mp4|intro\.mp4|guest|guest2|guest3|thumbs\.jpg|transcript\.json|preview\.jpg|ov-[a-z0-9]{6,12}\.(?:jpg|png|webp))$/.exec(path);
    if (f && validId(f[1])) {
      const job = load(f[1]);
      const base = (job.form?.title || "video").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "video";
      const dl = url.searchParams.has("dl") ? { "cover.jpg": `${base}.jpg`, "final.mp4": `${base}.mp4` }[f[2]] : undefined;
      return sendFile(req, res, join(jobDir(f[1]), f[2]), dl);
    }
    json(res, 404, { error: "not found" });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: String(e.message || e) });
  }
});
server.requestTimeout = 0; // large uploads and long downloads
server.listen(PORT, LOCAL ? "127.0.0.1" : undefined, () => console.log(`Studio: http://localhost:${PORT}`));
