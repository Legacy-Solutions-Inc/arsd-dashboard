-- Create warehouse management tables
-- Tables: delivery_receipts, dr_items, release_forms, release_items

-- 1. Delivery Receipts
CREATE TABLE IF NOT EXISTS public.delivery_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dr_no TEXT UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  supplier TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  locked BOOLEAN NOT NULL DEFAULT true,
  warehouseman TEXT NOT NULL,
  dr_photo_url TEXT,
  po_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_receipts_project ON public.delivery_receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_dr_no ON public.delivery_receipts(dr_no);
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_date ON public.delivery_receipts(date);
COMMENT ON TABLE public.delivery_receipts IS 'Delivery receipts for incoming warehouse items';

-- 2. DR Items
CREATE TABLE IF NOT EXISTS public.dr_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_receipt_id UUID NOT NULL REFERENCES public.delivery_receipts(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  qty_in_dr NUMERIC NOT NULL,
  qty_in_po NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dr_items_delivery_receipt ON public.dr_items(delivery_receipt_id);
COMMENT ON TABLE public.dr_items IS 'Line items for delivery receipts';

-- 3. Release Forms
CREATE TABLE IF NOT EXISTS public.release_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_no TEXT UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  received_by TEXT NOT NULL,
  date DATE NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT true,
  warehouseman TEXT,
  purpose TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_release_forms_project ON public.release_forms(project_id);
CREATE INDEX IF NOT EXISTS idx_release_forms_release_no ON public.release_forms(release_no);
CREATE INDEX IF NOT EXISTS idx_release_forms_date ON public.release_forms(date);
COMMENT ON TABLE public.release_forms IS 'Release forms for outgoing warehouse items';

-- 4. Release Items
CREATE TABLE IF NOT EXISTS public.release_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_form_id UUID NOT NULL REFERENCES public.release_forms(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_release_items_release_form ON public.release_items(release_form_id);
COMMENT ON TABLE public.release_items IS 'Line items for release forms';

-- 5. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_delivery_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_receipts_updated_at
  BEFORE UPDATE ON public.delivery_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_receipts_updated_at();

CREATE OR REPLACE FUNCTION update_release_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_release_forms_updated_at
  BEFORE UPDATE ON public.release_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_release_forms_updated_at();
