# Accomplishment Reports Rules

- Pipeline: Excel upload → `src/lib/xlsx-parser.ts` → `src/lib/accomplishment-report-parser.ts` → `src/services/accomplishment-reports/auto-parse.service.ts` → Supabase storage + DB rows.
- xlsx parsing is memory-intensive on large workbooks. Auto-parse runs sheets in parallel for speed; if you change batching or concurrency, watch heap and the cron `maxDuration` budget.
- Reports may be re-parsed via `/api/accomplishment-reports/parse-approved` and reset via `/api/reset-failed-reports`.
- Domain types live in `src/types/accomplishment-reports.ts` and `src/types/accomplishment-report-data.ts` — keep parser output aligned with them.
- The Supabase storage bucket for reports is provisioned via migrations in `supabase/migrations/` (look for `*_create_storage_bucket*.sql` and the `*xlsx_support*` migration). Do not recreate the bucket from app code.