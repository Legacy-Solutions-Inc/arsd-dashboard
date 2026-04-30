---
name: scaffold-service
description: Use when creating a new business-logic service class in src/services/ for the ARSD Dashboard. Triggers on "create a service for X", "add a service", "new service class", or any request to put logic behind a domain in src/services/. Encodes the BaseService extension pattern, error helpers, Supabase client choice, and the service-role escape hatch.
---

# Scaffold Service

Use this skill when creating a new service class. Service classes hold all business logic — components and route handlers stay thin.

Steps:

1. Confirm the target domain folder exists under `src/services/<domain>/`. If the domain is new, also plan the matching folders in `src/components/<domain>/`, `src/types/<domain>.ts`, and `src/hooks/<domain>/`.
2. Create `<feature>.service.ts` in the domain folder. Use kebab-case for the filename and PascalCase for the class.
3. The class **must** extend `BaseService` from `@/services/base-service`. Do not instantiate `createClient` directly — `BaseService` provides `this.supabase`.
4. Wrap every Supabase call with `this.handleSupabaseError(() => this.supabase.from(...).select(...))` so errors normalize to `AppError`.
5. Use `this.validateRequired(input, ['field1', 'field2'])` at the top of any method that takes a required-field payload.
6. **Server-side / RLS bypass exception**: if the method must run server-side and bypass RLS (cron route, webhook, server-only maintenance), do not use `BaseService`'s default browser client. Instead, import and call `createServiceSupabaseClient()` from `@/lib/supabase` inside the method, and add a one-line comment explaining why bypass is required.
7. Export the class as a named export. No default exports.
8. If the service introduces new shapes, add them to `src/types/<domain>.ts` (one types file per domain).
9. Verify with `npx tsc --noEmit`.

Anti-patterns to avoid:
- Putting business logic in route handlers or components.
- Catching errors inside the service to return a "safe" empty value — let them propagate; `handleSupabaseError` already normalizes them.
- Constructing a third client variant (`@supabase/ssr` directly, hand-rolled `createClient` calls, etc.). Use the existing factories.

References: `.claude/rules/services.md`, `.claude/rules/supabase.md`.
