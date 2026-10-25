#!/bin/bash
# Stops the studio when "Pro Studio.app" quits.
PID_FILE="$HOME/Movies/Pro Studio/studio.pid"
[ -f "$PID_FILE" ] && pkill -P "$(cat "$PID_FILE")" 2>/dev/null; kill "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null
rm -f "$PID_FILE"
exit 0
