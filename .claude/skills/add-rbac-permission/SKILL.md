---
name: add-rbac-permission
description: Use when adding, modifying, or removing a permission, role, or protected route in the ARSD Dashboard's RBAC system. Triggers on "add permission for X", "create role Y", "protect route Z", "restrict access", "give role X access to Y". Forces consideration of all four enforcement layers plus the separate warehouse RBAC layer — skipping any one of them creates a real authorization bug, not just a UI issue.
---

# Add RBAC Permission

Use this skill when touching the RBAC system. RBAC is enforced at four layers; UI-only changes do not protect data.

Steps:

1. **Source of truth — `src/lib/config.ts`** (always edit first):
   - **Adding a permission**: append the string to the relevant role's array under `config.permissions`.
   - **Adding a role**: add an entry to `config.permissions` (with its permission strings), `config.auth.redirectPaths` (post-login destination), and — if the role has its own gated routes — `config.routes.roleBased`.
   - **Protecting a route**: add the path to `config.routes.protected`. If only specific roles may access it, also add it to `config.routes.roleBased` with the allowed-role list.
2. **Service layer enforcement** — `src/services/role-based/`:
   - For data operations, add a check that returns/throws on missing permission. Server-side enforcement is the only one that actually protects the data; everything else is UX.
3. **Middleware** — `middleware.ts` → `supabase/middleware.ts`:
   - Confirm the protected route flows through the middleware matcher. Most `/dashboard/*` routes do; verify by reading the matcher config.
   - If the route is outside `/dashboard`, you may need to extend the matcher.
4. **UI** — gate every visible affordance:
   - Wrap conditional UI in `<PermissionGate>` (`src/components/PermissionGate.tsx`).
   - For imperative checks inside components, use `useRBAC` (`src/hooks/useRBAC.ts`).
   - Never compare role strings directly in JSX or component logic — go through the hook/component.
5. **Warehouse module** — if the change touches anything under `src/app/dashboard/warehouse/`, `src/components/warehouse/`, `src/services/warehouse/`, or the warehouse API routes:
   - Update `src/lib/warehouse/rbac.ts` as well. The warehouse RBAC is **separate** from the main service and silently allows traffic if you only update the main layer.
   - Verify `useWarehouseAuth` (`src/hooks/warehouse/useWarehouseAuth.ts`) reflects the change.
6. **Verify**:
   - `npx tsc --noEmit` for type errors.
   - Manual test as both an authorized role **and** an unauthorized role. Confirm:
     - Unauthorized role cannot reach the route (middleware redirects, or service rejects).
     - Unauthorized role does not see the UI affordance.
     - The data itself is rejected at the service layer (curl with an unauthorized session, not just the UI).

Anti-patterns to avoid:
- Updating only the UI / `PermissionGate` and assuming the route is now protected. UI hiding is not security.
- Hard-coding role strings in components (`if (user.role === 'superadmin')`) — bypass `useRBAC` and your check will rot.
- Updating only the main RBAC layer when the warehouse module is involved.
- Adding a route to `config.routes.protected` without also gating it server-side. The middleware redirects unauthenticated users but does not enforce role-specific permissions on its own — that's `roleBased` + service layer.

References: `.claude/rules/rbac.md`, `src/lib/config.ts`, `RBAC_IMPLEMENTATION.md` (repo root).
