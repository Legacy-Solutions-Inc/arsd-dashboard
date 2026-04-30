# Warehouse Rules

- The warehouse module is a self-contained domain spanning UI, services, hooks, and its own RBAC. Treat it as a sub-app.
- Layout:
  - UI: `src/app/dashboard/warehouse/`, `src/components/warehouse/`
  - Services: `src/services/warehouse/` (delivery receipts, IPOW, releases, stocks)
  - API routes: `src/app/api/warehouse/{delivery-receipts,ipow,releases,stocks}/route.ts`
  - Hooks: `src/hooks/warehouse/` (`useDeliveryReceipts`, `useIPOW`, `useReleases`, `useStocks`, `useWarehouseAuth`, `useWarehouseProjects`)
  - State: `src/contexts/WarehouseStoreContext.tsx`
  - RBAC: `src/lib/warehouse/rbac.ts` is **separate** from `src/services/role-based/`. Both apply.
- Warehouse photo uploads go through `browser-image-compression` (`src/lib/image-compression.ts`) before hitting Supabase Storage.
- Stock ledger export uses `src/lib/stock-ledger-export.ts` — extend that helper rather than duplicating XLSX-writer logic.
- Warehouse-relevant roles: `warehouseman`, `purchasing`, `material_control` (plus `superadmin`). See `.claude/rules/rbac.md`.