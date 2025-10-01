-- Update accomplishment_reports_with_details view to include project_inspector_id and project_manager_id
-- This allows filtering reports based on which inspector/manager is assigned to the project

-- Drop the existing view first to avoid column name conflicts
DROP VIEW IF EXISTS public.accomplishment_reports_with_details;

-- Recreate the view with the correct columns
CREATE VIEW public.accomplishment_reports_with_details AS
SELECT 
    ar.*,
    p.id as project_table_id,
    p.project_name,
    p.client,
    p.location,
    p.status as project_status,
    p.project_manager_id,
    p.project_inspector_id,
    pr.id as profile_id,
    pr.display_name,
    pr.email
FROM public.accomplishment_reports ar
LEFT JOIN public.projects p ON ar.project_id = p.id
LEFT JOIN public.profiles pr ON ar.uploaded_by = pr.user_id;

-- The view will inherit RLS policies from underlying tables automatically
-- Grant access to authenticated users
GRANT SELECT ON public.accomplishment_reports_with_details TO authenticated;

-- Enable security_invoker so RLS policies are enforced
ALTER VIEW public.accomplishment_reports_with_details SET (security_invoker = true);

-- Add comment explaining the view
COMMENT ON VIEW public.accomplishment_reports_with_details IS 'View that joins accomplishment reports with project details (including inspector/manager assignments) and uploader information. RLS policies are enforced via security_invoker.';

