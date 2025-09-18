-- Fix RLS policies for storage bucket to allow uploads
-- Drop existing storage policies
DROP POLICY IF EXISTS "Project managers can upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Project managers can view their reports" ON storage.objects;
DROP POLICY IF EXISTS "PI can view all reports" ON storage.objects;
DROP POLICY IF EXISTS "Superadmins can manage all reports" ON storage.objects;

-- Recreate storage policies

-- 1. Project managers can upload reports for their assigned projects
CREATE POLICY "Project managers can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'accomplishment-reports' AND
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.project_manager_id = auth.uid()
      AND storage.filename(name) LIKE projects.id || '-%'
    )
  );

-- 2. Project managers can view their reports
CREATE POLICY "Project managers can view their reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'accomplishment-reports' AND
    (
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.project_manager_id = auth.uid()
        AND storage.filename(name) LIKE projects.id || '-%'
      )
    )
  );

-- 3. Superadmins can manage all reports
CREATE POLICY "Superadmins can manage all reports" ON storage.objects
  FOR ALL USING (
    bucket_id = 'accomplishment-reports' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
      AND profiles.status = 'active'
    )
  );

-- 4. Project inspectors can view all reports
CREATE POLICY "Project inspectors can view all reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'accomplishment-reports' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'project_inspector'
      AND profiles.status = 'active'
    )
  );