-- Fix RLS policies for accomplishment_reports to allow proper uploads
-- The current policies are blocking uploads with 403 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Project managers can view assigned project reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Project managers can insert reports for assigned projects" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Superadmins can insert reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Superadmins can manage all reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Project inspectors can view all reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "HR can view all reports" ON public.accomplishment_reports;

-- Recreate policies with correct conditions

-- 1. Project managers can view reports for their assigned projects
CREATE POLICY "Project managers can view assigned project reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- 2. Project managers can insert reports for their assigned projects
CREATE POLICY "Project managers can insert reports for assigned projects" ON public.accomplishment_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- 3. Superadmins can view all reports
CREATE POLICY "Superadmins can view all reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
      AND profiles.status = 'active'
    )
  );

-- 4. Superadmins can insert reports for any project
CREATE POLICY "Superadmins can insert reports" ON public.accomplishment_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
      AND profiles.status = 'active'
    )
  );

-- 5. Superadmins can update all reports
CREATE POLICY "Superadmins can update all reports" ON public.accomplishment_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
      AND profiles.status = 'active'
    )
  );

-- 6. Project inspectors can view all reports
CREATE POLICY "Project inspectors can view all reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'project_inspector'
      AND profiles.status = 'active'
    )
  );

-- 7. HR can view all reports
CREATE POLICY "HR can view all reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'hr'
      AND profiles.status = 'active'
    )
  );
