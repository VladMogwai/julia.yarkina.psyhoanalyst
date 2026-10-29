#!/usr/bin/env bash
# Builds "Pro Studio.app": the studio as a Mac app for Apple Silicon that needs nothing installed.
# Output: scripts/youtube/studio/app/dist/Pro-Studio.pkg (the website offers it after login).
# An installer rather than a zip: a browser marks every file in a downloaded zip, and macOS then calls an app without an
# Apple certificate "damaged"; files put in place by the installer carry no such mark.
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
rm -rf "$APP" dist/Pro-Studio.zip dist/Pro-Studio.pkg
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
# Speech recognition: whisper.cpp from Homebrew (brew install whisper-cpp) with its libraries and the ggml backends
# (Metal, CPU), the library paths rewritten to point inside the app; ggml finds backends next to the program.
WB="$(dirname "$(readlink -f "$(command -v whisper-cli)")")"
GG="$(brew --prefix ggml)"
mkdir -p "$R/lib" "$R/assets/whisper"
cp "$WB/whisper-cli" "$WB/whisper-server" "$R/bin/"
cp "$WB/../lib/libwhisper.1.dylib" "$GG/lib/libggml.0.dylib" "$GG/lib/libggml-base.0.dylib" "$R/lib/"
cp "$GG"/libexec/*.so "$R/bin/"
cp "$(brew --prefix libomp)/lib/libomp.dylib" "$R/lib/" # ggml asks for it by @rpath
chmod u+w "$R"/bin/* "$R"/lib/*
# Any other Homebrew library they load, recursively.
bundle_deps() {
  for f in "$@"; do
    for dep in $(otool -L "$f" | awk 'NR > 1 { print $1 }' | grep '^/opt/homebrew' || true); do
      b="$(basename "$dep")"
      [ -f "$R/lib/$b" ] && continue
      cp "$(readlink -f "$dep")" "$R/lib/$b"
      chmod u+w "$R/lib/$b"
      bundle_deps "$R/lib/$b"
    done
  done
}
bundle_deps "$R/bin/whisper-cli" "$R/bin/whisper-server" "$R"/lib/*.dylib "$R"/bin/*.so
for f in "$R/bin/whisper-cli" "$R/bin/whisper-server" "$R"/lib/*.dylib "$R"/bin/*.so; do
  for dep in $(otool -L "$f" | awk 'NR > 1 { print $1 }' | grep -E '^/opt/homebrew|^@rpath'); do
    install_name_tool -change "$dep" "@rpath/$(basename "$dep")" "$f" 2>/dev/null || true
  done
done
# (an rpath that is already there makes install_name_tool fail; that is fine)
for f in "$R"/lib/*.dylib; do install_name_tool -id "@rpath/$(basename "$f")" "$f" 2>/dev/null; install_name_tool -add_rpath @loader_path "$f" 2>/dev/null || true; done
for f in "$R"/bin/*.so; do install_name_tool -add_rpath @loader_path/../lib "$f" 2>/dev/null || true; done
# Rewriting paths breaks their signatures, and macOS kills unsigned code: sign each one again (--deep skips Resources).
for f in "$R/bin/whisper-cli" "$R/bin/whisper-server" "$R"/lib/*.dylib "$R"/bin/*.so; do codesign --force -s - "$f"; done
cp "$YT/assets/whisper/ggml-large-v3-turbo-q5_0.bin" "$R/assets/whisper/"

swiftc -O -o "$R/bin/face" "$YT/make/face.swift"
swiftc -O -o "$R/bin/blurbg" "$YT/make/blurbg.swift"

# Code: the generators and the studio, with puppeteer-core next to them.
cp -R "$YT/make" "$R/app/scripts/youtube/make"
mkdir -p "$R/app/scripts/youtube/studio"
cp -R "$YT/studio/server.mjs" "$YT/studio/transcribe.mjs" "$YT/studio/public" "$R/app/scripts/youtube/studio/"
PUPPETEER_V="$(node -p "require('$ROOT/node_modules/puppeteer-core/package.json').version")"
echo '{"private":true,"type":"module"}' > "$R/app/package.json"
# Build stamp: the app compares it with the website's newest build to offer an update.
VERSION="$(date +%Y%m%d%H%M)"
echo "$VERSION" > "$R/app/version.txt"
npm install --prefix "$R/app" --omit=dev --no-audit --no-fund --silent "puppeteer-core@$PUPPETEER_V"

# Julia's photos and the intro piano, played once here so the app needs no soundfont.
cp "$YT"/assets/julia/*.jpg "$R/assets/julia/"
# The intro tracks chosen per kind of video (make/intro-music.json), if they are on this Mac.
mkdir -p "$R/assets/music"
node -e 'for (const [k, t] of Object.entries(require(process.argv[1]))) if (t.file) console.log(t.file)' "$YT/make/intro-music.json" | sort -u |
  while read -r f; do [ -f "$YT/assets/music/$f" ] && cp "$YT/assets/music/$f" "$R/assets/music/"; done
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

# Installer into /Applications. Not relocatable: it must not "update" some other copy, e.g. one left in Downloads.
root="$(mktemp -d)"
cp -R "$APP" "$root/"
plist="$(mktemp -d)/component.plist"
pkgbuild --analyze --root "$root" "$plist" >/dev/null
plutil -replace 0.BundleIsRelocatable -bool NO "$plist"
pkgbuild --root "$root" --component-plist "$plist" --install-location /Applications \
  --identifier online.yarkina-psy.studio --version "$VERSION" dist/Pro-Studio.pkg >/dev/null
echo "$VERSION" > dist/version.txt
rm -rf "$root"
du -sh "$APP" dist/Pro-Studio.pkg
