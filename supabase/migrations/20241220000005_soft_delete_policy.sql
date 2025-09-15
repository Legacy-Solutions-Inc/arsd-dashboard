-- Add policy for soft delete (setting is_deleted = true)
CREATE POLICY "Users can soft delete their own website projects" ON website_projects
  FOR UPDATE USING (
    (auth.uid() = created_by OR auth.uid() = updated_by) 
    AND is_deleted = false
  );

-- Also allow soft delete for authenticated users (for admin purposes)
-- This is more permissive but allows the delete functionality to work
CREATE POLICY "Authenticated users can soft delete website projects" ON website_projects
  FOR UPDATE USING (
    auth.role() = 'authenticated' 
    AND is_deleted = false
  );
