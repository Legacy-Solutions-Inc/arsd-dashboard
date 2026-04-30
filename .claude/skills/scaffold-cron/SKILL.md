---
name: scaffold-cron
description: Use when adding a new Vercel cron route to the ARSD Dashboard. Triggers on "add a cron job", "schedule a recurring task", "create a cron route", "run something on a schedule". Encodes the route pattern, maxDuration, vercel.json registration, CRON_SECRET handling, and the documentation update needed so the cron is discoverable in future sessions.
---

# Scaffold Cron

Use this skill when adding a new Vercel cron. Crons fail silently in production unless every step is wired up — this skill enumerates them.

Steps:

1. **Pick the path**: `/api/cron/<descriptive-kebab-name>`. Create the file at `src/app/api/cron/<name>/route.ts`.
2. **Route handler** must:
   - Export an async `GET(request: NextRequest)` handler — Vercel Cron sends GET only.
   - Set `export const maxDuration = 300;` (5 min). Raise only if the workload genuinely needs longer; lower if you can guarantee faster execution.
   - Delegate the actual work to a service in `src/services/<domain>/`. Do not put business logic in the route handler.
   - Return `NextResponse.json({ success, ...result, timestamp: new Date().toISOString() })` on both success and failure paths so logs are diffable.
   - Catch errors and return status 500 with `{ success: false, error: message, timestamp }`. Log the error first.
3. **Register in `vercel.json`** under the `crons` array with a UTC schedule. Example:
   ```json
   { "path": "/api/cron/<name>", "schedule": "30 2 * * *" }
   ```
   Avoid scheduling within ±10 minutes of `02:00 UTC` (cleanup-storage) or `02:30 UTC` (migrate-to-nas) — keep load staggered.
4. **Auth**: if the route needs auth, read `process.env.CRON_SECRET` and check it against the `Authorization: Bearer <secret>` header. **Note**: recent commits removed bearer-token checks on the existing cron routes — confirm with the team whether new routes should have auth before adding it. If unsure, leave it open and document the decision.
5. **Update CLAUDE.md** "Tiered Storage" section (or add a sibling pattern under "Key Patterns") listing the new cron's path and schedule. Also append it to `.claude/rules/cron.md` so the cron list there stays current.
6. **Verify**:
   - `npx tsc --noEmit`
   - `npm run build`
   - Manual test: `curl http://localhost:3000/api/cron/<name>` against `npm run dev`. Confirm the response shape and that side effects ran.

Anti-patterns to avoid:
- Putting cron-only logic inline in the route handler instead of a service (makes it untestable from the outside).
- Forgetting `export const maxDuration` — the Vercel default may not be enough for heavy work.
- Scheduling without checking other cron times (cron stampede risk on low-tier Vercel plans).
- Skipping the CLAUDE.md / cron.md update — the cron will run but nobody will know it exists.

References: `.claude/rules/cron.md`, `.claude/rules/services.md`, `vercel.json`.
