-- Comprehensive fix for progress_photos RLS policies
-- Drop ALL existing policies and create clean, restrictive ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Project managers can view photos for their projects" ON progress_photos;
DROP POLICY IF EXISTS "Project managers can update their own photos" ON progress_photos;
DROP POLICY IF EXISTS "Project managers can delete their own photos" ON progress_photos;
DROP POLICY IF EXISTS "Superadmins and inspectors can view all photos" ON progress_photos;
DROP POLICY IF EXISTS "Superadmins can manage all photos" ON progress_photos;
DROP POLICY IF EXISTS "Project inspectors can view photos for assigned projects" ON progress_photos;
DROP POLICY IF EXISTS "Superadmins can view all photos" ON progress_photos;
DROP POLICY IF EXISTS "Project inspectors can upload photos" ON progress_photos;

-- ============================================================================
-- SELECT POLICIES (who can view photos)
-- ============================================================================

-- 1. Superadmins can view ALL photos
CREATE POLICY "Superadmins can view all photos" ON progress_photos
  FOR SELECT USING (
    public.is_superadmin()
  );

-- 2. Project Managers can view photos for their assigned projects
CREATE POLICY "Project managers can view assigned project photos" ON progress_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = progress_photos.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- 3. Project Inspectors can view photos ONLY for their assigned projects
CREATE POLICY "Project inspectors can view assigned project photos" ON progress_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = progress_photos.project_id 
      AND projects.project_inspector_id = auth.uid()
    )
  );

-- ============================================================================
-- INSERT POLICIES (who can upload photos)
-- ============================================================================

-- 1. Superadmins can upload photos for any project
CREATE POLICY "Superadmins can upload photos" ON progress_photos
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

-- 2. Project Managers can upload photos for their assigned projects
CREATE POLICY "Project managers can upload photos" ON progress_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = progress_photos.project_id 
      AND projects.project_manager_id = auth.uid()
    )
  );

-- 3. Project Inspectors can upload photos for their assigned projects
CREATE POLICY "Project inspectors can upload photos" ON progress_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = progress_photos.project_id 
      AND projects.project_inspector_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE POLICIES (who can modify photos)
-- ============================================================================

-- 1. Superadmins can update any photo
CREATE POLICY "Superadmins can update photos" ON progress_photos
  FOR UPDATE USING (
    public.is_superadmin()
  );

-- 2. Users can update their own uploaded photos
CREATE POLICY "Users can update own photos" ON progress_photos
  FOR UPDATE USING (
    progress_photos.uploaded_by = auth.uid()
  );

-- ============================================================================
-- DELETE POLICIES (who can delete photos)
-- ============================================================================

-- 1. Superadmins can delete any photo
CREATE POLICY "Superadmins can delete photos" ON progress_photos
  FOR DELETE USING (
    public.is_superadmin()
  );

-- 2. Users can delete their own uploaded photos
CREATE POLICY "Users can delete own photos" ON progress_photos
  FOR DELETE USING (
    progress_photos.uploaded_by = auth.uid()
  );

-- Add comments
COMMENT ON TABLE progress_photos IS 'Stores progress photos. Access is restricted: superadmins see all, managers/inspectors see only their assigned projects.';

