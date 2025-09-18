-- Create projects table for project management
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL, -- System generated project ID
  project_name TEXT NOT NULL CHECK (length(project_name) >= 2 AND length(project_name) <= 200),
  client TEXT NOT NULL CHECK (length(client) >= 2 AND length(client) <= 200),
  location TEXT NOT NULL CHECK (length(location) >= 2 AND length(location) <= 200),
  status TEXT NOT NULL CHECK (status IN ('in_planning', 'in_progress', 'completed')) DEFAULT 'in_planning',
  project_manager_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  latest_accomplishment_update TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(user_id) NOT NULL,
  updated_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON public.projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_manager ON public.projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_latest_update ON public.projects(latest_accomplishment_update);

-- Create function to generate project ID
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    -- Format: PRJ-YYYY-XXXX (e.g., PRJ-2024-0001)
    new_id := 'PRJ-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(counter::TEXT, 4, '0');
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE project_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    counter := counter + 1;
    
    -- Safety check to prevent infinite loop
    IF counter > 9999 THEN
      RAISE EXCEPTION 'Unable to generate unique project ID';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate project ID
CREATE OR REPLACE FUNCTION set_project_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NULL OR NEW.project_id = '' THEN
    NEW.project_id := generate_project_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_project_id
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_id();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Superadmins can do everything
CREATE POLICY "Superadmins can manage all projects" ON public.projects
  FOR ALL USING (public.is_superadmin());

-- Project managers can view and update their assigned projects
CREATE POLICY "Project managers can view assigned projects" ON public.projects
  FOR SELECT USING (
    project_manager_id = auth.uid() OR public.is_superadmin()
  );

CREATE POLICY "Project managers can update assigned projects" ON public.projects
  FOR UPDATE USING (
    project_manager_id = auth.uid() OR public.is_superadmin()
  );

-- HR can view all projects (for reporting purposes)
CREATE POLICY "HR can view all projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'hr' 
      AND status = 'active'
    ) OR public.is_superadmin()
  );

-- Project inspectors can view all projects
CREATE POLICY "Project inspectors can view all projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'project_inspector' 
      AND status = 'active'
    ) OR public.is_superadmin()
  );
