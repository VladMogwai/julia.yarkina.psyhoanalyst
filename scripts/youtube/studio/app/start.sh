#!/bin/bash
# Starts the studio inside "Pro Studio.app" (if it is not running yet) and opens it in the browser.
R="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$R/../.." && pwd)"
PORT=3301
URL="http://localhost:$PORT"
DATA="$HOME/Movies/Pro Studio"

# Run from the Downloads folder macOS uses a hidden read-only copy, where the tools inside cannot start.
if [[ "$APP" == *"/AppTranslocation/"* ]]; then
  osascript -e 'display dialog "Перетягніть Pro Studio у папку «Програми» і відкрийте її звідти." buttons {"Добре"} default button 1 with title "Pro Studio" with icon caution' >/dev/null
  exit 0
fi
# A zip from the internet marks every file inside; the marks would stop ffmpeg and the others from starting.
xattr -dr com.apple.quarantine "$APP" 2>/dev/null

if ! curl -s -o /dev/null "$URL/api/info"; then
  mkdir -p "$DATA"
  export PATH="$R/bin:$PATH" STUDIO_LOCAL=1 STUDIO_PORT=$PORT STUDIO_BIN="$R/bin" STUDIO_ASSETS="$R/assets" \
    STUDIO_CHROME="$R/chrome/chrome-headless-shell" STUDIO_WHISPER="$R/bin/whisper-cli" STUDIO_DATA="$DATA"
  # caffeinate keeps the Mac awake while the studio runs, and ends with it.
  nohup caffeinate -is "$R/bin/node" "$R/app/scripts/youtube/studio/server.mjs" >>"$DATA/studio.log" 2>&1 &
  echo $! >"$DATA/studio.pid"
  for _ in $(seq 1 50); do
    curl -s -o /dev/null "$URL/api/info" && break
    sleep 0.2
  done
fi
open "$URL"
