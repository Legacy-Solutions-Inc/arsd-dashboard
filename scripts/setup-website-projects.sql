-- Website Projects Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create website_projects table
CREATE TABLE IF NOT EXISTS website_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 120),
  location TEXT NOT NULL CHECK (length(location) >= 2 AND length(location) <= 120),
  slug TEXT UNIQUE NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create website_project_photos table
CREATE TABLE IF NOT EXISTS website_project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES website_projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_website_projects_name ON website_projects(name);
CREATE INDEX IF NOT EXISTS idx_website_projects_location ON website_projects(location);
CREATE INDEX IF NOT EXISTS idx_website_projects_is_deleted ON website_projects(is_deleted);
CREATE INDEX IF NOT EXISTS idx_website_projects_slug ON website_projects(slug);
CREATE INDEX IF NOT EXISTS idx_website_project_photos_project_id ON website_project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_website_project_photos_order ON website_project_photos(project_id, order_index);

-- 4. Create helper functions
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_website_project_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug := generate_slug(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers
CREATE TRIGGER trigger_set_website_project_slug
  BEFORE INSERT OR UPDATE ON website_projects
  FOR EACH ROW
  EXECUTE FUNCTION set_website_project_slug();

CREATE TRIGGER trigger_update_website_projects_updated_at
  BEFORE UPDATE ON website_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Row Level Security
ALTER TABLE website_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_project_photos ENABLE ROW LEVEL SECURITY;

-- 7. Create policies
CREATE POLICY "Users can view all website projects" ON website_projects
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert website projects" ON website_projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own website projects" ON website_projects
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can delete their own website projects" ON website_projects
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all website project photos" ON website_project_photos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert website project photos" ON website_project_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update website project photos" ON website_project_photos
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete website project photos" ON website_project_photos
  FOR DELETE USING (true);

-- 8. Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-projects',
  'website-projects',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- 9. Create storage policies
CREATE POLICY "Authenticated users can upload website project photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view website project photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update website project photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete website project photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

-- 10. Insert sample data (optional)
INSERT INTO website_projects (name, location) VALUES 
  ('Sample Office Building', 'Metro Manila, Philippines'),
  ('Residential Complex', 'Cebu City, Philippines')
ON CONFLICT (slug) DO NOTHING;

-- Success message
SELECT 'Website Projects database setup completed successfully!' as message;


