-- Add UPDATE policy for project inspectors to approve/reject reports
-- This allows project inspectors to change the status of accomplishment reports
-- for projects that are assigned to them

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Project inspectors can update reports for assigned projects" ON public.accomplishment_reports;

-- Create UPDATE policy for project inspectors
CREATE POLICY "Project inspectors can update reports for assigned projects" ON public.accomplishment_reports
  FOR UPDATE USING (
    -- Allow if the report belongs to a project assigned to this inspector
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_inspector_id = auth.uid()
    ) 
    -- Or if user is superadmin
    OR public.is_superadmin()
  ) 
  WITH CHECK (
    -- Ensure updated report still belongs to inspector's project
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_inspector_id = auth.uid()
    ) 
    -- Or if user is superadmin
    OR public.is_superadmin()
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Project inspectors can update reports for assigned projects" ON public.accomplishment_reports 
IS 'Allows project inspectors to approve or reject accomplishment reports for projects assigned to them. Superadmins can update any report.';

