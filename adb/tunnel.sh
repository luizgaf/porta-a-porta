#!/usr/bin/env bash
set -euo pipefail

# Tunnel backend API (port 3000) to Android device via adb reverse.
# Usage:
#   ./adb/tunnel.sh            # setup reverse tunnels
#   ./adb/tunnel.sh status     # show active tunnels
#   ./adb/tunnel.sh clear      # remove tunnels

case "${1:-setup}" in
  setup)
    echo "Setting up adb reverse tunnel for port 3000..."
    adb reverse tcp:3000 tcp:3000
    echo "Done. Device can reach http://localhost:3000"
    ;;
  status)
    echo "Active adb reverse tunnels:"
    adb reverse --list
    ;;
  clear)
    echo "Clearing adb reverse tunnels..."
    adb reverse --remove-all
    ;;
  *)
    echo "Usage: $0 {setup|status|clear}"
    exit 1
    ;;
esac
