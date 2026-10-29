#!/usr/bin/env bash
# Starts the studio on this Mac and, once the tunnel is set up (README), puts it online at https://studio.yarkina-psy.online.
# The Mac is kept awake while it runs. Stop with Ctrl+C.
set -euo pipefail
cd "$(dirname "$0")/../../.."

# If the server ever stops, it starts again a second later, so the site does not stay down (stopping it also reloads the code).
(while true; do
  caffeinate -is node --env-file=.env.local scripts/youtube/studio/server.mjs || true # a crash must not end the loop (set -e)
  sleep 1
done) &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; pkill -f "node --env-file=.env.local scripts/youtube/studio/server.mjs"' EXIT

if cloudflared tunnel info yarkina-studio >/dev/null 2>&1; then
  cloudflared tunnel run --url http://localhost:3300 yarkina-studio
else
  echo "No Cloudflare tunnel yet: the studio is only at http://localhost:3300"
  wait $SERVER
fi
