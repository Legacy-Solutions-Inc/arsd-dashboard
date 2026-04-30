# Services Layer Rules

- Business logic belongs in `src/services/<domain>/`, not in components or route handlers.
- New service classes extend `BaseService` (`src/services/base-service.ts`) and gain:
  - `this.supabase` — a browser-side Supabase client from `@/lib/supabase`
  - `handleSupabaseError(operation)` — wraps a Supabase call, throws `AppError` on failure
  - `validateRequired(data, fields)` — argument-presence guard
- Errors thrown from services are normalized via `handleError` in `@/lib/errors`. Do not catch-and-swallow — let them propagate.
- Services that must run server-side (RLS bypass, cron) should construct a server or service-role client explicitly instead of relying on `BaseService`'s default browser client. See `.claude/rules/supabase.md`.
- Domain index: `accomplishment-reports/`, `projects/`, `role-based/`, `storage/` (incl. `nas-mover.service.ts`), `warehouse/`, `progress-photos/`.