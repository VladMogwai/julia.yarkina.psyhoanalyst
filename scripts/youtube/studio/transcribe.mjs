// Speech to text with word timings (whisper.cpp), slip detection ("е-е", "м-м"), and subtitles for the edited video.
import { spawn, execFile as execFileCb } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);
const WHISPER = process.env.STUDIO_WHISPER || "whisper-cli";
export const modelPath = (assets) => join(assets, "whisper", "ggml-large-v3-turbo-q5_0.bin");
export const canTranscribe = (assets) => existsSync(modelPath(assets));

const letters = (w) => w.toLowerCase().replace(/[^\p{L}]/gu, "");
// Slips as words in the text: "е-е", "ееее", "ммм", "ем", "хм"… in Ukrainian, Russian and English spelling.
const FILLER = /^(е+|э+|е+м+|э+м+|м+|х+м+|г+м+|у+м+|e+h*|u+h+|u+m+|h+m+)$/;
// Heard on its own, a sound between words also counts as a slip when it is "а…", "ам", "о…" (in a sentence "а" is a word).
const SOUND = /^(а+|а+м+|о+|о+м+|е+|э+|е+м+|э+м+|м+|х+м+|г+м+|у+|у+м+|e+h*|u+h+|u+m+|h+m+|a+h*|o+h*)$/;
export const isFiller = (w) => FILLER.test(letters(w));
// Heard alone, a slip often comes back in English ("uh", "um"): shown the usual way.
const slipLabel = (said) => {
  const w = letters(said.split(/[\s,.…!?-]+/).find(Boolean) || "");
  if (/m|м/.test(w)) return "м-м";
  if (/^(a+h*|а+)$/.test(w)) return "а-а";
  if (/^(o+h*|о+)$/.test(w)) return "о-о";
  return "е-е";
};

/** Runs whisper with DTW timings (they need flash attention off) and returns its tokens: [{ t, text }]. */
function whisper(wav, out, assets, extra, onProgress) {
  return new Promise((resolve, reject) => {
    const args = ["-m", modelPath(assets), "-f", wav, "-l", "auto", "-nfa", "--dtw", "large.v3.turbo", "-ojf", "-of", out, "-pp", ...extra];
    const p = spawn(WHISPER, args);
    let err = "";
    p.stderr.on("data", (d) => {
      err += d;
      const m = /progress =\s*(\d+)%/.exec(String(d));
      if (m) onProgress?.(+m[1] / 100);
    });
    p.on("error", reject);
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(err.slice(-500) || `whisper exited ${code}`));
      const raw = JSON.parse(readFileSync(`${out}.json`, "utf8"));
      rmSync(`${out}.json`, { force: true });
      resolve(raw.transcription.flatMap((s) => s.tokens).filter((t) => !t.text.startsWith("[_") && t.t_dtw >= 0).map((t) => ({ t: t.t_dtw / 100, text: t.text })));
    });
  });
}

/** Transcribes each piece of 16 kHz mono PCM separately; returns their texts. */
async function hearEach(pieces, assets, onProgress) {
  if (!pieces.length) return [];
  const port = 20000 + Math.floor(Math.random() * 20000);
  const server = spawn(WHISPER.replace(/whisper-cli$/, "whisper-server"), ["-m", modelPath(assets), "--host", "127.0.0.1", "--port", String(port)], { stdio: "ignore" });
  try {
    for (let i = 0; i < 300; i++) {
      if (await fetch(`http://127.0.0.1:${port}/`).then(() => true, () => false)) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    const pad = Buffer.alloc(16000); // half a second of silence on each side
    const texts = [];
    for (const [k, piece] of pieces.entries()) {
      const body = Buffer.concat([pad, piece, pad]);
      const form = new FormData();
      form.append("file", new Blob([wavHeader(body.length), body], { type: "audio/wav" }), "piece.wav");
      form.append("response_format", "json");
      form.append("temperature", "0");
      const r = await fetch(`http://127.0.0.1:${port}/inference`, { method: "POST", body: form }).then((x) => x.json(), () => ({}));
      texts.push(String(r.text || "").trim());
      onProgress?.((k + 1) / pieces.length);
    }
    return texts;
  } finally {
    server.kill();
  }
}

/** Tokens into words: a token that starts with a space starts a new word. */
function toWords(tokens) {
  const words = [];
  for (const { t, text } of tokens) {
    if (/^\s/.test(text) || !words.length) words.push({ t0: t, w: text.trim() });
    else words[words.length - 1].w += text;
  }
  return words.filter((x) => x.w);
}

const wavHeader = (bytes) => {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + bytes, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(bytes, 40);
  return h;
};

/**
 * Words with times: [{ t0, t1, w, f }], f marking a slip. Whisper tends to leave "е-е" and "м-м" out of the text, so
 * stretches with sound but no words are collected, heard again together in one pass, and kept only when they are slips.
 * peaks: loudness, 100 values a second.
 */
export async function transcribe(src, dir, assets, peaks, onProgress) {
  const wav = join(dir, "speech.wav");
  await execFile("ffmpeg", ["-loglevel", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav]);
  try {
    const tokens = await whisper(wav, join(dir, "transcript-raw"), assets, ["--prompt", "Ну, е-е, ммм, як би сказати… Еее, тобто, м-м, так."], (p) => onProgress?.(p * 0.9));
    // DTW marks where a word starts; its end is estimated from its length, never past the next word.
    const words = toWords(tokens).map((x, i, all) => {
      const next = all[i + 1]?.t0 ?? x.t0 + 1;
      return { t0: +x.t0.toFixed(2), t1: +Math.min(next, x.t0 + 0.25 + 0.08 * letters(x.w).length).toFixed(2), w: x.w, f: isFiller(x.w) };
    }).filter((x) => x.t1 > x.t0);

    // Loud stretches between words.
    const at = (f) => peaks[f] || 0;
    const speech = words.map((x) => at(Math.round(((x.t0 + x.t1) / 2) * 100))).sort((a, b) => a - b);
    const loud = Math.max(0.04, (speech[Math.floor(speech.length / 2)] || 0.1) * 0.35);
    const candidates = [];
    words.forEach((x, i) => {
      const next = words[i + 1];
      if (!next || next.t0 - x.t1 < 0.3) return;
      let best = null, start = null;
      const end = Math.floor(next.t0 * 100);
      for (let f = Math.ceil(x.t1 * 100); f <= end; f++) {
        if (at(f) > loud && f < end) start ??= f;
        else if (start != null) {
          if (!best || f - start > best[1] - best[0]) best = [start, f];
          start = null;
        }
      }
      if (best && best[1] - best[0] >= 20 && best[1] - best[0] <= 300) candidates.push({ after: i, t0: Math.max(x.t1, best[0] / 100 - 0.05), t1: Math.min(next.t0, best[1] / 100 + 0.05) });
    });

    // Hear each candidate again on its own (heard together, whisper mixes the pieces up), through whisper-server so the
    // model loads once.
    const pcm = readFileSync(wav).subarray(44);
    const heard = await hearEach(candidates.map((c) => pcm.subarray(Math.floor(c.t0 * 16000) * 2, Math.floor(c.t1 * 16000) * 2)), assets, (p) => onProgress?.(0.9 + p * 0.1));
    const slips = candidates
      .map((c, k) => ({ ...c, said: heard[k].trim() }))
      .filter((c) => {
        const said = c.said.split(/[\s,.…!?-]+/).map(letters).filter(Boolean);
        return said.length > 0 && said.every((w) => SOUND.test(w));
      });
    const out = [];
    words.forEach((x, i) => {
      out.push(x);
      for (const s of slips) if (s.after === i) out.push({ t0: +s.t0.toFixed(2), t1: +s.t1.toFixed(2), w: slipLabel(s.said), f: true });
    });
    return out;
  } finally {
    rmSync(wav, { force: true });
  }
}

/** SRT for the finished video: the intro shifts everything, cut words and slips are dropped, times close the gaps. */
export function subtitles(words, cuts, introSeconds) {
  const sorted = [...cuts].sort((a, b) => a[0] - b[0]);
  const shift = (t) => {
    let removed = 0;
    for (const [a, b] of sorted) {
      if (t >= b) removed += b - a;
      else if (t > a) return null; // inside a cut
    }
    return introSeconds + t - removed;
  };
  const kept = words.filter((x) => !x.f).map((x) => ({ ...x, s0: shift(x.t0), s1: shift(x.t1) })).filter((x) => x.s0 != null && x.s1 != null);
  const lines = [];
  let cur = null;
  for (const x of kept) {
    // A new line after a pause, at 42 characters, or after 3.5 seconds.
    if (!cur || x.s0 - cur.end > 0.8 || cur.text.length + x.w.length > 42 || x.s1 - cur.start > 3.5) {
      cur = { start: x.s0, end: x.s1, text: x.w };
      lines.push(cur);
    } else {
      cur.text += " " + x.w;
      cur.end = x.s1;
    }
  }
  const ts = (s) => {
    const ms = Math.round(s * 1000);
    const p = (n, l = 2) => String(n).padStart(l, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  return lines.map((l, i) => `${i + 1}\n${ts(l.start)} --> ${ts(Math.max(l.end, l.start + 0.6))}\n${l.text}\n`).join("\n");
}
