#!/usr/bin/env bash
# Start Prelegal on macOS: build the image and run the container.
set -euo pipefail

# Resolve the repo root regardless of where the script is called from.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building and starting Prelegal…"
docker compose up --build -d

echo "Waiting for the backend to become healthy…"
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "Prelegal is ready at http://localhost:8000"
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy in time. Check logs with:" >&2
echo "  docker compose logs" >&2
exit 1
