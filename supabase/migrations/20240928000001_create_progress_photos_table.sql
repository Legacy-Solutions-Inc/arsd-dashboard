-- Create progress_photos table
CREATE TABLE IF NOT EXISTS progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    week_ending_date DATE NOT NULL,
    description TEXT,
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_progress_photos_project_id ON progress_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_uploaded_by ON progress_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_progress_photos_week_ending_date ON progress_photos(week_ending_date);
CREATE INDEX IF NOT EXISTS idx_progress_photos_created_at ON progress_photos(created_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_progress_photos_project_week ON progress_photos(project_id, week_ending_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_progress_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER progress_photos_updated_at_trigger
    BEFORE UPDATE ON progress_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_progress_photos_updated_at();

-- Create a view for progress photos with project and user details
CREATE OR REPLACE VIEW progress_photos_with_details AS
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
    -- Uploader details
    pr.id as profile_id,
    pr.display_name as uploader_name,
    pr.email as uploader_email
FROM progress_photos pp
LEFT JOIN projects p ON pp.project_id = p.id
LEFT JOIN profiles pr ON pp.uploaded_by = pr.user_id;

-- Create storage bucket for progress photos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'progress-photos',
    'progress-photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS (Row Level Security) policies
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Policy for project managers to view photos for their own projects
CREATE POLICY "Project managers can view photos for their projects" ON progress_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = project_id 
            AND project_manager_id = auth.uid()
        )
    );

-- Policy for project managers to update/delete their own uploaded photos
CREATE POLICY "Project managers can update their own photos" ON progress_photos
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Project managers can delete their own photos" ON progress_photos
    FOR DELETE USING (uploaded_by = auth.uid());

-- Policy for superadmins and project inspectors to view all photos
CREATE POLICY "Superadmins and inspectors can view all photos" ON progress_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'project_inspector')
        )
    );

-- Policy for superadmins to manage all photos
CREATE POLICY "Superadmins can manage all photos" ON progress_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Storage policies will be created in a separate migration file

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON progress_photos TO authenticated;
GRANT SELECT ON progress_photos_with_details TO authenticated;

-- Add comment to table
COMMENT ON TABLE progress_photos IS 'Stores progress photos uploaded by project managers for their assigned projects';
COMMENT ON VIEW progress_photos_with_details IS 'View that joins progress photos with project and user details for easier querying';
