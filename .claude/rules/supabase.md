# Supabase Rules

- Use supabase/client.ts for browser-side client
- Use supabase/server.ts for server-side client (Route Handlers, Server Actions, Server Components)
- Middleware in supabase/middleware.ts handles session refresh — do not bypass it
- RLS is enabled — all queries require proper auth context
- Database types are in src/types/supabase.ts
- Supabase storage is used for file uploads (progress photos, accomplishment reports)
- Storage cleanup runs via Vercel cron at /api/cron/cleanup-storage (weekly)
