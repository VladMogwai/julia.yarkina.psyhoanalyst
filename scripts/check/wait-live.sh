#!/usr/bin/env bash
# Waits until a pushed change is live: polls a page until it contains the given text (up to 10 minutes).
#   scripts/check/wait-live.sh https://yarkina-psy.online/uk 'apple-touch-icon'
set -euo pipefail
url=$1
text=$2
for attempt in $(seq 1 30); do
  if curl -s "$url" | grep -qF -- "$text"; then
    echo "live after ~$((attempt * 20)) s"
    exit 0
  fi
  sleep 20
done
echo "not live after 10 minutes" >&2
exit 1
