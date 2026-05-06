-- Counter tables for atomic DR / release number generation.
-- The SELECT-then-INSERT pattern in application code has a race condition;
-- this replaces it with a single atomic UPDATE RETURNING.

CREATE TABLE IF NOT EXISTS public.dr_counters (
  year INT PRIMARY KEY,
  last_no INT NOT NULL DEFAULT 0
);
-- Lock down direct API access; only the SECURITY DEFINER functions touch this table.
ALTER TABLE public.dr_counters ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.release_counters (
  year INT PRIMARY KEY,
  last_no INT NOT NULL DEFAULT 0
);
ALTER TABLE public.release_counters ENABLE ROW LEVEL SECURITY;

-- Seed counters from data that already exists so numbering continues correctly.
INSERT INTO public.dr_counters (year, last_no)
SELECT
  SUBSTRING(dr_no FROM 4 FOR 4)::INT,
  MAX(SUBSTRING(dr_no FROM 9)::INT)
FROM public.delivery_receipts
WHERE dr_no ~ '^DR-[0-9]{4}-[0-9]+$'
GROUP BY SUBSTRING(dr_no FROM 4 FOR 4)
ON CONFLICT (year) DO UPDATE
  SET last_no = GREATEST(dr_counters.last_no, EXCLUDED.last_no);

INSERT INTO public.release_counters (year, last_no)
SELECT
  SUBSTRING(release_no FROM 5 FOR 4)::INT,
  MAX(SUBSTRING(release_no FROM 10)::INT)
FROM public.release_forms
WHERE release_no ~ '^REL-[0-9]{4}-[0-9]+$'
GROUP BY SUBSTRING(release_no FROM 5 FOR 4)
ON CONFLICT (year) DO UPDATE
  SET last_no = GREATEST(release_counters.last_no, EXCLUDED.last_no);

-- Atomically generate the next DR number.
-- SECURITY DEFINER so callers don't need direct access to dr_counters.
CREATE OR REPLACE FUNCTION public.next_dr_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INT;
  v_next INT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::INT;

  -- Initialize row for this year from live table data if it doesn't exist yet.
  INSERT INTO public.dr_counters (year, last_no)
  SELECT v_year, COALESCE(MAX(SUBSTRING(dr_no FROM 9)::INT), 0)
  FROM public.delivery_receipts
  WHERE dr_no LIKE 'DR-' || v_year || '-%'
  ON CONFLICT (year) DO NOTHING;

  -- Atomic increment; concurrent calls serialize on this row lock.
  UPDATE public.dr_counters
  SET last_no = last_no + 1
  WHERE year = v_year
  RETURNING last_no INTO v_next;

  RETURN 'DR-' || v_year || '-' || LPAD(v_next::TEXT, 3, '0');
END;
$$;

-- Same pattern for release forms.
CREATE OR REPLACE FUNCTION public.next_release_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INT;
  v_next INT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::INT;

  INSERT INTO public.release_counters (year, last_no)
  SELECT v_year, COALESCE(MAX(SUBSTRING(release_no FROM 10)::INT), 0)
  FROM public.release_forms
  WHERE release_no LIKE 'REL-' || v_year || '-%'
  ON CONFLICT (year) DO NOTHING;

  UPDATE public.release_counters
  SET last_no = last_no + 1
  WHERE year = v_year
  RETURNING last_no INTO v_next;

  RETURN 'REL-' || v_year || '-' || LPAD(v_next::TEXT, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_dr_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_release_no() TO authenticated;
