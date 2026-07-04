import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const cfg = new pulumi.Config();
const instanceType = cfg.get("instanceType") ?? "t3.small";
const backupPrefix = cfg.get("backupPrefix") ?? "sportlink/backups";
const backupExpireDays = cfg.getNumber("backupExpireDays") ?? 30;
const sshCidr = cfg.get("sshCidr") ?? "0.0.0.0/0";
const keyPairName = cfg.get("keyPairName") ?? "";
const backupBucketName = cfg.get("backupBucketName") ?? "";

const tags = { Project: "sportlink", ManagedBy: "pulumi", Stack: pulumi.getStack() };

// ---------------------------------------------------------------------------
// S3 — daily SQLite backups
// ---------------------------------------------------------------------------
const backupBucket = new aws.s3.BucketV2("sportlink-backups", {
  bucket: backupBucketName !== "" ? backupBucketName : undefined,
  tags,
});

// Block all public access — backups are private.
new aws.s3.BucketPublicAccessBlock("sportlink-backups-pab", {
  bucket: backupBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// Encrypt objects at rest (SSE-S3).
new aws.s3.BucketServerSideEncryptionConfigurationV2("sportlink-backups-sse", {
  bucket: backupBucket.id,
  rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: "AES256" } }],
});

// Lifecycle: transition to Infrequent-Access, then expire. Prunes old backups
// so the upload-only cron doesn't accumulate cost forever.
new aws.s3.BucketLifecycleConfigurationV2("sportlink-backups-lifecycle", {
  bucket: backupBucket.id,
  rules: [
    {
      id: `expire-sportlink-backups-${backupExpireDays}d`,
      status: "Enabled",
      filter: { prefix: `${backupPrefix}/` },
      // No STANDARD_IA transition: S3 requires a 30-day minimum age for IA,
      // which equals our expiry — so transitioning would be pointless. Just
      // expire the objects.
      expiration: { days: backupExpireDays },
      // Clean up interrupted multipart uploads.
      abortIncompleteMultipartUpload: { daysAfterInitiation: 7 },
    },
  ],
});

// ---------------------------------------------------------------------------
// IAM — instance role the backup container assumes (no static keys)
// ---------------------------------------------------------------------------
const role = new aws.iam.Role("sportlink-backup-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { Service: "ec2.amazonaws.com" },
        Action: "sts:AssumeRole",
      },
    ],
  }),
  tags,
});

// Least-privilege: write only under the backup prefix of this bucket.
new aws.iam.RolePolicy("sportlink-backup-s3", {
  role: role.id,
  policy: pulumi.jsonStringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "SportlinkBackupWrite",
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:AbortMultipartUpload"],
        Resource: pulumi.interpolate`${backupBucket.arn}/${backupPrefix}/*`,
      },
    ],
  }),
});

// SSM Session Manager — shell into the box without SSH keys or open port 22.
// The SSM agent ships pre-installed on Amazon Linux 2023.
new aws.iam.RolePolicyAttachment("sportlink-ssm", {
  role: role.name,
  policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
});

const instanceProfile = new aws.iam.InstanceProfile("sportlink-backup-profile", {
  role: role.name,
  tags,
});

// ---------------------------------------------------------------------------
// Networking — security group in the default VPC
// ---------------------------------------------------------------------------
const defaultVpc = aws.ec2.getVpcOutput({ default: true });

const sg = new aws.ec2.SecurityGroup("sportlink-sg", {
  vpcId: defaultVpc.id,
  description: "SportLink backend: SSH + HTTP/HTTPS (Caddy)",
  ingress: [
    { description: "SSH", protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: [sshCidr] },
    { description: "HTTP (ACME + redirect)", protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    { description: "HTTPS", protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    { description: "HTTP/3 (QUIC)", protocol: "udp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags,
});

// ---------------------------------------------------------------------------
// EC2 — latest Amazon Linux 2023, Docker pre-installed via user-data
// ---------------------------------------------------------------------------
const ami = aws.ec2.getAmiOutput({
  owners: ["amazon"],
  mostRecent: true,
  filters: [
    { name: "name", values: ["al2023-ami-*-x86_64"] },
    { name: "architecture", values: ["x86_64"] },
    { name: "virtualization-type", values: ["hvm"] },
  ],
});

const userData = `#!/bin/bash
set -euxo pipefail
dnf update -y
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user
# Docker CLI plugins: Compose v2 + Buildx (Compose build requires buildx >= 0.17)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \\
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
curl -SL https://github.com/docker/buildx/releases/download/v0.19.3/buildx-v0.19.3.linux-amd64 \\
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
`;

const server = new aws.ec2.Instance("sportlink-backend", {
  ami: ami.id,
  instanceType: instanceType,
  iamInstanceProfile: instanceProfile.name,
  vpcSecurityGroupIds: [sg.id],
  keyName: keyPairName !== "" ? keyPairName : undefined,
  userData,
  // IMDSv2 required; hop limit 2 so the backup CONTAINER (one extra network
  // hop) can still read the instance role credentials.
  metadataOptions: {
    httpTokens: "required",
    httpEndpoint: "enabled",
    httpPutResponseHopLimit: 2,
  },
  // AL2023's AMI snapshot is 30 GB, so the root volume can't be smaller.
  rootBlockDevice: { volumeSize: 30, volumeType: "gp3", encrypted: true },
  tags: { ...tags, Name: "sportlink-backend" },
});

// Static Elastic IP so the DNS A record survives instance stop/start (the
// auto-assigned public IP changes on stop/start; the EIP does not).
const eip = new aws.ec2.Eip("sportlink-eip", {
  domain: "vpc",
  tags: { ...tags, Name: "sportlink-backend" },
});

new aws.ec2.EipAssociation("sportlink-eip-assoc", {
  instanceId: server.id,
  allocationId: eip.id,
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
export const backupBucketNameOut = backupBucket.bucket;
export const backupBucketArn = backupBucket.arn;
export const instanceRoleArn = role.arn;
export const instanceProfileName = instanceProfile.name;
export const securityGroupId = sg.id;
export const instanceId = server.id;
// Stable address to point your GoDaddy A record at.
export const instancePublicIp = eip.publicIp;
export const instancePublicDns = server.publicDns;

// Handy: the exact values to drop into backend/.env on the host.
export const envHints = pulumi.interpolate`BACKUP_S3_BUCKET=${backupBucket.bucket}
BACKUP_S3_PREFIX=${backupPrefix}
AWS_REGION=${aws.config.region}
# leave AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY blank — instance role is used`;
