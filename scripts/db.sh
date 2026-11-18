#!/usr/bin/env bash
# Database helper. Reads SUPABASE_DB_URL from .env.local (never committed).
#
#   bash scripts/db.sh migrate   # apply supabase/migrations/001..005 in ONE transaction (fresh DB only)
#   bash scripts/db.sh test      # run supabase/tests/game_test.sql (rolls back, leaves no data)
#   bash scripts/db.sh psql      # interactive psql
#
# Needs psql (PostgreSQL client). On Windows: C:\Program Files\PostgreSQL\<ver>\bin.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${SUPABASE_DB_URL:-}" ] && [ -f .env.local ]; then
  SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .env.local | head -1 | cut -d= -f2-)"
fi
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL is not set (put it in .env.local)" >&2
  exit 1
fi

for dir in "/c/Program Files/PostgreSQL"/*/bin; do
  [ -x "$dir/psql.exe" ] && PATH="$dir:$PATH"
done

case "${1:-}" in
  migrate)
    # -1 = single transaction: either every file applies or nothing does.
    psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -1 \
      -f supabase/migrations/001_schema.sql \
      -f supabase/migrations/002_security.sql \
      -f supabase/migrations/003_functions.sql \
      -f supabase/migrations/004_seed.sql \
      -f supabase/migrations/005_sms_hook.sql
    echo "Migrations applied."
    ;;
  test)
    psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/tests/game_test.sql
    ;;
  psql)
    psql "$SUPABASE_DB_URL" -X
    ;;
  *)
    echo "usage: bash scripts/db.sh migrate|test|psql" >&2
    exit 2
    ;;
esac
