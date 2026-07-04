#!/bin/sh
# Register the daily cron job and hand control to crond (foreground).
set -eu

CRON_SCHEDULE="${CRON_SCHEDULE:-0 3 * * *}"   # default: 03:00 every day

# cron runs with a stripped environment, so persist the vars the backup script
# needs into a file the cron command sources at run time.
printenv | grep -E '^(DB_PATH|S3_BUCKET|S3_PREFIX|AWS_|TZ)=' \
  | sed 's/^/export /' > /etc/backup.env

mkdir -p /etc/crontabs
printf '%s . /etc/backup.env; /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1\n' \
  "${CRON_SCHEDULE}" > /etc/crontabs/root

# Surface backup output on the container's stdout (docker logs).
touch /var/log/backup.log
tail -F /var/log/backup.log &

echo "[backup] scheduled: '${CRON_SCHEDULE}' (TZ=${TZ:-UTC})"

# Optionally run one backup immediately on boot for verification.
if [ "${RUN_ON_START:-false}" = "true" ]; then
  . /etc/backup.env
  /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1 || true
fi

exec crond -f -l 8
