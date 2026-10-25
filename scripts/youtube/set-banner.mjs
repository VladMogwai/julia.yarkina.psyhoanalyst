// Sets the channel banner through the YouTube Data API.
//
//   node scripts/youtube/set-banner.mjs <image>   PNG or JPEG, 2560x1440 recommended, up to 6 MB
//
// Sign-in: see auth.mjs. Only the banner changes: the rest of the channel's branding (description,
// keywords, …) is read first and written back as it was.
import { readFile } from "node:fs/promises";
import { accessToken, showChannel } from "./auth.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/youtube/set-banner.mjs <image>");
  process.exit(1);
}

const token = await accessToken();
await showChannel(token);
const auth = { Authorization: `Bearer ${token}` };

const upload = await fetch("https://www.googleapis.com/upload/youtube/v3/channelBanners/insert?uploadType=media", {
  method: "POST",
  headers: { ...auth, "Content-Type": file.endsWith(".png") ? "image/png" : "image/jpeg" },
  body: await readFile(file),
}).then((r) => r.json());
if (upload.error) throw new Error("Banner upload failed: " + upload.error.message);

const list = await fetch("https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&mine=true", { headers: auth }).then((r) => r.json());
if (list.error) throw new Error("Reading branding failed: " + list.error.message);
const { id, brandingSettings } = list.items[0];

const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=brandingSettings", {
  method: "PUT",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ id, brandingSettings: { ...brandingSettings, image: { bannerExternalUrl: upload.url } } }),
}).then((r) => r.json());
if (res.error) throw new Error("Setting banner failed: " + res.error.message);
console.log("Banner set:", res.brandingSettings?.image?.bannerExternalUrl ?? upload.url);
