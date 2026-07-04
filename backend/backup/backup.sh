#!/bin/sh
# Take a consistent snapshot of the SQLite DB and upload it to S3.
# WAL-safe: sqlite3 ".backup" acquires the proper locks and copies committed
# pages, so it never corrupts the live DB the backend is writing to.
set -eu

: "${DB_PATH:?DB_PATH is required}"
: "${S3_BUCKET:?S3_BUCKET is required}"
S3_PREFIX="${S3_PREFIX:-sportlink/backups}"

TS="$(date -u +%Y%m%d-%H%M%S)"
SNAPSHOT="/tmp/sportlink-${TS}.db"

echo "[backup] $(date -u +%FT%TZ) starting snapshot of ${DB_PATH}"
sqlite3 "${DB_PATH}" ".backup '${SNAPSHOT}'"

# Integrity check before shipping — abort on a corrupt snapshot.
if [ "$(sqlite3 "${SNAPSHOT}" 'PRAGMA integrity_check;')" != "ok" ]; then
  echo "[backup] ERROR: integrity check failed, aborting" >&2
  rm -f "${SNAPSHOT}"
  exit 1
fi

gzip -f "${SNAPSHOT}"
KEY="${S3_PREFIX}/sportlink-${TS}.db.gz"

echo "[backup] uploading to s3://${S3_BUCKET}/${KEY}"
aws s3 cp "${SNAPSHOT}.gz" "s3://${S3_BUCKET}/${KEY}" ${AWS_S3_EXTRA_ARGS:-}

rm -f "${SNAPSHOT}.gz"
echo "[backup] $(date -u +%FT%TZ) done"
