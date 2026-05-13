# Harden API Routes Against Build-Time Static Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock Vercel deployments by marking every API route handler that does server-only work as dynamic, so Next.js does not pre-execute it during build.

**Architecture:** Next.js 14 App Router treats route handlers as candidates for static pre-rendering at build time when they do not read dynamic primitives (`cookies()`, `headers()`, `request.url`, `searchParams`, or sit under a dynamic segment like `[id]`). When Next.js pre-renders, it *executes* the handler. For handlers that perform real I/O (S3 calls, DB writes, file parsing), this either times out or runs unwanted side-effects during build. The fix is one line per affected route: `export const dynamic = 'force-dynamic';`. Routes that already use dynamic primitives are skipped — Next.js infers their dynamism correctly. The cron rule and `scaffold-cron` skill are updated so future routes inherit the same guardrail.

**Tech Stack:** Next.js 14.2 App Router, TypeScript strict.

**Background:** Vercel deploy on commit `98d9df1` (2026-05-13) failed with:
```
Error: Static page generation for /api/cron/migrate-to-nas is still timing out after 3 attempts.
```
The handler imports `runNasMover` which opens an AWS S3 client to `s3.arsd.co` (NAS MinIO via cloudflared tunnel). Vercel's build sandbox cannot reach the NAS, the connection hangs past 60 s, three retries fail, the build aborts. The same trap is armed on 8 other API routes — anyone touching them or adding a sibling could re-trigger the failure on the next deploy.

**Note on testing:** No Jest / Vitest / Playwright wired up; per `.claude/rules/code-quality.md`, verification is `npx tsc --noEmit` + `npm run build` + a manual Vercel deploy check (documented in Task 4).

---

## File Structure

### Routes that need `force-dynamic` (9 files)

| File | Why it needs it |
|---|---|
| `src/app/api/cron/migrate-to-nas/route.ts` | **The deploy blocker.** Calls NAS S3 client; build sandbox cannot reach `s3.arsd.co`. |
| `src/app/api/cron/cleanup-storage/route.ts` | Cron; deletes Supabase Storage objects. Must never run at build time. |
| `src/app/api/reset-failed-reports/route.ts` | DB mutation handler; no dynamic primitives. |
| `src/app/api/test-cleanup/route.ts` | Storage cleanup utility; no dynamic primitives. |
| `src/app/api/storage/delete-file/route.ts` | Storage delete; no dynamic primitives. |
| `src/app/api/accomplishment-reports/parse-approved/route.ts` | Triggers parse pipeline; no dynamic primitives. |
| `src/app/api/warehouse/releases/next/route.ts` | DB read for next release number; no dynamic primitives. |
| `src/app/api/warehouse/delivery-receipts/next/route.ts` | DB read for next DR number; no dynamic primitives. |
| `src/app/api/warehouse/ipow/parse-test/route.ts` | xlsx parsing test handler; no dynamic primitives. |

### Documentation updates (2 files)

| File | Change |
|---|---|
| `.claude/rules/cron.md` | Add a bullet mandating `export const dynamic = 'force-dynamic';` on cron route handlers. |
| `.claude/skills/scaffold-cron/SKILL.md` | Add the same export to the "Route handler must" checklist in step 2. |

### Routes intentionally NOT modified (already implicitly dynamic)

| File | Reason |
|---|---|
| `src/app/auth/callback/route.ts` | Uses `request.url` and `searchParams`. |
| `src/app/api/storage/cleanup/route.ts` | Uses `request.url` and `searchParams`. |
| `src/app/api/warehouse/releases/route.ts` | Uses `request.nextUrl.searchParams`. |
| `src/app/api/warehouse/delivery-receipts/route.ts` | Uses `request.nextUrl.searchParams`. |
| `src/app/api/warehouse/ipow/route.ts` | Uses `request.nextUrl.searchParams`. |
| `src/app/api/warehouse/releases/[id]/route.ts` | Dynamic segment + reads `request.headers`. |
| `src/app/api/warehouse/delivery-receipts/[id]/route.ts` | Dynamic segment + reads `request.headers`. |
| `src/app/api/warehouse/stocks/[projectId]/route.ts` | Dynamic segment. |
| `src/app/api/warehouse/stocks/[projectId]/po/route.ts` | Dynamic segment. |

If the executor finds that any of these files no longer matches the listed reason (e.g. the dynamic primitive was removed), stop and report — do not silently add `force-dynamic` to them. The plan accounts for the codebase as of commit `98d9df1`.

---

## Task 1: Harden cron routes (the deploy unblocker)

**Files:**
- Modify: `src/app/api/cron/migrate-to-nas/route.ts`
- Modify: `src/app/api/cron/cleanup-storage/route.ts`

Order matters: Task 1 alone is enough to unblock the Vercel build. Task 2 is hardening; Task 3 is rule update; Task 4 is verification.

- [ ] **Step 1.1: Add `force-dynamic` to `migrate-to-nas`**

In `src/app/api/cron/migrate-to-nas/route.ts`, find:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { runNasMover } from '@/services/storage/nas-mover.service';

export const maxDuration = 300;
```

Replace with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { runNasMover } from '@/services/storage/nas-mover.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
```

- [ ] **Step 1.2: Add `force-dynamic` to `cleanup-storage`**

In `src/app/api/cron/cleanup-storage/route.ts`, find:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanupService } from '@/services/storage/storage-cleanup.service';

/**
 * GET /api/cron/cleanup-storage
```

Replace with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanupService } from '@/services/storage/storage-cleanup.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/cleanup-storage
```

- [ ] **Step 1.3: Verify the two crons now declare `force-dynamic`**

Run:
```bash
grep -n "export const dynamic" src/app/api/cron/migrate-to-nas/route.ts src/app/api/cron/cleanup-storage/route.ts
```

Expected output (two lines):
```
src/app/api/cron/migrate-to-nas/route.ts:4:export const dynamic = 'force-dynamic';
src/app/api/cron/cleanup-storage/route.ts:4:export const dynamic = 'force-dynamic';
```

If line numbers differ slightly (e.g. file has extra blank lines), that is fine — the requirement is that both files declare the export. If either grep finds nothing, stop and report.

---

## Task 2: Harden the seven other API routes

**Files:** (all modified)
- `src/app/api/reset-failed-reports/route.ts`
- `src/app/api/test-cleanup/route.ts`
- `src/app/api/storage/delete-file/route.ts`
- `src/app/api/accomplishment-reports/parse-approved/route.ts`
- `src/app/api/warehouse/releases/next/route.ts`
- `src/app/api/warehouse/delivery-receipts/next/route.ts`
- `src/app/api/warehouse/ipow/parse-test/route.ts`

Each file gets one line added: `export const dynamic = 'force-dynamic';`, placed on its own line between the import block and whatever follows (JSDoc, `export const`, or the `export async function`). Each step below gives the exact before/after to make the Edit unambiguous.

- [ ] **Step 2.1: `reset-failed-reports`**

Find:
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/reset-failed-reports
```

Replace with:
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reset-failed-reports
```

- [ ] **Step 2.2: `test-cleanup`**

Find:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanupService } from '@/services/storage/storage-cleanup.service';

/**
 * GET /api/test-cleanup
```

Replace with:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanupService } from '@/services/storage/storage-cleanup.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-cleanup
```

- [ ] **Step 2.3: `storage/delete-file`**

Find:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { deleteByUrl } from '@/services/storage/delete-by-url';

/**
 * POST /api/storage/delete-file
```

Replace with:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { deleteByUrl } from '@/services/storage/delete-by-url';

export const dynamic = 'force-dynamic';

/**
 * POST /api/storage/delete-file
```

- [ ] **Step 2.4: `accomplishment-reports/parse-approved`**

Find:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AutoParseService } from '@/services/accomplishment-reports/auto-parse.service';

/**
 * POST /api/accomplishment-reports/parse-approved
```

Replace with:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AutoParseService } from '@/services/accomplishment-reports/auto-parse.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/accomplishment-reports/parse-approved
```

- [ ] **Step 2.5: `warehouse/releases/next`**

Find:
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ReleasesService } from '@/services/warehouse/releases.service';

export async function GET() {
```

Replace with:
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ReleasesService } from '@/services/warehouse/releases.service';

export const dynamic = 'force-dynamic';

export async function GET() {
```

- [ ] **Step 2.6: `warehouse/delivery-receipts/next`**

Find:
```ts
import { NextResponse } from 'next/server';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';

export async function GET() {
```

Replace with:
```ts
import { NextResponse } from 'next/server';
import { DeliveryReceiptsService } from '@/services/warehouse/delivery-receipts.service';

export const dynamic = 'force-dynamic';

export async function GET() {
```

- [ ] **Step 2.7: `warehouse/ipow/parse-test`**

Find:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AccomplishmentReportParser } from '@/lib/accomplishment-report-parser';
import { AccomplishmentDataService } from '@/services/accomplishment-reports/accomplishment-data.service';

/**
```

Replace with:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AccomplishmentReportParser } from '@/lib/accomplishment-report-parser';
import { AccomplishmentDataService } from '@/services/accomplishment-reports/accomplishment-data.service';

export const dynamic = 'force-dynamic';

/**
```

- [ ] **Step 2.8: Verify all nine routes now declare `force-dynamic`**

Run:
```bash
grep -rn "export const dynamic" src/app/api/
```

Expected: exactly **9 lines** of output, one per file modified in Tasks 1 and 2. If the count is different, stop and report.

Also confirm none of the intentionally-skipped files were modified:
```bash
grep -L "export const dynamic" \
  src/app/api/storage/cleanup/route.ts \
  src/app/api/warehouse/releases/route.ts \
  src/app/api/warehouse/delivery-receipts/route.ts \
  src/app/api/warehouse/ipow/route.ts \
  src/app/api/warehouse/releases/\[id\]/route.ts \
  src/app/api/warehouse/delivery-receipts/\[id\]/route.ts \
  src/app/api/warehouse/stocks/\[projectId\]/route.ts \
  src/app/api/warehouse/stocks/\[projectId\]/po/route.ts \
  src/app/auth/callback/route.ts
```

Expected: all nine paths printed (meaning none of them contain the export). If any path is missing from the output, that file was modified — revert it.

---

## Task 3: Update documentation so future routes inherit the guardrail

**Files:**
- Modify: `.claude/rules/cron.md`
- Modify: `.claude/skills/scaffold-cron/SKILL.md`

- [ ] **Step 3.1: Update `.claude/rules/cron.md`**

Find:

```
- Cron route handlers live under `src/app/api/cron/<name>/route.ts` and export `GET`. Set `export const maxDuration = 300;` (5 min) when work may exceed default limits.
```

Replace with:

```
- Cron route handlers live under `src/app/api/cron/<name>/route.ts` and export `GET`. They MUST declare `export const dynamic = 'force-dynamic';` so Next.js does not try to pre-execute them at build time (otherwise the Vercel build will hang on real I/O and eventually fail with a static-generation timeout). Also set `export const maxDuration = 300;` (5 min) when runtime work may exceed default limits.
```

- [ ] **Step 3.2: Update `.claude/skills/scaffold-cron/SKILL.md`**

Find:

```
2. **Route handler** must:
   - Export an async `GET(request: NextRequest)` handler — Vercel Cron sends GET only.
   - Set `export const maxDuration = 300;` (5 min). Raise only if the workload genuinely needs longer; lower if you can guarantee faster execution.
```

Replace with:

```
2. **Route handler** must:
   - Export an async `GET(request: NextRequest)` handler — Vercel Cron sends GET only.
   - Set `export const dynamic = 'force-dynamic';` so Next.js does not pre-execute the handler during build. Cron handlers always do real I/O; pre-rendering them either hangs the build (S3/NAS calls) or triggers unwanted side-effects.
   - Set `export const maxDuration = 300;` (5 min). Raise only if the workload genuinely needs longer; lower if you can guarantee faster execution.
```

- [ ] **Step 3.3: Verify both docs were updated**

Run:
```bash
grep -n "force-dynamic" .claude/rules/cron.md .claude/skills/scaffold-cron/SKILL.md
```

Expected: at least one match in each file.

---

## Task 4: Verify build and report

**Files:** none modified.

- [ ] **Step 4.1: Typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: exit 0, no errors. If errors appear, capture verbatim and stop — do not improvise fixes.

- [ ] **Step 4.2: Production build**

Run:
```bash
npm run build
```

Expected: the build completes successfully. The previous failure mode was `Static page generation for /api/cron/migrate-to-nas is still timing out after 3 attempts` — that should no longer appear. In the route manifest you should see all nine modified routes listed as type **ƒ** (Dynamic) rather than **○** (Static). Capture the last ~30 lines of build output (this includes the route manifest table).

If the build still fails for the same reason, stop and report — the fix did not land. If it fails for a different reason, stop and report — that is a separate issue and the plan did not anticipate it.

- [ ] **Step 4.3: Final grep — confirm the right number of `force-dynamic` declarations exist**

Run:
```bash
grep -rln "export const dynamic = 'force-dynamic'" src/app/ .claude/
```

Expected: 11 paths total (9 route files + 2 doc files).

- [ ] **Step 4.4: Stop and report — do NOT commit**

Per project convention, do not `git add` or `git commit`. Produce a report with exactly four sections:

1. **Files modified** — list all 11 paths.
2. **`npx tsc --noEmit` result** — "clean" or the verbatim error list.
3. **`npm run build` outcome** — pass/fail, plus the last ~30 lines (the route manifest).
4. **Verification grep counts** — output of Step 2.8 (count and contents), Step 3.3, and Step 4.3.

The user will manually verify Vercel deploys cleanly before merging.

---

## Risk

Low. The change is purely a build-time hint to Next.js. It does not alter runtime behavior — Vercel Cron will still invoke `GET /api/cron/migrate-to-nas` at 02:30 UTC daily; the handler still does the same work. It only changes where the work happens (runtime, never build time).

The `force-dynamic` declaration on API routes that were already implicitly dynamic would be redundant but not harmful. The plan still skips those nine files to avoid unnecessary diff noise.

## Out of scope (deferred)

- Adding CRON_SECRET bearer-token auth back to cron routes (`.claude/rules/cron.md` notes recent commits removed it; that is a separate decision).
- Investigating *why* the Vercel build sandbox cannot reach `s3.arsd.co` (irrelevant once we stop pre-executing the handler).
- Moving any of the implicitly-dynamic API routes to explicit `force-dynamic` for consistency (low value; would expand the diff).
- Adding Vitest / Playwright infrastructure to assert dynamic markers — over-engineered for a one-line export.

---

## Self-Review

**Spec coverage:**
- Vercel build failure on `migrate-to-nas` → Task 1 Step 1.1 (the unblocker).
- Defense for the other 8 timing-out routes seen in the log (which were collateral damage but each could become the primary blocker after a service change) → Task 1 Step 1.2 + Task 2 Steps 2.1–2.7.
- Rule update so future sessions don't reintroduce → Task 3 Step 3.1.
- Skill update so `scaffold-cron` invocations produce safe code → Task 3 Step 3.2.
- Verification that nothing static slipped through → Task 2 Step 2.8 (count check), Task 4 Step 4.3 (cross-tree count check).
- Verification that nothing was incorrectly added to already-dynamic routes → Task 2 Step 2.8 (negative check).
- Build green on Vercel → Task 4 Step 4.2 + manual user verification before merge.

**Placeholder scan:** No "TBD", "implement later", "similar to Task N", or unspecified error handling. Every edit has explicit before/after snippets. Every verification command has an expected output.

**Type / signature consistency:** No type or signature changes — every edit is a single `export const dynamic = 'force-dynamic';` line addition. No risk of drift between tasks.
