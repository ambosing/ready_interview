#!/bin/sh
set -eu

case "${DATABASE_URL:-}" in
  file:/app/data/*)
    mkdir -p /app/data
    ;;
  "")
    echo "DATABASE_URL is required." >&2
    exit 1
    ;;
  *)
    echo "Docker DATABASE_URL must point at the persistent /app/data volume." >&2
    echo "Received: $DATABASE_URL" >&2
    exit 1
    ;;
esac

pnpm exec prisma migrate deploy

exec "$@"
