-- Create a privileged, column-restricted view over profiles so that authenticated
-- users can resolve uploader display names on shared resources (e.g. the
-- accomplishment reports listing) without exposing role, status, or any other
-- profile metadata.
--
-- The view runs with security_invoker = false (the default), which bypasses
-- profiles RLS. Safety is provided by the whitelisted column set below.

CREATE OR REPLACE VIEW public.safe_profile_directory AS
SELECT user_id, display_name, email
FROM public.profiles
WHERE status = 'active';

ALTER VIEW public.safe_profile_directory SET (security_invoker = false);

GRANT SELECT ON public.safe_profile_directory TO authenticated;

COMMENT ON VIEW public.safe_profile_directory IS
  'Read-only directory of active profiles (user_id, display_name, email only). '
  'Bypasses profiles RLS by design so that joined views (e.g. accomplishment '
  'report listings) can show the uploader''s name to any authenticated user. '
  'Does NOT expose role, status, or any other profile metadata.';
