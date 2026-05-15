#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PYTHON="$ROOT_DIR/backend/.venv/bin/python"

if [[ ! -x "$BACKEND_PYTHON" ]]; then
  BACKEND_PYTHON="python3"
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting backend..."
(
  cd "$ROOT_DIR/backend"
  "$BACKEND_PYTHON" app.py
) &
BACKEND_PID=$!

echo "Starting frontend..."
(
  cd "$ROOT_DIR/frontend"
  npm run dev
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
