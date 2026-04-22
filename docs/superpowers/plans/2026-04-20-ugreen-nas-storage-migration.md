# Supabase Storage → UGREEN NASync (MinIO) Migration Plan & Runbook

**Goal:** Perform a full cutover migration of all uploaded files from Supabase Storage to a self-hosted MinIO instance on a remotely-exposed UGREEN NASync NAS, with exact step-by-step commands for operators who are new to MinIO and Cloudflare Tunnel.

**Architecture:** MinIO (Docker) on UGREEN NAS → Cloudflare Tunnel (HTTPS + zero inbound ports) → Next.js app refactored behind a `StorageAdapter` interface using `@aws-sdk/client-s3` → app-level signed URLs + MinIO IAM replace Supabase RLS.

**Tech Stack:** MinIO RELEASE.2025-XX-XX, Docker Compose, `cloudflared`, `mc` (MinIO client), `rclone`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Next.js 14.

**Document layout:**
- §Context & Discovery — what/why
- §Runbook — copy-paste steps you execute by hand
- §Code Refactor — file-by-file changes
- §Cutover — timed sequence
- §Rollback & Decommission — safety nets
- §Risk Register + §What I Need From You

---

## Context

The team wants to move file storage from Supabase Storage to an on-prem UGREEN NASync NAS running MinIO. This is a full cutover (no hybrid). Auth and Postgres stay on Supabase. The migration is driven by cost control and data sovereignty.

---

## Discovery Summary (live audit 2026-04-20)

**Supabase project:** `uoffxmrnpukibgcmmgus` · Singapore (ap-southeast-1) · Postgres 17.

**Bucket inventory:**

| Bucket | Public flag | Size Limit | Objects | Size |
|--------|-------------|-----------|---------|------|
| `accomplishment-reports` | true | 20 MB | 103 | 800 MB |
| `progress-photos` | true | 10 MB | 763 | 994 MB |
| `warehouse` | true | 10 MB | 61 | 100 MB |
| `website-projects` | true | 10 MB | 41 | 16 MB |
| **Total** | | | **968** | **~1.91 GB** |

**Critical finding:** All 4 buckets are `public=true` in Supabase. RLS only gates writes and authenticated reads, not public URL reads. The migration recommends hardening `warehouse` and `accomplishment-reports` with signed URLs (user confirmation needed — §WN.C.1).

**Code touchpoints that call `supabase.storage.*`:**

1. `src/services/warehouse/warehouse-storage.service.ts`
2. `src/services/projects/website-projects.ts`
3. `src/services/projects/website-projects-server.ts`
4. `src/services/storage/file-storage.service.ts`
5. `src/services/accomplishment-reports/accomplishment-reports.service.ts` (lines 374, 387)
6. `src/services/progress-photos/progress-photos.service.ts` (lines 212, 249, 262)
7. `src/services/storage/storage-cleanup.service.ts` (lines 262–264)

**RLS policies to port:** 18 policies on `storage.objects` — most are path-based (`foldername[2] = project_id`).

---

# RUNBOOK

Every step has:
- **What**: one sentence of intent
- **Where**: which machine / which service
- **Command**: exact text to run
- **Expected**: what success looks like

If a command fails, **do not improvise** — check the troubleshooting note at the bottom of each part.

---

## Part A — NAS & MinIO Setup

**Prerequisite:** UGREEN NASync device is powered on, drives installed, RAID built (RAID 5 recommended for ≥4 bays), UGOS Pro updated to latest, SSH enabled.

### A.1 Enable SSH on the NAS

- [ ] **A.1.1** — Log in to UGOS Pro web UI (find.ugnas.com or LAN IP).
- [ ] **A.1.2** — Control Panel → Terminal & SNMP → enable SSH on port 22.
- [ ] **A.1.3** — Verify from your workstation:
  ```bash
  ssh admin@<NAS_LAN_IP>
  ```
  Expected: shell prompt as `admin`.

### A.2 Install Docker on the NAS

UGOS Pro ships Docker as an app. If not installed:

- [ ] **A.2.1** — App Center → search "Docker" → install.
- [ ] **A.2.2** — Confirm from SSH:
  ```bash
  docker --version
  docker compose version
  ```
  Expected: Docker ≥ 24.x, Compose ≥ v2.

### A.3 Create the MinIO data volume

- [ ] **A.3.1** — On the NAS (UGOS Pro file manager), create folder structure:
  ```
  /volume1/docker/minio/data
  /volume1/docker/minio/config
  ```
  (Adjust `/volume1/` to match your actual RAID volume name.)

- [ ] **A.3.2** — Verify via SSH:
  ```bash
  ls -la /volume1/docker/minio
  ```
  Expected: both folders exist.

### A.4 Write the MinIO docker-compose.yml

- [ ] **A.4.1** — Create `/volume1/docker/minio/docker-compose.yml`:

```yaml
version: "3.8"

services:
  minio:
    image: quay.io/minio/minio:RELEASE.2025-02-28T00-00-00Z
    container_name: arsd-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_BROWSER_REDIRECT_URL: https://console.arsd-nas.example.com
      MINIO_SERVER_URL: https://s3.arsd-nas.example.com
    command: server /data --console-address ":9001"
    volumes:
      - /volume1/docker/minio/data:/data
      - /volume1/docker/minio/config:/root/.minio
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
```

> **Why bind to 127.0.0.1:** Never expose MinIO directly on the LAN or public IP. Cloudflare Tunnel (Part B) is the only ingress.
> **Replace** `arsd-nas.example.com` with your actual domain everywhere it appears.

- [ ] **A.4.2** — Create `/volume1/docker/minio/.env`:

```bash
# Strong random values — generate with: openssl rand -base64 32
MINIO_ROOT_USER=<30-char random string>
MINIO_ROOT_PASSWORD=<40-char random string>
```

Generate locally:
```bash
openssl rand -base64 24   # use for MINIO_ROOT_USER
openssl rand -base64 32   # use for MINIO_ROOT_PASSWORD
```

- [ ] **A.4.3** — Lock down the env file:
  ```bash
  chmod 600 /volume1/docker/minio/.env
  ```

### A.5 Launch MinIO

- [ ] **A.5.1** — Start the container:
  ```bash
  cd /volume1/docker/minio
  docker compose up -d
  ```
  Expected: `Container arsd-minio Started`.

- [ ] **A.5.2** — Check health:
  ```bash
  docker ps | grep arsd-minio
  docker logs arsd-minio --tail 20
  ```
  Expected: `API: http://...:9000` and `WebUI: http://...:9001` lines.

- [ ] **A.5.3** — Local connectivity smoke test:
  ```bash
  curl -sSf http://127.0.0.1:9000/minio/health/live
  ```
  Expected: HTTP 200 empty body.

**Troubleshooting A:**
- Container restarts in a loop → `docker logs arsd-minio` usually shows permission error on `/data` — fix ownership: `chown -R 1000:1000 /volume1/docker/minio`.
- `mc ready` healthcheck fails → the image tag may not include `mc`. Replace healthcheck with `curl -f http://localhost:9000/minio/health/live`.

---

## Part B — Cloudflare Tunnel Setup

**Why Cloudflare Tunnel:** Zero inbound ports, automatic TLS, Cloudflare Access for the admin console, no static IP required.

**Prerequisite:** You own a domain managed in Cloudflare (or can move one there — takes 10 minutes).

### B.1 Create Cloudflare account + add your domain

- [ ] **B.1.1** — Sign up / log in at https://dash.cloudflare.com.
- [ ] **B.1.2** — Add your domain (free plan is fine). Update your registrar's nameservers to Cloudflare's. Wait for "Active".

### B.2 Create the tunnel in Cloudflare Zero Trust

- [ ] **B.2.1** — Cloudflare dashboard → Zero Trust → Networks → Tunnels → Create a tunnel.
- [ ] **B.2.2** — Connector: `cloudflared`. Tunnel name: `arsd-nas`.
- [ ] **B.2.3** — Cloudflare displays an install command for `cloudflared`. **Copy the full token**.

### B.3 Install cloudflared on the NAS

- [ ] **B.3.1** — Create `/volume1/docker/cloudflared/docker-compose.yml`:

```yaml
version: "3.8"

services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: arsd-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
    network_mode: host
```

- [ ] **B.3.2** — Create `/volume1/docker/cloudflared/.env`:
```bash
CF_TUNNEL_TOKEN=<paste token from step B.2.3>
```
```bash
chmod 600 /volume1/docker/cloudflared/.env
```

- [ ] **B.3.3** — Start it:
```bash
cd /volume1/docker/cloudflared
docker compose up -d
docker logs arsd-cloudflared --tail 20
```
Expected: lines containing `Registered tunnel connection`.

- [ ] **B.3.4** — Back in Cloudflare dashboard, the tunnel should show status **HEALTHY**.

### B.4 Add public hostnames (route → service)

In the tunnel's Public Hostname tab:

- [ ] **B.4.1** — Add Public Hostname #1:
  - Subdomain: `s3`
  - Domain: `arsd-nas.example.com` (your domain)
  - Service: `HTTP` · URL: `localhost:9000`
  - Additional settings → HTTP Host Header: `s3.arsd-nas.example.com`
  - Save.

- [ ] **B.4.2** — Add Public Hostname #2:
  - Subdomain: `console`
  - Service: `HTTP` · URL: `localhost:9001`
  - Additional settings → HTTP Host Header: `console.arsd-nas.example.com`
  - Save.

- [ ] **B.4.3** — Verify from your laptop:
```bash
curl -sSf https://s3.arsd-nas.example.com/minio/health/live
```
Expected: HTTP 200, empty body.

### B.5 Lock down the admin console with Cloudflare Access

- [ ] **B.5.1** — Zero Trust → Access → Applications → Add an application → Self-hosted.
- [ ] **B.5.2** — Application name: `MinIO Console`. Session duration: 8 hours. Application domain: `console.arsd-nas.example.com`.
- [ ] **B.5.3** — Add an Access policy: Allow · Emails · list your superadmin emails. Save.
- [ ] **B.5.4** — Verify: in an incognito window, hit `https://console.arsd-nas.example.com`. You should see a Cloudflare Access login page, not MinIO directly.

### B.6 Rate limit the S3 endpoint (optional but recommended)

- [ ] **B.6.1** — Cloudflare dashboard → Security → WAF → Rate limiting rules → Create.
- [ ] **B.6.2** — Rule: If `hostname eq "s3.arsd-nas.example.com"` → limit to 1000 req/min per IP. Action: Block.

**Troubleshooting B:**
- "1033 argo tunnel error" → `cloudflared` container not reachable. Check `docker logs arsd-cloudflared`.
- Console loads MinIO directly without login → Access policy not enforcing. Verify app domain matches exactly.
- Slow uploads → disable Cloudflare caching on `s3.` subdomain (it's API traffic, not static). Rules → Page Rules → bypass cache.

---

## Part C — MinIO Buckets, Policies, and Access Keys

**Use the `mc` CLI.** Install on your workstation (not the NAS).

### C.1 Install `mc` (MinIO client)

- [ ] **C.1.1** — Install:
  - macOS: `brew install minio/stable/mc`
  - Windows: download `mc.exe` from https://dl.min.io/client/mc/release/windows-amd64/mc.exe, put on PATH
  - Linux: `wget https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && sudo mv mc /usr/local/bin/`
- [ ] **C.1.2** — Verify: `mc --version`.

### C.2 Register your MinIO instance as an alias

- [ ] **C.2.1** — Run:
```bash
mc alias set arsd https://s3.arsd-nas.example.com <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
```
Expected: `Added arsd successfully.`

- [ ] **C.2.2** — Test:
```bash
mc admin info arsd
```
Expected: server info, uptime, drive count.

### C.3 Create the 4 buckets

- [ ] **C.3.1** — Run:
```bash
mc mb arsd/accomplishment-reports
mc mb arsd/progress-photos
mc mb arsd/warehouse
mc mb arsd/website-projects
```
Expected: `Bucket created successfully` × 4.

- [ ] **C.3.2** — List to confirm:
```bash
mc ls arsd
```

### C.4 Set public-read policy on the two truly public buckets

- [ ] **C.4.1** — `progress-photos` (app shows these inline on dashboard — keep public):
```bash
mc anonymous set download arsd/progress-photos
```

- [ ] **C.4.2** — `website-projects` (public-facing project gallery):
```bash
mc anonymous set download arsd/website-projects
```

- [ ] **C.4.3** — Leave `warehouse` and `accomplishment-reports` **private** (default). The app will mint signed URLs.

### C.5 Create scoped IAM policies

Save as local files on your workstation.

**File: `policy-app-rw.json`**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::accomplishment-reports",
        "arn:aws:s3:::accomplishment-reports/*",
        "arn:aws:s3:::progress-photos",
        "arn:aws:s3:::progress-photos/*",
        "arn:aws:s3:::warehouse",
        "arn:aws:s3:::warehouse/*",
        "arn:aws:s3:::website-projects",
        "arn:aws:s3:::website-projects/*"
      ]
    }
  ]
}
```

**File: `policy-app-admin.json`**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": [
        "arn:aws:s3:::accomplishment-reports",
        "arn:aws:s3:::accomplishment-reports/*",
        "arn:aws:s3:::progress-photos",
        "arn:aws:s3:::progress-photos/*",
        "arn:aws:s3:::warehouse",
        "arn:aws:s3:::warehouse/*",
        "arn:aws:s3:::website-projects",
        "arn:aws:s3:::website-projects/*"
      ]
    }
  ]
}
```

**File: `policy-migration.json`** (temporary — delete after migration)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::accomplishment-reports",
        "arn:aws:s3:::accomplishment-reports/*",
        "arn:aws:s3:::progress-photos",
        "arn:aws:s3:::progress-photos/*",
        "arn:aws:s3:::warehouse",
        "arn:aws:s3:::warehouse/*",
        "arn:aws:s3:::website-projects",
        "arn:aws:s3:::website-projects/*"
      ]
    }
  ]
}
```

- [ ] **C.5.1** — Register policies:
```bash
mc admin policy create arsd arsd-app-rw policy-app-rw.json
mc admin policy create arsd arsd-app-admin policy-app-admin.json
mc admin policy create arsd arsd-migration policy-migration.json
```

### C.6 Create service accounts (access keys) and attach policies

- [ ] **C.6.1** — App R/W key:
```bash
mc admin user svcacct add arsd <MINIO_ROOT_USER> \
  --name "arsd-app-rw" \
  --description "App runtime read/write"
```
> Save the printed `Access Key` and `Secret Key` — you cannot retrieve the secret later.

- [ ] **C.6.2** — Attach policy:
```bash
mc admin policy attach arsd arsd-app-rw --user <access-key-from-C.6.1>
```

- [ ] **C.6.3** — Repeat for admin:
```bash
mc admin user svcacct add arsd <MINIO_ROOT_USER> --name "arsd-app-admin"
mc admin policy attach arsd arsd-app-admin --user <admin-access-key>
```

- [ ] **C.6.4** — Repeat for migration (temporary):
```bash
mc admin user svcacct add arsd <MINIO_ROOT_USER> --name "arsd-migration"
mc admin policy attach arsd arsd-migration --user <migration-access-key>
```

- [ ] **C.6.5** — Save all three access-key/secret pairs to your secrets manager (1Password, Vault, etc.).

**Troubleshooting C:**
- `mc` connection refused → check Cloudflare Tunnel is up and hostname resolves (`dig s3.arsd-nas.example.com`).
- `AccessDenied` on bucket create → the root user should work by default; re-check your alias creds.

---

## Part D — Set Up Off-Site Backup (CRITICAL)

**Do this before migration, not after.** Without off-site backup the NAS is a single point of failure.

### D.1 Create a Backblaze B2 bucket

- [ ] **D.1.1** — Sign up at https://www.backblaze.com/b2.
- [ ] **D.1.2** — Create bucket `arsd-nas-backup` · Private.
- [ ] **D.1.3** — App Keys → Add application key · Scoped to this bucket · Read+Write. Save the keyID and applicationKey.

### D.2 Configure `mc` for Backblaze

- [ ] **D.2.1** — On the NAS (or your workstation):
```bash
mc alias set b2 https://s3.us-west-002.backblazeb2.com <keyID> <applicationKey>
```
(Match your B2 region — shown in B2 bucket settings.)

- [ ] **D.2.2** — Test:
```bash
mc ls b2/arsd-nas-backup
```
Expected: empty listing (no error).

### D.3 Schedule nightly mirror

- [ ] **D.3.1** — On the NAS, create `/volume1/docker/minio/nightly-backup.sh`:
```bash
#!/bin/bash
set -euo pipefail
for bucket in accomplishment-reports progress-photos warehouse website-projects; do
  mc mirror --overwrite --remove arsd/$bucket b2/arsd-nas-backup/$bucket
done
```
```bash
chmod +x /volume1/docker/minio/nightly-backup.sh
```

- [ ] **D.3.2** — Add to crontab (UGOS Pro → Task Scheduler, or via SSH `crontab -e`):
```
30 2 * * * /volume1/docker/minio/nightly-backup.sh >> /volume1/docker/minio/backup.log 2>&1
```

---

## Part E — Data Migration with rclone

### E.1 Install rclone on the NAS

- [ ] **E.1.1** — Via SSH:
```bash
curl https://rclone.org/install.sh | sudo bash
rclone version
```

### E.2 Configure the Supabase remote (source)

Supabase Storage exposes an S3-compatible endpoint.

- [ ] **E.2.1** — Get Supabase S3 credentials: Supabase dashboard → Project Settings → Storage → S3 Connection → **Enable**. Copy Endpoint, Access Key, Secret Key, Region.

- [ ] **E.2.2** — Add rclone remote:
```bash
rclone config create supabase s3 \
  provider=Other \
  endpoint=https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/s3 \
  access_key_id=<from-E.2.1> \
  secret_access_key=<from-E.2.1> \
  region=ap-southeast-1
```

- [ ] **E.2.3** — Test:
```bash
rclone lsd supabase:
```
Expected: 4 buckets listed.

### E.3 Configure the MinIO remote (destination)

- [ ] **E.3.1**:
```bash
rclone config create minio s3 \
  provider=Minio \
  endpoint=https://s3.arsd-nas.example.com \
  access_key_id=<arsd-migration-access-key> \
  secret_access_key=<arsd-migration-secret-key> \
  region=us-east-1 \
  force_path_style=true
```

- [ ] **E.3.2** — Test:
```bash
rclone lsd minio:
```
Expected: 4 empty buckets.

### E.4 Dry-run copy

- [ ] **E.4.1** — Per bucket:
```bash
rclone copy supabase:accomplishment-reports minio:accomplishment-reports --dry-run --progress
rclone copy supabase:progress-photos        minio:progress-photos        --dry-run --progress
rclone copy supabase:warehouse              minio:warehouse              --dry-run --progress
rclone copy supabase:website-projects       minio:website-projects       --dry-run --progress
```
Expected totals match Discovery: 968 files / 1.91 GB.

### E.5 Real copy (first pass — before cutover)

- [ ] **E.5.1**:
```bash
for b in accomplishment-reports progress-photos warehouse website-projects; do
  rclone copy supabase:$b minio:$b --checksum --progress --transfers=8 --checkers=16 \
    --log-file=/tmp/migrate-$b.log --log-level=INFO
done
```
Expected wall clock ≤ 10 minutes on a 100 Mbps uplink.

### E.6 Verify object counts

- [ ] **E.6.1**:
```bash
for b in accomplishment-reports progress-photos warehouse website-projects; do
  src=$(rclone size supabase:$b --json | jq .count)
  dst=$(rclone size minio:$b --json | jq .count)
  echo "$b: source=$src destination=$dst"
done
```
All four lines must show `source=destination`. If not, re-run E.5 for that bucket.

---

## Part F — Code Refactor

**Branch:** `feat/migrate-storage-to-minio` off `main`.

### F.1 Add dependencies

- [ ] **F.1.1**:
```bash
npm install @aws-sdk/client-s3@3.632.0 @aws-sdk/s3-request-presigner@3.632.0
```
(Pin exact versions — do not use `latest`.)

- [ ] **F.1.2** — In the same commit, pin fragile deps:
```bash
npm install @supabase/supabase-js@2.45.4 @supabase/ssr@0.5.1
```

### F.2 Create the storage adapter interface

- [ ] **F.2.1** — Create `src/services/storage/storage-adapter.ts`:

```typescript
export class StorageNotFoundError extends Error {}
export class StorageForbiddenError extends Error {}
export class StorageTransientError extends Error {}

export interface StorageAdapter {
  putObject(bucket: string, key: string, body: Buffer | Blob, contentType?: string): Promise<{ url: string }>;
  getObject(bucket: string, key: string): Promise<ReadableStream>;
  getPublicUrl(bucket: string, key: string): string;
  getSignedUrl(bucket: string, key: string, operation: 'get' | 'put', ttlSeconds: number): Promise<string>;
  deleteObject(bucket: string, key: string): Promise<void>;
  deleteObjects(bucket: string, keys: string[]): Promise<{ deleted: string[]; errors: Array<{ key: string; error: string }> }>;
  listObjects(bucket: string, prefix?: string, continuationToken?: string): Promise<{ objects: Array<{ key: string; size: number; lastModified: Date }>; nextToken?: string }>;
  headObject(bucket: string, key: string): Promise<{ size: number; contentType: string; lastModified: Date } | null>;
}
```

### F.3 Create the S3 adapter

- [ ] **F.3.1** — Create `src/services/storage/s3-adapter.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, HeadObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageAdapter, StorageNotFoundError } from './storage-adapter';

export class S3StorageAdapter implements StorageAdapter {
  constructor(private client: S3Client, private publicBaseUrl: string) {}

  async putObject(bucket: string, key: string, body: Buffer | Blob, contentType?: string) {
    const buf = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body;
    await this.client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: contentType }));
    return { url: `${this.publicBaseUrl}/${bucket}/${key}` };
  }

  async getObject(bucket: string, key: string) {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return res.Body as ReadableStream;
    } catch (e: any) {
      if (e instanceof NoSuchKey) throw new StorageNotFoundError(key);
      throw e;
    }
  }

  getPublicUrl(bucket: string, key: string) {
    return `${this.publicBaseUrl}/${bucket}/${key}`;
  }

  async getSignedUrl(bucket: string, key: string, operation: 'get' | 'put', ttlSeconds: number) {
    const cmd = operation === 'get'
      ? new GetObjectCommand({ Bucket: bucket, Key: key })
      : new PutObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: ttlSeconds });
  }

  async deleteObject(bucket: string, key: string) {
    await this.client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: [{ Key: key }] } }));
  }

  async deleteObjects(bucket: string, keys: string[]) {
    if (!keys.length) return { deleted: [], errors: [] };
    const res = await this.client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map(Key => ({ Key })) },
    }));
    return {
      deleted: (res.Deleted ?? []).map(d => d.Key!),
      errors: (res.Errors ?? []).map(e => ({ key: e.Key!, error: e.Message ?? 'unknown' })),
    };
  }

  async listObjects(bucket: string, prefix?: string, continuationToken?: string) {
    const res = await this.client.send(new ListObjectsV2Command({
      Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken, MaxKeys: 1000,
    }));
    return {
      objects: (res.Contents ?? []).map(o => ({ key: o.Key!, size: o.Size ?? 0, lastModified: o.LastModified ?? new Date(0) })),
      nextToken: res.NextContinuationToken,
    };
  }

  async headObject(bucket: string, key: string) {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { size: res.ContentLength ?? 0, contentType: res.ContentType ?? 'application/octet-stream', lastModified: res.LastModified ?? new Date(0) };
    } catch (e: any) {
      if (e.name === 'NotFound') return null;
      throw e;
    }
  }
}
```

### F.4 Create the storage factory

- [ ] **F.4.1** — Create `src/services/storage/storage-factory.ts`:

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import { StorageAdapter } from './storage-adapter';
import { S3StorageAdapter } from './s3-adapter';

let appAdapter: StorageAdapter | null = null;
let adminAdapter: StorageAdapter | null = null;

function buildClient(keyId: string, secret: string): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION ?? 'us-east-1',
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
    forcePathStyle: true,
  });
}

export function getStorageAdapter(mode: 'app' | 'admin' = 'app'): StorageAdapter {
  const publicUrl = process.env.S3_PUBLIC_BASE_URL!;
  if (mode === 'admin') {
    if (!adminAdapter) {
      adminAdapter = new S3StorageAdapter(
        buildClient(process.env.S3_ADMIN_ACCESS_KEY_ID!, process.env.S3_ADMIN_SECRET_ACCESS_KEY!),
        publicUrl,
      );
    }
    return adminAdapter;
  }
  if (!appAdapter) {
    appAdapter = new S3StorageAdapter(
      buildClient(process.env.S3_ACCESS_KEY_ID!, process.env.S3_SECRET_ACCESS_KEY!),
      publicUrl,
    );
  }
  return appAdapter;
}
```

### F.5 Create the access-control module

- [ ] **F.5.1** — Create `src/services/storage/access-control.ts` — one function per RLS policy from Discovery. Template:

```typescript
import { User } from '@/types/auth';
import { createApiSupabaseClient } from '@/lib/supabase';

export async function canReadWarehouseObject(user: User, key: string): Promise<boolean> {
  if (user.role === 'superadmin') return true;
  if (['project_inspector', 'project_manager'].includes(user.role)) return true;
  const parts = key.split('/'); // e.g. "dr/<project_id>/..."
  const projectId = parts[1];
  if (!projectId) return false;
  const supabase = createApiSupabaseClient();
  const { data } = await supabase.from('projects').select('id').eq('id', projectId)
    .or(`project_manager_id.eq.${user.id},project_inspector_id.eq.${user.id},warehouseman_id.eq.${user.id}`)
    .maybeSingle();
  return !!data;
}

// ... repeat for every row in the 18-policy RLS table
```

Write one test per policy (allow + deny) before shipping.

### F.6 Swap Supabase calls in existing services

For each of the 7 touchpoint files, make the minimal swap. Example (`src/services/warehouse/warehouse-storage.service.ts`):

- [ ] **F.6.1** — Old:
```typescript
const { data, error } = await supabase.storage.from('warehouse').upload(path, file);
```

- [ ] **F.6.2** — New:
```typescript
import { getStorageAdapter } from '@/services/storage/storage-factory';
const adapter = getStorageAdapter('app');
const { url } = await adapter.putObject('warehouse', path, file, file.type);
```

Apply the same pattern to:
- `src/services/projects/website-projects.ts`
- `src/services/projects/website-projects-server.ts`
- `src/services/storage/file-storage.service.ts`
- `src/services/accomplishment-reports/accomplishment-reports.service.ts`
- `src/services/progress-photos/progress-photos.service.ts`
- `src/services/storage/storage-cleanup.service.ts` — use `getStorageAdapter('admin')` to match prior service-role-key behavior

### F.7 Update env example + config

- [ ] **F.7.1** — `.env.local.example`:
```
S3_ENDPOINT=https://s3.arsd-nas.example.com
S3_PUBLIC_BASE_URL=https://s3.arsd-nas.example.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ADMIN_ACCESS_KEY_ID=
S3_ADMIN_SECRET_ACCESS_KEY=
```

- [ ] **F.7.2** — `src/config/storage.config.ts` — update `BASE_URL` to read from `S3_PUBLIC_BASE_URL`.

### F.8 Feature-flag the cutover

- [ ] **F.8.1** — Add to env: `STORAGE_BACKEND=supabase` (default) vs `STORAGE_BACKEND=minio`.
- [ ] **F.8.2** — In `storage-factory.ts`, keep a legacy Supabase adapter behind the flag so you can flip per environment.

### F.9 Tests

- [ ] **F.9.1** — Unit: mock the adapter, verify each service method calls expected adapter methods.
- [ ] **F.9.2** — Integration: spin up MinIO in Docker during CI, run adapter against it.
- [ ] **F.9.3** — Access-control: one test per RLS policy row.
- [ ] **F.9.4** — Smoke: one end-to-end upload+read test per bucket.

### F.10 Merge + deploy to staging

- [ ] **F.10.1** — Open PR, green CI, review, merge to `main`.
- [ ] **F.10.2** — Vercel staging env: set all `S3_*` vars and `STORAGE_BACKEND=minio` pointing at a **staging** MinIO bucket (separate from prod).
- [ ] **F.10.3** — Run §G validation on staging.

---

## Part G — Validation Smoke Tests

Run on staging first. Repeat on production at T+0:20 of cutover.

### G.1 Upload paths

- [ ] **G.1.1** — Upload accomplishment report XLSX via `/dashboard/uploads` → verify file in `arsd/accomplishment-reports`:
```bash
mc ls arsd/accomplishment-reports --recent
```
- [ ] **G.1.2** — Upload progress photo → `mc ls arsd/progress-photos --recent`.
- [ ] **G.1.3** — Upload warehouse DR photo → `mc ls arsd/warehouse/dr/`.
- [ ] **G.1.4** — Upload warehouse release attachment → `mc ls arsd/warehouse/releases/`.
- [ ] **G.1.5** — Upload website project photo → `mc ls arsd/website-projects`.

### G.2 Read paths

- [ ] **G.2.1** — Load `/projects` → website project photos render.
- [ ] **G.2.2** — Load dashboard → progress photos render inline.
- [ ] **G.2.3** — Download accomplishment report from upload list → opens (signed URL, HTTP 200).
- [ ] **G.2.4** — View warehouse DR photo → opens (signed URL).
- [ ] **G.2.5** — Unsigned anonymous curl should fail:
```bash
curl -I https://s3.arsd-nas.example.com/warehouse/dr/<uuid>/photo.jpg
```
Expected: HTTP 403.

### G.3 Cleanup

- [ ] **G.3.1** — As superadmin POST to `/api/storage/cleanup` → N files deleted.
- [ ] **G.3.2** — Trigger `/api/cron/cleanup-storage` with cron token → same.

### G.4 Baselines (record for regression)

- [ ] **G.4.1** — Median upload time for a 2 MB photo: record.
- [ ] **G.4.2** — TTFB for public photo: record.
- [ ] **G.4.3** — Signed URL generation latency: record.

---

## Part H — Cutover (T-day)

Assumed freeze window: 30 minutes. Communicated as "up to 1 hour".

### H.1 T-24h

- [ ] **H.1.1** — Email + in-app banner announcing freeze.
- [ ] **H.1.2** — Confirm Cloudflare Tunnel healthy, MinIO healthy, B2 backup ran last night.
- [ ] **H.1.3** — Pre-fetch: re-run §E.5 to minimize the final incremental delta.

### H.2 T-0:00 — Freeze

- [ ] **H.2.1** — Vercel env `MAINTENANCE=true` → redeploy. App shows read-only banner.
- [ ] **H.2.2** — Confirm no more uploads in Supabase by watching `storage.objects` row count stability for 2 minutes.

### H.3 T+0:05 — Final incremental copy

- [ ] **H.3.1**:
```bash
for b in accomplishment-reports progress-photos warehouse website-projects; do
  rclone sync supabase:$b minio:$b --checksum --progress
done
```
Note `sync` (not `copy`) — ensures no stale files.

- [ ] **H.3.2** — Re-run §E.6 verification.

### H.4 T+0:10 — URL rewrite in Postgres

- [ ] **H.4.1** — **Take a DB backup first.** Supabase dashboard → Database → Backups → Manual backup.

- [ ] **H.4.2** — Run (inside a transaction) via Supabase SQL editor:

```sql
BEGIN;

UPDATE accomplishment_reports
SET file_url = REPLACE(file_url, 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/', 'https://s3.arsd-nas.example.com/')
WHERE file_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/%';

UPDATE website_project_photos
SET url = REPLACE(url, 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/', 'https://s3.arsd-nas.example.com/')
WHERE url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/%';

UPDATE progress_photos
SET url = REPLACE(url, 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/', 'https://s3.arsd-nas.example.com/')
WHERE url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/%';

UPDATE delivery_receipts
SET photo_url = REPLACE(photo_url, 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/', 'https://s3.arsd-nas.example.com/')
WHERE photo_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/%';

-- Spot check: there should be 0 remaining old-URL rows across all tables:
SELECT 'accomplishment_reports', COUNT(*) FROM accomplishment_reports WHERE file_url LIKE '%uoffxmrnpukibgcmmgus%'
UNION ALL SELECT 'website_project_photos', COUNT(*) FROM website_project_photos WHERE url LIKE '%uoffxmrnpukibgcmmgus%'
UNION ALL SELECT 'progress_photos', COUNT(*) FROM progress_photos WHERE url LIKE '%uoffxmrnpukibgcmmgus%'
UNION ALL SELECT 'delivery_receipts', COUNT(*) FROM delivery_receipts WHERE photo_url LIKE '%uoffxmrnpukibgcmmgus%';
-- All four counts must be 0. If not, ROLLBACK.

COMMIT;
```

> **Confirm the actual column names** against your schema before running. Add any missing tables.

### H.5 T+0:15 — Flip the flag

- [ ] **H.5.1** — Vercel env: set `STORAGE_BACKEND=minio` and `MAINTENANCE=false` + all `S3_*` vars populated.
- [ ] **H.5.2** — Redeploy.
- [ ] **H.5.3** — Watch deploy logs until live.

### H.6 T+0:20 — Smoke test

- [ ] **H.6.1** — Run §G checklist against production.

### H.7 T+0:30 — Lift freeze

- [ ] **H.7.1** — Remove banner; email users "resumed".
- [ ] **H.7.2** — Monitor error dashboards for 2 hours.

---

## Part I — Rollback (if triggered)

### I.1 Triggers

Any one: upload failure rate > 5%, read error rate > 1%, NAS/tunnel outage > 10 min, data-loss report.

### I.2 Procedure

- [ ] **I.2.1** — Vercel env: `STORAGE_BACKEND=supabase` + `MAINTENANCE=true` → redeploy.
- [ ] **I.2.2** — Reverse SQL from §H.4 (flip REPLACE args). Transactional.
- [ ] **I.2.3** — Backfill any MinIO-only uploads to Supabase:
```bash
for b in accomplishment-reports progress-photos warehouse website-projects; do
  rclone copy minio:$b supabase:$b --checksum --progress
done
```
- [ ] **I.2.4** — `MAINTENANCE=false` → redeploy.

Hard cap debug attempts at 60 minutes before pulling the trigger.

---

## Part J — Decommission

### J.1 T+14 days

- [ ] **J.1.1** — Confirm no rollback needed. Freeze audit.
- [ ] **J.1.2** — Final Supabase → cold-archive dump:
```bash
for b in accomplishment-reports progress-photos warehouse website-projects; do
  rclone copy supabase:$b b2:arsd-nas-backup/pre-cutover-archive/$b --checksum
done
```
- [ ] **J.1.3** — Delete Supabase storage objects (via dashboard or SQL with service role).

### J.2 T+30 days

- [ ] **J.2.1** — Delete the 4 Supabase buckets from dashboard.
- [ ] **J.2.2** — Grep repo: `rg "SUPABASE_SERVICE_ROLE_KEY"` — if unused beyond legacy, remove from env.
- [ ] **J.2.3** — Drop the 18 storage RLS policies — DO NOT drop the `storage` schema itself (Supabase Auth uses it).
- [ ] **J.2.4** — Delete `arsd-migration` MinIO service account: `mc admin user svcacct rm arsd <migration-access-key>`.

---

## Risk Register (Consolidated)

| # | Severity | Risk | Mitigation |
|---|----------|------|------------|
| R1 | **CRITICAL** | NAS/power/internet outage halts prod uploads | UPS + read-only failover banner |
| R2 | **CRITICAL** | NAS uplink bandwidth bottleneck | Measure pre-cutover; set user-facing upload timeout |
| R3 | **CRITICAL** | Access-control policy port miss → unauth access | Unit-test every row of the 18-policy RLS table (allow + deny) |
| R4 | **CRITICAL** | `forcePathStyle` or endpoint misconfig → silent 403 | CI integration test vs real MinIO |
| R5 | **CRITICAL** | Freeze window overruns | Rehearsal on staging with timing |
| R6 | **CRITICAL** | Premature Supabase decommission blocks rollback | 14-day retention gate |
| R7 | **CRITICAL** | No off-site backup → single point of failure | Nightly mc mirror to Backblaze B2 (§D) |
| R8 | High | Stored URL columns break after cutover | URL rewrite SQL in transaction (§H.4) |
| R9 | High | Objects uploaded during copy are missed | Freeze + incremental rclone sync |
| R10 | High | Non-ASCII filenames encode differently | Pre-audit `storage.objects.name` |
| R11 | Medium | `@supabase/*` pinned to `latest` is fragile | Pin exact versions in §F.1 |
| R12 | Medium | Cloudflare Tunnel rate limits hit | Monitor; upgrade to paid tier if needed |

---

## What I Need From You Before Execution Begins

### A — Hardware & Network
1. **NASync model + bay count** (default: DXP4800 Plus 4-bay RAID 5)
2. **Drives** — count/capacity/model (default: 4× 4TB WD Red Plus or IronWolf)
3. **Network placement + uplink Mbps** (default: office LAN + Cloudflare Tunnel)
4. **UPS** yes/no, model (default: CyberPower CP1500EPFCLCD, non-negotiable)
5. **Domain for S3 endpoint** — e.g. `s3.arsd-nas.yourdomain.com` (must be Cloudflare-managed)

### B — MinIO & Security
1. **Remote exposure choice** — Cloudflare Tunnel (recommended) / Tailscale / self-hosted
2. **Off-site backup target** — Backblaze B2 (recommended) / second NAS / AWS Glacier
3. **Admin console allowlist** — emails for Cloudflare Access
4. **TLS strategy** — Cloudflare-managed (recommended with Tunnel)

### C — Code & Environment
1. **Security hardening**: harden warehouse + accomplishment-reports with signed URLs (recommended), or preserve public URL behavior?
2. **Vercel env owner** — who updates env vars + triggers redeploys at cutover
3. **Node version** on Vercel — must be ≥ 20
4. **CI secrets** for integration-test MinIO (default: ephemeral per run)

### D — Operational
1. **Cutover date + on-call** (default: first Saturday 02:00 local, 30-min freeze)
2. **Lifecycle policies** per bucket (default: none initially)
3. **Security hardening confirmation** (mirrors C.1)
4. **Dual-write vs freeze** (default: freeze — 30 min)
5. **Rollback retention** (default: 14 days)
6. **Cold archive retention** (default: 12 months B2)

---

## Verification Gates Before Any Implementation

1. All §WN items answered.
2. NAS hardware racked, RAID built, MinIO container running locally (§A).
3. Cloudflare Tunnel up — `curl https://s3.arsd-nas.example.com/minio/health/live` → 200.
4. Off-site backup target provisioned + nightly job scheduled (§D).
5. Staging rehearsal of §H completes within 30 minutes.

Only after all five pass does §F (refactor) merge to main and §H (cutover) go on the calendar.

---

## Effort Summary

| Phase | Effort |
|-------|--------|
| A–D Infra setup | 1–2 days |
| E rclone migration | 0.5 day |
| F Code refactor | 5 days |
| G Validation | 0.5 day |
| H Cutover + rehearsal | 1 day |
| I Rollback prep | 0.5 day |
| J Decommission | 0.5 day (spread) |
| **Total engineering** | **~10 days** |

Calendar time: **2–3 weeks** including hardware procurement and staging rehearsal.
