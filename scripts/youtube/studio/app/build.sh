#!/usr/bin/env bash
# Builds "Pro Studio.app": the studio as a Mac app for Apple Silicon that needs nothing installed.
# Output: scripts/youtube/studio/app/dist/Pro-Studio.zip (the website offers it after login).
#
#   scripts/youtube/studio/app/build.sh
#
# Needs on this Mac: Xcode command line tools (swiftc), fluidsynth and the soundfont in scripts/youtube/assets/
# (README). Downloads Node, ffmpeg, ffprobe and headless Chrome into app/vendor/ on the first run.
set -euo pipefail
cd "$(dirname "$0")"
HERE="$PWD"
YT="$(cd ../.. && pwd)"            # scripts/youtube
ROOT="$(cd ../../../.. && pwd)"    # the repo

NODE_V=v22.23.4
CHROME_V=156.0.8078.47
mkdir -p vendor dist
cd vendor
[ -f node.tar.gz ] || curl -fsSL -o node.tar.gz "https://nodejs.org/dist/$NODE_V/node-$NODE_V-darwin-arm64.tar.gz"
curl -fsSL "https://nodejs.org/dist/$NODE_V/SHASUMS256.txt" | grep "darwin-arm64.tar.gz" | awk '{print $1"  node.tar.gz"}' | shasum -a 256 -c -
[ -f ffmpeg.zip ] || curl -fsSL -o ffmpeg.zip "https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release/ffmpeg.zip"
[ -f ffprobe.zip ] || curl -fsSL -o ffprobe.zip "https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release/ffprobe.zip"
[ -f chs.zip ] || curl -fsSL -o chs.zip "https://storage.googleapis.com/chrome-for-testing-public/$CHROME_V/mac-arm64/chrome-headless-shell-mac-arm64.zip"
cd "$HERE"

APP="dist/Pro Studio.app"
rm -rf "$APP" dist/Pro-Studio.zip
# A stay-open AppleScript applet: a normal Dock icon with a working Quit, which stops the studio.
osacompile -s -o "$APP" -e '
on run
  do shell script quoted form of (POSIX path of (path to me) & "Contents/Resources/start.sh")
end run
on reopen
  do shell script quoted form of (POSIX path of (path to me) & "Contents/Resources/start.sh")
end reopen
on quit
  do shell script quoted form of (POSIX path of (path to me) & "Contents/Resources/stop.sh")
  continue quit
end quit'
R="$APP/Contents/Resources"
mkdir -p "$R/bin" "$R/chrome" "$R/assets/julia" "$R/app/scripts/youtube"

tmp="$(mktemp -d)"
tar -xzf vendor/node.tar.gz -C "$tmp"
cp "$tmp/node-$NODE_V-darwin-arm64/bin/node" "$R/bin/"
unzip -qo vendor/ffmpeg.zip -d "$R/bin"
unzip -qo vendor/ffprobe.zip -d "$R/bin"
unzip -qo vendor/chs.zip -d "$tmp"
cp -R "$tmp/chrome-headless-shell-mac-arm64/." "$R/chrome/"
rm -rf "$tmp"
swiftc -O -o "$R/bin/face" "$YT/make/face.swift"
swiftc -O -o "$R/bin/blurbg" "$YT/make/blurbg.swift"

# Code: the generators and the studio, with puppeteer-core next to them.
cp -R "$YT/make" "$R/app/scripts/youtube/make"
mkdir -p "$R/app/scripts/youtube/studio"
cp -R "$YT/studio/server.mjs" "$YT/studio/public" "$R/app/scripts/youtube/studio/"
PUPPETEER_V="$(node -p "require('$ROOT/node_modules/puppeteer-core/package.json').version")"
echo '{"private":true,"type":"module"}' > "$R/app/package.json"
npm install --prefix "$R/app" --omit=dev --no-audit --no-fund --silent "puppeteer-core@$PUPPETEER_V"

# Julia's photos and the intro piano, played once here so the app needs no soundfont.
cp "$YT"/assets/julia/*.jpg "$R/assets/julia/"
node --input-type=module -e "import { writeMidi } from '$YT/make/piano.mjs'; writeMidi('$R/assets/piano.mid')"
fluidsynth -ni -q -r 48000 -g 0.6 -F "$R/assets/piano.wav" "$YT/assets/GeneralUser-GS.sf2" "$R/assets/piano.mid"
rm "$R/assets/piano.mid"

cp start.sh stop.sh "$R/"
chmod +x "$R/start.sh" "$R/stop.sh"

# Icon from the site's icon.
iconset="$(mktemp -d)/AppIcon.iconset"
mkdir -p "$iconset"
for s in 16 32 128 256 512; do
  sips -z $s $s "$ROOT/src/app/apple-icon.png" --out "$iconset/icon_${s}x${s}.png" >/dev/null
  sips -z $((s * 2)) $((s * 2)) "$ROOT/src/app/apple-icon.png" --out "$iconset/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns -o "$R/applet.icns" "$iconset"

P="$APP/Contents/Info.plist"
plutil -replace CFBundleName -string "Pro Studio" "$P"
plutil -replace CFBundleIdentifier -string "online.yarkina-psy.studio" "$P"
plutil -replace LSMinimumSystemVersion -string "14.0" "$P"
plutil -replace LSArchitecturePriority -json '["arm64"]' "$P"

# Ad-hoc signature over everything, so macOS runs the bundled tools (there is no Apple developer certificate).
codesign --force --deep -s - "$APP"
(cd dist && ditto -c -k --keepParent "Pro Studio.app" Pro-Studio.zip)
du -sh "$APP" dist/Pro-Studio.zip
