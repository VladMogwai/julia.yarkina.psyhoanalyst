#!/usr/bin/env bash
# Starts the studio on this Mac and, once the tunnel is set up (README), puts it online at https://studio.yarkina-psy.online.
# The Mac is kept awake while it runs. Stop with Ctrl+C.
set -euo pipefail
cd "$(dirname "$0")/../../.."

caffeinate -is node --env-file=.env.local scripts/youtube/studio/server.mjs &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT

if cloudflared tunnel info yarkina-studio >/dev/null 2>&1; then
  cloudflared tunnel run --url http://localhost:3300 yarkina-studio
else
  echo "No Cloudflare tunnel yet: the studio is only at http://localhost:3300"
  wait $SERVER
fi
