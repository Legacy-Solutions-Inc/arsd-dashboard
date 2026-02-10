-- Create IPOW items table for Inventory Plan of Work
CREATE TABLE IF NOT EXISTS public.ipow_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs TEXT NOT NULL,
  item TEXT,
  item_description TEXT NOT NULL,
  type TEXT,
  resource TEXT,
  ipow_qty NUMERIC NOT NULL DEFAULT 0,
  latest_ipow_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, wbs)
);

CREATE INDEX IF NOT EXISTS idx_ipow_items_project ON public.ipow_items(project_id);
CREATE INDEX IF NOT EXISTS idx_ipow_items_wbs ON public.ipow_items(wbs);
COMMENT ON TABLE public.ipow_items IS 'Inventory Plan of Work items per project, parsed from accomplishment reports';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ipow_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ipow_items_updated_at
  BEFORE UPDATE ON public.ipow_items
  FOR EACH ROW
  EXECUTE FUNCTION update_ipow_items_updated_at();

-- Enable RLS
ALTER TABLE public.ipow_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (follow same pattern as other warehouse tables)
CREATE POLICY "Users can view IPOW for accessible projects" ON public.ipow_items
  FOR SELECT USING (
    public.user_can_access_warehouse_project(project_id)
  );

CREATE POLICY "Superadmins can manage IPOW items" ON public.ipow_items
  FOR ALL USING (
    public.is_superadmin()
  ) WITH CHECK (
    public.is_superadmin()
  );
