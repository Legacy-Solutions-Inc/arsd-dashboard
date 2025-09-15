-- Create website_projects table
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

-- Create website_project_photos table
CREATE TABLE IF NOT EXISTS website_project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES website_projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_projects_name ON website_projects(name);
CREATE INDEX IF NOT EXISTS idx_website_projects_location ON website_projects(location);
CREATE INDEX IF NOT EXISTS idx_website_projects_is_deleted ON website_projects(is_deleted);
CREATE INDEX IF NOT EXISTS idx_website_projects_slug ON website_projects(slug);
CREATE INDEX IF NOT EXISTS idx_website_project_photos_project_id ON website_project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_website_project_photos_order ON website_project_photos(project_id, order_index);

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug
CREATE OR REPLACE FUNCTION set_website_project_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug := generate_slug(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_website_project_slug
  BEFORE INSERT OR UPDATE ON website_projects
  FOR EACH ROW
  EXECUTE FUNCTION set_website_project_slug();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_website_projects_updated_at
  BEFORE UPDATE ON website_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE website_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_project_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for website_projects
CREATE POLICY "Users can view all website projects" ON website_projects
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert website projects" ON website_projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own website projects" ON website_projects
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can delete their own website projects" ON website_projects
  FOR DELETE USING (auth.uid() = created_by);

-- Create policies for website_project_photos
CREATE POLICY "Users can view all website project photos" ON website_project_photos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert website project photos" ON website_project_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update website project photos" ON website_project_photos
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete website project photos" ON website_project_photos
  FOR DELETE USING (true);


