-- Fix RLS policies for accomplishment_reports table
-- This migration fixes the INSERT policy that's causing the 403 error

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Project managers can upload to assigned projects" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Project managers can update their reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Superadmins can manage all reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "HR and PI can view all reports" ON public.accomplishment_reports;
DROP POLICY IF EXISTS "Project managers can view assigned project reports" ON public.accomplishment_reports;

-- Create improved RLS policies using is_superadmin() function
-- Project managers can insert reports for their assigned projects
CREATE POLICY "Project managers can upload to assigned projects" ON public.accomplishment_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- Project managers can update their own reports
CREATE POLICY "Project managers can update their reports" ON public.accomplishment_reports
  FOR UPDATE USING (
    uploaded_by = auth.uid()
  ) WITH CHECK (
    uploaded_by = auth.uid()
  );

-- Superadmins can insert reports for any project
CREATE POLICY "Superadmins can insert reports" ON public.accomplishment_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
      AND profiles.status = 'active'
    )
  );

-- Superadmins can manage all reports
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

-- Project managers can view reports for their assigned projects
CREATE POLICY "Project managers can view assigned project reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- Project Inspectors can view all reports
CREATE POLICY "PI can view all reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('project_inspector')
      AND profiles.status = 'active'
    )
  );
