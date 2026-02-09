-- Add warehouse-related values to user_role enum (required for warehouse RLS policies)
-- Must run before 20250127000004_warehouse_rls_policies.sql

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'warehouseman';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'purchasing';
