#!/bin/bash
# Daily dump of the A12 database (container adm-db); keeps the last 14 days.
# Cron on the server: 15 3 * * * /opt/webpul/deploy/backup.sh >> /var/log/a12-backup.log 2>&1
set -euo pipefail
DIR=/opt/backups/a12
KEEP_DAYS=14
mkdir -p "$DIR"
chmod 700 "$DIR"
FILE="$DIR/a12-$(date +%Y%m%d-%H%M).sql.gz"

docker exec adm-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$FILE.tmp"
# An empty or tiny dump means pg_dump failed quietly; keep the previous good ones
if [ "$(stat -c %s "$FILE.tmp")" -lt 1000 ]; then
  rm -f "$FILE.tmp"
  echo "$(date -Is) backup FAILED: dump too small"
  exit 1
fi
mv "$FILE.tmp" "$FILE"
find "$DIR" -name 'a12-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) backup ok $FILE $(stat -c %s "$FILE") bytes"
