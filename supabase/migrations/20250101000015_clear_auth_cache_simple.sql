-- Simple auth cache cleanup (without profiles table)
-- This avoids RLS recursion issues

BEGIN;

-- Clear auth-related tables that might cache user references
DELETE FROM auth.identities WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM auth.sessions WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM auth.mfa_factors WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clear MFA challenges that reference deleted factors
DELETE FROM auth.mfa_challenges 
WHERE factor_id NOT IN (SELECT id FROM auth.mfa_factors);

-- Clear refresh tokens (cast user_id to uuid for comparison)
DELETE FROM auth.refresh_tokens 
WHERE user_id IS NOT NULL 
  AND user_id::uuid NOT IN (SELECT id FROM auth.users);

-- Clear audit logs that reference deleted users
DELETE FROM auth.audit_log_entries 
WHERE (payload->>'user_id') IS NOT NULL 
  AND (payload->>'user_id')::uuid NOT IN (SELECT id FROM auth.users);

COMMIT;

-- Verification
DO $$
DECLARE
  identities_count INTEGER := 0;
  sessions_count INTEGER := 0;
  mfa_factors_count INTEGER := 0;
  mfa_challenges_count INTEGER := 0;
  audit_logs_count INTEGER := 0;
  refresh_tokens_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO identities_count FROM auth.identities;
  SELECT COUNT(*) INTO sessions_count FROM auth.sessions;
  SELECT COUNT(*) INTO mfa_factors_count FROM auth.mfa_factors;
  SELECT COUNT(*) INTO mfa_challenges_count FROM auth.mfa_challenges;
  SELECT COUNT(*) INTO audit_logs_count FROM auth.audit_log_entries;
  SELECT COUNT(*) INTO refresh_tokens_count FROM auth.refresh_tokens;
  
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '🧹 AUTH CACHE CLEANUP COMPLETED (SIMPLE VERSION)';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ Identities remaining: %', identities_count;
  RAISE NOTICE '✅ Sessions remaining: %', sessions_count;
  RAISE NOTICE '✅ MFA factors remaining: %', mfa_factors_count;
  RAISE NOTICE '✅ MFA challenges remaining: %', mfa_challenges_count;
  RAISE NOTICE '✅ Audit log entries remaining: %', audit_logs_count;
  RAISE NOTICE '✅ Refresh tokens remaining: %', refresh_tokens_count;
  RAISE NOTICE '✅ Auth cache cleared - deleted users can now re-signup';
  RAISE NOTICE '=====================================================';
END $$;
