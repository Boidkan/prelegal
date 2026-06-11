#!/usr/bin/env bash
# Stop Prelegal on macOS and remove the container.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Stopping Prelegal…"
docker compose down
echo "Stopped."
