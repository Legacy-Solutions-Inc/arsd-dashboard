# Warehouse Backend Implementation - Summary

This document summarizes the warehouse management backend and database implementation completed on January 27, 2026.

## Overview

The warehouse backend provides full database and API support for:
- **Projects** with warehouseman assignment
- **IPOW items** (Inventory Plan of Work) per project
- **Delivery Receipts** (DRs) with items and photos
- **Release Forms** with items and attachments
- **Stock monitoring** with aggregated delivered/utilized/balance calculations
- **Lock/unlock workflow** for DR and Release approval
- **Role-based access control** (warehouseman, site engineer, project manager, etc.)

## Database Schema

### Migrations Created

1. **`20250127000001_add_warehouseman_to_projects.sql`**
   - Adds `warehouseman_id` column to `projects` table
   - Creates index and RLS policy for warehousemen

2. **`20250127000002_create_warehouse_tables.sql`**
   - `ipow_items`: Project-specific IPOW with WBS, description, qty, cost, unit
   - `delivery_receipts`: DR header with project, supplier, date, lock status, warehouseman
   - `dr_items`: Line items for each DR
   - `release_forms`: Release header with project, received_by, lock status
   - `release_items`: Line items for each release
   - Includes triggers for `updated_at` timestamps

3. **`20250127000003_create_warehouse_storage.sql`**
   - Creates `warehouse` storage bucket
   - RLS policies for DR photos, PO photos, and release attachments
   - 10MB file size limit, supports images and PDFs

4. **`20250127000004_warehouse_rls_policies.sql`**
   - Helper function: `user_can_access_warehouse_project()`
   - Comprehensive RLS for all warehouse tables
   - Role-based access (superadmin, purchasing, project_manager, project_inspector, warehouseman)

5. **`20250127000005_seed_ipow_items.sql`**
   - Template for seeding IPOW items (requires updating with real project UUIDs)

## Backend Services

### Core Services

**`src/services/warehouse/ipow.service.ts`**
- `getByProjectId(projectId)`: Fetch IPOW items for a project
- `getById(id)`: Get single IPOW item
- `getByProjectAndWBS(projectId, wbs)`: Find specific WBS

**`src/services/warehouse/delivery-receipts.service.ts`**
- `list(filters)`: List DRs with search, project, date range filters
- `getById(id)`: Get DR with items
- `create(input)`: Create DR with items (auto-generates DR-YYYY-NNN number)
- `updateLock(id, locked)`: Lock/unlock DR
- `getNextDrNoPublic()`: Get next DR number for preview

**`src/services/warehouse/releases.service.ts`**
- Similar CRUD operations for release forms
- Auto-generates REL-YYYY-NNN numbers

**`src/services/warehouse/warehouse-storage.service.ts`**
- `uploadDRPhoto()`, `uploadPOPhoto()`: Upload to warehouse/dr/{id}/
- `uploadReleaseAttachment()`: Upload to warehouse/releases/{id}/
- Returns public URLs for persistence

**Updated: `src/services/projects/project.service.ts`**
- Added warehouseman joins and filters
- `getAvailableWarehousemen()`: List users with warehouseman role

## API Routes

All routes follow REST conventions and include error handling:

**IPOW**
- `GET /api/warehouse/ipow?projectId=<uuid>`: List IPOW items

**Delivery Receipts**
- `GET /api/warehouse/delivery-receipts?search=&projectId=&dateFrom=&dateTo=`: List with filters
- `GET /api/warehouse/delivery-receipts/[id]`: Get single DR
- `POST /api/warehouse/delivery-receipts`: Create DR (multipart with files)
- `PATCH /api/warehouse/delivery-receipts/[id]`: Update lock status

**Release Forms**
- `GET /api/warehouse/releases?search=&projectId=&dateFrom=&dateTo=`: List with filters
- `GET /api/warehouse/releases/[id]`: Get single release
- `POST /api/warehouse/releases`: Create release (multipart with file)
- `PATCH /api/warehouse/releases/[id]`: Update lock status

**Stocks**
- `GET /api/warehouse/stocks/[projectId]`: Computed stock items with delivered/utilized/balance

## Frontend Updates

### Auth & RBAC

**`src/lib/warehouse/rbac.ts`**
- `getCurrentWarehouseUser()`: Get user with warehouse context
- `getAccessibleWarehouseProjects()`: Filter projects by role and assignment
- `canCreateDRRelease()`, `canUnlockDRRelease()`, `canViewAllProjects()`: Permission helpers

### Hooks

**`src/hooks/warehouse/useWarehouseAuth.ts`**
- Provides current user, loading state, and permission flags

**`src/hooks/warehouse/useWarehouseProjects.ts`**
- Fetches accessible projects based on user role

**`src/hooks/warehouse/useDeliveryReceipts.ts`**
- Fetches and manages DRs with filters
- `updateLock()` method for lock/unlock
- Auto-refresh on filter changes

**`src/hooks/warehouse/useReleases.ts`**
- Similar functionality for release forms

**`src/hooks/warehouse/useStocks.ts`**
- Fetches computed stock items for a project

### Updated Pages

**Warehouse Dashboard** (`src/app/dashboard/warehouse/page.tsx`)
- Uses `useWarehouseAuth` and `useWarehouseProjects`
- Real-time project loading with warehouseman display
- Search functionality across project name, location, warehouseman

**DR List** (`src/app/dashboard/warehouse/delivery-receipts/page.tsx`)
- Uses `useDeliveryReceipts` hook with live filters
- Real-time lock/unlock via API
- Updated to use database field names (`dr_no`, `project_id`, etc.)

**Release List** (`src/app/dashboard/warehouse/releases/page.tsx`)
- Uses `useReleases` hook
- Same filter and lock/unlock functionality as DRs

**Stocks** (`src/app/dashboard/warehouse/stocks/[projectId]/page.tsx`)
- Uses `useStocks` hook for server-side computed aggregation
- Updated to use database field names (`item_description`, `ipow_qty`, `running_balance`, etc.)

**Detail Pages** (NEW)
- `src/app/dashboard/warehouse/delivery-receipts/[id]/page.tsx`: View DR details with lock/unlock
- `src/app/dashboard/warehouse/releases/[id]/page.tsx`: View release details with lock/unlock

### Components Updated

**`src/components/warehouse/ProjectGrid.tsx`**
- Updated to use `Project` from `@/types/projects`
- Shows warehouseman or project manager name
- Maps database status (in_progress, in_planning, completed)

**`src/components/warehouse/MobileItemCard.tsx`**
- Updated field names to match API (`item_description`, `ipow_qty`, `running_balance`)

## Types

**`src/types/warehouse.ts`** (NEW)
- Complete TypeScript definitions for all warehouse entities
- Input types for creating DRs and releases
- Filter types for list queries
- Stock item computed type

**`src/types/projects.ts`** (UPDATED)
- Added `warehouseman_id` and `warehouseman` to Project
- Updated create/update/filter interfaces

## Pending Work

The following items still need implementation:

### 1. Create DR Form Update
**File:** `src/app/dashboard/warehouse/delivery-receipts/new/page.tsx`

Needs:
- Replace mock projects with `useWarehouseProjects`
- Use `useWarehouseAuth` for current user
- Implement file upload + FormData submission to POST API
- Handle loading/error states

### 2. Create Release Form Update
**File:** `src/app/dashboard/warehouse/releases/new/page.tsx`

Needs:
- Same updates as Create DR form
- FormData with attachment upload

### 3. Database Setup

Before using the backend:

1. **Run migrations:**
   ```bash
   npx supabase db push
   # or via Supabase dashboard: run migrations in order
   ```

2. **Seed IPOW items:**
   - Get actual project UUIDs: `SELECT id, project_name FROM projects;`
   - Update `20250127000005_seed_ipow_items.sql` with real UUIDs
   - Run the INSERT statements

3. **Assign warehousemen to projects:**
   ```sql
   UPDATE projects 
   SET warehouseman_id = '<user_id>' 
   WHERE id = '<project_id>';
   ```

4. **Ensure profiles have warehouse roles:**
   ```sql
   UPDATE profiles 
   SET role = 'warehouseman' 
   WHERE user_id = '<user_id>';
   ```

### 4. Testing Checklist

Once Create forms are updated:

- [ ] Login as warehouseman
- [ ] View assigned projects on warehouse dashboard
- [ ] Create a delivery receipt with photos
- [ ] Verify DR appears in list and is locked
- [ ] Create a release form with attachment
- [ ] View DR and Release detail pages
- [ ] Login as site engineer/project manager
- [ ] Unlock a DR/Release
- [ ] Lock it again
- [ ] View stocks page and verify calculations
- [ ] Test all filters (search, project, date range)

## Architecture Decisions

1. **Number Generation**: Implemented app-side (format: DR-YYYY-NNN, REL-YYYY-NNN)
2. **Stock Aggregation**: Server-side via `/api/warehouse/stocks/[projectId]` for better performance
3. **File Upload**: Separate uploads to storage, then save URLs in database
4. **RLS**: Comprehensive policies based on project access and warehouse roles
5. **Lock on Create**: DRs and releases are always created in locked state per business rules

## Key Files Created

**Migrations:** 5 files in `supabase/migrations/`
**Types:** `src/types/warehouse.ts`
**Services:** 4 files in `src/services/warehouse/`
**API Routes:** 7 route files in `src/app/api/warehouse/`
**Hooks:** 5 files in `src/hooks/warehouse/`
**Utils:** `src/lib/warehouse/rbac.ts`
**Detail Pages:** 2 files for DR and Release views

## Notes

- The implementation prioritizes backend readiness; the Create DR/Release forms still need API integration
- Mock data (`warehouseMock.ts`) and `WarehouseStoreContext` can be kept for reference but are no longer used by list/detail pages
- All TypeScript types are properly defined and code compiles successfully
- RLS ensures data security; never trust client-side permission checks alone
