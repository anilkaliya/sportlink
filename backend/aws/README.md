# AWS setup for SQLite → S3 backups

One-time setup so the `backup` container can push to S3 using the EC2 instance's
IAM role (no static keys) and old backups are pruned automatically.

Set your values once:

```bash
BUCKET=my-sportlink-backups
REGION=ap-south-1
ROLE=sportlink-backup-role
PROFILE=sportlink-backup-profile
```

## 1. IAM instance role (no static keys)

Grants the EC2 box `s3:PutObject` on the backup prefix only. Leave
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` blank in `.env` — the aws-cli in
the container picks up the role credentials automatically via IMDS.

```bash
# Point the policy at your bucket
sed -i "s/REPLACE_WITH_BUCKET_NAME/$BUCKET/" backup-s3-policy.json

# Role the EC2 instance can assume
aws iam create-role \
  --role-name "$ROLE" \
  --assume-role-policy-document file://ec2-trust-policy.json

# Attach the S3 write permission
aws iam put-role-policy \
  --role-name "$ROLE" \
  --policy-name sportlink-backup-s3 \
  --policy-document file://backup-s3-policy.json

# Instance profile wrapper + attach the role
aws iam create-instance-profile --instance-profile-name "$PROFILE"
aws iam add-role-to-instance-profile \
  --instance-profile-name "$PROFILE" --role-name "$ROLE"

# Attach the profile to the running EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-XXXXXXXXXXXXXXXXX \
  --iam-instance-profile Name="$PROFILE"
```

### ⚠️ IMDSv2 hop limit (containers)

A Docker container is one extra network hop from the instance metadata service.
If the instance enforces IMDSv2 with the default hop limit of 1, the container
**cannot** read the role credentials. Raise the hop limit to 2:

```bash
aws ec2 modify-instance-metadata-options \
  --instance-id i-XXXXXXXXXXXXXXXXX \
  --http-tokens required \
  --http-put-response-hop-limit 2
```

Only `AWS_REGION` needs to be set in `.env`; the credential env vars stay empty.

## 2. S3 lifecycle rule (prune old backups)

The cron only uploads — it never deletes. This rule transitions objects to
cheaper Infrequent-Access storage after 7 days and expires them after 30.
Adjust `Days` in `s3-lifecycle.json` to change retention.

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --lifecycle-configuration file://s3-lifecycle.json

# Verify
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET"
```

## 3. Verify the pipeline

```bash
# On the EC2 host, force an immediate backup and watch the logs
BACKUP_RUN_ON_START=true docker compose up -d --build backup
docker compose logs -f backup

# Confirm the object landed
aws s3 ls "s3://$BUCKET/sportlink/backups/"
```
