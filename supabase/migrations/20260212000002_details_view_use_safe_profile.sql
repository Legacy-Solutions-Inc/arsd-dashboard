-- Rewire accomplishment_reports_with_details to join the privileged
-- safe_profile_directory view instead of the raw profiles table.
--
-- Background: the previous version of this view joined public.profiles directly
-- and was declared with security_invoker = true. Because profiles has a row-level
-- security policy that only allows a user to SELECT their own row (or superadmin
-- to see all), the LEFT JOIN silently returned NULL for display_name/email on
-- any report uploaded by another user — so the Reports Management table rendered
-- a blank "Uploaded By" column for non-superadmin viewers.
--
-- Fix: LEFT JOIN safe_profile_directory (a security_definer view that whitelists
-- only user_id/display_name/email) so uploader info is always resolvable. The
-- outer view stays security_invoker = true so the accomplishment_reports RLS
-- continues to gate which report rows each user can see.

DROP VIEW IF EXISTS public.accomplishment_reports_with_details;

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
    spd.user_id as profile_id,
    spd.display_name,
    spd.email
FROM public.accomplishment_reports ar
LEFT JOIN public.projects p ON ar.project_id = p.id
LEFT JOIN public.safe_profile_directory spd ON ar.uploaded_by = spd.user_id;

GRANT SELECT ON public.accomplishment_reports_with_details TO authenticated;

-- Enforce RLS on the underlying accomplishment_reports table via the outer view.
-- The safe_profile_directory join bypasses profiles RLS intentionally.
ALTER VIEW public.accomplishment_reports_with_details SET (security_invoker = true);

COMMENT ON VIEW public.accomplishment_reports_with_details IS
  'Accomplishment reports joined with project details and uploader info. '
  'RLS on the reports table is enforced via security_invoker. Uploader name/email '
  'comes from safe_profile_directory, which intentionally bypasses profiles RLS '
  'so non-superadmin viewers can still see who uploaded a given report.';
