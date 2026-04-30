# NAS Storage Rules

- Storage is tiered: **Supabase Storage = staging** (fast, RLS-checked), **NAS MinIO = canonical** (long-term, public read at `s3.arsd.co`).
- The mover lives in `src/services/storage/nas-mover.service.ts` and runs from the Vercel cron at `/api/cron/migrate-to-nas`. It uses `@aws-sdk/client-s3` against the NAS endpoint.
- Required env vars (server-only): `NAS_S3_ENDPOINT`, `NAS_S3_ACCESS_KEY_ID`, `NAS_S3_SECRET_ACCESS_KEY`. Never expose them to the browser; never commit them.
- A file URL in the database may point to **either** Supabase Storage or NAS MinIO. Code that consumes URLs must not assume a single host.
- The `nas-config/` directory at repo root holds operational config for the NAS-side daemons (cloudflared tunnel, MinIO, legacy `mover.sh`, logrotate). It is not deployed by Vercel — treat it as documentation/operations, not application code.
- The legacy NAS-side mover (`/volume1/docker/mover/mover.sh`) was replaced by the Vercel cron after 2026-04-22; do not re-enable it.