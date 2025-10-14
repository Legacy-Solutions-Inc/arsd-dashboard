-- Add Target % to project_costs
-- New nullable column to store target percentage from Excel (AY)

BEGIN;

ALTER TABLE IF EXISTS public.project_costs
ADD COLUMN IF NOT EXISTS target_percentage DECIMAL(5,2);

COMMIT;


