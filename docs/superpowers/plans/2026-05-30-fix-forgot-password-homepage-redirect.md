# Mission

You are a senior Claude Code agent operating in the ARSD Dashboard repo (Next.js 14 App Router + Supabase). Your task: root-cause and fix a still-broken forgot-password flow.

**Symptom:** Users click the password-reset link in their email and land on the HOMEPAGE (`https://arsd.co/`), not on `/reset-password`.

**Prior fix (commit `1222f1e`, on `main` and deployed):** Introduced a dedicated `src/app/auth/recovery/route.ts` handler with a query-free redirect path to avoid GoTrue's wildcard-vs-query-string quirk. The bug persists despite this fix — so the failure surface is outside that code path.

## Why this matters diagnostically

Every in-app failure branch in the current code redirects to `/forgot-password?error=...`. The user lands on the **HOMEPAGE**, not on `/forgot-password`. Therefore the request never reaches the `/auth/recovery` handler — meaning the failure is in:

- Supabase's redirect-URL resolution (allow-list rejected our `redirect_to`, fell back to Site URL = homepage), OR
- The email link uses implicit-flow hash fragments (`#access_token=...`) that server-side handlers cannot read, OR
- Production is not running commit `1222f1e` (unlikely — but verify in Phase 1).

## Verified current state — do not re-research these files

| File | Behavior |
|------|----------|
| `src/app/actions.ts:147-179` | `forgotPasswordAction` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${origin}/auth/recovery\` })`. No query string. |
| `src/app/auth/recovery/route.ts` | `GET` reads `?code=` only; calls `supabase.auth.exchangeCodeForSession(code)`; success → `/reset-password`; failure → `/forgot-password?error=Reset+link+expired+or+invalid`; no code → `/forgot-password?error=Invalid+link`. |
| `src/app/(auth)/reset-password/page.tsx:19-21` | Server component; requires authenticated session via `supabase.auth.getUser()`; no user → `/forgot-password?error=Reset+link+expired+or+invalid`. |
| `src/middleware.ts` | The ACTIVE middleware (there is also a stale `middleware.ts` at root, but `src/middleware.ts` wins under the `src/` layout). Only redirects authed users from `/sign-in` and `/sign-up`. Does NOT touch `/auth/recovery` or `/reset-password`. |

**Stack:** `@supabase/ssr` + `@supabase/supabase-js` (both `latest`). Next.js `14.2.23`. Supabase project ID `uoffxmrnpukibgcmmgus`.

**Two Supabase client locations exist:** `supabase/{client,server}.ts` (used by auth routes — recovery route uses the server variant) and `src/lib/supabase.ts` (factory). Neither explicitly sets `flowType` — relies on Supabase project default.

## Ranked hypotheses — check in this order

1. **Supabase allow-list missing exact entry** for `https://arsd.co/auth/recovery`. Allow-list rejected `redirect_to`, Supabase silently fell back to Site URL → user lands on homepage. This was the dominant failure mode in the 2026-05-13 fix.
2. **Email uses IMPLICIT flow** with `#access_token=...&type=recovery` hash fragment. Hash fragments never reach servers — they land on whatever page handles them client-side. If Site URL is the homepage, the hash arrives at homepage but no handler reads it → user stays on homepage with the hash silently present in the URL.
3. **PKCE code-verifier cookie missing in browser** at click time (cross-device click, incognito, cookies cleared between request and click) → `exchangeCodeForSession` fails → redirect to `/forgot-password?error=...`. User would NOT land on homepage with this failure, so this is unlikely as root cause; treat as sanity check only.
4. **Production not running `1222f1e`** — verifiable with one curl command in Phase 1.

## Guardrails — non-negotiable

**DO:**
- Treat this as a diagnostic-first task. Gather data before patching.
- Use `curl -sI -L --max-redirs 0` to inspect raw Location headers on production.
- Ask the user for the actual email link (token-redacted) — it is the single most diagnostic data point.
- Edit existing files when possible. New files only when the implicit-flow branch genuinely requires one.
- Run `npx tsc --noEmit` after every code change. This project has no lint script — typecheck is the verification gate.
- Verify which middleware is active before changing auth flow (`src/middleware.ts` is the active one; root `middleware.ts` is stale).
- Present every Supabase dashboard change as a numbered, copy-pasteable checklist with EXACT field names and values. The user must do these by hand.

**DO NOT:**
- Commit, stage, or push. Leave all changes uncommitted in the working tree for user review. Do not modify git state at all.
- Run `git add`, `git commit`, `git push`, `git stash`, or any state-altering git command. Read-only git commands (`git status`, `git log`, `git diff`) are fine.
- Introduce new dependencies.
- Touch the root `middleware.ts` to "clean up" the duplicate — that is a separate task.
- Skip Phase 2's user-data collection and start patching from hypotheses alone. The prior fix shipped on the wrong hypothesis precisely because data was not collected first.
- Use the service-role Supabase client. Auth flows use anon key + cookies.
- Mark this task done until the user has performed a successful end-to-end reset on production and confirmed.

---

## Phase 1 — Confirm live deploy state (no user interaction needed)

Run these against production and report the Location header (or absence) for each:

```bash
curl -sI 'https://arsd.co/auth/recovery'
curl -sI 'https://arsd.co/auth/recovery?code=invalid-test-code'
curl -sI 'https://arsd.co/reset-password'
```

**Expected if `1222f1e` is deployed:**
- `https://arsd.co/auth/recovery` (no code) → 307/302 to `/forgot-password?error=Invalid+link`
- `https://arsd.co/auth/recovery?code=invalid-test-code` → 307/302 to `/forgot-password?error=Reset+link+expired+or+invalid`
- `https://arsd.co/reset-password` (unauth) → 307/302 to `/forgot-password?error=Reset+link+expired+or+invalid`

If any of these returns 200, 404, or a redirect to the homepage, the deploy itself is the bug — escalate to the user before Phase 2.

**GATE 1:** Report the exact Location header for each URL. DO NOT proceed to Phase 2 until you have all three results and have explicitly stated whether they match the expected redirects.

---

## Phase 2 — Collect diagnostic artifacts from the user

You cannot distinguish hypothesis 1 from hypothesis 2 without data from the user. Ask the user for ALL of the following, in one consolidated message:

1. **The full URL from a fresh password-reset email** (token redacted but URL structure intact — they should request a new reset link first, then copy-paste the link from the email WITHOUT clicking). You need to see: the host, path, query string, and whether there is a `#` hash fragment.
2. **Supabase dashboard → Authentication → URL Configuration**, report:
   - The value of **Site URL** (exact string)
   - Every entry in the **Redirect URLs** allow-list (exact strings, one per line)
3. **Supabase dashboard → Authentication → Email Templates → "Reset Password"**: paste the raw template body. You need to verify whether it uses `{{ .ConfirmationURL }}` or `{{ .SiteURL }}{{ .RedirectTo }}` — the template wording matters for diagnosis.
4. **Supabase dashboard → Authentication → Providers → Email**: report the value of "Flow type" if visible, and whether "Confirm email" / "Secure email change" are on. On newer projects this may not be exposed in the UI; if not visible, just say so.

While waiting for the user, also have the user **click** the reset link in a fresh incognito window and report:
- The exact URL in the address bar AFTER landing on homepage (including any `#fragment`)
- Whether the URL contained `?code=...` or `#access_token=...` before redirecting
- Browser network tab: the full redirect chain (each Request URL + Status Code), starting from the first hop out of Supabase

**GATE 2:** Do not begin Phase 3 until you have items 1, 2, and 3 (item 4 is best-effort) plus the address-bar URL and redirect chain. If the user pushes you to "just fix it," tell them you cannot choose between hypothesis 1 and hypothesis 2 without the email link — they are mutually-exclusive fixes.

---

## Phase 3 — Diagnose and apply the targeted fix

Map the user's data to a hypothesis. Show your work — explicitly cite which piece of data confirms which hypothesis — before applying any change.

### Branch A — Email URL contains `?code=...` (PKCE flow) AND user landed on homepage with no `?code` in final URL

→ **Hypothesis 1 confirmed: allow-list mismatch.**

**Action:** Deliver this numbered checklist for the user to do in the Supabase dashboard. No code changes for this branch.

1. Go to https://supabase.com/dashboard/project/uoffxmrnpukibgcmmgus → Authentication → URL Configuration.
2. Under **Redirect URLs**, add this EXACT entry (no wildcard, no trailing slash, no query string):
   ```
   https://arsd.co/auth/recovery
   ```
3. Verify **Site URL** is `https://arsd.co` (no trailing slash, no path). Do NOT change Site URL to `/auth/recovery` — Site URL is the global fallback for ALL email links and changing it will break sign-up confirmation and other flows.
4. Click **Save**.
5. Wait ~30 seconds for the change to propagate.
6. Have the user request a fresh reset email (old ones still embed the old `redirect_to` and will not work even after the fix) and click the link.

### Branch B — Email URL contains `#access_token=...` OR `#type=recovery` (implicit flow)

→ **Hypothesis 2 confirmed: implicit flow.**

Present these two paths to the user with pros/cons. Default recommendation: **Path A**.

**Path A (recommended) — Replace `route.ts` with a client `page.tsx` that handles BOTH flows:**

Next.js does NOT allow a route handler and a page at the same path. To handle both `?code=` (PKCE) and `#access_token=` (implicit) at `/auth/recovery`, you must REPLACE `src/app/auth/recovery/route.ts` with `src/app/auth/recovery/page.tsx` (client component).

Proposed `src/app/auth/recovery/page.tsx`:
- `"use client"` at top.
- On mount (`useEffect`):
  1. Parse `window.location.hash` (strip leading `#`) into a URLSearchParams. Look for `access_token` and `refresh_token`.
  2. If both present → instantiate browser Supabase client from `@/supabase/client`, call `await supabase.auth.setSession({ access_token, refresh_token })`. On success, `router.replace("/reset-password")`. On error, `router.replace("/forgot-password?error=Reset+link+expired+or+invalid")`.
  3. Else if `?code=` is in `window.location.search` → call `await supabase.auth.exchangeCodeForSession(code)` from the browser client; same success/failure redirects.
  4. Else → `router.replace("/forgot-password?error=Invalid+link")`.
- Show a minimal loading state ("Verifying your reset link…") during the exchange.
- Delete `src/app/auth/recovery/route.ts` after writing the page (they cannot coexist).
- Grep for `/auth/recovery` to confirm no other code references the route handler.
- Verify `src/middleware.ts` does not block navigation to `/reset-password` from an unauthenticated request — it currently does not (it only gates `/dashboard/*`), but reconfirm.

**Pros:** works on any Supabase project regardless of flow setting; one-time code change; no dashboard wrangling.
**Cons:** slightly slower (extra client round-trip after the email click); the page briefly renders before the session is set; the cookie-set happens in the browser rather than via Set-Cookie from the server.

**Path B — Switch the Supabase project to PKCE flow** (if exposed):
**Pros:** no code change; cleaner server-side handling.
**Cons:** not always exposed in the dashboard; can break other auth flows that depend on implicit (signup confirmation, magic links). Higher blast radius.

Recommend Path A unless the user explicitly prefers Path B.

### Branch C — Phase 1 curl results did NOT match expected redirects

→ **Hypothesis 4 confirmed: deploy issue.** Stop and report to the user; this is a Vercel deploy-level problem, not an application-code problem.

### Regardless of branch — propose a small UX hardening

Independently of which branch you take, propose tightening `src/app/(auth)/reset-password/page.tsx:19-21` to differentiate "no session at all" from "session exists but not from a recovery exchange." Currently both cases redirect to `/forgot-password?error=Reset+link+expired+or+invalid` — improve the error param so future debugging is easier (e.g., `error=No+recovery+session`). Show this as a small, separate edit the user can accept or skip. Do not bundle it into the main fix.

**GATE 3:** Before applying any code change:
1. State which hypothesis the data confirmed and which specific piece of data confirmed it.
2. Show a diff preview of the file(s) you will edit.
3. Get explicit user confirmation on the branch (Path A vs Path B) if Branch B applies.

After applying the change, run `npx tsc --noEmit` and report the result. If typecheck fails, fix the typecheck error before reporting Phase 3 complete.

---

## Phase 4 — End-to-end verification on production

After the user has applied the Supabase dashboard changes (Branch A) OR the user has committed and deployed your code (Branch B — NOTE: you yourself MUST NOT commit or push; the user does this manually):

Walk the user through this test in an incognito browser window:
1. Go to `https://arsd.co/forgot-password`.
2. Submit their email.
3. Open the email.
4. Click the reset link.
5. Confirm they land on `/reset-password` (not homepage, not `/forgot-password?error=...`).
6. Enter a new password and submit.
7. Confirm they land on `/sign-in` with a success message.
8. Sign in with the new password.

If any step fails, ask the user to capture the URL at the failure point + browser network tab redirect chain and re-diagnose. Do NOT silently assume "close enough."

**GATE 4:** Do not declare this task complete until the user explicitly reports a successful end-to-end reset on production. Do not rely on typecheck or build success as a proxy for fix success — those do not catch auth-config bugs.

---

## Output discipline

- Report each phase's findings before moving on. Don't batch.
- When asking the user a question, number it and put it last in your message so they can scan and reply.
- When proposing code changes, show the diff first.
- When proposing dashboard changes, give exact field names, exact values, and step-by-step navigation.
- If you find yourself wanting to skip Gate 2 ("the user is busy / I'm pretty sure it's hypothesis 1") — DO NOT. The whole point of this task is that the prior fix shipped on the wrong hypothesis. Verify before patching.

## Definition of done

User has completed an end-to-end password reset on production: forgot-password → email click → land on `/reset-password` → new password set → sign in → success. Reported and confirmed by the user. The working tree contains any pending code changes (uncommitted) and a written summary of any dashboard changes the user applied.

Anything short of that is not done.
