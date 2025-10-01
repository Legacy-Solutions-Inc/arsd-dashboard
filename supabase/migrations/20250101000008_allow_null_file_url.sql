-- Allow file_url to be NULL when files are deleted during cleanup
ALTER TABLE public.accomplishment_reports 
ALTER COLUMN file_url DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN public.accomplishment_reports.file_url IS 'URL to the uploaded file. NULL when file has been deleted during cleanup.';

