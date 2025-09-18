-- Ensure the accomplishment-reports storage bucket exists
-- This migration will create the bucket if it doesn't exist, or update it if it does

-- First, try to create the bucket (this will fail if it already exists, which is fine)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accomplishment-reports',
  'accomplishment-reports',
  true,
  20971520, -- 20MB limit
  ARRAY['text/csv', 'application/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the storage bucket (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Project managers can upload to their assigned projects" ON storage.objects;
DROP POLICY IF EXISTS "Project managers can view their assigned project reports" ON storage.objects;
DROP POLICY IF EXISTS "PI can view all reports" ON storage.objects;
DROP POLICY IF EXISTS "Superadmins can manage all reports" ON storage.objects;

-- Create RLS policies for the storage bucket
CREATE POLICY "Project managers can upload to their assigned projects" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'accomplishment-reports' AND
    (
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.project_manager_id = auth.uid()
      ) OR public.is_superadmin()
    )
  );

CREATE POLICY "Project managers can view their assigned project reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'accomplishment-reports' AND
    (
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.project_manager_id = auth.uid()
      ) OR public.is_superadmin()
    )
  );

CREATE POLICY "PI can view all reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'accomplishment-reports' AND
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role IN ('project_inspector')
        AND profiles.status = 'active'
      ) OR public.is_superadmin()
    )
  );

CREATE POLICY "Superadmins can manage all reports" ON storage.objects
  FOR ALL USING (
    bucket_id = 'accomplishment-reports' AND public.is_superadmin()
  ) WITH CHECK (
    bucket_id = 'accomplishment-reports' AND public.is_superadmin()
  );
