# SportLink Infrastructure (Pulumi)

Infrastructure-as-code for the SportLink backend. Provisions everything the
Dockerised backend (`../backend`) needs to run on AWS:

- **EC2** instance (Amazon Linux 2023) with Docker + Compose pre-installed via
  user-data, IMDSv2 with hop limit 2 (so the backup container can read the role).
- **S3 bucket** for daily SQLite backups — private, encrypted, with a lifecycle
  rule (expire after 30d) and multipart cleanup.
- **IAM instance role + profile** granting least-privilege `s3:PutObject` under
  the backup prefix only — no static AWS keys anywhere.
- **Security group** opening 22 (SSH), 80/443 TCP and 443 UDP (HTTP/3) for Caddy.
- **SSM Session Manager** access (via `AmazonSSMManagedInstanceCore` on the role)
  — shell in without SSH keys or an open port 22.

This replaces the manual steps that were documented in `../backend/aws/`.

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/install/)
- AWS credentials in your shell (`aws configure` / `AWS_PROFILE`) with rights to
  create EC2/S3/IAM resources.
- Node 18+.

## State backend

Pulumi state is stored in the existing S3 bucket **`s3://pulumiinfrastate`**
(pinned in `Pulumi.yaml`). Log in to it once:

```bash
pulumi login s3://pulumiinfrastate
```

Because this is a self-managed backend (no Pulumi Cloud key), stacks need their
own secrets provider — use AWS KMS or a passphrase (see stack init below).

## Deploy

### 0. One-time setup on your machine

```bash
# Pulumi CLI (macOS)
brew install pulumi/tap/pulumi

# AWS credentials with rights to create EC2/S3/IAM
aws configure                 # or: export AWS_PROFILE=...
aws sts get-caller-identity   # sanity check
```

The state bucket `pulumiinfrastate` already exists. Install the
[Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
if you want SSM shell access later.

### 1. Point Pulumi at the S3 state backend

```bash
cd infra
pulumi login s3://pulumiinfrastate
```

### 2. Install program dependencies

```bash
npm install
```

### 3. Create the stack (with a secrets provider)

A self-managed backend requires one. Pick either:

```bash
# Option A — passphrase (simplest for MVP)
export PULUMI_CONFIG_PASSPHRASE='choose-a-strong-passphrase'
pulumi stack init dev

# Option B — AWS KMS (create the key first, then)
pulumi stack init dev --secrets-provider="awskms://alias/pulumi-sportlink"
```

> If `Pulumi.dev.yaml` already exists, use `pulumi stack select dev` instead.

### 4. Set / confirm config

Defaults live in `Pulumi.dev.yaml`. Override what you need:

```bash
pulumi config set aws:region ap-south-1
pulumi config set sportlink-infra:sshCidr 203.0.113.4/32   # lock SSH to your IP
pulumi config set sportlink-infra:keyPairName my-ec2-key   # optional; SSM works without it
# pulumi config set sportlink-infra:instanceType t3.small
```

### 5. Preview, then deploy

```bash
pulumi preview     # dry run — review the resources
pulumi up          # type "yes" to create
```

### 6. Grab the outputs

```bash
pulumi stack output                    # all outputs
pulumi stack output instancePublicIp
pulumi stack output envHints           # values for backend/.env
```

### 7. Configure & run the backend on the box

Shell in **without SSH** via SSM:

```bash
aws ssm start-session --target "$(pulumi stack output instanceId)"
```

Then on the instance:

```bash
sudo su - ec2-user
git clone <your-repo> && cd sportlink/backend
cp .env.example .env    # set DOMAIN, ACME_EMAIL, CORS_ORIGIN + paste envHints
docker compose up -d --build
```

> user-data takes ~1–2 min after boot to finish installing Docker. If
> `docker compose` isn't found on first login, wait and retry, or check
> `sudo cat /var/log/cloud-init-output.log`.

### 8. DNS → TLS

Point your `DOMAIN`'s A record at `instancePublicIp`. Once DNS resolves, Caddy
auto-issues the Let's Encrypt cert. Verify:

```bash
curl -I https://<your-domain>/api/health
```

## Stacks

`dev` is the default stack (`Pulumi.dev.yaml`). Create more per environment:

```bash
pulumi stack init prod
pulumi config set sportlink-infra:instanceType t3.medium --stack prod
pulumi up --stack prod
```

## Teardown

```bash
pulumi destroy
```

> The S3 bucket is deleted on `destroy`. If it still contains backups, empty it
> first (`aws s3 rm s3://<bucket> --recursive`) or add `forceDestroy: true` to
> the bucket resource.
