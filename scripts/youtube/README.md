# YouTube scripts

Covers, intros and the banner for the channel «Pro психоаналіз», in the channel style:
condensed uppercase title on the left, people in circles (or Julia on an arch) on the right,
photos with a blurred background (never cut out), five background colours.

| File | What it does |
| --- | --- |
| `studio/` | Website with a password: upload a video, cut pauses and slips on a waveform, get it back with the intro and a cover |
| `make/make.mjs` | Makes a cover (1280×720 JPEG) and a 5-second intro (1920×1080 MP4 with piano) for a new video |
| `set-thumbnails.mjs` | Uploads covers listed in `thumbnails.json` to YouTube |
| `set-banner.mjs` | Replaces the channel banner, keeping the rest of the channel branding |
| `auth.mjs` | Google sign-in shared by the two upload scripts |

Git-ignored (the repo is public): `client_secret.json`, `token.json`, `covers/` (everything generated),
`assets/` (Julia's photos and the piano soundfont).

## One-time setup

1. Tools, all free: Google Chrome, Node, and

   ```bash
   brew install ffmpeg fluid-synth
   ```

2. Julia's photos in `assets/julia/` as `6.jpg`, `7.jpg`, `8.jpg`, `10.jpg`, `11.jpg`, with the background already
   blurred. To add another photo (any name, then pass it as `--julia <name>`):

   ```bash
   swift scripts/youtube/make/blurbg.swift ~/Downloads/new-photo.jpg scripts/youtube/assets/julia/12.jpg
   ```

3. Piano sound for the intro: the GeneralUser GS soundfont (32 MB, free for commercial use). Without it the intro is silent.

   ```bash
   curl -L https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2 -o scripts/youtube/assets/GeneralUser-GS.sf2
   ```

4. For uploads only: `client_secret.json` from Google Cloud project `yarkina-youtube` (OAuth client "Desktop app").
   The first upload opens Google sign-in: choose Yulyayarkina@gmail.com, then "Continue" on the "unverified app" screen.

## Studio (website)

Upload the original video, a title and a guest photo; the studio suggests long pauses as cuts, you adjust them on the
waveform (drag to add a cut, drag the edges, `I`/`O` to mark, `Del` to remove, "preview without cuts" plays the result),
then "Змонтувати" gives the video with the intro in front and the cover. Everything runs on this Mac:
ffmpeg with the M1 hardware encoder, so an hour of video takes a few minutes.

1. Add a password to `.env.local` (any long phrase): `STUDIO_PASSWORD=…`
2. Start it:

   ```bash
   scripts/youtube/studio/start.sh
   ```

   It is at http://localhost:3300. Uploaded and finished videos stay in `scripts/youtube/studio-data/` (git-ignored); delete old
   folders there to free space.

To open it from anywhere at https://studio.yarkina-psy.online, set up the Cloudflare tunnel once (free; the domain is already on
Cloudflare). The first command opens the browser: pick `yarkina-psy.online` and press Authorize.

```bash
cloudflared tunnel login
```

```bash
cloudflared tunnel create yarkina-studio
```

```bash
cloudflared tunnel route dns yarkina-studio studio.yarkina-psy.online
```

After that `start.sh` brings the site online too. It is reachable only while this Mac is on and `start.sh` runs. Another Mac
can run the studio the same way (clone the repo, `npm install`, the tools above, copy `assets/` and the `.env.local` line, and
copy `~/.cloudflared/` for the tunnel), but only one of them at a time: each keeps its videos on its own disk.

## Cover and intro for a new video

Run from the project folder. One video takes about a minute; `--no-intro` makes only the cover in a few seconds.

Interview (guest and Julia in two circles):

```bash
node scripts/youtube/make/make.mjs --kind int --title "Чому психоаналіз?" --label "Інтерв'ю · Ім'я Прізвище" --guest ~/Downloads/guest.jpg --color 2 --name 2026-11-chomu-psykhoanaliz
```

Julia's own topic (Julia on an arch):

```bash
node scripts/youtube/make/make.mjs --kind tema --title "Як проживати горе" --color 4 --name 2026-11-hore
```

Psychoanalytic theory (cream background, Julia in a circle):

```bash
node scripts/youtube/make/make.mjs --kind teor --title "Аналітик як суддя" --label "Теорія психоаналізу · Гл. 2" --name 2026-11-fink-gl2
```

| Option | Meaning |
| --- | --- |
| `--kind` | `int` interview, `tema` Julia's topic, `teor` theory |
| `--title` | Big title; it shrinks by itself to fit. Keep it to 2–5 words |
| `--label` | Small line above the title. Default: `Інтерв'ю`, `Тема · Юлія Яркіна`, `Теорія психоаналізу` |
| `--guest` | Guest photo, required for `int`; repeat it for two or three guests (in cover order, Julia comes last). The guest's own photo is best; a Zoom frame works if cropped to the guest first (Preview → Crop) |
| `--julia` | Which photo of Julia from `assets/julia/`. Default `7` for circles, `11` for the arch |
| `--color` | Background colour 0–4: pink, navy, blue, orange, green. Alternate them between videos. Ignored for `teor` |
| `--name` | File name of the result |
| `--no-intro` | Make only the cover |

The result is in `scripts/youtube/covers/`: `<name>.jpg` (the cover) and `<name>-intro.mp4` (put it at the very start of the
video when editing). Intros only work for new uploads: YouTube does not let you change a published video.

## Uploading the cover

Add a line to `thumbnails.json` with the video id (from the link `youtube.com/watch?v=<id>`) and the file, then upload just that video:

```json
"VIDEO_ID": "covers/2026-11-chomu-psykhoanaliz.jpg"
```

```bash
node scripts/youtube/set-thumbnails.mjs VIDEO_ID
```

The channel name is printed first: it must be «З Юлією Яркіною про психоаналіз». Without ids, every cover in the list is uploaded again.
YouTube allows about 200 cover uploads a day (50 of the 10,000 daily quota units each).

## Banner

```bash
node scripts/youtube/set-banner.mjs scripts/youtube/covers/banner.png
```

PNG or JPEG, 2560×1440. Keep text and faces in the centre 1546×423, the only part shown on phones.
