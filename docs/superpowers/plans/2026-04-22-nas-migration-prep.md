# NAS Migration Pre-NAS Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every piece of work that does not require physical or SSH access to the UGREEN NAS, so that when NAS access becomes available, only hands-on hardware setup remains. Ship the production code change (`deleteByUrl` helper) to Vercel ahead of the NAS going live — safe because no URLs will start with `https://s3.arsd.co/` until the mover runs.

**Architecture:** A dual-mode `deleteByUrl(url)` helper inspects the URL's prefix and routes the delete to either Supabase Storage (existing code path) or MinIO via `@aws-sdk/client-s3` (new code path). Until the NAS is live, every URL is a Supabase URL, so behavior is unchanged; once the nightly mover on the NAS starts rewriting URLs, the S3 branch activates transparently. Parsing is extracted into a pure function (`parseStorageUrl`) so it can be tested without mocking SDKs. In parallel, all credentials, the MinIO IAM policy, the mover shell script, and the Cloudflare Tunnel are pre-staged so §A–G of `2026-04-22-nas-tiered-storage-migration.md` become pure execution.

**Tech Stack:** TypeScript · Next.js 14 (App Router) · `@aws-sdk/client-s3@3.632.0` · `tsx` (for running TS test files) · Node.js built-in `node:test` · Supabase JS client · npm · `shellcheck` (optional)

**Prerequisite:** `2026-04-22-vercel-to-cloudflare-dns.md` complete — `arsd.co` is Active on Cloudflare, SSL mode Full (strict), yellow proxy warning cleared.

**Related:** This plan executes the no-NAS-needed portions of `2026-04-22-nas-tiered-storage-migration.md`. The remaining portions (§A–G hands-on NAS work) run after NAS access is obtained.

---

## File Structure

**Files to create:**
- `src/services/storage/delete-by-url.ts` — routing helper exporting `parseStorageUrl` (pure) and `deleteByUrl` (performs the delete)
- `src/services/storage/delete-by-url.test.ts` — tests for `parseStorageUrl` using `node:test`
- `.env.local.example` — env var template; currently absent from repo despite being referenced in `CLAUDE.md`
- `docs/superpowers/artifacts/policy-mover.json` — MinIO IAM policy for the mover service account
- `docs/superpowers/artifacts/mover.sh` — the nightly mover script, shellcheck-validated on workstation before deployment
- `docs/superpowers/artifacts/README.md` — one-page index of what these artifacts are and when each is used

**Files to modify:**
- `package.json` — add two deps (`@aws-sdk/client-s3`, `tsx`), add `test` script
- `src/services/progress-photos/progress-photos.service.ts` (lines 204–217) — swap manual URL parsing + `supabase.storage.remove` for `deleteByUrl(photo.file_url)`

**Files explicitly NOT modified in this plan (carveouts or deferred):**
- `src/services/projects/website-projects.ts` — **carveout**: the `website-projects` bucket stays on Supabase (see main plan §Context). The table stores only `file_path` (no `url` column), so a URL-rewrite mover cannot target it without a cross-cutting schema refactor. Since the bucket is only 16 MB (0.8% of total), leaving it on Supabase is the pragmatic choice. Current delete logic remains correct.
- `src/services/warehouse/warehouse-storage.service.ts` — its `deleteFile` method currently has zero callers in the codebase (verified via grep). Leave untouched; revisit if warehouse delete flows are added.
- `src/services/storage/storage-cleanup.service.ts` — still targets Supabase only. Appropriate for tiered-storage phase 1 since Supabase holds only <24h files post-mover. NAS cleanup is future work.

**External actions (Supabase dashboard, Cloudflare dashboard, password manager) — no files modified:**
- Supabase: take manual DB backup · enable Storage S3 Connection · copy credentials to password manager
- Cloudflare Zero Trust: create the `arsd-nas` tunnel shell (no public hostnames yet) · copy connector token to password manager
- Workstation: generate MinIO root user/password with `openssl`, save to password manager

---

## Key Decisions (locked in)

1. **Test tool:** `node --test` via `tsx` for TypeScript support. One devDep (`tsx`). Rationale: codebase has no existing test framework; full Jest/Vitest adoption is out of scope for a single-file helper.
2. **Pure-function seam:** `parseStorageUrl` returns `{ backend: 'supabase' | 'nas' | null, bucket: string, key: string }`. Testable with simple assertions; no SDK mocking needed.
3. **Forward-compatible prefixes:** Only two prefixes recognized. Unknown URLs throw — explicit fail-fast over silent success.
4. **S3 client is lazy-initialized** inside `deleteByUrl` to avoid reading env vars at module load time (Next.js builds would fail if vars are unset).
5. **Commit style:** follow the repo's existing Conventional Commits (`feat:`, `refactor:`, `docs:`, `chore:`) seen in recent history.

---

## Task 1: Verify Postgres schema matches the mover's UPDATE targets

**Files:** None (read-only verification via Supabase MCP).

- [ ] **Step 1: Run schema query**

Run this SQL via the Supabase MCP `execute_sql` tool against project `uoffxmrnpukibgcmmgus`:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'accomplishment_reports' AND column_name = 'file_url') OR
    (table_name = 'website_project_photos' AND column_name IN ('url', 'file_path')) OR
    (table_name = 'progress_photos' AND column_name IN ('url', 'file_url')) OR
    (table_name = 'delivery_receipts' AND column_name = 'photo_url')
  )
ORDER BY table_name, column_name;
```

Expected: 4+ rows listing each table/column pair. All URL columns should be `text` or `character varying`.

- [ ] **Step 2: Count rows currently holding Supabase URLs**

```sql
SELECT 'accomplishment_reports' AS tbl, COUNT(*) FROM accomplishment_reports WHERE file_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%'
UNION ALL SELECT 'website_project_photos', COUNT(*) FROM website_project_photos WHERE url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%'
UNION ALL SELECT 'progress_photos', COUNT(*) FROM progress_photos WHERE url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%'
UNION ALL SELECT 'delivery_receipts', COUNT(*) FROM delivery_receipts WHERE photo_url LIKE 'https://uoffxmrnpukibgcmmgus.supabase.co/%';
```

Record the 4 counts in your ops notes — these are the rows the one-time drain will rewrite.

- [ ] **Step 3: If any table/column is absent or misnamed, STOP**

Update `2026-04-22-nas-tiered-storage-migration.md` §E.6.1 `mover.sh` and §F.1 to match reality **before** running the mover. Do not proceed with the rest of this plan until the schema is confirmed.

- [ ] **Step 4: No commit — this is a read-only verification**

---

## Task 2: Take a manual Supabase DB backup (safety net)

**Files:** None (Supabase dashboard action).

- [ ] **Step 1: Trigger backup**

Supabase Dashboard → project `uoffxmrnpukibgcmmgus` → **Database → Backups** → **Create a manual backup**. Wait for the status to show "Completed".

- [ ] **Step 2: Record metadata**

Save to your ops notes:
- Backup timestamp (UTC)
- Backup size
- Expiration (free-tier backups retained 7 days)

- [ ] **Step 3: No commit**

---

## Task 3: Enable Supabase Storage S3 Connection + save credentials

**Files:** None (dashboard + password manager).

- [ ] **Step 1: Enable S3 Connection**

Supabase Dashboard → **Project Settings → Storage → S3 Connection** → click **Enable**.

- [ ] **Step 2: Create access credentials**

Still in the S3 Connection panel, click **"New access key"**. Give it a description: `arsd-nas-mover`. Copy:
- Endpoint (e.g., `https://uoffxmrnpukibgcmmgus.storage.supabase.co/storage/v1/s3`)
- Region (e.g., `ap-southeast-1`)
- Access Key
- Secret Key

- [ ] **Step 3: Save to password manager**

Create entry: **"Supabase · Storage S3 Credentials (arsd-nas-mover)"**. Fields: Endpoint, Region, Access Key, Secret Key. These are used by the NAS-side `rclone` configuration in §E.5 of the main plan.

- [ ] **Step 4: No commit**

---

## Task 4: Generate MinIO root credentials and save to password manager

**Files:** None (workstation tooling + password manager).

- [ ] **Step 1: Generate user**

Run on workstation (Git Bash on Windows, Terminal on macOS/Linux):

```bash
openssl rand -base64 24
```

Example output: `R5qT3K9mN8pL7jH2vXw4yZaB`. Copy verbatim.

- [ ] **Step 2: Generate password**

```bash
openssl rand -base64 32
```

Example output: `uP4xN7vL8mQ2jR9tK6hZ3wY5bA1sV0fG8eD4cF7iE6h=`. Copy verbatim.

- [ ] **Step 3: Save both to password manager**

Create entry: **"ARSD NAS · MinIO Root"**. Fields: `MINIO_ROOT_USER` (value from Step 1), `MINIO_ROOT_PASSWORD` (value from Step 2). These feed into `/volume1/docker/minio/.env` during NAS setup (main plan §B.4).

- [ ] **Step 4: No commit**

---

## Task 5: Create the Cloudflare Tunnel shell (no NAS yet)

**Files:** None (Cloudflare Zero Trust dashboard + password manager).

- [ ] **Step 1: Create the tunnel**

https://one.dash.cloudflare.com → your account → **Networks → Tunnels → Create a tunnel**.

- Connector type: **Cloudflared**
- Tunnel name: **`arsd-nas`**
- Click **Save tunnel**.

- [ ] **Step 2: Copy the connector token**

On the install-command screen, locate the long token beginning with `eyJ...` embedded in the suggested install command. Copy **only the token**, not the full command.

- [ ] **Step 3: Save to password manager**

Create entry: **"ARSD NAS · Cloudflare Tunnel Token"**. Paste the token. This feeds into `/volume1/docker/cloudflared/.env` during NAS setup (main plan §C.2.2).

- [ ] **Step 4: Do not configure public hostnames yet**

Public hostnames require MinIO to be listening on `localhost:9000` / `localhost:9001` on the NAS. Leave the tunnel status as **INACTIVE** for now. Exit the setup wizard.

- [ ] **Step 5: No commit**

---

## Task 6: Create the artifacts directory and save policy-mover.json

**Files:**
- Create: `docs/superpowers/artifacts/policy-mover.json`
- Create: `docs/superpowers/artifacts/README.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "docs/superpowers/artifacts"
```

- [ ] **Step 2: Write `docs/superpowers/artifacts/policy-mover.json`**

`website-projects` is intentionally omitted — it's a carveout (stays on Supabase).

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

- [ ] **Step 3: Write `docs/superpowers/artifacts/README.md`**

```markdown
# NAS Migration Artifacts

Pre-staged configs for the Supabase → UGREEN NAS tiered-storage migration.

## Files

| File | Used in | When |
|---|---|---|
| `policy-mover.json` | `2026-04-22-nas-tiered-storage-migration.md` §D.5.3 | Registered via `mc admin policy create` after MinIO is up |
| `mover.sh` | `2026-04-22-nas-tiered-storage-migration.md` §E.6 | Copied to `/volume1/docker/mover/mover.sh` on the NAS |

Do not commit real secrets here. Both files are templates; secrets live in the operator's password manager and the NAS `.env` files.
```

- [ ] **Step 4: Verify files**

```bash
ls docs/superpowers/artifacts/
```

Expected output: `README.md  policy-mover.json`.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/artifacts/policy-mover.json docs/superpowers/artifacts/README.md
git commit -m "docs: add NAS mover IAM policy artifact"
```

---

## Task 7: Save mover.sh into artifacts (shellcheck-validated)

**Files:**
- Create: `docs/superpowers/artifacts/mover.sh`

- [ ] **Step 1: Write `docs/superpowers/artifacts/mover.sh`**

```bash
#!/bin/bash
# ==============================================================================
# Supabase -> NAS tiered-storage mover
# Deployed to /volume1/docker/mover/mover.sh on the UGREEN NAS.
# Runs nightly via cron (see §G of 2026-04-22-nas-tiered-storage-migration.md).
#
# Flow:
#   1. rclone copy supabase:<bucket> minio:<bucket> --min-age ${AGE_HOURS}h
#   2. psql UPDATE rewriting file URLs (one transaction across 4 tables)
#   3. rclone delete supabase:<bucket> --min-age ${AGE_HOURS}h
#
# Idempotent: re-running after a partial failure is safe because URL REPLACE
# is prefix-matched and rclone delete only removes files older than the age
# threshold.
# ==============================================================================
set -euo pipefail

# Load secrets (DB_URL)
source /volume1/docker/mover/.env

AGE_HOURS="${AGE_HOURS:-24}"
SUPABASE_PREFIX="https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public"
NAS_PREFIX="https://s3.arsd.co"
# website-projects is intentionally excluded (carveout — see main plan).
BUCKETS=(accomplishment-reports progress-photos warehouse)
LOG_DIR="/volume1/docker/mover/logs"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOG_DIR/mover-$STAMP.log"

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG") 2>&1

echo "=== Mover run started: $(date -Iseconds) ==="
echo "AGE_HOURS=$AGE_HOURS"

# --- Step 1: Copy old-enough files Supabase -> MinIO ---
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

# --- Step 2: Rewrite URLs in Postgres (columns verified 2026-04-22) ---
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

# --- Step 3: Delete old-enough files from Supabase (not website-projects) ---
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

- [ ] **Step 2: Validate with shellcheck (optional but recommended)**

If `shellcheck` is installed on your workstation:

```bash
shellcheck docs/superpowers/artifacts/mover.sh
```

Expected: no output (clean). If warnings appear, fix them before committing.

If shellcheck is not installed, skip — NAS will execute the script regardless; shellcheck is just a lint pass.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/artifacts/mover.sh
git commit -m "docs: add NAS nightly mover script artifact"
```

---

## Task 8: Add `tsx` dev dependency and `test` npm script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `tsx` as devDependency**

```bash
npm install --save-dev tsx@^4.19.0
```

Expected: `package.json` gets a new line in `devDependencies`, `package-lock.json` updated.

- [ ] **Step 2: Add `test` script**

Edit `package.json`. In the `"scripts"` block, add a `test` entry:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --import tsx --test src/**/*.test.ts"
  }
}
```

- [ ] **Step 3: Verify**

```bash
npm run test
```

Expected output (no tests yet): `# tests 0` / `# pass 0` / `# fail 0`. Zero exit code. No errors.

> On Windows, if the glob `src/**/*.test.ts` is passed literally, run `npx tsx --test src/services/storage/delete-by-url.test.ts` explicitly after Task 10 instead.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tsx and test script for single-file tests"
```

---

## Task 9: Install `@aws-sdk/client-s3`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install pinned version**

```bash
npm install @aws-sdk/client-s3@3.632.0
```

Pin the exact version — do not use `^` or `latest`. Rationale: the AWS SDK has had breaking changes historically; pinning avoids surprise regressions.

- [ ] **Step 2: Verify**

```bash
node -e "const { S3Client } = require('@aws-sdk/client-s3'); console.log(typeof S3Client);"
```

Expected: `function`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @aws-sdk/client-s3 for NAS MinIO integration"
```

---

## Task 10: Write failing tests for `parseStorageUrl`

**Files:**
- Create: `src/services/storage/delete-by-url.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStorageUrl } from './delete-by-url';

test('parseStorageUrl returns supabase backend for Supabase public URL', () => {
  const result = parseStorageUrl(
    'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/progress-photos/abc/photo.jpg'
  );
  assert.deepEqual(result, {
    backend: 'supabase',
    bucket: 'progress-photos',
    key: 'abc/photo.jpg',
  });
});

test('parseStorageUrl returns supabase backend for Supabase URL with deep path', () => {
  const result = parseStorageUrl(
    'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/warehouse/dr/uuid-1234/delivery.png'
  );
  assert.deepEqual(result, {
    backend: 'supabase',
    bucket: 'warehouse',
    key: 'dr/uuid-1234/delivery.png',
  });
});

test('parseStorageUrl returns nas backend for NAS URL', () => {
  const result = parseStorageUrl(
    'https://s3.arsd.co/progress-photos/project-42/week-1/photo.jpg'
  );
  assert.deepEqual(result, {
    backend: 'nas',
    bucket: 'progress-photos',
    key: 'project-42/week-1/photo.jpg',
  });
});

test('parseStorageUrl returns nas backend for NAS URL with single-level key', () => {
  const result = parseStorageUrl(
    'https://s3.arsd.co/accomplishment-reports/report.xlsx'
  );
  assert.deepEqual(result, {
    backend: 'nas',
    bucket: 'accomplishment-reports',
    key: 'report.xlsx',
  });
});

test('parseStorageUrl throws on unrecognized URL prefix', () => {
  assert.throws(
    () => parseStorageUrl('https://example.com/some/file.jpg'),
    /unrecognized URL prefix/
  );
});

test('parseStorageUrl throws on malformed Supabase URL (no bucket)', () => {
  assert.throws(
    () => parseStorageUrl('https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/'),
    /missing bucket or key/
  );
});

test('parseStorageUrl throws on malformed NAS URL (bucket but no key)', () => {
  assert.throws(
    () => parseStorageUrl('https://s3.arsd.co/progress-photos'),
    /missing bucket or key/
  );
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx tsx --test src/services/storage/delete-by-url.test.ts
```

Expected: all 7 tests fail with module-not-found error because `./delete-by-url` doesn't exist yet:
```
Error: Cannot find module ... delete-by-url
```

Zero exit code would indicate a false positive — non-zero exit code is required here.

- [ ] **Step 3: Do not commit yet** (tests are failing — commit after Task 11 when they pass).

---

## Task 11: Implement `parseStorageUrl` to pass the tests

**Files:**
- Create: `src/services/storage/delete-by-url.ts`

- [ ] **Step 1: Write the initial implementation**

```typescript
const SUPABASE_PUBLIC_PREFIX =
  'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/';
const NAS_PREFIX = 'https://s3.arsd.co/';

export type StorageBackend = 'supabase' | 'nas';

export interface ParsedStorageUrl {
  backend: StorageBackend;
  bucket: string;
  key: string;
}

export function parseStorageUrl(url: string): ParsedStorageUrl {
  let rest: string;
  let backend: StorageBackend;

  if (url.startsWith(SUPABASE_PUBLIC_PREFIX)) {
    backend = 'supabase';
    rest = url.slice(SUPABASE_PUBLIC_PREFIX.length);
  } else if (url.startsWith(NAS_PREFIX)) {
    backend = 'nas';
    rest = url.slice(NAS_PREFIX.length);
  } else {
    throw new Error(`parseStorageUrl: unrecognized URL prefix: ${url}`);
  }

  const firstSlash = rest.indexOf('/');
  if (firstSlash <= 0 || firstSlash === rest.length - 1) {
    throw new Error(`parseStorageUrl: missing bucket or key in URL: ${url}`);
  }

  const bucket = rest.slice(0, firstSlash);
  const key = rest.slice(firstSlash + 1);

  if (!bucket || !key) {
    throw new Error(`parseStorageUrl: missing bucket or key in URL: ${url}`);
  }

  return { backend, bucket, key };
}
```

- [ ] **Step 2: Run tests to verify all pass**

```bash
npx tsx --test src/services/storage/delete-by-url.test.ts
```

Expected:
```
# tests 7
# pass 7
# fail 0
```

Zero exit code.

- [ ] **Step 3: Commit**

```bash
git add src/services/storage/delete-by-url.ts src/services/storage/delete-by-url.test.ts
git commit -m "feat(storage): add parseStorageUrl helper for dual-backend routing"
```

---

## Task 12: Implement `deleteByUrl` (routes to S3 or Supabase)

**Files:**
- Modify: `src/services/storage/delete-by-url.ts`

- [ ] **Step 1: Extend the file with `deleteByUrl`**

Append to `src/services/storage/delete-by-url.ts`:

```typescript
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@/lib/supabase';

let s3ClientSingleton: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientSingleton) {
    const endpoint = process.env.NAS_S3_ENDPOINT;
    const accessKeyId = process.env.NAS_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.NAS_S3_SECRET_ACCESS_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'deleteByUrl: NAS_S3_ENDPOINT / NAS_S3_ACCESS_KEY_ID / NAS_S3_SECRET_ACCESS_KEY not set',
      );
    }
    s3ClientSingleton = new S3Client({
      endpoint,
      region: process.env.NAS_S3_REGION ?? 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return s3ClientSingleton;
}

export async function deleteByUrl(url: string): Promise<void> {
  const { backend, bucket, key } = parseStorageUrl(url);

  if (backend === 'nas') {
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([key]);
  if (error) throw error;
}
```

> The `import { createClient } from '@/lib/supabase'` matches the existing pattern in `src/services/progress-photos/progress-photos.service.ts` (line 1). If the build fails with a module-resolution error, check the actual export path in `src/lib/supabase.ts` and adjust.

- [ ] **Step 2: Verify the existing tests still pass**

```bash
npx tsx --test src/services/storage/delete-by-url.test.ts
```

Expected: `# pass 7 / # fail 0`. The new code shouldn't break parsing tests.

- [ ] **Step 3: Confirm the file compiles under the repo's tsconfig**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear, they will most likely be:
- `@/lib/supabase` path — verify with `ls src/lib/supabase.ts`; adjust import if needed.
- Missing `@aws-sdk/client-s3` types — re-run `npm install` to hydrate.

- [ ] **Step 4: Commit**

```bash
git add src/services/storage/delete-by-url.ts
git commit -m "feat(storage): add deleteByUrl routing to Supabase or NAS MinIO"
```

---

## Task 13: Create `.env.local.example`

**Files:**
- Create: `.env.local.example`

- [ ] **Step 1: Read current `.env.local` structure**

```bash
cat .env.local | sed 's/=.*/=/' | head -20
```

This shows variable names without values. Use it as the source of truth for what vars exist.

- [ ] **Step 2: Write `.env.local.example`**

Use the variable names observed in Step 1. Add the four new `NAS_S3_*` vars at the bottom.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Firebase (legacy — may be removable)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# NAS (MinIO on UGREEN via Cloudflare Tunnel)
# Leave blank until the NAS is live. Fill in Vercel project env vars only.
NAS_S3_ENDPOINT=
NAS_S3_REGION=us-east-1
NAS_S3_ACCESS_KEY_ID=
NAS_S3_SECRET_ACCESS_KEY=
```

> If your `.env.local` contains variables not shown above (e.g., Stripe, cron tokens), add them — do not leave production variables out of the template.

- [ ] **Step 3: Verify no secrets leaked**

```bash
grep -E "^[A-Z_]+=." .env.local.example
```

Expected: zero output. Every line should end with `=` with no value. If any line has a value, clear it.

- [ ] **Step 4: Commit**

```bash
git add .env.local.example
git commit -m "docs: add .env.local.example referencing NAS_S3_* vars"
```

---

## Task 14: Refactor `progress-photos.service.ts` to use `deleteByUrl`

**Files:**
- Modify: `src/services/progress-photos/progress-photos.service.ts` (lines 204–217)

- [ ] **Step 1: Read the current state of the delete block**

```bash
sed -n '190,230p' src/services/progress-photos/progress-photos.service.ts
```

Expected: you see the block that calls `new URL(photo.file_url)`, splits on `/storage/v1/object/public/progress-photos/`, and calls `supabase.storage.from('progress-photos').remove([filePath])`.

- [ ] **Step 2: Add the import at the top of the file**

Find the existing imports (around line 1). Add:

```typescript
import { deleteByUrl } from '@/services/storage/delete-by-url';
```

- [ ] **Step 3: Replace the delete block**

Old code (lines ~204–217):
```typescript
      // Extract file path from URL
      const url = new URL(photo.file_url);
      const filePath = url.pathname.split('/storage/v1/object/public/progress-photos/')[1];

      // Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('progress-photos')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }
```

Replace with:
```typescript
      // Delete from storage — routes to Supabase or NAS by URL prefix
      try {
        await deleteByUrl(photo.file_url);
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 5: Manual smoke read through**

Open the file and confirm:
- The import resolves: `import { deleteByUrl } from '@/services/storage/delete-by-url';` is near the top.
- The `new URL(...)` line and the `split('/storage/v1/object/public/progress-photos/')` line are gone.
- The `supabase.storage.from('progress-photos').remove(...)` call is gone.

- [ ] **Step 6: Commit**

```bash
git add src/services/progress-photos/progress-photos.service.ts
git commit -m "refactor(progress-photos): delete via deleteByUrl helper"
```

---

## Task 15: [DELETED — website-projects is a carveout]

**Status:** This task was removed after the 2026-04-22 schema audit. The `website-projects` bucket is intentionally NOT migrated to the NAS (main plan §Context — "Why `website-projects` is a carveout"). The `website_project_photos` table stores only `file_path` (no `url` column), and its delete flow uses `supabase.storage.from('website-projects').remove([file_path])` which remains correct because the files never leave Supabase.

**No code change required for `src/services/projects/website-projects.ts`.** Skip to Task 16.

---

## Task 16: Build + type-check + run full test suite

**Files:** None.

- [ ] **Step 1: Full type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Next.js build**

```bash
npm run build
```

Expected: successful build. Watch for:
- Module-not-found errors on `@aws-sdk/client-s3` or `@/lib/supabase` paths.
- Type errors in `delete-by-url.ts`.
- Warnings about `NAS_S3_*` env vars — these are fine; they're only read at runtime inside `getS3Client()`, not at build time.

- [ ] **Step 3: Run all tests**

```bash
npx tsx --test src/services/storage/delete-by-url.test.ts
```

Expected: `# tests 7 / # pass 7 / # fail 0`.

- [ ] **Step 4: Manual verification in dev server**

Start the dev server:

```bash
npm run dev
```

Exercise delete flows:
1. In the app, delete a progress photo → watch the server console for any uncaught errors.
2. In the app, delete a website-projects photo → same (untouched code path, validates no regression).

The URL being deleted will still be a Supabase URL (NAS isn't live), so `deleteByUrl` takes the Supabase branch. Behavior should be identical to before the refactor.

Open the Supabase dashboard → Storage → `progress-photos` bucket to confirm the deleted file is actually gone.

- [ ] **Step 5: No commit** (nothing changed).

---

## Task 17: Open PR + deploy to Vercel

**Files:** None (git + Vercel actions).

- [ ] **Step 1: Confirm branch**

```bash
git status
git log --oneline main..HEAD
```

Expected: you're on the `nas-server` branch (or a feature branch forked from it). Commits from Tasks 6–15 are present.

- [ ] **Step 2: Push branch**

```bash
git push -u origin nas-server
```

- [ ] **Step 3: Open pull request**

```bash
gh pr create --title "feat(storage): pre-NAS prep — deleteByUrl helper + artifacts" --body "$(cat <<'EOF'
## Summary

- Adds `deleteByUrl()` helper that routes delete calls to Supabase Storage or MinIO (NAS) based on URL prefix.
- Refactors `progress-photos.service.ts` to use the helper. `website-projects.ts` is a carveout (stays on Supabase) — no change.
- Pre-stages NAS migration artifacts (`policy-mover.json`, `mover.sh`) in `docs/superpowers/artifacts/`.
- Adds `.env.local.example` documenting `NAS_S3_*` vars.
- Installs `@aws-sdk/client-s3` and `tsx`.

Safe to deploy before the NAS is live: no URLs start with `https://s3.arsd.co/` yet, so every delete takes the Supabase branch — behavior unchanged.

See `docs/superpowers/plans/2026-04-22-nas-migration-prep.md` for full task breakdown.

## Test plan

- [ ] `npm run build` passes in CI
- [ ] Manual: delete a progress photo → file removed from Supabase (validates refactored path)
- [ ] Manual: delete a website-projects photo → file removed from Supabase (validates untouched path still works)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Add Vercel preview `NAS_S3_*` env vars (placeholder)**

Vercel project → Settings → Environment Variables → add for **Production** and **Preview**:

- `NAS_S3_ENDPOINT` — leave empty (or set to `https://s3.arsd.co` in advance)
- `NAS_S3_REGION` — `us-east-1`
- `NAS_S3_ACCESS_KEY_ID` — leave empty
- `NAS_S3_SECRET_ACCESS_KEY` — leave empty

Empty values are safe because no URL will trigger the NAS branch until the mover runs.

- [ ] **Step 5: After PR approval, merge**

```bash
gh pr merge --squash
```

Vercel auto-deploys on merge to `main`. Watch the deploy logs.

- [ ] **Step 6: Post-deploy smoke test**

Repeat Task 16 Step 4 against production. Both deletes should succeed.

- [ ] **Step 7: Record PR URL in ops notes**

Link the merged PR in your team's migration tracker or in `docs/superpowers/plans/` as a cross-reference.

---

## Post-Plan Checklist — What's done, what's waiting for NAS

**Done after this plan:**
- Supabase DB backup taken
- S3 Connection enabled + credentials in password manager
- MinIO root creds generated + saved
- Cloudflare Tunnel shell created, token saved
- `policy-mover.json`, `mover.sh` staged in repo under `docs/superpowers/artifacts/`
- `deleteByUrl` helper shipped to production
- `.env.local.example` created

**Waiting on NAS access (main plan §A–H):**
- NAS hardware/OS prep (SSH, Docker, RAID check, UPS)
- MinIO `docker-compose up -d`
- `cloudflared` install + public hostnames
- `mc` alias + bucket creation (workstation-side, needs MinIO up)
- Mover service account + policy attach
- `rclone` + `psql` install on NAS
- Configure rclone remotes
- Deploy `mover.sh` to NAS
- One-time drain of existing 1.91 GB
- Schedule nightly cron
- Day-1/Day-2 verification

**After NAS is live:**
- Fill in `NAS_S3_*` env vars in Vercel production with real values from Task 3
- Redeploy (or wait for next natural deploy)
- Run main plan §J.8.4 smoke test — delete a NAS-hosted photo via the app

---

## Risk Register

| # | Severity | Risk | Mitigation |
|---|----------|------|------------|
| R1 | Medium | `tsc --noEmit` fails in Task 12 due to `@/lib/supabase` path mismatch | Verify the actual path via `cat src/lib/supabase.ts 2>/dev/null` or `ls src/lib/`; adjust the import. If `createClient` is actually exported from `supabase/client.ts` at repo root (per CLAUDE.md), the import path is different than the pattern observed in `progress-photos.service.ts`. Reconcile before proceeding. |
| R2 | Low | `website_project_photos.url` column does not exist (only `file_path`) | Task 1 Step 1 explicitly checks this. If missing, fall back to storing both `file_path` and a computed URL by combining Supabase endpoint + bucket + file_path at delete time. |
| R3 | Low | Production deploy exposes `NAS_S3_*` env vars to build-time static analysis that rejects empty vars | `getS3Client()` is lazy; empty env vars are only a problem if `deleteByUrl` is called with a NAS URL. Build-time Next.js does not read these. If a build plugin complains, set them to placeholder strings like `pending-nas-setup`. |
| R4 | Low | `tsx` adds ~15 MB to node_modules | Acceptable — it's devOnly and widely used. Not shipped to production. |
| R5 | Low | Squash merge loses the per-task commit history | Alternative: `gh pr merge --merge` for a merge commit preserving history. User preference. |

---

## Verification Gates Before Each Task

| Before Task | Must be true |
|---|---|
| 1 (schema check) | Supabase MCP tool is available in this session |
| 2 (DB backup) | Supabase dashboard access confirmed |
| 8 (tsx install) | Tasks 1–7 complete (non-code setup done) |
| 10 (failing tests) | Task 8 (tsx) and Task 9 (aws-sdk) both succeeded |
| 14 (progress-photos refactor) | Task 12 passed all tests |
| 17 (PR + deploy) | Task 16 build succeeded and manual smoke tests passed |

---

## Effort Summary

| Task | Type | Effort |
|---|---|---|
| 1 — Schema verify | Read-only | 10 min |
| 2 — DB backup | Dashboard | 5 min |
| 3 — S3 Connection + creds | Dashboard | 10 min |
| 4 — MinIO creds gen | CLI + password mgr | 5 min |
| 5 — Cloudflare Tunnel shell | Dashboard | 10 min |
| 6 — policy-mover.json + README | Code | 10 min |
| 7 — mover.sh artifact | Code | 15 min |
| 8 — tsx + test script | Code | 10 min |
| 9 — @aws-sdk/client-s3 | Code | 5 min |
| 10 — Failing tests | Code | 20 min |
| 11 — parseStorageUrl | Code | 20 min |
| 12 — deleteByUrl | Code | 30 min |
| 13 — .env.local.example | Code | 10 min |
| 14 — progress-photos refactor | Code | 20 min |
| 15 — (deleted — carveout) | — | 0 min |
| 16 — Build + verify | Run | 20 min |
| 17 — PR + deploy | Git / ops | 20 min |
| **Total** | | **~3 hours 45 min** |

Most tasks are small and sequential. Realistic one-sitting completion: **half a day of focused work**, spread over a day or two if interleaved with other tasks.

---

## Why This Is Worth Doing Before NAS Access

1. **Unblocks production value.** The `deleteByUrl` refactor cleans up two services that were parsing URLs by hand. Shipping it is independent of NAS state.
2. **Derisks NAS week.** When NAS access comes, you'll have every credential, policy, and config ready to paste. Parts A–G of the main plan become pure execution, not research.
3. **Safety net.** The manual DB backup (Task 2) is insurance against any URL-rewrite SQL error during the drain.
4. **Shrinks the cutover surface.** Code ships separately from data movement. Rollback of code and rollback of data are independent levers.
