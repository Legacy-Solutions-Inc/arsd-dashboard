-- Clean recreate of accomplishment_reports RLS policies
-- This migration drops all existing policies and recreates them properly

-- Drop ALL existing policies on accomplishment_reports table
DROP POLICY IF EXISTS "Allow project managers to insert reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Allow project managers to update their reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Allow project managers to view their reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Allow superadmins to manage all reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Project managers can upload to assigned projects" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Project managers can update their reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Project managers can view assigned project reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Superadmins can insert reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Superadmins can manage all reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "PI can view all reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "HR and PI can view all reports" ON public.accomplishment_reports;

-- Create clean, simple policies

-- 1. Project managers can insert reports for their assigned projects
CREATE POLICY "Project managers can upload to assigned projects" ON public.accomplishment_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- 2. Project managers can view reports for their assigned projects
CREATE POLICY "Project managers can view assigned project reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- 3. Project managers can update their own reports
CREATE POLICY "Project managers can update their reports" ON public.accomplishment_reports
  FOR UPDATE USING (
    uploaded_by = auth.uid()
  ) WITH CHECK (
    uploaded_by = auth.uid()
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

-- 5. Superadmins can manage all reports
CREATE POLICY "Superadmins can manage all reports" ON public.accomplishment_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
      AND profiles.status = 'active'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
      AND profiles.status = 'active'
    )
  );

-- 6. Project Inspectors can view all reports
CREATE POLICY "Project inspectors can view all reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'project_inspector'
      AND profiles.status = 'active'
    )
  );
