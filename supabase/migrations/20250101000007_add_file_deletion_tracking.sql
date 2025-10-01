-- Add file deletion tracking to accomplishment_reports table
-- This allows us to track when files are deleted for cleanup purposes

ALTER TABLE public.accomplishment_reports 
ADD COLUMN IF NOT EXISTS file_deleted_at TIMESTAMPTZ;

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_accomplishment_reports_file_cleanup 
ON public.accomplishment_reports(parsed_status, week_ending_date, file_deleted_at);

-- Add comment to explain the column
COMMENT ON COLUMN public.accomplishment_reports.file_deleted_at IS 'Timestamp when the uploaded file was deleted from storage during cleanup';
