# NAS Tiered Storage Migration — Execution Record

**Date executed:** 2026-04-22
**Operator:** Rafael III (rflprdnt@gmail.com)
**Plan followed:** `docs/superpowers/plans/2026-04-22-nas-tiered-storage-migration.md`
**Supersedes (do not use):** `docs/superpowers/plans/2026-04-20-ugreen-nas-storage-migration.md`
**Outcome:** ✅ Success — 930 files / ~1.9 GB migrated from Supabase Storage to UGREEN NAS MinIO. Nightly mover scheduled. App delete path updated to route by URL prefix.

This document captures exactly what happened during execution — the commands that worked, the gotchas we hit, and the final system state. Use it as a companion to the plan if you ever need to rebuild this setup from scratch.

---

## Final System Architecture

```
User uploads a file via the app
        │
        ▼
Next.js service → supabase.storage.upload(bucket, path)
        │                        │
        │                        ▼
        └─► DB insert file_url = "https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/<bucket>/<path>"

... file sits in Supabase for up to 24h ...

Nightly at 02:30 NAS local time (cron on NAS):
  /volume1/docker/mover/mover.sh:
    1. rclone copy supabase:<bucket> minio:<bucket> --min-age 24h
    2. psql UPDATE to rewrite URLs to "https://s3.arsd.co/..."
    3. rclone delete supabase:<bucket> --min-age 24h

User's browser loads a migrated file:
  <img src="https://s3.arsd.co/progress-photos/..."> 
        │
        ▼
  Cloudflare edge → Cloudflare Tunnel → cloudflared container → MinIO container on NAS

User deletes a file via the app:
  Browser → POST /api/storage/delete-file { url }
        │
        ▼
  Server-side deleteByUrl() helper:
    - https://s3.arsd.co/... → AWS SDK DeleteObject against MinIO
    - https://uoffxmrnpukibgcmmgus.supabase.co/... → Supabase storage.remove()
```

---

## Key Coordinates

### NAS
- **LAN IP:** `192.168.0.251` (DHCP, LAN1)
- **Hostname:** `ARSDNasServer`
- **OS:** UGOS Pro (Debian 12.8 base, ARM64 / aarch64)
- **Admin SSH user:** `Rafael III` (has a space — required quoting: `ssh -l "Rafael III" 192.168.0.251` in PowerShell)
- **Volume:** `/volume1` (7.3 TiB total, ~97 GB used before migration)
- **Docker:** 26.1.0, Compose v2.26.1
- **Cron:** root crontab (user crontab is permission-denied)

### URLs (public)
- **S3 API:** `https://s3.arsd.co` → MinIO bucket/object endpoint
- **MinIO Console:** `https://console.arsd.co` → admin UI, locked behind Cloudflare Access
- **Live app:** `https://arsd.co` → served by Vercel

### Supabase Project
- **Project ID:** `uoffxmrnpukibgcmmgus`
- **Region:** `ap-southeast-1`
- **Postgres (used by mover):** Shared Transaction Pooler — `aws-1-ap-southeast-1.pooler.supabase.com:6543` (IPv4-compatible; don't use Dedicated Pooler — IPv6 only)
- **Storage S3 endpoint:** `https://uoffxmrnpukibgcmmgus.storage.supabase.co/storage/v1/s3`

### Buckets
| Bucket | Files migrated | Size | Public? | Notes |
|---|---|---|---|---|
| `accomplishment-reports` | 103 | ~800 MB | yes | Keys include `accomplishment-reports/<uuid>/<file>` (bucket-as-prefix quirk from Supabase) |
| `progress-photos` | 763 | ~994 MB | yes | Keys include `progress-photos/<uuid>/<file>` (same quirk) |
| `warehouse` | 64 | ~100 MB | yes | Keys are `dr/<uuid>/<file>` or `releases/<uuid>/<file>`. **64 files are DB-orphaned** — uploaded but not referenced by `delivery_receipts` / `release_forms` URL columns. Now safely on NAS but worth a cleanup audit. |
| `website-projects` | 41 (not migrated) | ~16 MB | yes | **Carveout** — stays on Supabase. The `website_project_photos.file_path` column doesn't store URLs (URLs computed at runtime via `supabase.storage.getPublicUrl()`), so a URL-rewrite mover can't handle it without a schema change. Keeping it on Supabase is acceptable since it's 0.8% of total storage. |

### Database columns rewritten by the mover
| Table | Column | Bucket |
|---|---|---|
| `accomplishment_reports` | `file_url` | accomplishment-reports |
| `progress_photos` | `file_url` | progress-photos |
| `delivery_receipts` | `dr_photo_url` | warehouse |
| `delivery_receipts` | `delivery_proof_url` | warehouse |
| `release_forms` | `attachment_url` | warehouse |

**Row counts rewritten (2026-04-22 drain):** `accomplishment_reports=16`, `progress_photos=758`, others=0. The 64 warehouse files are orphan files in Supabase Storage with no DB row pointing at them.

### Credentials inventory (values in password manager only)
| Entry | Purpose |
|---|---|
| `ARSD NAS · MinIO Root` | Root admin creds for MinIO. Only used to log into MinIO console + manage service accounts. Access Key = `wWyyCehAPxcpmajXzkzhaZx86lSzQupF`. |
| `ARSD NAS · Mover Service Account` | Scoped S3 account for `rclone`/app. Access Key = `VESY9HDMOCI98LK2BPCJ`. Policy `arsd-mover-policy` (PutObject/GetObject/DeleteObject/ListBucket on 3 buckets). |
| `ARSD NAS · Cloudflare Tunnel Token` | `eyJ...` token for the `arsd-nas` Cloudflare Tunnel. Stored in `/volume1/docker/cloudflared/.env`. |
| `Supabase · Storage S3 Credentials` | Source-side S3 creds for mover's `rclone` supabase remote. Generated via Supabase Dashboard → Storage → S3 Connection. |
| `Supabase · DB Connection URI (mover)` | Full pooled Postgres URI with DB password. Stored in `/volume1/docker/mover/.env`. |

⚠️ **During execution, several credential values were leaked into this chat/screenshot history**: the MinIO root Access Key, the mover service account Access Key and Secret Key, the Supabase Storage S3 keys, and the first Cloudflare Tunnel token (which we rotated early). The user explicitly declined to rotate after the migration. The blast radius is limited because: MinIO console is behind Cloudflare Access, mover account is scoped, tunnel re-generation is simple. **If you want to harden, rotate all listed credentials and redeploy Vercel env vars.**

---

## Step-by-Step Record (what we actually did, with gotchas)

### Part A — NAS Hardware & OS Prep

**What worked:**
- Enabled SSH via UGOS Pro Control Panel → Terminal & SNMP (port 22)
- Verified Docker 26.1.0 + Compose v2.26.1 (pre-installed on UGOS Pro)
- RAID 5 healthy, `/volume1` with 7.2 TB free

**Gotchas:**
- **SSH auto-shutoff:** UGOS Pro has a "Shut down SSH automatically" dropdown defaulted to `10 min later`. Must be set to **Never** (or you'll get "Connection refused" mid-session when it times out).
- **Permission denied after auth for Administrator user:** The `Rafael III` account has a space in the login name. SSH initially rejected auth despite the user being Administrator. Fix (accidental): changing password to a simple one (`Test1234!`) then logging into the UGOS Pro web UI as that user once, after which SSH started accepting the credentials. **Unclear which step was decisive** — either password reset triggered account activation, or the web UI login synced the password hash to SSH's PAM backend. **Do NOT assume UGOS Pro SSH will "just work" for named users** — have a plan to create a no-space admin account (`nasadmin`) as a fallback.
- **Wrong IP confusion:** The default gateway (`192.168.0.1`) shows up in some UGOS Pro config screens. The actual NAS IP was `192.168.0.251`. Find it via UGOS Pro → **Control Panel → Network → Network Connection**, looking for the LAN adapter's own IP address.
- **Username field contains display names:** UGOS Pro's "User name" field IS the login name (greyed out after creation — cannot rename). Spaces are valid in UGOS Pro but break downstream SSH/Linux tooling. Prefer lowercase, no-space usernames for admin accounts.

### Part B — MinIO Setup

**What worked:**
- Created `/volume1/docker/minio/{data,config}` + wrote `docker-compose.yml` + `.env`
- MinIO pulled cleanly via `docker compose up -d` after image tag correction
- Local health check passed: `curl http://127.0.0.1:9000/minio/health/live` → 200 OK

**Gotchas:**
- **The plan's MinIO image tag didn't exist:** `quay.io/minio/minio:RELEASE.2025-02-28T00-00-00Z` was a placeholder the plan author invented. **Fix:** changed to `quay.io/minio/minio:latest` via `sed -i`. Resolved to `RELEASE.2025-09-07T16-13-09Z` on ARM64.
- **`nano` is not installed on UGOS Pro.** Only `vi` / `vim.basic`. Heredoc pastes into bash got mangled multi-line. **Fix:** write `docker-compose.yml` locally on the laptop, SCP it up via `scp -O` (force legacy SCP protocol, since modern OpenSSH's SCP-over-SFTP fails silently against the NAS SSH server).
- **`chmod 600` on `/volume1/docker/minio/.env` didn't stick initially** — UGOS Pro's shared-folder ACLs (`+` in `ls -la`) overrode file mode. Running `chmod 600` a second time got it to `-rw-------`.
- **Credential accidentally included angle brackets:** When I instructed the user to paste values in place of `<placeholder>` text, they initially left the `<` and `>` literal characters in the `.env` file. MinIO wouldn't authenticate until the brackets were removed.
- **Docker permission errors in first run:** `permission denied ... /var/run/docker.sock`. Fixed in retry (either usermod -aG docker or the user re-SSH'd).

### Part C — Cloudflare Tunnel

**What worked:**
- Created tunnel `arsd-nas` in Cloudflare Zero Trust → got connector token
- Deployed `cloudflare/cloudflared:latest` in `/volume1/docker/cloudflared/`
- Two public hostnames added via Zero Trust **Published application routes**:
  - `s3.arsd.co` → `http://localhost:9000` (HTTP Host Header: `s3.arsd.co`)
  - `console.arsd.co` → `http://localhost:9001` (HTTP Host Header: `console.arsd.co`)
- Cloudflare Access policy `Allow superadmins` locks `console.arsd.co` to specific emails

**Gotchas:**
- **Cloudflare Zero Trust UI reorganization:** "Access → Applications" is now "Access controls → Applications" in the current Cloudflare One dashboard. Left sidebar navigation differs from plan.
- **Cloudflare Access took a moment to propagate:** first incognito visit to `https://console.arsd.co` still showed the raw MinIO login; refreshing after ~1 minute showed the Access challenge.
- **Token was leaked into chat via screenshot** — we rotated by deleting and recreating the tunnel with the same name.
- **"Not IPv4 compatible" dedicated pooler:** not relevant to Cloudflare but discovered while setting up the mover — see Part E.

### Part D — MinIO Buckets & Credentials

**What worked:**
- Installed `mc.exe` on Windows (from `https://dl.min.io/client/mc/release/windows-amd64/mc.exe`), added `C:\Tools` to PATH
- Created 3 buckets: `accomplishment-reports`, `progress-photos`, `warehouse` (no `website-projects` — carveout)
- Set `mc anonymous set download` on all three to match Supabase's public-bucket behavior
- Created `arsd-mover` service account + attached `arsd-mover-policy` (scoped to PutObject/GetObject/DeleteObject/ListBucket on the 3 buckets only)

**Gotchas:**
- **mc.exe landed in a temp folder:** Edge downloaded to `C:\Users\PC\AppData\Local\Temp\MicrosoftEdgeDownloads\<uuid>\mc.exe` which Windows auto-cleans. **Fix:** moved to `C:\Tools\mc.exe` and added to PATH permanently.
- **Anonymous policy permits `s3:ListBucket`:** anyone with a bucket URL can enumerate all file keys (`https://s3.arsd.co/<bucket>/` returns XML listing). Supabase's public buckets didn't expose listing. **Follow-up:** write a custom bucket policy that allows only `s3:GetObject`, not `s3:ListBucket`.
- **`mc admin user svcacct edit` says "not found" — it wasn't the mover's Access Key:** during troubleshooting a signature mismatch, we were using the MinIO **root user's** Access Key (`wWyyCehAPxcpmajXzkzhaZx86lSzQupF`) thinking it was the mover svcacct's. The actual mover Access Key was `VESY9HDMOCI98LK2BPCJ`, discovered via `mc admin user svcacct list arsd <root-user>`.

### Part E — Mover Install

**What worked:**
- `rclone v1.73.5` installed via `curl https://rclone.org/install.sh | sudo bash`
- `psql 15.16` installed via `sudo apt-get install postgresql-client`
- Supabase S3 creds + Postgres URI obtained from Dashboard → **Project Settings → Database** (Connect button → Shared Pooler / IPv4 tab)
- rclone remotes configured: `supabase:` (provider=Other, force_path_style=true) and `minio:` (provider=Minio, pointed at **http://127.0.0.1:9000** — see gotchas)
- `mover.sh` SCP'd to `/volume1/docker/mover/mover.sh`; `.env` with `DB_URL` written directly; `chmod 600` on `.env`, `chmod +x` on script
- DB connectivity test: `psql "$DB_URL" -c "SELECT version();"` → PostgreSQL 17.6

**Gotchas — this Part took the longest:**
- **SSH permission-denied on `rclone config create`:** the multi-line backslash-continuation form got mangled in PowerShell paste. **Fix:** use single-line command with explicit placeholders, replace values, paste once.
- **"Supabase · DB Connection URI" — do NOT use Dedicated Pooler:** it's IPv6-only (the NAS is IPv4). Use the **Shared Pooler / Transaction Pooler** with user `postgres.uoffxmrnpukibgcmmgus@aws-1-ap-southeast-1.pooler.supabase.com:6543`. The Supabase UI highlighted "Use IPv4 connection (Shared Pooler)" toggle that made this explicit.
- **rclone Supabase remote missing `force_path_style=true`:** first attempt returned `AccessDenied: Missing signature`. The Supabase S3 endpoint is path-style, so `force_path_style=true` + `env_auth=false` were required.
- **rclone MinIO remote → `SignatureDoesNotMatch` on every attempt:** we burned ~30 min on this. The culprit: **Cloudflare Tunnel modifies request headers in a way that invalidates AWS SigV4 signatures**. `mc` uses a different TCP/HTTP path that happens to work, but `rclone` doesn't. **Fix:** point the MinIO rclone remote at `http://127.0.0.1:9000` (localhost direct) instead of `https://s3.arsd.co`. The mover runs on the NAS anyway, so there's no reason to round-trip through Cloudflare. Only the public-facing reads (browser fetching images) need the tunnel.
- **Repeated confusion between root creds and svcacct creds:** we created a new svcacct with `mc admin user svcacct add`, but a few commands later we were pasting the ROOT user's Access Key into `rclone config` and `svcacct edit`, thinking it was the mover svcacct. Because the root's Access Key is just base64 and the mover svcacct's was alphanumeric, they look similar at a glance but aren't. **Lesson:** after `svcacct add`, save **both** keys in the password manager immediately AND tag them clearly as "SVCACCT" distinct from the root creds.

### Part F — One-time drain

**What worked:**
- Schema sanity check (`information_schema.columns`) confirmed all 5 URL columns exist with expected names
- Baseline count matched plan's expected values: `accomplishment_reports=16`, `progress_photos=758`, others=0
- Supabase scheduled backup from yesterday (2026-04-21 22:43 UTC) served as safety net (manual-backup button was either hidden or Pro-only in this UI)
- Dry-run confirmed ~927 files across 3 buckets
- Real drain: `AGE_HOURS=0 /volume1/docker/mover/mover.sh` moved everything in one run
- Post-drain: source=0 / destination=(103, 763, 64) ✓
- URL rewrite queries confirmed: 0 rows with Supabase URLs remaining, 774 rows with NAS URLs (matches baseline)
- App smoke test: live `https://arsd.co/dashboard` loaded progress photos via `https://s3.arsd.co/progress-photos/...` (DevTools Network tab showed 200 OK)

**Gotchas:**
- **`Create a manual backup` button was not available** in the Supabase Database → Backups UI for this project. The latest scheduled backup was one day old, which we accepted as sufficient (DB updates since yesterday were limited to the URL rewrite we're about to do, which is itself the safety net's purpose).
- **Warehouse bucket had 64 files but DB showed 0 Supabase-URL references** to them. The files migrated to NAS regardless (rclone copies whatever's in the bucket). Meaning: 64 warehouse files are **orphans** — uploaded but not referenced in `delivery_receipts` or `release_forms`. The URL rewrite had nothing to update for those. They're safe on NAS but the orphan state existed pre-migration.
- **Supabase Usage display lags by up to 1 hour.** Post-drain, the "Storage Size" dashboard card still showed 1.781 GB for a while. The underlying files ARE deleted; the usage counter just updates on a 1-hr refresh cycle.

### Part G — Cron Schedule

**What worked:**
- Added to **root's crontab** (user crontab was permission-denied): `30 2 * * * /volume1/docker/mover/mover.sh >> /volume1/docker/mover/logs/cron.log 2>&1`
- Logrotate config at `/etc/logrotate.d/mover` — weekly rotation, 8 weeks retention

**Gotchas:**
- **User crontab permission-denied:** `crontab -e` as `Rafael III` → `crontabs/Rafael III/: fdopen: Permission denied`. The space in the username breaks the crontab spool path. **Fix:** `sudo crontab -e` — root's crontab works fine and can invoke the mover script.
- **`cat > ... << EOF` heredoc inside `sudo bash -c '...'` failed** to parse the EOF terminator inside the quoted string. Left a stray `EOF` line in the output file and squashed newlines in a way logrotate rejected with `bad weekly directive`. **Fix:** wrote logrotate config locally, SCP'd to `~/logrotate-mover`, then `sudo mv ~/logrotate-mover /etc/logrotate.d/mover` + chown/chmod.

### Part H — Verification

- Production Vercel deploy auto-kicked on PR merge — verified green in Vercel dashboard
- Production delete test via `https://arsd.co/dashboard`: DELETE a progress photo → `POST /api/storage/delete-file` → 200 OK → file gone from `mc ls arsd/progress-photos/` ✓
- `docker ps --filter name=arsd-` shows both `arsd-minio` and `arsd-cloudflared` as Up (healthy)

### Part J — Delete Path Code Change

**What was changed:**
- **New:** `src/services/storage/delete-by-url.ts` — server-only `deleteByUrl(url)` helper, routes to MinIO (AWS SDK) or Supabase Storage based on URL prefix
- **New:** `src/app/api/storage/delete-file/route.ts` — auth-gated POST endpoint, wraps `deleteByUrl`. Accepts `{ url: string }`. Any authenticated user can call (intentional — access control is by knowing the URL, and the URL comes from the user's own DB rows).
- **Modified:** `src/services/progress-photos/progress-photos.service.ts` lines 204–217 — replaced inline `supabase.storage.remove([filePath])` with `fetch('/api/storage/delete-file', { url: photo.file_url })`
- **Not modified (intentional):**
  - `src/services/projects/website-projects.ts` — website-projects bucket is the carveout (stays on Supabase)
  - `src/services/warehouse/warehouse-storage.service.ts` — has zero callers in the codebase (dead code)
  - `src/services/storage/storage-cleanup.service.ts` — still targets Supabase Storage only; acceptable for post-migration since Supabase now only holds <24h-old files
- **Added env vars** to `CLAUDE.md`: `NAS_S3_ENDPOINT`, `NAS_S3_ACCESS_KEY_ID`, `NAS_S3_SECRET_ACCESS_KEY` (all server-only)
- **Dependency:** `npm install @aws-sdk/client-s3@3.632.0`

---

## Files on the NAS

| Path | Purpose | Permissions |
|---|---|---|
| `/volume1/docker/minio/docker-compose.yml` | MinIO container definition | ACL-controlled |
| `/volume1/docker/minio/.env` | `MINIO_ROOT_USER` + `MINIO_ROOT_PASSWORD` | 600 |
| `/volume1/docker/minio/data/` | MinIO's internal object storage (xl.meta + part.N format — **do NOT edit directly**) | ACL-controlled |
| `/volume1/docker/cloudflared/docker-compose.yml` | Cloudflared container definition | ACL-controlled |
| `/volume1/docker/cloudflared/.env` | `CF_TUNNEL_TOKEN` | 600 |
| `/volume1/docker/mover/mover.sh` | Nightly mover script | 755 |
| `/volume1/docker/mover/.env` | `DB_URL` (Supabase pooler URI with password) | 600 |
| `/volume1/docker/mover/logs/` | Per-run logs + `cron.log` | ACL-controlled |
| `/etc/logrotate.d/mover` | Rotates mover logs weekly, 8 weeks retention | 644 root:root |
| Root crontab entry | `30 2 * * * /volume1/docker/mover/mover.sh >> /volume1/docker/mover/logs/cron.log 2>&1` | - |

## Files in the App Repo (`arsd-dashboard`)

| Path | Purpose |
|---|---|
| `nas-config/minio/docker-compose.yml` | IaC copy of what's on the NAS |
| `nas-config/minio/policy-mover.json` | `arsd-mover-policy` policy source |
| `nas-config/cloudflared/docker-compose.yml` | IaC copy |
| `nas-config/mover/mover.sh` | IaC copy |
| `nas-config/mover/logrotate-mover` | IaC copy of `/etc/logrotate.d/mover` |
| `src/services/storage/delete-by-url.ts` | Server-only delete router by URL prefix |
| `src/app/api/storage/delete-file/route.ts` | Thin POST wrapper around `deleteByUrl` |
| `src/services/progress-photos/progress-photos.service.ts` | Uses `/api/storage/delete-file` instead of inline supabase remove |
| `CLAUDE.md` | Added `NAS_S3_*` env vars to documented list |
| `docs/superpowers/plans/2026-04-22-nas-tiered-storage-migration.md` | The plan followed |
| `docs/superpowers/plans/2026-04-20-ugreen-nas-storage-migration.md` | Superseded — DO NOT execute |

## Vercel Environment Variables

The following three MUST be set in Vercel → Project Settings → Environment Variables for Production + Preview:

- `NAS_S3_ENDPOINT = https://s3.arsd.co`
- `NAS_S3_ACCESS_KEY_ID` = (mover svcacct Access Key)
- `NAS_S3_SECRET_ACCESS_KEY` = (mover svcacct Secret Key)

Without these, `POST /api/storage/delete-file` throws in production because `process.env.NAS_S3_ENDPOINT!` is undefined.

---

## Operational Runbook

### Daily health checks

```bash
# SSH to NAS
docker ps --filter name=arsd-                    # Both containers Up
tail -20 /volume1/docker/mover/logs/cron.log     # Last mover run summary
ls -lt /volume1/docker/mover/logs/ | head -5     # Is there a fresh mover-YYYYMMDD-023000.log?
```

### Check Supabase remains near-empty

Supabase Dashboard → Database → Usage → Storage Size. Expected steady-state: < 50 MB (just `website-projects` + any <24h-old recent uploads).

### Check disk space on NAS

```bash
df -h /volume1
du -sh /volume1/docker/minio/data/*
```

### Manually trigger a mover run (if needed)

```bash
/volume1/docker/mover/mover.sh
# Or force-drain everything regardless of age:
AGE_HOURS=0 /volume1/docker/mover/mover.sh
```

Tail the live log:
```bash
tail -f /volume1/docker/mover/logs/mover-*.log
```

### Restart a stuck container

```bash
docker restart arsd-minio
docker restart arsd-cloudflared
```

### Inspect what's in MinIO

From the laptop:
```powershell
mc admin info arsd                  # server info
mc ls arsd                           # list buckets
mc ls --recursive arsd/progress-photos | head -20
mc du arsd/progress-photos           # disk usage
```

Or via the MinIO Console: `https://console.arsd.co` (Cloudflare Access → MinIO root login).

---

## Known Issues & Follow-ups

### Security follow-ups (none blocking, ordered by priority)

1. **Rotate all leaked credentials.** During the execution several values ended up in chat screenshots. The user explicitly declined to rotate now. When convenient, rotate: MinIO root, mover service account (both access and secret keys), Cloudflare Tunnel token, Supabase Storage S3 keys. Update the corresponding `.env` files on NAS, restart MinIO + cloudflared, update Vercel env vars.
2. **Remove `s3:ListBucket` from anonymous policy.** Currently anyone with a bucket URL can list every file (`https://s3.arsd.co/<bucket>/` returns XML). Fix by replacing `mc anonymous set download` with a custom policy that only allows `s3:GetObject`.
3. **Consider private buckets + signed URLs.** The plan explicitly said "security hardening (private buckets + signed URLs) is out of scope." For now, anyone with a direct file URL can access it (same as Supabase's public buckets). Move to signed URLs if uploading PII or internal-only content.

### Functional follow-ups

4. **64 orphan warehouse files.** Exist on NAS but not referenced by any DB row. Decide whether to: (a) audit + clean up, (b) search other tables for references, or (c) leave as-is (they're cheap to keep). Run `mc ls --recursive arsd/warehouse/` to see them.
5. **NAS-side cleanup job.** `storage-cleanup.service.ts` only touches Supabase. Orphans on the NAS side grow forever. Plan §J.7.2 suggests a nightly NAS cleanup job that lists MinIO objects and deletes any not referenced in the DB. Not implemented in this phase.
6. **Refactor `website-projects` bucket.** Currently a carveout because `website_project_photos.file_path` stores only the path, not URL. If we want it on NAS too, need to: (a) add a new column or migrate the existing one to full URLs, (b) adapt `website-projects-server.ts` to use the NAS URL, (c) extend the mover. Only worth doing if Supabase Storage cost becomes a concern again.
7. **Smaller log files.** The mover writes a new `mover-YYYYMMDD-HHMMSS.log` every run PLUS appends to `cron.log`. Currently logrotate handles `*.log`. Consider consolidating — drop the per-run file or the cron.log, not both.

### Ops improvements

8. **Email/Slack alert on mover failure.** Currently silent failures only show in logs. Add a wrapper around the cron line: `mover.sh ... || notify-failed.sh`.
9. **Monitoring endpoint.** `https://s3.arsd.co/minio/health/live` already exists and returns 200 when MinIO is up. Consider adding an uptime monitor (e.g., UptimeRobot free tier).
10. **Offsite backup.** Currently NAS is the only copy. If the NAS fails (fire, theft, drive failure beyond RAID tolerance), all 930 files are lost. Consider: rclone to a second cloud bucket, or a second NAS at a different location.

---

## Lessons Learned (in rough order of pain)

1. **SSH-over-Cloudflare-tunnel breaks SigV4.** The single biggest time sink. `rclone` failed for ~30 minutes because we were pointing at `https://s3.arsd.co` when the NAS could just use `http://127.0.0.1:9000` directly. **Rule:** services that live on the same host as MinIO should always talk to it via localhost.
2. **Service accounts ≠ root users.** After `mc admin user svcacct add`, the printed Access Key is the SVCACCT's, NOT the root's. Easy to confuse them later, especially when troubleshooting, because the first `mc alias set` prompt uses the root's Access Key (it IS the root user). Always save both distinctly in the password manager, and label them (`SVCACCT` vs `ROOT`).
3. **SCP a file instead of heredoc'ing into a terminal paste.** Multi-line YAML/JSON/shell scripts got mangled every time we tried to paste into `cat > file << EOF`. Writing locally + `scp -O file 'user@host:path'` worked every time. Use this pattern for any multi-line config.
4. **UGOS Pro is opinionated and under-documented.** It has weird ACL behavior on `/volume1` (overrides chmod), quirky SSH behavior with space-named users, its own Docker pre-installed, no `nano`. Don't assume standard Linux server behavior.
5. **Credentials in screenshots are forever.** Several rotations happened because values ended up in chat images. Best practice during any credential setup: only screenshot **verification commands** (`ls -la`, `wc -l`, `grep -c`, `mc admin info`) — never the commands that **set** the credentials (`echo 'KEY=value'`, `mc admin user svcacct edit ... --secret-key`, any `rclone config create` with inline secrets).
6. **Clock skew causes different errors than you'd think.** `SignatureDoesNotMatch` can be a symptom of clock skew (>15 min off), and MinIO's error message doesn't distinguish from "wrong key". Always verify clocks with `date` on both sides when debugging signing issues.
7. **The plan's image tag was fake.** `quay.io/minio/minio:RELEASE.2025-02-28T00-00-00Z` was a placeholder. Always pull the current `:latest`, let it resolve, then write the resolved tag back into the plan / docker-compose for reproducibility.

---

## If You Need to Rebuild This From Scratch

Approximate effort: **~3 days** with this record as a guide (vs ~1 day if everything works first try). Estimate a full day for Parts A–E (the NAS-side plumbing), half a day for F (the drain — mostly waiting on rclone), and a day for J (code + PR + smoke tests).

Prerequisites before starting:
- DNS for your domain is on Cloudflare (proxied, orange cloud). Plan: `2026-04-22-vercel-to-cloudflare-dns.md`.
- NAS hardware racked, RAID healthy, UPS connected, SSH working, Docker installed.
- Supabase project exists and you have Dashboard access.
- Password manager access.
- Local dev machine with `git`, `npm`, Edge/Chrome for Cloudflare dashboard, PowerShell.

Order of operations (skip the dead ends this record captured):
1. **Part A** — inventory + SSH + Docker check. ⚠️ Create a no-space admin user like `nasadmin` if your existing admin has a space.
2. **Part B** — MinIO. SCP docker-compose from laptop (don't heredoc). Image tag: `quay.io/minio/minio:latest`.
3. **Part C** — Cloudflared + two hostnames. Lock console with Cloudflare Access.
4. **Part D** — `mc` on laptop → alias → 3 buckets → anonymous download → svcacct + policy. **Save both Access Key and Secret Key of the svcacct in the password manager tagged `SVCACCT`.**
5. **Part E** — rclone: use `http://127.0.0.1:9000` for the minio remote, `force_path_style=true` for both remotes. Use Shared Pooler for DB.
6. **Part F** — baseline count → drain with `AGE_HOURS=0` → verify counts match → app smoke test.
7. **Part G** — sudo crontab -e (user crontab won't work). SCP logrotate config.
8. **Part J** — code change, npm install, Vercel env vars, PR, merge.
9. **Part H** — verify live app delete works end-to-end; check cron fires next morning.

Use `docker-compose.yml`, `mover.sh`, and `logrotate-mover` from `nas-config/` as starting templates.

---

## Appendix: Full Command Recap (the happy path)

For someone re-running, here are the commands in order, minus the dead ends:

```bash
# Part A (run on NAS after SSH)
docker --version            # verify ≥ 24
docker compose version      # verify v2
df -h /volume1              # verify free space

# Part B (NAS)
mkdir -p /volume1/docker/{minio/data,minio/config,cloudflared,mover/logs}
# SCP docker-compose.yml from nas-config/minio/ (force -O flag)
echo 'MINIO_ROOT_USER=<value>' > /volume1/docker/minio/.env
echo 'MINIO_ROOT_PASSWORD=<value>' >> /volume1/docker/minio/.env
chmod 600 /volume1/docker/minio/.env
cd /volume1/docker/minio && docker compose up -d
curl -sSf http://127.0.0.1:9000/minio/health/live

# Part C (Cloudflare dashboard + NAS)
# 1. Create tunnel 'arsd-nas' in one.dash.cloudflare.com
# 2. SCP cloudflared docker-compose.yml
echo 'CF_TUNNEL_TOKEN=<token>' > /volume1/docker/cloudflared/.env
chmod 600 /volume1/docker/cloudflared/.env
cd /volume1/docker/cloudflared && docker compose up -d
# 3. Add public hostnames s3.arsd.co → localhost:9000, console.arsd.co → localhost:9001
# 4. Add Cloudflare Access policy on console.arsd.co

# Part D (from workstation / PowerShell)
mc alias set arsd https://s3.arsd.co <ROOT_USER> <ROOT_PASS>
mc admin info arsd
mc mb arsd/accomplishment-reports arsd/progress-photos arsd/warehouse
mc anonymous set download arsd/accomplishment-reports
mc anonymous set download arsd/progress-photos
mc anonymous set download arsd/warehouse
mc admin user svcacct add arsd <ROOT_USER> --name arsd-mover
mc admin policy create arsd arsd-mover-policy policy-mover.json
mc admin policy attach arsd arsd-mover-policy --user <SVCACCT_ACCESS_KEY>

# Part E (NAS)
curl https://rclone.org/install.sh | sudo bash
sudo apt-get install -y postgresql-client
rclone config create supabase s3 provider=Other endpoint=https://<PROJECT>.storage.supabase.co/storage/v1/s3 access_key_id=<KEY> secret_access_key=<SECRET> region=ap-southeast-1 force_path_style=true env_auth=false
rclone config create minio s3 provider=Minio endpoint=http://127.0.0.1:9000 access_key_id=<SVCACCT_ACCESS> secret_access_key=<SVCACCT_SECRET> region=us-east-1 force_path_style=true env_auth=false
rclone lsd supabase:    # should show 4 buckets
rclone lsd minio:       # should show 3 buckets
# SCP mover.sh, chmod +x
echo 'DB_URL=<POOLED_URI>' > /volume1/docker/mover/.env
chmod 600 /volume1/docker/mover/.env
source /volume1/docker/mover/.env && psql "$DB_URL" -c "SELECT version();"

# Part F (NAS, from mover dir)
# Schema sanity + baseline count queries (see file)
# Take a Supabase DB backup (scheduled or manual)
AGE_HOURS=0 /volume1/docker/mover/mover.sh

# Part G (NAS)
sudo crontab -e   # add: 30 2 * * * /volume1/docker/mover/mover.sh >> /volume1/docker/mover/logs/cron.log 2>&1
# SCP logrotate config, sudo mv to /etc/logrotate.d/mover

# Part J (workstation)
npm install @aws-sdk/client-s3@3.632.0
# Add NAS_S3_ENDPOINT, NAS_S3_ACCESS_KEY_ID, NAS_S3_SECRET_ACCESS_KEY to .env.local AND Vercel
# Add the two new files + edit progress-photos.service.ts
git add <files> && git commit && git push
gh pr create --base main ...
# After PR merge → Vercel auto-deploys → production smoke test
```

---

**End of record.** If a future operator reads this and something's wrong, the most likely cause is drift in one of: Supabase UI layout, Cloudflare Zero Trust UI layout, UGOS Pro version behavior, MinIO image API, rclone config option names. Cross-check against the current dashboards before blindly following commands.
