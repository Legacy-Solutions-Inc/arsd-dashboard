-- Add warehouseman_id to projects table
-- This allows each project to be assigned to a specific warehouseman

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS warehouseman_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_warehouseman ON public.projects(warehouseman_id);

-- Add comment
COMMENT ON COLUMN public.projects.warehouseman_id IS 'References the warehouseman assigned to this project';

-- Add RLS policy: Warehousemen can view projects assigned to them
CREATE POLICY "Warehousemen can view assigned projects" ON public.projects
  FOR SELECT USING (
    warehouseman_id = auth.uid() OR public.is_superadmin()
  );
