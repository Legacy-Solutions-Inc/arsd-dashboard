-- Create a view that properly joins accomplishment_reports with projects and profiles
-- This solves the PGRST200 error by avoiding direct foreign key references

CREATE OR REPLACE VIEW public.accomplishment_reports_with_details AS
SELECT 
    ar.*,
    p.id as project_table_id,
    p.project_name,
    p.client,
    p.location,
    p.status as project_status,
    pr.id as profile_id,
    pr.display_name,
    pr.email
FROM public.accomplishment_reports ar
LEFT JOIN public.projects p ON ar.project_id = p.id
LEFT JOIN public.profiles pr ON ar.uploaded_by = pr.user_id;

-- Grant access to the view
GRANT SELECT ON public.accomplishment_reports_with_details TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.accomplishment_reports_with_details SET (security_invoker = true);

-- Note: RLS policies on views work differently than on tables
-- The view will inherit the RLS policies from the underlying tables
-- (accomplishment_reports, projects, profiles) automatically
