-- Add WBS columns to DR and Release items for WBS-aware stock matching

ALTER TABLE public.dr_items
  ADD COLUMN IF NOT EXISTS wbs text;

ALTER TABLE public.release_items
  ADD COLUMN IF NOT EXISTS wbs text;

