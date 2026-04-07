#!/usr/bin/env bash
# ─── NexVault Backend Launcher ────────────────────────────────────────────────
# Usage:  bash backend/start.sh
# Loads API keys from backend/.env, then starts the Spring Boot jar.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=.env
  source "$ENV_FILE"
  echo "[start.sh] Loaded env from $ENV_FILE"
else
  echo "[start.sh] WARNING: $ENV_FILE not found — using application.yml defaults"
fi

JAR=$(find "$SCRIPT_DIR/target" -maxdepth 1 -name "*.jar" ! -name "*sources*" | head -1)
if [[ -z "$JAR" ]]; then
  echo "[start.sh] No jar found in target/. Run: cd backend && mvn package -DskipTests"
  exit 1
fi

echo "[start.sh] Starting: $JAR"
exec java -jar "$JAR"
