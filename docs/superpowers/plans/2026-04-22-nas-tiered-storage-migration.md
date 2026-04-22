# Supabase → UGREEN NAS Tiered Storage Migration — Runbook

**Goal:** Move file storage onto the UGREEN NAS **without paying Supabase Pro ($25/mo)** and **without changing the app's upload path**. The app keeps writing new uploads to Supabase Storage; a nightly job on the NAS drains files older than 24h to MinIO, rewrites their URLs in the Postgres database, and deletes the Supabase copy. Within a few days of deployment, Supabase Storage stays near-empty (well under the 1 GB free-tier limit) and 100% of persisted files live on the NAS.

**What this supersedes:** `2026-04-20-ugreen-nas-storage-migration.md` (full cutover plan). Keep that file for reference only — **do not execute** it. This tiered-storage plan replaces it end-to-end. The original plan's Parts A, B, C are reused here in simplified form; everything else (the code adapter refactor, the 18-policy RLS port, the freeze-window cutover, and the formal rollback runbook) is dropped.

**Prerequisite:** `2026-04-22-vercel-to-cloudflare-dns.md` is complete. Cloudflare shows `arsd.co` as **Active**, SSL/TLS mode is **Full (strict)**, and the "Proxy DNS records" warning has cleared.

**Primary tech:** Docker · MinIO (`quay.io/minio/minio`) · `cloudflared` · `rclone` · `mc` (MinIO client) · `psql` · bash cron. No application code dependencies added; the only code change is to the delete path in a few services (§Part J).

**Stack on the NAS:** UGREEN NASync running UGOS Pro (Linux base), Docker ≥ 24, Docker Compose v2. All long-running services run as Docker containers under `/volume1/docker/`.

---

## Context

### Why this approach

We are **at 1.91 GB of Supabase Storage**, above the 1 GB free-tier cap. Supabase Pro costs **$25/mo**. The boss has already purchased a UGREEN NAS 6 months ago and wants it put to use. Database usage is 98 MB (well under the 500 MB free-tier cap) so there is no pressure to move the database.

### Architectural choice: tiered, not cutover

| Concern | Full cutover (original plan) | **Tiered storage (this plan)** |
|---|---|---|
| Upload path | App writes to MinIO | App still writes to Supabase |
| Tunnel uptime affects uploads | Yes (critical path) | No (only affects reads of moved files) |
| Freeze window | 30 min required | None |
| Code changes | 7 service files + RLS port | 3 service files (delete path only) |
| Rollback complexity | Reverse migration | Re-upload to Supabase if needed |
| Engineering time | ~10 days | **~3 days** |
| End state | Supabase = 0 bytes | Supabase ≈ 1 day of uploads (≪ 1 GB) |
| Supabase Pro needed | No | No |

### Data flow

```
User uploads a file
        │
        ▼
Next.js service  ──►  supabase.storage.upload(bucket, path)
        │                      │
        │                      ▼
        └──► DB insert with file_url = "https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/<bucket>/<path>"

... file sits in Supabase for up to 24h ...

Nightly at 02:00 NAS local time:
  mover.sh on NAS:
    1. rclone copy supabase:<bucket> minio:<bucket> --min-age 24h   (source → destination, older-than-24h only)
    2. Verify counts match
    3. psql UPDATE ... SET url = REPLACE(url, supabase_prefix, nas_prefix) WHERE url LIKE supabase_prefix%   (one statement per table)
    4. rclone delete supabase:<bucket> --min-age 24h                (remove from Supabase)
    5. Log + exit
```

### Bucket inventory (from §Discovery 2026-04-20 + schema audit 2026-04-22)

| Bucket | Objects | Size | Public | Migrated? |
|---|---|---|---|---|
| `accomplishment-reports` | 103 | 800 MB | true | ✅ Yes |
| `progress-photos` | 763 | 994 MB | true | ✅ Yes |
| `warehouse` | 61 | 100 MB | true | ✅ Yes |
| `website-projects` | 41 | 16 MB | true | ❌ **Carveout — stays on Supabase** |
| **Total** | **968** | **~1.91 GB** | | **Migrating: ~1.89 GB (99%)** |

Three of four buckets migrate to the NAS. To match Supabase's public-bucket behavior, all migrated MinIO buckets are set to `mc anonymous set download`. **Security hardening (private buckets + signed URLs) is explicitly out of scope** — treat it as a separate future project.

#### Why `website-projects` is a carveout

The `website_project_photos` table stores only a `file_path` column — there is no stored URL. URLs are computed at runtime via `supabase.storage.from('website-projects').getPublicUrl(file_path)` (see `src/services/projects/website-projects-server.ts:27`). A URL-rewrite mover cannot migrate this bucket without a schema change and a cross-cutting refactor of read/write paths. Because the bucket is only 16 MB (0.8% of total storage), keeping it on Supabase is the pragmatic choice — steady-state Supabase usage stays well under the 1 GB free-tier cap.

### Database tables and columns the mover updates (verified 2026-04-22)

| Table | Column(s) | Bucket referenced |
|---|---|---|
| `accomplishment_reports` | `file_url` | `accomplishment-reports` |
| `progress_photos` | `file_url` | `progress-photos` |
| `delivery_receipts` | `dr_photo_url`, `delivery_proof_url` | `warehouse` |
| `release_forms` | `attachment_url` | `warehouse` |

`website_project_photos.file_path` is **intentionally excluded** — see carveout note above.

> Schema verified against production on 2026-04-22 via `information_schema.columns`. If the mover is not deployed within a few weeks of this date, re-run §F.1.

### URL rewrite pattern

- **Before:** `https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/<bucket>/<path>`
- **After:** `https://s3.arsd.co/<bucket>/<path>`

The object key is preserved — `rclone copy` uses the same path on source and destination, so a simple `REPLACE()` on the URL prefix is enough.

---

# RUNBOOK

Every step has:
- **What** — one sentence of intent
- **Where** — which machine / UI / service
- **Action** — exact command or click path
- **Expected** — the success signal

If a step fails, check the troubleshooting notes at the bottom of each Part before improvising.

---

## Part A — NAS Hardware & OS Prep

**Prerequisite:** NAS powered on, drives installed, RAID built (RAID 5 recommended for ≥4 bays), UGOS Pro updated to the latest version, UPS connected, wired Ethernet with stable uplink.

### A.1 Inventory check

- [ ] **A.1.1** — Record NAS model, bay count, drive count/capacity/model, RAID level, LAN IP, current UGOS Pro version. Save to team wiki/notes for future ops.

### A.2 Enable SSH

- [ ] **A.2.1** — UGOS Pro web UI → Control Panel → Terminal & SNMP → enable SSH on port 22.
- [ ] **A.2.2** — From your workstation:
  ```bash
  ssh admin@<NAS_LAN_IP>
  ```
  Expected: shell prompt as `admin`.

### A.3 Verify Docker + Compose

- [ ] **A.3.1** — If Docker is not already installed: UGOS Pro App Center → search "Docker" → install.
- [ ] **A.3.2** — Confirm via SSH:
  ```bash
  docker --version
  docker compose version
  ```
  Expected: Docker ≥ 24.x and Compose ≥ v2.x.

### A.4 Verify RAID + storage volume

- [ ] **A.4.1** — UGOS Pro → Storage Manager → confirm RAID 5 (or chosen level) is **Healthy**.
- [ ] **A.4.2** — Identify the primary volume path (commonly `/volume1`). Substitute this path wherever the plan says `/volume1/`.
- [ ] **A.4.3** — Confirm free space > 50 GB:
  ```bash
  df -h /volume1
  ```

### A.5 Verify UPS

- [ ] **A.5.1** — UGOS Pro → Control Panel → External Devices / UPS → confirm the UPS is detected and the NAS is set to **shut down safely** after N minutes on battery.

**Troubleshooting A:**
- SSH refused → confirm SSH service toggled on; check firewall in UGOS Pro.
- `docker` command not found → App Center may have installed but requires reboot.
- Volume path differs → use the actual path returned by `df -h`.

---

## Part B — MinIO Setup

### B.1 Create directory structure

- [ ] **B.1.1** — SSH to NAS. Create folders:
  ```bash
  mkdir -p /volume1/docker/minio/data
  mkdir -p /volume1/docker/minio/config
  mkdir -p /volume1/docker/cloudflared
  mkdir -p /volume1/docker/mover
  mkdir -p /volume1/docker/mover/logs
  ```

- [ ] **B.1.2** — Verify:
  ```bash
  ls -la /volume1/docker/
  ```
  Expected: four folders listed.

### B.2 Generate MinIO root credentials

- [ ] **B.2.1** — On your **workstation** (not the NAS), generate two strong random strings:
  ```bash
  openssl rand -base64 24   # use for MINIO_ROOT_USER
  openssl rand -base64 32   # use for MINIO_ROOT_PASSWORD
  ```

- [ ] **B.2.2** — Save both in your team password manager (1Password, Bitwarden, Vault) under entry **"ARSD NAS · MinIO Root"**. You will need them once during bucket setup and almost never afterwards.

### B.3 Write MinIO `docker-compose.yml`

- [ ] **B.3.1** — Create `/volume1/docker/minio/docker-compose.yml`:

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
      MINIO_BROWSER_REDIRECT_URL: https://console.arsd.co
      MINIO_SERVER_URL: https://s3.arsd.co
    command: server /data --console-address ":9001"
    volumes:
      - /volume1/docker/minio/data:/data
      - /volume1/docker/minio/config:/root/.minio
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9000/minio/health/live || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

> **Why bind to 127.0.0.1:** never expose MinIO on the LAN or public IP. Cloudflare Tunnel (Part C) is the only ingress.

### B.4 Write `.env` for MinIO

- [ ] **B.4.1** — Create `/volume1/docker/minio/.env`:
```bash
MINIO_ROOT_USER=<paste value from B.2.1>
MINIO_ROOT_PASSWORD=<paste value from B.2.1>
```

- [ ] **B.4.2** — Lock the file:
```bash
chmod 600 /volume1/docker/minio/.env
```

### B.5 Launch MinIO

- [ ] **B.5.1** — Start:
```bash
cd /volume1/docker/minio
docker compose up -d
```
Expected: `Container arsd-minio Started`.

- [ ] **B.5.2** — Check logs:
```bash
docker logs arsd-minio --tail 30
```
Expected: lines containing `API: http://...:9000` and `WebUI: http://...:9001`.

- [ ] **B.5.3** — Local smoke test:
```bash
curl -sSf http://127.0.0.1:9000/minio/health/live
```
Expected: HTTP 200, empty body.

**Troubleshooting B:**
- Container restarts repeatedly → `docker logs arsd-minio`. Most common cause: `/data` permissions. Fix:
  ```bash
  chown -R 1000:1000 /volume1/docker/minio
  docker compose down && docker compose up -d
  ```
- Healthcheck failing but curl works → ignore; the healthcheck uses `curl` inside the container which may not be present. Functionally fine.

---

## Part C — Cloudflare Tunnel

### C.1 Create the tunnel in Cloudflare Zero Trust

- [ ] **C.1.1** — https://one.dash.cloudflare.com → your account → **Networks → Tunnels → Create a tunnel**.
- [ ] **C.1.2** — Connector: `cloudflared`. Tunnel name: `arsd-nas`. Save.
- [ ] **C.1.3** — On the next screen, Cloudflare shows an install command containing a long token string beginning with `eyJ...`. **Copy the entire token** (only) to your clipboard or a scratch file.

### C.2 Install `cloudflared` on the NAS

- [ ] **C.2.1** — Create `/volume1/docker/cloudflared/docker-compose.yml`:

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

- [ ] **C.2.2** — Create `/volume1/docker/cloudflared/.env`:
```bash
CF_TUNNEL_TOKEN=<paste token from C.1.3>
```

- [ ] **C.2.3** — Lock the file:
```bash
chmod 600 /volume1/docker/cloudflared/.env
```

- [ ] **C.2.4** — Start:
```bash
cd /volume1/docker/cloudflared
docker compose up -d
docker logs arsd-cloudflared --tail 20
```
Expected: at least one line `Registered tunnel connection`.

- [ ] **C.2.5** — Back in Cloudflare Zero Trust dashboard, the tunnel `arsd-nas` should now show status **HEALTHY**.

### C.3 Add public hostnames (route → service)

In the tunnel's **Public Hostname** tab, add two hostnames:

- [ ] **C.3.1** — Public Hostname #1:
  - **Subdomain:** `s3`
  - **Domain:** `arsd.co`
  - **Service type:** `HTTP`
  - **URL:** `localhost:9000`
  - **Additional application settings → HTTP Settings → HTTP Host Header:** `s3.arsd.co`
  - Save.

- [ ] **C.3.2** — Public Hostname #2:
  - **Subdomain:** `console`
  - **Domain:** `arsd.co`
  - **Service type:** `HTTP`
  - **URL:** `localhost:9001`
  - **Additional application settings → HTTP Settings → HTTP Host Header:** `console.arsd.co`
  - Save.

- [ ] **C.3.3** — Verify DNS auto-created: Cloudflare → DNS for `arsd.co` should now show two new CNAME records (`s3` and `console`) pointing to a `*.cfargotunnel.com` target, both proxied (orange cloud).

- [ ] **C.3.4** — Verify from your workstation:
```bash
curl -sSfI https://s3.arsd.co/minio/health/live
```
Expected: HTTP 200.

```bash
curl -sSfI https://console.arsd.co
```
Expected: HTTP 200 or 302 (redirect into MinIO console login).

### C.4 Lock down the MinIO console with Cloudflare Access

The `console.arsd.co` endpoint is the MinIO admin UI. It must not be publicly reachable.

- [ ] **C.4.1** — Cloudflare Zero Trust → **Access → Applications → Add an application → Self-hosted**.
- [ ] **C.4.2** — Application name: `MinIO Console`. Session duration: 8 hours. Application domain: `console.arsd.co`.
- [ ] **C.4.3** — Add an Access policy:
  - Action: **Allow**
  - Include: **Emails** → list the superadmin emails (yours + any other operator).
  - Save.
- [ ] **C.4.4** — Verify in an incognito browser: visiting `https://console.arsd.co` should show a **Cloudflare Access login page**, not the MinIO login directly.

**Troubleshooting C:**
- Tunnel status stays **INACTIVE** in dashboard → `docker logs arsd-cloudflared`. Usually the token is wrong. Regenerate at Cloudflare, redeploy.
- `1033 argo tunnel error` → cloudflared container not reachable from Cloudflare edge. Check internet connectivity from the NAS.
- Console loads MinIO directly without an Access challenge → policy domain doesn't match exactly. Must be `console.arsd.co` — not `*.arsd.co`, not `https://console.arsd.co`.
- Slow uploads later → disable Cloudflare caching on the `s3.` subdomain (Rules → Page Rules → bypass cache for `s3.arsd.co/*`).

---

## Part D — MinIO Buckets & Credentials

Run all `mc` commands from your **workstation**, not the NAS. You need internet access to `s3.arsd.co`.

### D.1 Install `mc` (MinIO client)

- [ ] **D.1.1** — Install on your OS:
  - **Windows:** download `mc.exe` from https://dl.min.io/client/mc/release/windows-amd64/mc.exe, put it on your PATH.
  - **macOS:** `brew install minio/stable/mc`
  - **Linux:** `wget https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && sudo mv mc /usr/local/bin/`
- [ ] **D.1.2** — Verify: `mc --version`.

### D.2 Register the MinIO alias

- [ ] **D.2.1** — Run (using the values saved in §B.2.2):
```bash
mc alias set arsd https://s3.arsd.co <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
```
Expected: `Added arsd successfully.`

- [ ] **D.2.2** — Confirm:
```bash
mc admin info arsd
```
Expected: server info, uptime, drive count.

### D.3 Create the four buckets

- [ ] **D.3.1** — Create the three migrated buckets (`website-projects` is a carveout — do NOT create it in MinIO):
```bash
mc mb arsd/accomplishment-reports
mc mb arsd/progress-photos
mc mb arsd/warehouse
```
Expected: `Bucket created successfully` × 3.

- [ ] **D.3.2** — Confirm:
```bash
mc ls arsd
```

### D.4 Set anonymous-download on the three migrated buckets

This matches the Supabase behavior (these three buckets are `public=true`).

- [ ] **D.4.1**:
```bash
mc anonymous set download arsd/accomplishment-reports
mc anonymous set download arsd/progress-photos
mc anonymous set download arsd/warehouse
```

- [ ] **D.4.2** — Smoke test (expect 404 Not Found, not 403 Forbidden, since bucket is empty):
```bash
curl -I https://s3.arsd.co/progress-photos/nonexistent.jpg
```
Expected: `HTTP/2 404`. **If you see 403 the bucket policy is wrong** — re-run D.4.1.

### D.5 Create a service account for the mover

This is the credential the nightly mover uses to write into MinIO.

- [ ] **D.5.1** — Create service account:
```bash
mc admin user svcacct add arsd <MINIO_ROOT_USER> \
  --name "arsd-mover" \
  --description "Nightly Supabase→NAS mover"
```
**Save the printed `Access Key` and `Secret Key`** — the secret cannot be retrieved later. Store in password manager under **"ARSD NAS · Mover Service Account"**.

- [ ] **D.5.2** — Create a scoped policy file on your workstation (`policy-mover.json`). `website-projects` is omitted because that bucket is a carveout and never touched by the mover:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::accomplishment-reports",
        "arn:aws:s3:::accomplishment-reports/*",
        "arn:aws:s3:::progress-photos",
        "arn:aws:s3:::progress-photos/*",
        "arn:aws:s3:::warehouse",
        "arn:aws:s3:::warehouse/*"
      ]
    }
  ]
}
```

- [ ] **D.5.3** — Register and attach:
```bash
mc admin policy create arsd arsd-mover-policy policy-mover.json
mc admin policy attach arsd arsd-mover-policy --user <access-key-from-D.5.1>
```

**Troubleshooting D:**
- `mc` cannot connect → check Cloudflare Tunnel is up; verify `dig s3.arsd.co` resolves to Cloudflare IPs.
- `AccessDenied` on bucket create → re-check alias credentials match the `.env` file on the NAS.

---

## Part E — Install the Mover on the NAS

### E.1 Install `rclone`

- [ ] **E.1.1** — SSH to NAS:
```bash
curl https://rclone.org/install.sh | sudo bash
rclone version
```
Expected: rclone v1.68.x or newer.

### E.2 Install `postgresql-client` (provides `psql`)

- [ ] **E.2.1** — UGOS Pro uses Debian/Ubuntu base; install via apt:
```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```
Verify: `psql --version`.

> If `apt-get` is not available on your UGOS Pro version, install psql as a Docker one-shot (alternative in §E.6).

### E.3 Get Supabase S3 credentials (source)

Supabase exposes an S3-compatible endpoint for Storage.

- [ ] **E.3.1** — Supabase Dashboard → project `uoffxmrnpukibgcmmgus` → **Project Settings → Storage → S3 Connection**.
- [ ] **E.3.2** — Click **Enable** if not already enabled.
- [ ] **E.3.3** — Copy: **Endpoint**, **Region**, **Access Key**, **Secret Key**. Save to password manager under **"Supabase · Storage S3 Credentials"**.

Expected values:
- Endpoint: `https://uoffxmrnpukibgcmmgus.storage.supabase.co/storage/v1/s3`
- Region: `ap-southeast-1`

### E.4 Get Supabase Postgres credentials

- [ ] **E.4.1** — Supabase Dashboard → **Project Settings → Database → Connection string → URI**.
- [ ] **E.4.2** — Copy the URI. It looks like:
  ```
  postgresql://postgres.uoffxmrnpukibgcmmgus:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```
- [ ] **E.4.3** — Save in password manager under **"Supabase · DB Connection URI (mover)"**.

> Use the **pooler** (port 6543) connection string, not the direct connection (5432). The pooler is more tolerant of cron-style short-lived connections.

### E.5 Configure `rclone` on the NAS

Run these on the NAS (SSH session).

- [ ] **E.5.1** — Configure the **Supabase** source remote:
```bash
rclone config create supabase s3 \
  provider=Other \
  endpoint=https://uoffxmrnpukibgcmmgus.storage.supabase.co/storage/v1/s3 \
  access_key_id=<from E.3.3> \
  secret_access_key=<from E.3.3> \
  region=ap-southeast-1
```

- [ ] **E.5.2** — Configure the **MinIO** destination remote:
```bash
rclone config create minio s3 \
  provider=Minio \
  endpoint=https://s3.arsd.co \
  access_key_id=<from D.5.1> \
  secret_access_key=<from D.5.1> \
  region=us-east-1 \
  force_path_style=true
```

- [ ] **E.5.3** — Smoke-test both:
```bash
rclone lsd supabase:
rclone lsd minio:
```
Expected: both list the four buckets (supabase side will show populated, minio side empty).

### E.6 Create the mover script

- [ ] **E.6.1** — Create `/volume1/docker/mover/mover.sh`:

```bash
#!/bin/bash
# ==============================================================================
# Supabase → NAS tiered-storage mover
# Runs nightly via cron. Moves files older than AGE_HOURS from Supabase Storage
# to MinIO, rewrites their URLs in Postgres, and deletes the Supabase copy.
# ==============================================================================
set -euo pipefail

# Load secrets (DB_URL)
source /volume1/docker/mover/.env

AGE_HOURS="${AGE_HOURS:-24}"
SUPABASE_PREFIX="https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public"
NAS_PREFIX="https://s3.arsd.co"
# website-projects is intentionally excluded (carveout — see §Context).
BUCKETS=(accomplishment-reports progress-photos warehouse)
LOG_DIR="/volume1/docker/mover/logs"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOG_DIR/mover-$STAMP.log"

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG") 2>&1

echo "=== Mover run started: $(date -Iseconds) ==="
echo "AGE_HOURS=$AGE_HOURS"

# -----------------------------------------------------------------------------
# Step 1: Copy old-enough files Supabase → MinIO
# -----------------------------------------------------------------------------
for bucket in "${BUCKETS[@]}"; do
  echo ""
  echo "--- Copying supabase:$bucket -> minio:$bucket (min-age ${AGE_HOURS}h) ---"
  rclone copy "supabase:$bucket" "minio:$bucket" \
    --min-age "${AGE_HOURS}h" \
    --checksum \
    --transfers 8 \
    --checkers 16 \
    --log-level INFO
done

# -----------------------------------------------------------------------------
# Step 2: Rewrite URLs in Postgres
# Column names verified against production schema on 2026-04-22.
# Each UPDATE is idempotent — it only affects rows that still contain the
# Supabase prefix, so re-running the script is safe.
# -----------------------------------------------------------------------------
echo ""
echo "--- Rewriting URLs in Postgres ---"
psql "$DB_URL" <<SQL
BEGIN;

-- accomplishment-reports bucket
UPDATE accomplishment_reports
SET file_url = REPLACE(file_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE file_url LIKE '$SUPABASE_PREFIX/%';

-- progress-photos bucket
UPDATE progress_photos
SET file_url = REPLACE(file_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE file_url LIKE '$SUPABASE_PREFIX/%';

-- warehouse bucket: delivery receipts (two URL columns)
UPDATE delivery_receipts
SET dr_photo_url = REPLACE(dr_photo_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE dr_photo_url LIKE '$SUPABASE_PREFIX/%';

UPDATE delivery_receipts
SET delivery_proof_url = REPLACE(delivery_proof_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE delivery_proof_url LIKE '$SUPABASE_PREFIX/%';

-- warehouse bucket: release forms
UPDATE release_forms
SET attachment_url = REPLACE(attachment_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE attachment_url LIKE '$SUPABASE_PREFIX/%';

COMMIT;
SQL

# -----------------------------------------------------------------------------
# Step 3: Delete old-enough files from Supabase
# Only runs if Steps 1 and 2 succeeded (set -e above).
# website-projects bucket is NOT drained — see carveout note.
# -----------------------------------------------------------------------------
for bucket in "${BUCKETS[@]}"; do
  echo ""
  echo "--- Deleting supabase:$bucket (min-age ${AGE_HOURS}h) ---"
  rclone delete "supabase:$bucket" \
    --min-age "${AGE_HOURS}h" \
    --log-level INFO
done

echo ""
echo "=== Mover run finished: $(date -Iseconds) ==="
```

- [ ] **E.6.2** — Make it executable:
```bash
chmod +x /volume1/docker/mover/mover.sh
```

### E.7 Create the mover `.env`

- [ ] **E.7.1** — Create `/volume1/docker/mover/.env`:
```bash
DB_URL=postgresql://postgres.uoffxmrnpukibgcmmgus:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

- [ ] **E.7.2** — Lock:
```bash
chmod 600 /volume1/docker/mover/.env
```

**Troubleshooting E:**
- `rclone` `InvalidAccessKeyId` against Supabase → ensure S3 Connection is enabled in Supabase Dashboard; copy keys fresh.
- `psql: could not connect` → confirm you're using the **pooler** URL (port 6543), not the direct 5432 URL. The NAS's outbound firewall may block 5432 but allow 6543.
- `force_path_style=true` missing → MinIO returns `NoSuchBucket` because S3 SDK expects `bucket.domain/key` instead of `domain/bucket/key`. Recreate the MinIO remote with the flag.

---

## Part F — One-Time Drain of Existing Data

This single run moves all **968 files / 1.91 GB** currently in Supabase onto the NAS and rewrites their URLs. After this, Supabase Storage will be effectively empty.

### F.1 Schema sanity check

Before running anything that rewrites production URLs, confirm the column names.

- [ ] **F.1.1** — From Supabase SQL editor (or the MCP `execute_sql`), run:
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'accomplishment_reports' AND column_name = 'file_url') OR
    (table_name = 'progress_photos' AND column_name = 'file_url') OR
    (table_name = 'delivery_receipts' AND column_name IN ('dr_photo_url', 'delivery_proof_url')) OR
    (table_name = 'release_forms' AND column_name = 'attachment_url')
  )
ORDER BY table_name, column_name;
```
- [ ] **F.1.2** — Verify the output includes all five rows:
  - `accomplishment_reports.file_url`
  - `delivery_receipts.delivery_proof_url`
  - `delivery_receipts.dr_photo_url`
  - `progress_photos.file_url`
  - `release_forms.attachment_url`

  If any are missing or differently named, **edit §E.6.1 mover.sh before proceeding**.

- [ ] **F.1.3** — Count rows that currently hold Supabase URLs:
```sql
SELECT 'accomplishment_reports.file_url' AS tbl, COUNT(*) FROM accomplishment_reports WHERE file_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%'
UNION ALL SELECT 'progress_photos.file_url', COUNT(*) FROM progress_photos WHERE file_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%'
UNION ALL SELECT 'delivery_receipts.dr_photo_url', COUNT(*) FROM delivery_receipts WHERE dr_photo_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%'
UNION ALL SELECT 'delivery_receipts.delivery_proof_url', COUNT(*) FROM delivery_receipts WHERE delivery_proof_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%'
UNION ALL SELECT 'release_forms.attachment_url', COUNT(*) FROM release_forms WHERE attachment_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%';
```
Record the five counts. These are the rows the drain will update. **Baseline snapshot (2026-04-22):** `accomplishment_reports=16`, `progress_photos=758`, others=0.

### F.2 Backup Postgres (safety net)

- [ ] **F.2.1** — Supabase Dashboard → **Database → Backups** → click **Create a manual backup**. Wait for completion.
- [ ] **F.2.2** — Screenshot the backup timestamp for your ops log.

### F.3 Dry-run the copy

- [ ] **F.3.1** — SSH to NAS (three migrated buckets only — `website-projects` is a carveout):
```bash
cd /volume1/docker/mover
for b in accomplishment-reports progress-photos warehouse; do
  rclone copy "supabase:$b" "minio:$b" --dry-run --progress
done
```
Expected total: ~927 files / ~1.89 GB (968 total minus the 41 files / 16 MB in `website-projects`). If numbers are wildly different, stop and investigate.

### F.4 Real copy (no age filter — move everything)

- [ ] **F.4.1** — Temporarily run the mover with `AGE_HOURS=0` to drain *everything*:
```bash
AGE_HOURS=0 /volume1/docker/mover/mover.sh
```
- [ ] **F.4.2** — Monitor the log streaming to `/volume1/docker/mover/logs/mover-*.log`.
- [ ] **F.4.3** — Expected wall clock: 5–30 minutes depending on uplink and NAS disk speed.

### F.5 Verify object counts match (NAS side)

- [ ] **F.5.1** — On the NAS:
```bash
for b in accomplishment-reports progress-photos warehouse; do
  src=$(rclone size "supabase:$b" --json | jq .count)
  dst=$(rclone size "minio:$b" --json | jq .count)
  echo "$b: source=$src destination=$dst"
done
```
Expected: **source=0, destination=<expected count>** for each of the three migrated buckets after the drain.

`website-projects` is untouched — it should still show its full count in Supabase and 0 in MinIO (the MinIO bucket was never created).

### F.6 Verify URL rewrite

- [ ] **F.6.1** — In Supabase SQL editor, re-run the query from §F.1.3. All five counts must now be **0**.
- [ ] **F.6.2** — Confirm NAS URLs are in place:
```sql
SELECT 'accomplishment_reports.file_url' AS tbl, COUNT(*) FROM accomplishment_reports WHERE file_url LIKE 'https://s3.arsd.co/%'
UNION ALL SELECT 'progress_photos.file_url', COUNT(*) FROM progress_photos WHERE file_url LIKE 'https://s3.arsd.co/%'
UNION ALL SELECT 'delivery_receipts.dr_photo_url', COUNT(*) FROM delivery_receipts WHERE dr_photo_url LIKE 'https://s3.arsd.co/%'
UNION ALL SELECT 'delivery_receipts.delivery_proof_url', COUNT(*) FROM delivery_receipts WHERE delivery_proof_url LIKE 'https://s3.arsd.co/%'
UNION ALL SELECT 'release_forms.attachment_url', COUNT(*) FROM release_forms WHERE attachment_url LIKE 'https://s3.arsd.co/%';
```
Expected counts should match the §F.1.3 values.

### F.7 App-level smoke test

- [ ] **F.7.1** — Load `https://arsd.co/projects` in a browser → website project photos render (from Supabase — carveout).
- [ ] **F.7.2** — Load dashboard → progress photos render inline (from NAS).
- [ ] **F.7.3** — Download an accomplishment report from the upload list → opens (from NAS).
- [ ] **F.7.4** — View a warehouse delivery receipt photo → opens (from NAS).
- [ ] **F.7.5** — View a release form attachment → opens (from NAS).

If any image fails: inspect its `src` URL. For the three migrated buckets it should be `https://s3.arsd.co/<bucket>/<path>`. For website-projects it should remain `https://uoffxmrnpukibgcmmgus.supabase.co/...`. Curl the URL directly to check if it's a tunnel issue vs. a missing object.

**Troubleshooting F:**
- Some NAS images 404 → the object isn't on the NAS for that path. Check: `mc ls arsd/<bucket>/<path>`. If missing, re-run the mover for that bucket.
- Some DB rows still show Supabase URLs → a row's URL may have had extra whitespace or a slightly different prefix. Spot-check and manually update.

---

## Part G — Schedule the Nightly Cron

### G.1 Add crontab entry

- [ ] **G.1.1** — On the NAS, edit the crontab:
```bash
crontab -e
```
- [ ] **G.1.2** — Add:
```
30 2 * * * /volume1/docker/mover/mover.sh >> /volume1/docker/mover/logs/cron.log 2>&1
```
This runs at **02:30 NAS local time every day**.

- [ ] **G.1.3** — Save and exit. Verify:
```bash
crontab -l
```

### G.2 Log rotation

- [ ] **G.2.1** — Create `/etc/logrotate.d/mover` (requires sudo):
```
/volume1/docker/mover/logs/*.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
}
```
Keeps 8 weeks of logs, then discards.

### G.3 Optional: email alert on failure

If the NAS has a working SMTP forwarder (UGOS Pro → Notification settings), wrap the cron line:
```
30 2 * * * /volume1/docker/mover/mover.sh >> /volume1/docker/mover/logs/cron.log 2>&1 || echo "mover failed: see /volume1/docker/mover/logs/cron.log" | mail -s "[arsd-nas] mover failed" ops@yourdomain.com
```

---

## Part H — Verification & Monitoring

### H.1 Day 1 after go-live

- [ ] **H.1.1** — Upload a test file via the app (progress photo or accomplishment report).
- [ ] **H.1.2** — Confirm in Supabase SQL editor:
  ```sql
  SELECT url FROM progress_photos WHERE created_at > now() - interval '10 minutes';
  ```
  The URL should be the **Supabase** URL (not NAS yet — upload < 24h old).
- [ ] **H.1.3** — Verify the image displays on the dashboard.

### H.2 Day 2 after go-live

- [ ] **H.2.1** — Check `/volume1/docker/mover/logs/mover-*.log` for the overnight run. Confirm:
  - `rclone copy` copied the yesterday's test file.
  - The URL rewrite UPDATEs affected ≥1 row.
  - `rclone delete` removed the Supabase copy.
- [ ] **H.2.2** — Re-query:
  ```sql
  SELECT url FROM progress_photos WHERE created_at > now() - interval '2 days';
  ```
  Old URLs should now be `https://s3.arsd.co/...`.
- [ ] **H.2.3** — Reload the image in the dashboard → renders from NAS.

### H.3 Weekly check

- [ ] **H.3.1** — Supabase Dashboard → **Project Settings → Usage** → confirm **Storage is under 1 GB**. Expected steady-state: tens to low hundreds of MB.
- [ ] **H.3.2** — If Storage approaches 1 GB, inspect the mover logs for failures.

### H.4 Monthly check

- [ ] **H.4.1** — Run `mc ls --recursive --summarize arsd/` to get total NAS storage. Track the number in your ops log.
- [ ] **H.4.2** — Check NAS disk health in UGOS Pro (SMART).

---

## Part J — Code Change: Delete Path

The current delete path in three services assumes every file URL is a Supabase URL. After migration, URLs can be either Supabase (new files) or NAS (files the mover has already moved). Delete must handle both.

### J.1 Touchpoints

| File | What it does today | In-scope for tiered prep? |
|---|---|---|
| `src/services/progress-photos/progress-photos.service.ts` (lines 204–217) | Parses `/storage/v1/object/public/progress-photos/` out of URL; calls `supabase.storage.from('progress-photos').remove([filePath])` | ✅ Yes — migrated bucket |
| `src/services/projects/website-projects.ts` (lines 190–225) | Deletes by `file_path` column; bucket-local removal on `website-projects` | ❌ **No — website-projects is a carveout**; existing code remains correct |
| `src/services/storage/storage-cleanup.service.ts` | Iterates through orphaned files in Supabase Storage | ❌ No — only targets Supabase; appropriate for phase 1 |
| `src/services/warehouse/warehouse-storage.service.ts` | `deleteFile(filePath)` method — **has zero callers in the codebase** (verified via grep) | ❌ No — dead code; leave untouched |

### J.2 Strategy

Introduce a small helper that routes a delete by URL shape:

- URL starts with `https://uoffxmrnpukibgcmmgus.supabase.co/` → delete from Supabase Storage (existing path).
- URL starts with `https://s3.arsd.co/` → delete from MinIO via the `@aws-sdk/client-s3` package (new path).

### J.3 Install S3 SDK

- [ ] **J.3.1**:
```bash
npm install @aws-sdk/client-s3@3.632.0
```

### J.4 Create the delete helper

- [ ] **J.4.1** — Create `src/services/storage/delete-by-url.ts`:

```typescript
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@/supabase/server';

const NAS_PREFIX = 'https://s3.arsd.co/';
const SUPABASE_PUBLIC_PREFIX = 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.NAS_S3_ENDPOINT!,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.NAS_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NAS_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export async function deleteByUrl(url: string): Promise<void> {
  if (url.startsWith(NAS_PREFIX)) {
    const rest = url.slice(NAS_PREFIX.length);
    const firstSlash = rest.indexOf('/');
    const bucket = rest.slice(0, firstSlash);
    const key = rest.slice(firstSlash + 1);
    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }

  if (url.startsWith(SUPABASE_PUBLIC_PREFIX)) {
    const rest = url.slice(SUPABASE_PUBLIC_PREFIX.length);
    const firstSlash = rest.indexOf('/');
    const bucket = rest.slice(0, firstSlash);
    const key = rest.slice(firstSlash + 1);
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).remove([key]);
    if (error) throw error;
    return;
  }

  throw new Error(`deleteByUrl: unrecognized URL prefix: ${url}`);
}
```

### J.5 Add env vars

- [ ] **J.5.1** — `.env.local.example`:
```
NAS_S3_ENDPOINT=https://s3.arsd.co
NAS_S3_ACCESS_KEY_ID=
NAS_S3_SECRET_ACCESS_KEY=
```

- [ ] **J.5.2** — Vercel project → Settings → Environment Variables → add the three for **Production** and **Preview**. Use a dedicated Vercel-scoped MinIO service account (not the mover's). Create it with the same policy as D.5 and paste the access/secret keys.

### J.6 Swap the three touchpoints

Replace the manual URL parsing + `supabase.storage.remove` calls with a single `deleteByUrl(url)` call.

**Example — `src/services/progress-photos/progress-photos.service.ts` around line 204:**

Before:
```typescript
const url = new URL(photo.file_url);
const filePath = url.pathname.split('/storage/v1/object/public/progress-photos/')[1];
if (filePath) {
  const { error: storageError } = await supabase.storage
    .from('progress-photos')
    .remove([filePath]);
  if (storageError) {
    console.warn('Failed to delete file from storage:', storageError);
  }
}
```

After:
```typescript
import { deleteByUrl } from '@/services/storage/delete-by-url';
// ...
try {
  await deleteByUrl(photo.file_url);
} catch (err) {
  console.warn('Failed to delete file from storage:', err);
}
```

**Only `progress-photos.service.ts` is refactored.** `website-projects.ts` and `warehouse-storage.service.ts` are explicitly out of scope — see §J.1.

### J.7 Update storage-cleanup.service.ts

The cleanup service iterates files in Supabase Storage to find orphans. With tiered storage, Supabase contains only files <24h old, so the orphan-cleanup logic is largely moot for post-migration files. Two options:

- [ ] **J.7.1** (simplest, recommended) — Leave `storage-cleanup.service.ts` as-is. It still works against Supabase Storage for any <24h orphans. NAS cleanup is not implemented in this phase.

- [ ] **J.7.2** (future work, not in scope) — Add a companion NAS-side cleanup job that runs weekly: lists NAS objects, checks each against the DB, deletes any not referenced.

### J.8 Deploy

- [ ] **J.8.1** — Branch `feat/storage-delete-by-url` off `main`.
- [ ] **J.8.2** — Implement J.3–J.7, tests, PR, review, merge.
- [ ] **J.8.3** — Vercel prod env contains the three `NAS_S3_*` vars → redeploy happens automatically on merge.
- [ ] **J.8.4** — Smoke test: delete a progress photo whose URL is `https://s3.arsd.co/...` → confirm it's gone from NAS (`mc ls arsd/progress-photos/... `).

---

## Part I — Failure Modes & Recovery

### I.1 Mover fails one night

- Cron log shows an error; SQL was not rewritten; Supabase files were not deleted.
- **Impact:** zero user impact. Next night's run processes yesterday + today's files together (`--min-age 24h` naturally includes everything ≥24h).
- **Action:** inspect log, fix root cause (usually a DB connection hiccup or a transient rclone error), wait for next run.

### I.2 NAS goes offline

- **Impact:** images with NAS URLs fail to load until NAS is back. New uploads unaffected (they go to Supabase).
- **Action:** restore NAS (power, network, restart `arsd-minio` and `arsd-cloudflared`). No data loss as long as RAID drives are intact.

### I.3 Cloudflare Tunnel drops

- **Impact:** same as I.2 — NAS-served URLs break.
- **Action:** `docker restart arsd-cloudflared` on NAS. If the tunnel token was rotated in Cloudflare, update `/volume1/docker/cloudflared/.env` and restart.

### I.4 Wholesale rollback (worst case)

Only needed if the tiered-storage model proves unworkable (e.g., NAS uptime unacceptably poor).

- [ ] **I.4.1** — Stop the nightly cron: `crontab -e` → comment out the mover line.
- [ ] **I.4.2** — Re-upload all NAS files back to Supabase (only the three migrated buckets; `website-projects` never left Supabase):
  ```bash
  for b in accomplishment-reports progress-photos warehouse; do
    rclone copy "minio:$b" "supabase:$b" --checksum --progress
  done
  ```
- [ ] **I.4.3** — Reverse the URL rewrite (all 5 column updates):
  ```sql
  BEGIN;
  UPDATE accomplishment_reports SET file_url          = REPLACE(file_url,          'https://s3.arsd.co', 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public') WHERE file_url          LIKE 'https://s3.arsd.co/%';
  UPDATE progress_photos        SET file_url          = REPLACE(file_url,          'https://s3.arsd.co', 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public') WHERE file_url          LIKE 'https://s3.arsd.co/%';
  UPDATE delivery_receipts      SET dr_photo_url      = REPLACE(dr_photo_url,      'https://s3.arsd.co', 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public') WHERE dr_photo_url      LIKE 'https://s3.arsd.co/%';
  UPDATE delivery_receipts      SET delivery_proof_url = REPLACE(delivery_proof_url, 'https://s3.arsd.co', 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public') WHERE delivery_proof_url LIKE 'https://s3.arsd.co/%';
  UPDATE release_forms          SET attachment_url    = REPLACE(attachment_url,    'https://s3.arsd.co', 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public') WHERE attachment_url    LIKE 'https://s3.arsd.co/%';
  COMMIT;
  ```
- [ ] **I.4.4** — Subscribe to Supabase Pro to stay above the 1 GB cap.

---

## Risk Register

| # | Severity | Risk | Mitigation |
|---|----------|------|------------|
| R1 | **High** | NAS / power / internet outage breaks image loads for moved files | UPS + monitoring; fresh uploads unaffected because they go to Supabase |
| R2 | **High** | URL rewrite SQL targets a wrong column → production data corruption | §F.1 schema sanity check + §F.2 manual DB backup before drain |
| R3 | **High** | Mover runs but DB update fails mid-run → files copied but Supabase still serves old URL | `set -euo pipefail` + `BEGIN/COMMIT` transaction; next run is idempotent |
| R4 | Medium | Cloudflare Tunnel token rotation breaks connection silently | Monitor `docker logs arsd-cloudflared` weekly; alert on restart loop |
| R5 | Medium | MinIO disk pressure silently fills RAID | UGOS Pro free-space alert; §H.4 monthly check |
| R6 | Medium | Vercel SDK cannot reach `s3.arsd.co` from serverless function (e.g., egress region / cold start) | §J.8.4 smoke test from prod; fallback: route deletes through a Next.js route handler that shells out |
| R7 | Low | Supabase storage egress bill from the mover's daily pull | 100 MB/day × 30 = 3 GB/mo < 5 GB free-tier egress. Monitor in §H.3 |
| R8 | Low | NAS clock drift causes `--min-age` to compute wrong ages | NTP configured in UGOS Pro; verify `timedatectl` output |
| R9 | Low | Rclone silently skips a file with non-ASCII name | Pre-audit: `rclone ls supabase: | grep -vP '^[\x00-\x7f]*$'` |

---

## Verification Gates Before Starting

1. DNS plan `2026-04-22-vercel-to-cloudflare-dns.md` complete (Cloudflare shows `arsd.co` Active).
2. NAS hardware racked, RAID Healthy, UPS connected, SSH working.
3. Team password manager has entries for: MinIO Root, Mover Service Account, Supabase Storage S3 Credentials, Supabase DB URI.
4. Manual Supabase DB backup taken (§F.2).
5. Boss approval confirmed (hardware investment being put to use; ops risk accepted).

Only after all five pass do you run §F (drain) and §G (schedule cron).

---

## Effort Summary

| Phase | Effort |
|---|---|
| A — NAS & OS prep | 0.5 day |
| B — MinIO setup | 0.5 day |
| C — Cloudflare Tunnel | 0.5 day |
| D — Buckets & credentials | 0.25 day |
| E — Mover install & config | 0.75 day |
| F — One-time drain + verify | 0.25 day |
| G — Cron + log rotation | 0.1 day |
| H — Validation over 2 days | 0.25 day (spread) |
| J — Delete-path code change, PR, deploy | 1 day |
| **Total engineering** | **~3.5 days** |

Calendar time: **1 week** including a 2-day observation window before calling the migration done.

---

## What Stays on Supabase Forever

- Auth (users, sessions, refresh tokens)
- Postgres database (all tables, RLS policies, functions, migrations)
- Edge functions
- Realtime
- A rolling ~24 hours of recent file uploads (which the mover drains nightly)

## What Moves to the NAS

- All files older than 24 hours across all four buckets
- Nothing else — the NAS is storage-only in this architecture

---

## Why We Did Not Do the Full Cutover

Documenting so future readers don't re-litigate:

1. The data volume (1.91 GB) is tiny; the full cutover's complexity is disproportionate to the data size.
2. The upload path on Supabase is already battle-tested; moving it to a self-hosted MinIO behind a home-internet tunnel introduces availability risk on the critical write path.
3. The 18 RLS policies that gate Supabase Storage access don't need to be ported — all four buckets are public in Supabase today, so making MinIO buckets public anonymous-download matches behavior.
4. Tiered storage lets us achieve the cost goal ($0/mo Supabase) AND the political goal (boss's NAS in use) simultaneously, with one-third the engineering time.

If a future requirement demands on-prem writes (e.g., compliance, air-gapped uploads), revisit the full cutover plan in `2026-04-20-ugreen-nas-storage-migration.md` at that time.
