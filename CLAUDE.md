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
- Payments: Stripe
- Deployment: Vercel (with cron jobs)
- Package Manager: npm

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
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

- Service layer pattern: business logic lives in src/services/, not in components or route handlers
- RBAC is implemented at multiple layers: middleware, service, and UI (see src/services/role-based/ and src/lib/warehouse/rbac.ts)
- Accomplishment reports are parsed from Excel (xlsx) files with auto-parse capability
- Supabase Storage handles all file uploads with weekly cleanup via Vercel cron
- Path alias @/* maps to ./src/* for all imports

## Code Conventions

- Named exports for all non-page components
- Service classes extend base-service.ts pattern
- Supabase client: use supabase/client.ts (browser) vs supabase/server.ts (server)
- Types are centralized in src/types/ — one file per domain

## Environment Variables

Required (see .env.local):
```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY      # Server-only service role key
STRIPE_SECRET_KEY              # Stripe API key (if payments active)
NEXT_PUBLIC_TEMPO              # Tempo devtools flag (dev only)
```

## Key Patterns

### Accomplishment Report Flow
Excel upload → xlsx-parser.ts → accomplishment-report-parser.ts → auto-parse.service.ts → Supabase storage + database

### RBAC Flow
Auth middleware (session refresh) → role-based service → warehouse RBAC → UI conditional rendering

### Storage Cleanup
Vercel cron (weekly) → /api/cron/cleanup-storage → storage-cleanup.service.ts → removes orphaned files

## Gotchas

- Supabase RLS is enforced — queries without proper auth context will silently return empty results
- The middleware.ts at project root delegates to supabase/middleware.ts for session handling
- xlsx parser is memory-intensive for large files — auto-parse runs in parallel for performance
- Warehouse module has its own RBAC layer separate from the main app RBAC

## .claude/ Directory

This project uses the full .claude/ structure:
- `/commands` — Run with /project:review, /project:scaffold-component, /project:debug
- `/agents` — Subagents for research (researcher) and QA (qa)
- `/rules` — Auto-loaded rules for nextjs, supabase, ui, code-quality

## When Compacting

Always preserve:
- Files modified in this session
- Current task objective and progress
- Test/build commands run and their results
- Active branch context
