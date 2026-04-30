# Supabase Rules

- Two parallel Supabase client locations exist:
  - `supabase/client.ts` and `supabase/server.ts` — minimal `@supabase/ssr` clients used by route handlers, server components, and middleware
  - `src/lib/supabase.ts` — factory exporting `createClient` (browser), `createServerSupabaseClient` (cookies-aware), `createApiSupabaseClient` (no cookies), and `createServiceSupabaseClient` (service role, bypasses RLS). `BaseService` consumes this.
- When in doubt, follow the surrounding file's import. Do not introduce a third client pattern.
- Use the service-role client only when bypassing RLS is genuinely required (cron routes, server-only maintenance). Never expose it to the browser.
- Middleware in `supabase/middleware.ts` handles session refresh — do not bypass it; the root `middleware.ts` only delegates.
- RLS is enabled on every table — anonymous queries silently return empty. Authenticate first, or use the service-role client deliberately.
- Database types are in `src/types/supabase.ts`.
- Supabase Storage is the **staging** tier; the daily NAS-mover cron migrates files >24h old to NAS MinIO and rewrites their DB URL. See `.claude/rules/nas-storage.md` and `.claude/rules/cron.md`.