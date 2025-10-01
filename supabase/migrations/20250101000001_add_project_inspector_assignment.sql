-- Add project_inspector_id column to projects table
-- This allows each project to be assigned to a specific project inspector

-- Add the column
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_inspector_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_project_inspector ON public.projects(project_inspector_id);

-- Add comment
COMMENT ON COLUMN public.projects.project_inspector_id IS 'References the project inspector assigned to this project';

-- Drop the old policy that allows all inspectors to view all projects
DROP POLICY IF EXISTS "Project inspectors can view all projects" ON public.projects;

-- Create new policy: Project inspectors can only view projects assigned to them
CREATE POLICY "Project inspectors can view assigned projects" ON public.projects
  FOR SELECT USING (
    project_inspector_id = auth.uid() OR public.is_superadmin()
  );

-- Project inspectors can upload reports for their assigned projects
-- Update accomplishment_reports policies to check project_inspector_id
DROP POLICY IF EXISTS "Project inspectors can view assigned project reports" ON public.accomplishment_reports;

CREATE POLICY "Project inspectors can view assigned project reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND (projects.project_manager_id = auth.uid() OR projects.project_inspector_id = auth.uid())
    ) OR public.is_superadmin()
  );

-- Project inspectors can upload reports for their assigned projects
DROP POLICY IF EXISTS "Project inspectors can upload to assigned projects" ON public.accomplishment_reports;

CREATE POLICY "Project inspectors can upload to assigned projects" ON public.accomplishment_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND (projects.project_manager_id = auth.uid() OR projects.project_inspector_id = auth.uid())
    ) OR public.is_superadmin()
  );

-- Note: progress_photos policies are handled in migration 20250101000004_fix_progress_photos_policies.sql

