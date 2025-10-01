-- Update progress_photos_with_details view to include project_inspector_id and project_manager_id
-- This allows filtering photos based on which inspector/manager is assigned to the project

-- Drop the existing view first
DROP VIEW IF EXISTS progress_photos_with_details;

-- Recreate the view with the correct columns
CREATE VIEW progress_photos_with_details AS
SELECT 
    pp.id,
    pp.project_id,
    pp.uploaded_by,
    pp.file_name,
    pp.file_size,
    pp.file_url,
    pp.week_ending_date,
    pp.description,
    pp.upload_date,
    pp.created_at,
    pp.updated_at,
    -- Project details
    p.project_id as project_table_id,
    p.project_name,
    p.client,
    p.location,
    p.status as project_status,
    p.project_manager_id,
    p.project_inspector_id,
    -- Uploader details
    pr.id as profile_id,
    pr.display_name as uploader_name,
    pr.email as uploader_email
FROM progress_photos pp
LEFT JOIN projects p ON pp.project_id = p.id
LEFT JOIN profiles pr ON pp.uploaded_by = pr.user_id;

-- Grant access to authenticated users
GRANT SELECT ON progress_photos_with_details TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW progress_photos_with_details IS 'View that joins progress photos with project details (including inspector/manager assignments) and uploader information. RLS policies are enforced through the underlying tables.';

