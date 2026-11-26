#!/usr/bin/env bash
# Supabase database backup for a VPS or a manual run. On Railway, the
# "Database backup" GitHub Actions workflow does this nightly instead.
# Reads /etc/store-backup.env:
#   DATABASE_URL   Supabase "Session pooler" connection string (required)
#   RCLONE_DEST    off-site target such as "r2:store-backups" (recommended)
#   RCLONE_IMAGES  Supabase Storage S3 source such as "supabase:product-images" (optional)
set -euo pipefail
umask 077

set -a
. "${BACKUP_ENV:-/etc/store-backup.env}"
set +a
: "${DATABASE_URL:?DATABASE_URL is required}"

DIR="${BACKUP_DIR:-/var/backups/store}"
KEEP_DAYS="${KEEP_DAYS:-14}"
FILE="$DIR/db-$(date +%F-%H%M).dump"
mkdir -p "$DIR"
trap 'rm -f "$FILE.part"' EXIT

# Write to a temporary name so a failed dump never looks like a good backup.
docker run --rm -e DATABASE_URL postgres:17-alpine \
  sh -c 'pg_dump "$DATABASE_URL" -Fc --no-owner -n public -n auth' > "$FILE.part"
test -s "$FILE.part"
mv "$FILE.part" "$FILE"

if [ -n "${RCLONE_DEST:-}" ]; then
  rclone copy "$FILE" "$RCLONE_DEST/db"
  if [ -n "${RCLONE_IMAGES:-}" ]; then
    # copy, not sync: images deleted by mistake stay in the backup.
    rclone copy "$RCLONE_IMAGES" "$RCLONE_DEST/images"
  fi
fi

find "$DIR" -name 'db-*.dump' -mtime "+$KEEP_DAYS" -delete
echo "Backup complete: $FILE"
