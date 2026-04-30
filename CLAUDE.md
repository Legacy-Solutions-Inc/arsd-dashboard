# ARSD Dashboard

Construction project management dashboard for ARSD (Architectural & Structural Design). Manages projects, accomplishment reports, warehouse/inventory, progress photos, and role-based access control.

## Stack

- Framework: Next.js 14 with App Router (src/app/)
- Language: TypeScript (strict mode)
- Database: Supabase (PostgreSQL + Auth + Storage + RLS)
- UI: Shadcn/ui + Tailwind CSS + Radix UI primitives
- Charts: Recharts + Chart.js
- Forms: react-hook-form
- Animations: framer-motion
- File Parsing: xlsx (Excel parsing for accomplishment reports)
- Image Compression: browser-image-compression (warehouse upload pipeline)
- Tiered Storage: Supabase Storage (staging) → NAS MinIO via @aws-sdk/client-s3 (canonical)
- Deployment: Vercel (with cron jobs)
- Package Manager: npm

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npx tsc --noEmit     # Typecheck (no lint script — use this + build for verification)
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Auth pages (sign-in, sign-up, forgot-password)
│   ├── api/             # Route Handlers (cron, cleanup, reset)
│   ├── auth/callback/   # Supabase auth callback
│   ├── dashboard/       # Main dashboard (projects, uploads, users, warehouse, leaderboard)
│   ├── projects/        # Public project listing
│   ├── pending-approval/# Pending user approval page
│   └── actions.ts       # Server Actions
├── components/
│   ├── ui/              # Shadcn components
│   ├── accomplishment-reports/
│   ├── projects/
│   ├── storage/
│   ├── uploads/
│   ├── warehouse/
│   └── website-projects/
├── services/            # Business logic layer (service classes)
│   ├── accomplishment-reports/  # Report parsing, data, integration
│   ├── projects/        # Project CRUD + website projects
│   ├── role-based/      # RBAC service layer
│   ├── storage/         # File storage + cleanup
│   └── warehouse/       # Delivery receipts, IPOW, releases
├── lib/                 # Shared utilities
│   ├── supabase.ts      # Supabase client
│   ├── utils.ts         # cn() helper, general utils
│   ├── xlsx-parser.ts   # Excel file parser
│   ├── accomplishment-report-parser.ts
│   └── warehouse/rbac.ts
├── types/               # TypeScript type definitions
├── contexts/            # React contexts (WarehouseStoreContext)
├── hooks/               # Custom hooks (warehouse/)
├── config/              # App configuration
├── constants/           # Shared constants
└── data/                # Static data
supabase/
├── client.ts            # Browser Supabase client
├── server.ts            # Server Supabase client
├── middleware.ts         # Session refresh middleware
└── migrations/          # Database migrations
```

## Architecture Decisions

- Service layer pattern: business logic lives in src/services/, not in components or route handlers; classes extend `BaseService` (`src/services/base-service.ts`)
- RBAC is enforced at four layers: middleware, role-based service, warehouse RBAC (separate), and UI (`PermissionGate` + `useRBAC`). Source of truth: `src/lib/config.ts`.
- Accomplishment reports are parsed from Excel (xlsx) files with an auto-parse pipeline that runs sheets in parallel
- Tiered storage: Supabase Storage is staging; daily cron migrates files >24h old to NAS MinIO (`s3.arsd.co`) and rewrites their DB URL. Weekly cron removes Supabase orphans.
- Path alias @/* maps to ./src/* for all imports

## Code Conventions

- Named exports for all non-page components
- Service classes extend `base-service.ts` and use its `handleSupabaseError` / `validateRequired` helpers
- **Two** Supabase client locations exist: `supabase/{client,server}.ts` and `src/lib/supabase.ts` (factory with browser, server, API, and service-role variants). See `.claude/rules/supabase.md` for which to use where.
- Types are centralized in src/types/ — one file per domain

## Environment Variables

Required (see .env.local):
```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY      # Server-only service role key
NEXT_PUBLIC_TEMPO              # Tempo devtools flag (dev only — disabled in prod via next.config.js)
NAS_S3_ENDPOINT                # NAS MinIO endpoint, e.g. https://s3.arsd.co
NAS_S3_ACCESS_KEY_ID           # NAS MinIO service account access key (server-only)
NAS_S3_SECRET_ACCESS_KEY       # NAS MinIO service account secret key (server-only)
CRON_SECRET                    # Vercel-managed secret for cron route auth (set in Vercel dashboard)
```

## Key Patterns

### Accomplishment Report Flow
Excel upload → `xlsx-parser.ts` → `accomplishment-report-parser.ts` → `auto-parse.service.ts` → Supabase storage + DB. See `.claude/rules/accomplishment-reports.md`.

### RBAC Flow
Auth middleware (session refresh) → role-based service → warehouse RBAC → `PermissionGate` UI. Roles + permissions defined in `src/lib/config.ts`. See `.claude/rules/rbac.md`.

### Tiered Storage
1. Upload → Supabase Storage (staging, RLS-checked)
2. Daily cron (`/api/cron/migrate-to-nas`, 02:30 UTC) drains files >24h old to NAS MinIO and rewrites DB URLs
3. Weekly cron (`/api/cron/cleanup-storage`, Sun 02:00 UTC) removes Supabase orphans

See `.claude/rules/nas-storage.md` and `.claude/rules/cron.md`.

## Gotchas

- Supabase RLS is enforced — queries without proper auth context silently return empty results
- The `middleware.ts` at project root delegates to `supabase/middleware.ts` for session handling — do not bypass
- xlsx parser is memory-intensive for large files — auto-parse runs in parallel for performance; watch heap if you change batching
- Warehouse module has its own RBAC layer separate from the main app RBAC — both must be considered
- File URLs in the DB may point to Supabase Storage **or** NAS MinIO — never assume a single host

## Reference Docs

Project docs at repo root (read for deep context, not loaded every session):
- `RBAC_IMPLEMENTATION.md`, `ROLE_BASED_FILTERING.md`, `PROJECT_INSPECTOR_IMPLEMENTATION.md`
- `STORAGE_CLEANUP_DOCUMENTATION.md`
- `WAREHOUSE_BACKEND_IMPLEMENTATION.md`
- `WEBSITE_PROJECTS_SETUP.md`
- `CONSTANTS_CENTRALIZATION.md`, `CONTACT_INFO_CENTRALIZATION.md`
- `SUPABASE_CLI_SETUP.md`

## .claude/ Layout

- `agents/` — `researcher` (read-only codebase research), `qa` (typecheck + build verification)
- `commands/` — invoked as `/project:review`, `/project:debug`, `/project:scaffold-component`
- `rules/` — domain rules imported below; they load with this file every session
- `skills/` — `scaffold-service`, `scaffold-cron`, `add-rbac-permission` (auto-trigger on matching intent)
- `hooks/` — present but currently unused in this project

@.claude/rules/code-quality.md
@.claude/rules/nextjs.md
@.claude/rules/supabase.md
@.claude/rules/ui.md
@.claude/rules/services.md
@.claude/rules/rbac.md
@.claude/rules/cron.md
@.claude/rules/nas-storage.md
@.claude/rules/accomplishment-reports.md
@.claude/rules/warehouse.md

## When Compacting

Always preserve:
- Files modified in this session
- Current task objective and progress
- Test/build commands run and their results
- Active branch context
