-- Drop tables that are not part of the actual accomplishment report structure

-- Drop materials_summary table
DROP TABLE IF EXISTS public.materials_summary CASCADE;

-- Drop equipment table  
DROP TABLE IF EXISTS public.equipment CASCADE;

-- Drop productivity table
DROP TABLE IF EXISTS public.productivity CASCADE;

-- Note: CASCADE will also drop any dependent objects like indexes, policies, etc.
