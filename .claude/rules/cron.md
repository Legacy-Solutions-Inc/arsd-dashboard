# Cron Rules

- Two crons are declared in `vercel.json`:
  - `/api/cron/cleanup-storage` — Sundays 02:00 UTC (`0 2 * * 0`); removes Supabase Storage orphans
  - `/api/cron/migrate-to-nas` — daily 02:30 UTC (`30 2 * * *`); drains files >24h old from Supabase to NAS MinIO and rewrites DB URLs
- Cron route handlers live under `src/app/api/cron/<name>/route.ts` and export `GET`. Set `export const maxDuration = 300;` (5 min) when work may exceed default limits.
- Auth: Vercel injects a bearer token; the route reads `CRON_SECRET` from env. Recent commits removed bearer-token checks — verify current state before re-adding any auth.
- New crons must be added to `vercel.json` and to the cron list in CLAUDE.md so future sessions know they exist.