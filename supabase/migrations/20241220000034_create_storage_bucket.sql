-- Create storage bucket for accomplishment reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accomplishment-reports',
  'accomplishment-reports',
  true,
  10485760, -- 10MB limit
  ARRAY['text/csv', 'application/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
);

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
