-- Create warehouse storage bucket for DR photos, PO photos, and release attachments

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'warehouse',
  'warehouse',
  false, -- private bucket; access controlled by RLS
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for warehouse storage bucket

-- Warehousemen can upload files for their assigned projects
CREATE POLICY "Warehousemen can upload to assigned projects" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'warehouse' AND
    (
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.warehouseman_id = auth.uid()
      ) OR public.is_superadmin()
    )
  );

-- Project managers can view files for their projects
CREATE POLICY "Project managers can view warehouse files for their projects" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'warehouse' AND
    (
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id::text = (storage.foldername(name))[2]
        AND (
          projects.project_manager_id = auth.uid() OR
          projects.project_inspector_id = auth.uid() OR
          projects.warehouseman_id = auth.uid()
        )
      ) OR public.is_superadmin()
    )
  );

-- Superadmins can manage all warehouse files
CREATE POLICY "Superadmins can manage warehouse files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'warehouse' AND public.is_superadmin()
  ) WITH CHECK (
    bucket_id = 'warehouse' AND public.is_superadmin()
  );

-- Project inspectors (PM) and project managers (site engineers) can view warehouse files
CREATE POLICY "Project inspectors and project managers can view warehouse files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'warehouse' AND
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role IN ('project_inspector', 'project_manager')
        AND profiles.status = 'active'
      ) OR public.is_superadmin()
    )
  );
