// Sets custom thumbnails on the channel's videos through the YouTube Data API.
//
//   node scripts/youtube/set-thumbnails.mjs            upload every cover in thumbnails.json
//   node scripts/youtube/set-thumbnails.mjs --dry-run  only check the files and the sign-in
//
// Sign-in: see auth.mjs. thumbnails.set costs 50 quota units out of 10,000 a day, so about 200 covers a day.
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { accessToken, here, showChannel } from "./auth.mjs";

const MAP = join(here, "thumbnails.json");
const dryRun = process.argv.includes("--dry-run");

const covers = JSON.parse(await readFile(MAP, "utf8"));
for (const file of Object.values(covers)) {
  const { size } = await stat(join(here, file));
  if (size > 2 * 1024 * 1024) throw new Error(`${file} is over YouTube's 2 MB limit`);
}

const token = await accessToken();
await showChannel(token);
if (dryRun) process.exit(0);

for (const [videoId, file] of Object.entries(covers)) {
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": file.endsWith(".png") ? "image/png" : "image/jpeg" }, body: await readFile(join(here, file)) },
  );
  const body = await res.json();
  console.log(res.ok ? `ok   ${videoId}  ${file}` : `FAIL ${videoId}  ${body.error?.message}`);
}
