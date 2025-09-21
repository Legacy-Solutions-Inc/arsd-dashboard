-- Add parsing status tracking to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS has_parsed_data BOOLEAN DEFAULT FALSE;

-- Update existing projects based on their accomplishment reports
UPDATE public.projects 
SET has_parsed_data = TRUE 
WHERE id IN (
  SELECT DISTINCT project_id 
  FROM public.accomplishment_reports 
  WHERE status = 'approved' 
  AND parsed_status = 'success'
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_parsed_data 
ON public.projects(has_parsed_data);
