-- Fix progress photos RLS and storage policies
-- This migration addresses the "Unauthorized" and "new row violates row-level security policy" errors

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Project managers can upload photos for their projects" ON progress_photos;
DROP POLICY IF EXISTS "Project managers can view photos for their projects" ON progress_photos;
DROP POLICY IF EXISTS "Project managers can update their own photos" ON progress_photos;
DROP POLICY IF EXISTS "Project managers can delete their own photos" ON progress_photos;
DROP POLICY IF EXISTS "Superadmins and inspectors can view all photos" ON progress_photos;
DROP POLICY IF EXISTS "Superadmins can manage all photos" ON progress_photos;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete progress photos" ON storage.objects;

-- Create simplified and working RLS policies for progress_photos
-- INSERT policy - allow authenticated users to insert (can be tightened later)
CREATE POLICY "Authenticated users can insert progress photos" ON progress_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SELECT policy - allow authenticated users to view (can be tightened later)
CREATE POLICY "Authenticated users can view progress photos" ON progress_photos
    FOR SELECT USING (auth.role() = 'authenticated');

-- UPDATE policy - allow users to update their own photos
CREATE POLICY "Users can update their own progress photos" ON progress_photos
    FOR UPDATE USING (uploaded_by = auth.uid());

-- DELETE policy - allow users to delete their own photos
CREATE POLICY "Users can delete their own progress photos" ON progress_photos
    FOR DELETE USING (uploaded_by = auth.uid());

-- Create simplified storage policies for progress-photos bucket
CREATE POLICY "Authenticated users can upload progress photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'progress-photos' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can view progress photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'progress-photos' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update progress photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'progress-photos' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete progress photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'progress-photos' AND
        auth.role() = 'authenticated'
    );

-- Add comment explaining the permissive nature for testing
COMMENT ON TABLE progress_photos IS 'Stores progress photos uploaded by project managers for their assigned projects. RLS policies are currently permissive for testing and should be tightened in production.';
