-- Add parsing status columns to accomplishment_reports table
ALTER TABLE public.accomplishment_reports 
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parsed_status TEXT CHECK (parsed_status IN ('pending', 'success', 'failed')),
ADD COLUMN IF NOT EXISTS parse_error TEXT;

-- Set default values for existing records
UPDATE public.accomplishment_reports 
SET parsed_status = 'pending' 
WHERE parsed_status IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_accomplishment_reports_parsing 
ON public.accomplishment_reports(status, parsed_at, parsed_status);
