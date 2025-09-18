-- Create accomplishment_reports table for storing CSV uploads
CREATE TABLE IF NOT EXISTS public.accomplishment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_ending_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accomplishment_reports_project_id ON public.accomplishment_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_accomplishment_reports_uploaded_by ON public.accomplishment_reports(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_accomplishment_reports_week_ending ON public.accomplishment_reports(week_ending_date);
CREATE INDEX IF NOT EXISTS idx_accomplishment_reports_status ON public.accomplishment_reports(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_accomplishment_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_accomplishment_reports_updated_at
  BEFORE UPDATE ON public.accomplishment_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_accomplishment_reports_updated_at();

-- Enable RLS
ALTER TABLE public.accomplishment_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accomplishment_reports
-- Project managers can view reports for their assigned projects
CREATE POLICY "Project managers can view assigned project reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    ) OR public.is_superadmin()
  );

-- Project managers can insert reports for their assigned projects
CREATE POLICY "Project managers can upload to assigned projects" ON public.accomplishment_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = accomplishment_reports.project_id 
      AND projects.project_manager_id = auth.uid()
    ) OR public.is_superadmin()
  );

-- Project managers can update their own reports
CREATE POLICY "Project managers can update their reports" ON public.accomplishment_reports
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR public.is_superadmin()
  ) WITH CHECK (
    uploaded_by = auth.uid() OR public.is_superadmin()
  );

-- Superadmins can manage all reports
CREATE POLICY "Superadmins can manage all reports" ON public.accomplishment_reports
  FOR ALL USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- HR and Project Inspectors can view all reports
CREATE POLICY "HR and PI can view all reports" ON public.accomplishment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('hr', 'project_inspector')
      AND profiles.status = 'active'
    ) OR public.is_superadmin()
  );

-- Create function to get week ending date for a given date
CREATE OR REPLACE FUNCTION public.get_week_ending_date(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Get the day of week (0 = Sunday, 6 = Saturday)
  -- We'll use Saturday as week ending
  RETURN input_date + (6 - EXTRACT(DOW FROM input_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to check if report already exists for a project and week
CREATE OR REPLACE FUNCTION public.check_duplicate_report(
  p_project_id UUID,
  p_week_ending_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accomplishment_reports 
    WHERE project_id = p_project_id 
    AND week_ending_date = p_week_ending_date
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
