// Makes a cover (1280x720 JPEG) and a 5-second intro (1920x1080 MP4 with piano) for a new video.
// Usage and options: scripts/youtube/README.md.
import { parseArgs } from "node:util";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSpec, renderCover, renderIntro } from "./lib.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../covers");

const { values: o } = parseArgs({
  options: {
    kind: { type: "string" }, // int | tema | teor
    title: { type: "string" },
    label: { type: "string" },
    guest: { type: "string" },
    julia: { type: "string" },
    color: { type: "string", default: "0" },
    name: { type: "string" },
    "no-intro": { type: "boolean", default: false },
  },
});
if (!o.name) {
  console.error('Usage: node scripts/youtube/make/make.mjs --kind int|tema|teor --title "…" --name slug [--label "…"] [--guest photo.jpg] [--julia 6|7|8|10|11] [--color 0-4] [--no-intro]');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const spec = await buildSpec(o, join(OUT, `${o.name}-work`));
console.log("cover:", await renderCover(spec, join(OUT, `${o.name}.jpg`)));
if (!o["no-intro"]) console.log("intro:", await renderIntro(spec, join(OUT, `${o.name}-intro.mp4`)));
