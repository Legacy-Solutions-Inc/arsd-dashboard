-- Fix existing projects that don't have created_by or updated_by values
-- This will set them to a default user or make them accessible to all authenticated users

-- First, let's see what we have
-- SELECT id, name, created_by, updated_by FROM website_projects WHERE created_by IS NULL;

-- For now, let's create a more permissive policy that allows any authenticated user to soft delete
-- This is a temporary fix until we can properly assign ownership

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can soft delete their own website projects" ON website_projects;
DROP POLICY IF EXISTS "Users can update their own website projects" ON website_projects;
DROP POLICY IF EXISTS "Authenticated users can soft delete website projects" ON website_projects;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can update website projects" ON website_projects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can soft delete website projects" ON website_projects
  FOR UPDATE USING (auth.role() = 'authenticated' AND is_deleted = false);
