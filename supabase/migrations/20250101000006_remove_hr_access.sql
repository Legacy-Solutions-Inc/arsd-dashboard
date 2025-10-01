-- Remove HR access to projects, reports, and photos
-- HR role is now restricted to only manage_website_details permission

-- Remove HR policy for viewing all projects
DROP POLICY IF EXISTS "HR can view all projects" ON public.projects;

-- Remove HR policy for viewing all reports  
DROP POLICY IF EXISTS "HR can view all reports" ON public.accomplishment_reports;

-- Remove HR policy for viewing all photos (if exists)
DROP POLICY IF EXISTS "HR can view all photos" ON progress_photos;

-- Add comment to document the change
COMMENT ON TABLE public.projects IS 'Projects table with RLS. Only superadmins can view all projects. Managers/inspectors see only assigned projects. HR has no access.';
COMMENT ON TABLE public.accomplishment_reports IS 'Accomplishment reports with RLS. Only superadmins can view all reports. Managers/inspectors see only assigned project reports. HR has no access.';
COMMENT ON TABLE progress_photos IS 'Progress photos with RLS. Only superadmins can view all photos. Managers/inspectors see only assigned project photos. HR has no access.';

