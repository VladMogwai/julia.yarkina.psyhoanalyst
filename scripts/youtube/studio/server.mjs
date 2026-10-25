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
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSETS, buildSpec, renderCover, renderIntro } from "../make/lib.mjs";
import { SECONDS } from "../make/intro.mjs";

const execFile = promisify(execFileCb);
const here = dirname(fileURLToPath(import.meta.url));
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

    step("Пошук пауз");
    const { stderr } = await execFile("ffmpeg", ["-i", src, "-vn", "-af", "silencedetect=noise=-35dB:d=0.8", "-f", "null", "-"], { maxBuffer: 64 << 20 });
    const suggestions = [];
    for (const m of stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) {
      const [a, b] = [+m[1] + 0.15, +m[2] - 0.15]; // keep 0.3 s of the pause so speech does not run together
      if (b - a > 0.3) suggestions.push([+a.toFixed(2), +b.toFixed(2)]);
    }
    update(id, { status: "ready", message: "", progress: 1, suggestions, cuts: load(id).cuts ?? suggestions });
  } catch (e) {
    update(id, { status: "error", message: String(e.message || e) });
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
    await renderIntro(spec, join(dir, "intro.mp4"), { width: Math.min(1920, Math.round((height * 16) / 9 / 2) * 2), fps: rate, onProgress: (p) => step("Інтро", p) });

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
    parts.push(`${Array.from({ length: n }, (_, i) => `[v${i}][a${i}]`).join("")}concat=n=${n}:v=1:a=1[v][a]`);
    const script = join(dir, "filter.txt");
    writeFileSync(script, parts.join(";\n"));
    const total = SECONDS + keep.reduce((s, [a, b]) => s + b - a, 0);
    step("Монтаж", 0);
    await ffmpeg(["-i", join(dir, "intro.mp4"), "-i", join(dir, "video"), "-/filter_complex", script, "-map", "[v]", "-map", "[a]",
      "-c:v", "h264_videotoolbox", "-b:v", String(Math.max(4e6, Math.min(bitrate, 20e6))), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", join(dir, "final.mp4")],
      total, (p) => step("Монтаж", p));
    update(id, { status: "done", message: "", progress: 1, renderedAt: Date.now() });
  } catch (e) {
    update(id, { status: "error", message: String(e.message || e) });
  }
}

// HTTP helpers.
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
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
  if (download) headers["Content-Disposition"] = `attachment; filename="${{ ".jpg": "cover.jpg", ".zip": "Pro-Studio.zip" }[extname(file)] ?? "video.mp4"}"; filename*=UTF-8''${encodeURIComponent(download)}`;
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
    if (path === "/style.css") return sendFile(req, res, join(PUBLIC, "style.css"));
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
    const appZip = join(here, "app/dist/Pro-Studio.zip");
    if (path === "/api/info") return json(res, 200, { local: LOCAL, app: !LOCAL && existsSync(appZip) });
    if (path === "/download/Pro-Studio.zip" && !LOCAL) return sendFile(req, res, appZip, "Pro-Studio.zip");
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
      if (action === "form" && req.method === "PUT") return json(res, 200, update(id, { form: { ...load(id).form, ...JSON.parse(String(await readBody(req))) } }));
      // Chunked upload: PUT …/upload?name=video|guest|guest2|guest3&offset=N appends a chunk; a repeated chunk is ignored.
      if (action === "upload" && req.method === "PUT") {
        const name = url.searchParams.get("name");
        if (!["video", "guest", "guest2", "guest3"].includes(name)) return json(res, 400, { error: "bad name" });
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
      if (action === "prepare" && req.method === "POST") {
        update(id, { status: "preparing", message: "", progress: 0 });
        prepare(id);
        return json(res, 200, { ok: true });
      }
      if (action === "cuts" && req.method === "PUT") return json(res, 200, update(id, { cuts: JSON.parse(String(await readBody(req))) }));
      if (action === "render" && req.method === "POST") {
        if (load(id).status === "rendering") return json(res, 409, { error: "already rendering" });
        update(id, { status: "rendering", message: "", progress: 0 });
        render(id);
        return json(res, 200, { ok: true });
      }
    }
    const f = /^\/files\/([a-z0-9-]+)\/(proxy\.mp4|peaks\.json|cover\.jpg|final\.mp4|intro\.mp4|guest)$/.exec(path);
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
