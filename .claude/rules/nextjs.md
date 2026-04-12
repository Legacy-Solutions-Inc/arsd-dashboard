# Next.js Rules

- Use App Router patterns (src/app/ directory), not Pages Router
- Server Components are the default — only add "use client" when state/effects/browser APIs are needed
- Use Route Handlers (src/app/api/*/route.ts) for API endpoints
- Use Server Actions (src/app/actions.ts) for form mutations
- Dynamic routes use [param] folder convention
- Metadata exports go in layout.tsx or page.tsx, not a separate head file
- Path alias @/* maps to ./src/* — always use it for imports
