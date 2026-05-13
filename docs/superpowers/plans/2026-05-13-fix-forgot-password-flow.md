# Fix Forgot-Password Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the password-recovery flow work end-to-end for every user with an account, regardless of approval status.

**Architecture:** Move `reset-password` out of the RBAC-gated `/dashboard/` segment into the public `(auth)` route group, fix the five broken redirect paths in `src/app/actions.ts` (all currently point at a non-existent `/protected/reset-password`), add a server-side recovery-session guard on the new page, and reroute the success path back through `/sign-in` so the flow works for users in any approval state.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase Auth (`@supabase/ssr`), server actions.

**Background:** Investigation in conversation on 2026-05-13. Root cause: `src/app/actions.ts` has 5 references to `/protected/reset-password` which does not exist (the actual page is at `src/app/dashboard/reset-password/page.tsx`). Clicking the recovery email link 404s. Even if the path were corrected, `/dashboard/*` is gated by `supabase/middleware.ts` (blocks pending/inactive users) and `src/app/dashboard/layout.tsx` (RBAC check), so pending users — which is every freshly signed-up user — cannot complete the flow.

**Note on testing:** This project has no Jest / Vitest / Playwright infrastructure today, and per `.claude/rules/code-quality.md`: *"no test framework is wired up — add one if a regression risk warrants it, otherwise document the manual repro in the PR."* Verification is `npx tsc --noEmit` + `npm run build` + a manual end-to-end smoke test documented in Task 4.

---

## File Structure

| File | Responsibility | New / Modified / Deleted |
|---|---|---|
| `src/app/(auth)/reset-password/page.tsx` | New-password form page, public route (no RBAC gate), with server-side recovery-session guard. | **New** |
| `src/app/dashboard/reset-password/page.tsx` | Old location — gated by `/dashboard/*` middleware + layout RBAC. | **Deleted** |
| `src/app/dashboard/reset-password/` | Now-empty directory. | **Deleted** |
| `src/app/actions.ts` | `forgotPasswordAction` + `resetPasswordAction` — 5 redirect-path edits. | **Modified** |

**Out of scope** (do not touch in this plan):
- `src/app/auth/callback/route.ts` — already correct (reads `redirect_to`, forwards it).
- `supabase/middleware.ts` — gating is correct; we're fixing route placement, not the gates.
- `src/app/dashboard/layout.tsx` — same.
- `src/app/(auth)/forgot-password/page.tsx` — form is correct; only the action's redirect target changes.
- Supabase project URL allow-list, SMTP, email templates — operator-side; documented in Task 4 as a manual verification step.
- Password-strength enforcement, rate-limiting, global session invalidation.

---

## Task 1: Create the new reset-password page in the `(auth)` route group

**Files:**
- Create: `src/app/(auth)/reset-password/page.tsx`

The `(auth)` route group has no layout-level RBAC check (unlike `dashboard/layout.tsx`) and is not gated by `supabase/middleware.ts`. The page itself enforces "only with a valid recovery session" via a server-side `getUser()` guard.

- [ ] **Step 1.1: Read the existing dashboard reset-password page**

Run:
```bash
cat "src/app/dashboard/reset-password/page.tsx"
```

Expected: a server component that awaits `searchParams`, renders a message-only view when `"message" in searchParams`, otherwise renders the new-password form bound to `resetPasswordAction`. Confirm this matches before proceeding — if it's been modified since the plan was written, stop and ask.

- [ ] **Step 1.2: Create the new file with the relocated form + session guard**

Create `src/app/(auth)/reset-password/page.tsx` with exactly this content:

```tsx
import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  // Require a recovery session created by /auth/callback.
  // Without it, supabase.auth.updateUser() would fail with a confusing error.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/forgot-password?error=Reset+link+expired+or+invalid");
  }

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
              <p className="text-sm text-muted-foreground">
                Please enter your new password below.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="New password"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  required
                  className="w-full"
                />
              </div>
            </div>

            <SubmitButton
              formAction={resetPasswordAction}
              pendingText="Resetting password..."
              className="w-full"
            >
              Reset password
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </>
  );
}
```

Notes on the import paths:
- `../../../../supabase/server` resolves from `src/app/(auth)/reset-password/page.tsx` to `<repo-root>/supabase/server.ts` (4 levels up, then into `supabase/`). This matches the pattern used by `src/app/auth/callback/route.ts:1`.
- `@/components/...` and `@/app/actions` use the `@/* → ./src/*` path alias declared in the project's tsconfig.

- [ ] **Step 1.3: Verify the file was created and the route group is intact**

Run:
```bash
ls "src/app/(auth)/reset-password/page.tsx" && ls "src/app/(auth)/"
```

Expected: the new file exists, and `src/app/(auth)/` now contains at least `forgot-password/`, `reset-password/`, plus whatever sibling auth pages were already there (e.g. `sign-in/`, `sign-up/`).

---

## Task 2: Update redirect paths in `src/app/actions.ts`

**Files:**
- Modify: `src/app/actions.ts` (lines 158, 190, 198, 210, 215)

All five redirects currently point at routes that either don't exist or are RBAC-gated. After this task, every redirect in the recovery flow points at either the new public `/reset-password` page or `/sign-in`.

- [ ] **Step 2.1: Edit line 158 — `forgotPasswordAction` email link**

In `src/app/actions.ts`, find:

```ts
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });
```

Change to:

```ts
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });
```

- [ ] **Step 2.2: Edit lines 188-192 — `resetPasswordAction` "missing fields" error**

Find:

```ts
  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }
```

Change to:

```ts
  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required",
    );
  }
```

- [ ] **Step 2.3: Edit lines 195-201 — `resetPasswordAction` "passwords don't match" error**

Find:

```ts
  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }
```

Change to:

```ts
  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Passwords do not match",
    );
  }
```

- [ ] **Step 2.4: Edit lines 207-213 — `resetPasswordAction` Supabase failure**

Find:

```ts
  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }
```

Change to:

```ts
  if (error) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password update failed",
    );
  }
```

- [ ] **Step 2.5: Edit line 215 — `resetPasswordAction` success**

Find:

```ts
  return encodedRedirect("success", "/protected/reset-password", "Password updated");
```

Change to:

```ts
  return encodedRedirect("success", "/sign-in", "Password updated. Please sign in with your new password.");
```

Rationale: routing the success back through `/sign-in` works regardless of the user's approval state. If we sent them to `/dashboard` they'd be redirected to `/pending-approval` (per `supabase/middleware.ts`); `/sign-in` is the safe universal exit.

- [ ] **Step 2.6: Verify no stale path references remain anywhere in `src/`**

Run:
```bash
grep -rn "/protected/reset-password\|/dashboard/reset-password" src/
```

Expected: **zero output** (no matches). If anything is returned, inspect the match — it must be either dead code that needs removing, or a missed edit. Do not proceed until this returns clean.

---

## Task 3: Delete the old `/dashboard/reset-password` page

**Files:**
- Delete: `src/app/dashboard/reset-password/page.tsx`
- Delete: `src/app/dashboard/reset-password/` (now-empty directory)

This must happen *after* Task 2 — if you delete the page before fixing the redirects, the build still passes (the path is dynamic string in `encodedRedirect`), but any runtime hit of the old path would 404 instead of 200.

- [ ] **Step 3.1: Confirm the file is the only thing in the directory**

Run:
```bash
ls "src/app/dashboard/reset-password/"
```

Expected: only `page.tsx`. If there's anything else (e.g. a `layout.tsx`, `loading.tsx`, sub-route), stop and ask — the plan did not account for it.

- [ ] **Step 3.2: Delete the page and the directory**

Run:
```bash
rm "src/app/dashboard/reset-password/page.tsx" && rmdir "src/app/dashboard/reset-password"
```

- [ ] **Step 3.3: Verify deletion**

Run:
```bash
ls "src/app/dashboard/" | grep reset-password || echo "OK: reset-password no longer under dashboard"
```

Expected: `OK: reset-password no longer under dashboard`.

---

## Task 4: Verify build and document manual smoke test

**Files:** none modified

- [ ] **Step 4.1: Typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: completes with **zero errors**. If TypeScript reports an error in any file touched by this plan, stop and report — do not improvise a fix that wasn't in the plan.

- [ ] **Step 4.2: Production build**

Run:
```bash
npm run build
```

Expected: build completes successfully. In the route manifest printed at the end, you should see `/reset-password` listed as a route (under the `(auth)` group, served at `/reset-password`), and **no** `/dashboard/reset-password` route. No `/protected/reset-password` either (there never was one).

- [ ] **Step 4.3: Final grep — no stale path strings anywhere in the repo**

Run:
```bash
grep -rn "/protected/reset-password\|/dashboard/reset-password" src/ supabase/ middleware.ts docs/ 2>/dev/null
```

Expected: zero output (the `docs/` scope may catch references in this plan file itself — those are fine to ignore; the executor only needs to confirm no *code or migration* references remain).

- [ ] **Step 4.4: Stop and report — do NOT commit**

Per project convention (`Only create commits when requested by the user`), do not `git add` or `git commit`. Report back to the user with:
- List of files created / modified / deleted (paths only).
- Output of `npx tsc --noEmit` (should be empty / no errors).
- Last 15 lines of `npm run build` output (the route manifest).
- Result of the grep in Step 4.3.
- Confirmation that the (auth)/reset-password page exists and the old dashboard one is gone.

The user then runs the **manual end-to-end smoke test** below before committing. The executor does not run this — it requires a real Supabase project and an email inbox.

### Manual smoke test (user runs, after executor reports clean)

1. Start dev server: `npm run dev`.
2. Log out (clear cookies if needed). Visit `http://localhost:3000/forgot-password`.
3. Submit a known-good email belonging to a user in the Supabase project.
4. Confirm the success message "Check your email for a link to reset your password." appears.
5. Open the email. The link should look like `https://<your-domain>/auth/callback?code=...&redirect_to=/reset-password`.
6. Click the link. The browser must land on `http://localhost:3000/reset-password` (NOT `/protected/...`, NOT `/`, NOT `/sign-in`).
7. Enter a new password twice, submit. Browser must redirect to `/sign-in?success=Password+updated...`.
8. Sign in with the new password — must succeed.
9. **Repeat with a pending-status user** (one whose profile has `role='pending'` or `status='pending'`). The full flow must still work — this is the key regression the plan fixes.
10. **Negative test**: open `http://localhost:3000/reset-password` directly in an incognito tab (no session). Must redirect to `/forgot-password?error=Reset+link+expired+or+invalid`.

### Supabase dashboard verification (user only — cannot be automated from this repo)

Independent of the code fix, confirm in the Supabase dashboard:
- **Authentication → URL Configuration → Site URL** = the production URL (or dev URL for local testing).
- **Authentication → URL Configuration → Redirect URLs** allow-list includes:
  - `https://<prod-domain>/auth/callback`
  - `https://<prod-domain>/auth/callback?redirect_to=/reset-password`
  - `http://localhost:3000/auth/callback*` (for local dev).
- **Authentication → SMTP Settings** is configured with a real SMTP provider. Without this, Supabase rate-limits recovery emails to ~3/hour and they often go to spam — a common cause of "forgot password not working" reports that no code fix can address.

If any of these are missing, the code is correct but the user-visible flow will still appear broken.

---

## Risk

Low. No database schema, RLS, RBAC, service-layer, or middleware changes. Pure route + redirect cleanup. Build-time route resolution catches the only structural risk (a path typo would surface as a missing route).

## Out of scope (deferred; create separate plans if needed)

- Custom email-template content / branding (Supabase dashboard).
- Rate-limiting of password-reset attempts beyond Supabase defaults.
- Client-side or server-side password-strength enforcement.
- Invalidating other active sessions after a password change.
- Logging / telemetry for recovery-flow funnel.

---

## Self-Review

**Spec coverage:**
- Bug 1 (dead `/protected/reset-password` references) — Task 2 (all 5 edits).
- Bug 2 (post-update success 404) — Task 2 Step 2.5 (routes to `/sign-in`).
- Bug 3 (inconsistent error redirects) — Task 2 Steps 2.2-2.4 normalize all error paths to `/reset-password`.
- Bug 4 (route placement gated by RBAC) — Tasks 1 + 3 (move into `(auth)`, delete from `/dashboard/`).
- Bug 5 (no session guard, opens door to confusing `updateUser` errors) — Task 1 Step 1.2 (server-side `getUser()` check).
- Bug 6 (operator-side Supabase URL allow-list / SMTP) — documented in Task 4 manual checks.

**Placeholder scan:** No "TBD" / "implement later" / "similar to Task N" / unspecified error handling. Every code change is shown verbatim. Every grep / build command has expected output.

**Type / signature consistency:** `resetPasswordAction` signature is not changed; both the old and new pages import it from `@/app/actions`. The new page uses the same `Message` type from `@/components/form-message`. The Supabase server-client import in the new page (`../../../../supabase/server`) matches the relative path used in `src/app/auth/callback/route.ts:1` (which is `../../../../supabase/server` from `src/app/auth/callback/route.ts`).
