-- Add material_control to user_role enum for warehouse and RBAC usage

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'material_control';

