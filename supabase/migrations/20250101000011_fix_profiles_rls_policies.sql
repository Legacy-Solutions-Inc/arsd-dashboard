-- Fix RLS policies for profiles table to allow signup
-- This resolves the "Database error finding user" signup issue

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

-- Create RLS policies for profiles table

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

-- 3. Allow profile creation during signup (service role)
CREATE POLICY "Service role can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- 4. Allow authenticated users to insert their own profile (for signup)
CREATE POLICY "Allow profile creation during signup" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. Superadmins can view all profiles
CREATE POLICY "Superadmins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 6. Superadmins can update all profiles
CREATE POLICY "Superadmins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- Add comment
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control for the ARSD dashboard. RLS policies allow profile creation during signup.';
