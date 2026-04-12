# Warehouse API Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close five security findings in the warehouse API surface — missing auth check on detail reads, project_id tampering on update, unverified project existence on PO override, weak file upload MIME validation, and one error-message leak.

**Architecture:** All five fixes are localized API-route + service-layer hardening — no database migrations, no schema changes, no client-side changes. Each phase ends at a clean commit boundary so work can be paused or shipped incrementally. Verification is via `npm run build` (TypeScript check) and manual `curl` reproduction since the project has no test runner installed.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Supabase (server-side client via `@/lib/supabase`), existing `DeliveryReceiptsService` / `ReleasesService` / `WarehouseStorageService`.

**Source review:** `C:\Users\PC\reviews\warehouse-dashboard-review.md` (2026-04-12). Findings addressed here: **C-2, C-3, M-1 (downgraded from C-1 after re-read), H-1, H-2**. The original C-1 ("PO PATCH bypasses project access") is downgraded to M-1 because per `src/lib/warehouse/rbac.ts:113-115` (`canViewAllProjects`), the three roles allowed to PATCH (`superadmin`, `material_control`, `purchasing`) are exactly the roles defined as having all-projects access — so the missing check is not a privilege escalation today, but it remains a defense-in-depth gap and a data-hygiene issue (no validation that `projectId` actually exists).

**Out of scope:** RLS migration changes, adding a test framework, UI changes, simplification refactors. Those are tracked in separate plans (`2026-04-12-warehouse-ux-feedback.md`, `2026-04-12-warehouse-list-refactor.md`).

---

## File Structure

**Modified:**
- `src/app/api/warehouse/delivery-receipts/[id]/route.ts` — add auth check to GET; lock `project_id` on PUT
- `src/app/api/warehouse/releases/[id]/route.ts` — same two changes
- `src/app/api/warehouse/stocks/[projectId]/po/route.ts` — add project-existence check; round `unit_cost` to 2dp; sanitize error response
- `src/services/warehouse/warehouse-storage.service.ts` — add MIME allowlist validation in `uploadFile`

**Created:** none (no new files; rule: prefer editing existing files).

**Touched but read-only (for reference during review):**
- `src/lib/warehouse/rbac.ts:64,99-115` — confirms which roles can view all projects
- `src/services/warehouse/delivery-receipts.service.ts` — `update()` and `getById()` signatures
- `src/services/warehouse/releases.service.ts` — same

---

## Phase A — Auth check on detail GETs (Finding C-2)

**Files:**
- Modify: `src/app/api/warehouse/delivery-receipts/[id]/route.ts:5-22`
- Modify: `src/app/api/warehouse/releases/[id]/route.ts:5-22`

**Why:** Both GET handlers fetch and return the full record without calling `supabase.auth.getUser()`. They rely entirely on the user-scoped client + RLS. That is single-layer defense — any future RLS regression silently exposes every DR/release by UUID enumeration. The fix is small: add an explicit 401 gate.

- [ ] **Step A1: Reproduce the bug — confirm unauthenticated GET succeeds (or returns RLS-empty, not 401)**

Run the dev server in a separate terminal:

```bash
npm run dev
```

In a second terminal, hit the endpoint without an auth cookie:

```bash
curl -i http://localhost:3000/api/warehouse/delivery-receipts/00000000-0000-0000-0000-000000000000
curl -i http://localhost:3000/api/warehouse/releases/00000000-0000-0000-0000-000000000000
```

Expected current behavior: **200** with `null`/empty body, or a 500 from the service throwing on a missing row — anything **other than 401**. Record what each returned. After this phase both must return **401**.

- [ ] **Step A2: Add auth gate to delivery-receipts GET**

Open `src/app/api/warehouse/delivery-receipts/[id]/route.ts`. Replace lines 5–22 (the entire `GET` function) with:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new DeliveryReceiptsService(supabase);
    const dr = await service.getById(params.id);

    return NextResponse.json(dr);
  } catch (error) {
    console.error('Error fetching delivery receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

The only addition is the four-line auth check between `createServerSupabaseClient()` and `new DeliveryReceiptsService(supabase)`. Everything else is unchanged.

- [ ] **Step A3: Add auth gate to releases GET**

Open `src/app/api/warehouse/releases/[id]/route.ts`. Replace lines 5–22 (the entire `GET` function) with:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new ReleasesService(supabase);
    const release = await service.getById(params.id);

    return NextResponse.json(release);
  } catch (error) {
    console.error('Error fetching release:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step A4: TypeScript build check**

Run:

```bash
npm run build
```

Expected: build succeeds with **no new TypeScript errors**. If the build was already broken before this change, note pre-existing errors but ensure no new ones touch the two files you edited.

- [ ] **Step A5: Verify the bug is fixed**

With `npm run dev` running, repeat the curl commands from Step A1:

```bash
curl -i http://localhost:3000/api/warehouse/delivery-receipts/00000000-0000-0000-0000-000000000000
curl -i http://localhost:3000/api/warehouse/releases/00000000-0000-0000-0000-000000000000
```

Expected: both return **HTTP 401** with body `{"error":"Unauthorized"}`.

Then verify an authenticated request still works. Sign in to the dashboard at `http://localhost:3000` in a browser, copy the `sb-*` cookie value from DevTools, and:

```bash
curl -i -H "Cookie: sb-<your-cookie>=<value>" \
  http://localhost:3000/api/warehouse/delivery-receipts/<a-real-dr-id>
```

Expected: **HTTP 200** with the DR JSON. (Substitute a real DR id you can see in the dashboard.)

- [ ] **Step A6: Commit Phase A**

```bash
git add src/app/api/warehouse/delivery-receipts/[id]/route.ts \
        src/app/api/warehouse/releases/[id]/route.ts
git commit -m "fix(warehouse): require auth on DR and release detail GET endpoints

Both GET handlers previously relied solely on RLS via the user-scoped
Supabase client. Add an explicit getUser() check so unauthenticated
requests get a clean 401 instead of relying on the database tier
to suppress the row.

Addresses finding C-2 from the 2026-04-12 warehouse review."
```

---

## Phase B — Lock `project_id` on PUT (Finding C-3)

**Files:**
- Modify: `src/app/api/warehouse/delivery-receipts/[id]/route.ts:69-143` (PUT handler)
- Modify: `src/app/api/warehouse/releases/[id]/route.ts:69-144` (PUT handler)

**Why:** After verifying creator-only edit, both PUTs hand the entire request body to `service.update(id, body)` — including `body.project_id`. A warehouseman who legitimately created a DR in Project A can re-tag it to Project B by editing the JSON. Fix: force the update payload's `project_id` to the value from the existing record, regardless of what the client sent.

- [ ] **Step B1: Reproduce the tampering**

In the dashboard, sign in as a warehouseman. Find a DR you created (it must be unlocked). Note its `id` and current `project_id`. Pick another `project_id` from a project you can see. From DevTools, copy your `sb-*` cookie. Then:

```bash
curl -i -X PUT http://localhost:3000/api/warehouse/delivery-receipts/<dr-id> \
  -H "Cookie: sb-<your-cookie>=<value>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "<a-different-project-id>",
    "supplier": "Tampering Test",
    "date": "2026-04-12",
    "warehouseman": "<your-display-name>",
    "items": [{"item_description":"x","quantity":1,"unit":"pcs"}]
  }'
```

Expected current behavior: **HTTP 200** and the DR is now attached to the wrong project (verify in the dashboard or via GET). This is the bug. Record the result.

After this phase the same call must either (a) succeed but keep the original `project_id`, or (b) return 400. We will choose (a) — silent normalization — so legitimate clients that send the original `project_id` continue to work.

- [ ] **Step B2: Lock `project_id` on the DR PUT**

Open `src/app/api/warehouse/delivery-receipts/[id]/route.ts`. The PUT handler currently destructures `project_id` from the body at line 123 and validates it is present, then passes the entire `body` to `service.update`. Replace the body of the PUT handler from line 122 (the `const { project_id, supplier, ... } = body;` line) through line 135 (the `return NextResponse.json(updated);` line) with:

```typescript
    const { supplier, date, warehouseman, items } = body;
    if (!supplier || !date || !warehouseman || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields for update' },
        { status: 400 }
      );
    }

    // Force project_id to the value on the existing record. Clients are not
    // permitted to move a DR between projects via PUT.
    const safeBody = { ...body, project_id: existing.project_id };

    // Use service-role client for the actual update to avoid RLS issues
    const serviceSupabase = createServiceSupabaseClient();
    const service = new DeliveryReceiptsService(serviceSupabase);
    const updated = await service.update(params.id, safeBody);
    return NextResponse.json(updated);
```

Two things changed: (1) `project_id` is no longer destructured or validated from the body — it is sourced from `existing.project_id` (which was already loaded earlier in the handler at line 87 via `userScopedService.getById(params.id)`); (2) the update payload is `safeBody`, not raw `body`.

- [ ] **Step B3: Lock `project_id` on the Release PUT**

Open `src/app/api/warehouse/releases/[id]/route.ts`. Replace lines 124–136 (the `const { project_id, ... } = body;` block through `return NextResponse.json(updated);`) with:

```typescript
    const { received_by, date, items } = body;
    if (!received_by || !date || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields for update' },
        { status: 400 }
      );
    }

    // Force project_id to the value on the existing record. Clients are not
    // permitted to move a release between projects via PUT.
    const safeBody = { ...body, project_id: existing.project_id };

    // Use service-role client for the actual update to avoid RLS issues
    const serviceSupabase = createServiceSupabaseClient();
    const service = new ReleasesService(serviceSupabase);
    const updated = await service.update(params.id, safeBody);
    return NextResponse.json(updated);
```

- [ ] **Step B4: TypeScript build check**

```bash
npm run build
```

Expected: succeeds with no new TypeScript errors. The destructuring change drops `project_id` from the local scope, which was previously only used for the validation check — confirm no other reference to `project_id` remains in either PUT handler that would now be an undefined variable.

- [ ] **Step B5: Verify the bug is fixed**

Repeat the curl from Step B1 (sending a foreign `project_id`):

```bash
curl -i -X PUT http://localhost:3000/api/warehouse/delivery-receipts/<dr-id> \
  -H "Cookie: sb-<your-cookie>=<value>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "<a-different-project-id>",
    "supplier": "Tampering Test 2",
    "date": "2026-04-12",
    "warehouseman": "<your-display-name>",
    "items": [{"item_description":"x","quantity":1,"unit":"pcs"}]
  }'
```

Expected: **HTTP 200** and the response body's `project_id` equals the **original** project, NOT the foreign one. Verify by following up with:

```bash
curl -s -H "Cookie: sb-<your-cookie>=<value>" \
  http://localhost:3000/api/warehouse/delivery-receipts/<dr-id> | grep project_id
```

Repeat both for `/releases/<release-id>`. Then verify a legitimate edit (sending the correct `project_id`) still works.

- [ ] **Step B6: Commit Phase B**

```bash
git add src/app/api/warehouse/delivery-receipts/[id]/route.ts \
        src/app/api/warehouse/releases/[id]/route.ts
git commit -m "fix(warehouse): prevent project_id tampering on DR and release PUT

Both PUT handlers passed the request body straight to service.update,
allowing a warehouseman to move a DR or release between projects by
swapping the project_id in the JSON body. Force the update payload's
project_id to match the existing record.

Addresses finding C-3 from the 2026-04-12 warehouse review."
```

---

## Phase C — Project existence + decimal scale on PO PATCH (Findings M-1, original-C-1 downgraded)

**Files:**
- Modify: `src/app/api/warehouse/stocks/[projectId]/po/route.ts:19-125`

**Why:** Two distinct issues in the same handler:
1. **Defense in depth:** the handler upserts on `(project_id, wbs, item_description)` without verifying that `project_id` corresponds to a real project. A typo or stale UUID writes orphan rows. Per `rbac.ts:113-115`, the three roles allowed here all have all-projects access by design, so this is not privilege escalation — but a `SELECT 1 FROM projects WHERE id = ?` check is cheap and catches data hygiene bugs.
2. **Decimal precision:** `unit_cost` accepts arbitrary float precision. The DB column is `NUMERIC` with no scale (per migration `20260211000006`). Round to 2 decimal places server-side before upsert.

- [ ] **Step C1: Reproduce both issues**

Sign in as `material_control` or `purchasing` (or `superadmin`). Find a real `projectId` you can edit. Then attempt:

```bash
# Issue 1: garbage project id
curl -i -X PATCH http://localhost:3000/api/warehouse/stocks/00000000-0000-0000-0000-000000000000/po \
  -H "Cookie: sb-<your-cookie>=<value>" \
  -H "Content-Type: application/json" \
  -d '{"item_description":"x","wbs":null,"po":1,"unit_cost":1}'

# Issue 2: high-precision unit_cost
curl -i -X PATCH http://localhost:3000/api/warehouse/stocks/<real-project-id>/po \
  -H "Cookie: sb-<your-cookie>=<value>" \
  -H "Content-Type: application/json" \
  -d '{"item_description":"x","wbs":null,"unit_cost":1.234567890123}'
```

Expected current behavior — first call: **HTTP 200** despite the project not existing (orphan row written). Second call: **HTTP 200** and the stored value preserves arbitrary precision. After this phase: first call returns **404**, second call rounds to `1.23` before upsert.

- [ ] **Step C2: Add project existence check + rounding to PATCH**

Open `src/app/api/warehouse/stocks/[projectId]/po/route.ts`. Locate the block right after the role check passes (currently line 39) and right before the body parse (line 41). Insert the project lookup. Then locate the rounding right before the merge (line 83-84). The full diff:

Replace lines 37–104 (from the role check return through the upsert error block) with:

```typescript
    if (!['superadmin', 'material_control', 'purchasing'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Defense in depth: verify the project actually exists before writing
    // an override. The roles allowed here have all-projects access by design
    // (see lib/warehouse/rbac.ts canViewAllProjects), so this is not a
    // privilege check — it prevents orphan rows from typos or stale UUIDs.
    const { data: projectRow, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      console.error('Failed to verify project existence', projectError);
      return NextResponse.json({ error: 'Failed to verify project' }, { status: 500 });
    }
    if (!projectRow) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = (await request.json()) as UpdateOverrideBody;
    if (!body || !body.item_description) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const hasPo = body.po !== undefined;
    const hasUnitCost = body.unit_cost !== undefined;

    if (!hasPo && !hasUnitCost) {
      return NextResponse.json(
        { error: 'Either po or unit_cost must be provided' },
        { status: 400 }
      );
    }

    if (hasPo && !isValidAmount(body.po)) {
      return NextResponse.json(
        { error: 'Invalid po value' },
        { status: 400 }
      );
    }

    if (hasUnitCost && !isValidAmount(body.unit_cost)) {
      return NextResponse.json(
        { error: 'Invalid unit_cost value' },
        { status: 400 }
      );
    }

    // Fetch any existing row so a partial update does not clobber the other field.
    const existingQuery = supabase
      .from('stock_po_overrides')
      .select('po, unit_cost')
      .eq('project_id', projectId)
      .eq('item_description', body.item_description);

    const { data: currentRow } = await (
      body.wbs === null
        ? existingQuery.is('wbs', null)
        : existingQuery.eq('wbs', body.wbs)
    ).maybeSingle();

    // Round unit_cost to 2 decimal places server-side. The DB column is
    // NUMERIC with no scale, so without rounding here a client could store
    // arbitrary float precision (e.g. 1.234567890123) and produce
    // accumulation errors in the ledger view.
    const roundCost = (n: number) => Math.round(n * 100) / 100;

    const mergedPo = hasPo ? (body.po as number) : Number(currentRow?.po ?? 0);
    const mergedUnitCost = hasUnitCost
      ? roundCost(body.unit_cost as number)
      : Number(currentRow?.unit_cost ?? 0);

    const { error: upsertError } = await supabase
      .from('stock_po_overrides')
      .upsert(
        {
          project_id: projectId,
          wbs: body.wbs,
          item_description: body.item_description,
          po: mergedPo,
          unit_cost: mergedUnitCost,
        },
        { onConflict: 'project_id,wbs,item_description' }
      );

    if (upsertError) {
      console.error('Failed to upsert stock override', upsertError);
      return NextResponse.json(
        { error: 'Failed to update stock override' },
        { status: 500 }
      );
    }
```

Three additions: the project lookup block, the `roundCost` helper, and the rounding applied at `mergedUnitCost`. Everything else in the handler is unchanged.

- [ ] **Step C3: TypeScript build check**

```bash
npm run build
```

Expected: succeeds with no new TypeScript errors.

- [ ] **Step C4: Verify both fixes**

```bash
# Issue 1 should now 404
curl -i -X PATCH http://localhost:3000/api/warehouse/stocks/00000000-0000-0000-0000-000000000000/po \
  -H "Cookie: sb-<your-cookie>=<value>" \
  -H "Content-Type: application/json" \
  -d '{"item_description":"x","wbs":null,"po":1,"unit_cost":1}'

# Expected: HTTP 404 {"error":"Project not found"}

# Issue 2 should round
curl -i -X PATCH http://localhost:3000/api/warehouse/stocks/<real-project-id>/po \
  -H "Cookie: sb-<your-cookie>=<value>" \
  -H "Content-Type: application/json" \
  -d '{"item_description":"REAL_ITEM_FROM_LEDGER","wbs":null,"unit_cost":1.234567890123}'

# Expected: HTTP 200, response shows unit_cost: 1.23
```

Then verify a normal edit still works (sane projectId, sane unit_cost like 12.50). It must.

- [ ] **Step C5: Commit Phase C**

```bash
git add src/app/api/warehouse/stocks/[projectId]/po/route.ts
git commit -m "fix(warehouse): verify project exists and round unit_cost on PO override

Two hardenings on the stock PO override PATCH:

1. Verify projectId corresponds to a real project before upserting.
   The three roles allowed here have all-projects access by design, so
   this is defense in depth — it prevents orphan rows from typos or
   stale UUIDs, not privilege escalation.

2. Round unit_cost to 2 decimal places server-side. The NUMERIC column
   has no scale, so without this a client could store arbitrary float
   precision and skew the ledger total_unit_cost calculations.

Addresses finding M-1 from the 2026-04-12 warehouse review (originally
filed as C-1 but downgraded after re-reading rbac.ts canViewAllProjects)."
```

---

## Phase D — MIME allowlist on file upload (Finding H-1)

**Files:**
- Modify: `src/services/warehouse/warehouse-storage.service.ts:55-91` (`uploadFile`), and add a new top-of-file constant.

**Why:** `uploadFile` only relies on the Supabase Storage bucket's `allowed_mime_types` configuration. The service does not check `file.type` (the browser-reported MIME) before calling Supabase Storage. Per the review: a malicious user can upload a binary disguised as `.jpg` and the only barrier is the bucket config, which can drift. Add a server-side allowlist check.

- [ ] **Step D1: Reproduce — confirm a wrong MIME is currently accepted by the service layer**

This one is hard to demonstrate end-to-end without a malicious binary, but you can verify the service code path: open `src/services/warehouse/warehouse-storage.service.ts:55-91` and confirm there is **no reference to `file.type`** anywhere in `uploadFile`. That is the issue.

- [ ] **Step D2: Add the allowlist constant**

Open `src/services/warehouse/warehouse-storage.service.ts`. After the existing `import` line at the top (line 1) and before `export interface UploadResult` (line 3), add:

```typescript
const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
```

- [ ] **Step D3: Validate MIME at the top of `uploadFile`**

Replace the body of `uploadFile` at lines 55–91 with:

```typescript
  private async uploadFile(filePath: string, file: File): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      console.warn('WarehouseStorageService.uploadFile rejected MIME', {
        bucket: this.bucketName,
        filePath,
        mime: file.type,
      });
      return {
        success: false,
        error: 'File type not allowed',
      };
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('WarehouseStorageService.uploadFile upload error', {
          bucket: this.bucketName,
          filePath,
          message: error.message,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
```

The only addition is the seven-line `if (!ALLOWED_MIME_TYPES.has(file.type))` block at the top. The rest is unchanged.

- [ ] **Step D4: TypeScript build check**

```bash
npm run build
```

Expected: succeeds. `Set<string>` is a built-in; no new dependency.

- [ ] **Step D5: Manual verification — happy path still works**

In the dashboard, sign in as a warehouseman, navigate to **Create DR**, fill the form, attach a real `.jpg` photo, and submit. Expected: success — the upload still works exactly as before for valid MIME types. Verify the DR is created and the photo is visible on the detail page.

- [ ] **Step D6: Manual verification — bad MIME is rejected**

Optional but recommended: from a browser DevTools console with the dashboard open, run a fetch that posts a `text/plain` blob to one of the upload endpoints. Or rename a `.txt` file to `.jpg` and try to attach it via the form — note that browsers report MIME based on actual content sniffing, not the extension, so `text/plain` should be detected and rejected by the new check. Expected: the upload fails with `"File type not allowed"`.

- [ ] **Step D7: Commit Phase D**

```bash
git add src/services/warehouse/warehouse-storage.service.ts
git commit -m "fix(warehouse): enforce MIME allowlist on file uploads

WarehouseStorageService.uploadFile previously delegated MIME enforcement
entirely to the Supabase Storage bucket configuration. Add an explicit
server-side allowlist (image/jpeg, image/png, image/webp, application/pdf)
so the service layer rejects bad uploads even if the bucket config drifts.

Addresses finding H-1 from the 2026-04-12 warehouse review."
```

---

## Phase E — Sanitize error response on stocks PO route (Finding H-2)

**Files:**
- Modify: `src/app/api/warehouse/stocks/[projectId]/po/route.ts:118-124` (the catch block at the end of PATCH)

**Why:** The catch block returns `error instanceof Error ? error.message : 'Failed to update stock override'` — which can leak constraint names, table names, and stack details to the client. The DR and Release detail routes already return `'Internal server error'` cleanly; this one is the only outlier in the warehouse API surface.

- [ ] **Step E1: Reproduce**

Force an error path by sending a body that will cause the upsert to fail (e.g., a `wbs` value that violates a constraint, if one exists). Or just inspect the current code at lines 118–124 and confirm it returns `error.message` rather than a generic string. The fix is straightforward enough that a code-level confirmation is sufficient.

- [ ] **Step E2: Replace the catch block**

Open `src/app/api/warehouse/stocks/[projectId]/po/route.ts`. Replace lines 118–124 (the `catch (error) { ... }` at the end of the PATCH function) with:

```typescript
  } catch (error) {
    console.error('Error updating stock override:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
```

The error is still logged server-side via `console.error`. The client now receives only `'Internal server error'`. Validation errors (400/403/404) are returned by the explicit branches earlier in the handler and remain descriptive — only the catch-all is sanitized.

- [ ] **Step E3: TypeScript build check**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step E4: Verify the happy path still works and the catch path returns generic**

Trigger a normal successful PATCH and confirm it still returns the updated stock row. Then trigger an error path (e.g., send a malformed body that bypasses the early validation but breaks at upsert — or simply inspect the code one more time). Expected on error: response body is `{"error":"Internal server error"}`, and the full error appears in the **server logs** (visible in the `npm run dev` terminal) for operator debugging.

- [ ] **Step E5: Commit Phase E**

```bash
git add src/app/api/warehouse/stocks/[projectId]/po/route.ts
git commit -m "fix(warehouse): sanitize stocks PO PATCH catch-block error

The catch-all returned error.message to the client, which can leak
constraint names, table names, and stack details. Match the pattern
used by the DR and release detail routes: log full error server-side,
return generic 'Internal server error' to the client. Validation errors
returned by explicit branches earlier in the handler are unchanged.

Addresses finding H-2 from the 2026-04-12 warehouse review."
```

---

## Final verification (after all five phases)

- [ ] **Run the production build one more time**

```bash
npm run build
```

Expected: clean build, no new TypeScript errors compared to baseline.

- [ ] **Smoke test the warehouse module end-to-end**

With `npm run dev` running and signed in as a warehouseman:
1. Open `/dashboard/warehouse` — projects load.
2. Open delivery receipts list — DRs load.
3. Open a DR detail page — loads via the now-auth-gated GET.
4. Edit the DR (unlock if needed), save with the original `project_id` — succeeds.
5. Try to upload a `.jpg` photo when creating a new DR — succeeds.

Then sign in as a `material_control` user:
6. Open a stocks page — loads.
7. Edit a `unit_cost` cell with value `12.345` — confirm dialog → save → cell shows `12.35` (rounded).
8. Open browser DevTools network tab and confirm no PATCH error response leaks raw DB messages.

- [ ] **Push branch and open a PR**

```bash
git push -u origin <branch-name>
```

Open a PR titled `fix(warehouse): security hardening (C-2, C-3, M-1, H-1, H-2)` with the body referencing `C:\Users\PC\reviews\warehouse-dashboard-review.md` for context and listing each phase as a checkbox in the PR description.

---

## Self-review checklist

- ✓ **Spec coverage:** C-2 (Phase A), C-3 (Phase B), original-C-1/M-1 (Phase C), H-1 (Phase D), H-2 (Phase E). All security findings rated Critical/High in the source review are covered, plus the M-1 downgrade. M-2 (`supabase.server.ts` move) and M-3 (random filename suffix) are intentionally deferred — both are nice-to-have, neither is exploitable today, and shipping them would expand the diff surface unnecessarily for a security patch.
- ✓ **Placeholder scan:** every step has either runnable commands or full code blocks. No "TODO", "implement later", "similar to phase X".
- ✓ **Type consistency:** the new `roundCost` helper is local to one file. The new `ALLOWED_MIME_TYPES` constant is local to one file. No cross-file types introduced.
- ✓ **Verification strategy:** every phase ends with `npm run build` and a curl-based or manual verification before commit. No test framework added (per `.claude/rules/code-quality.md`: "Do not introduce new dependencies without asking first").
- ✓ **Commit boundaries:** five independent commits, one per phase. Any phase can be skipped or split into its own PR if priorities shift.
