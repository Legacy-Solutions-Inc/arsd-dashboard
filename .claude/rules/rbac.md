# RBAC Rules

- Source of truth for roles, permissions, and post-login redirects: `src/lib/config.ts`.
- Eight roles: `superadmin`, `hr`, `project_manager`, `project_inspector`, `warehouseman`, `purchasing`, `material_control`, `pending`.
- RBAC is enforced at four layers — every change must be considered against all four:
  1. **Middleware** — session refresh + protected-route check (`middleware.ts` → `supabase/middleware.ts`)
  2. **Service** — `src/services/role-based/` (`rbac.ts`, `rbac.service.ts`, `rbac-server.ts`)
  3. **Warehouse** — `src/lib/warehouse/rbac.ts` is a **separate** RBAC layer for the warehouse module; it composes with the main service but has its own checks
  4. **UI** — `src/components/PermissionGate.tsx` plus `useRBAC` (`src/hooks/useRBAC.ts`) and `useWarehouseAuth` (`src/hooks/warehouse/useWarehouseAuth.ts`)
- Adding a permission: update `src/lib/config.ts` first, then thread it through any of the four layers that need to enforce it.
- Adding a role: also update the redirect map in `config.auth.redirectPaths` and the role-based route map in `config.routes.roleBased`.
- Never check roles by string-matching in components — go through `useRBAC` / `PermissionGate`.