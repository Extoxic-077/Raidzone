#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "[start.sh] FORCING NODE START ON 8080"
# Run seed only when explicitly requested
if [ "$SEED_DB" = "true" ]; then
  echo "🔄 Seeding database..."
  node scripts/seed.js
fi

exec node server.js
