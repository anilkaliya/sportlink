# Lightweight scheduled SQLite -> S3 backup container.
FROM alpine:3.20

# sqlite  -> consistent ".backup" snapshots (WAL-safe)
# aws-cli -> upload to S3
# tzdata  -> honour TZ for the cron schedule
RUN apk add --no-cache sqlite aws-cli tzdata

COPY backup.sh   /usr/local/bin/backup.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
