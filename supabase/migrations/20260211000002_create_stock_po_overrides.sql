-- Create table to store manual PO overrides per stock item

CREATE TABLE IF NOT EXISTS public.stock_po_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs TEXT,
  item_description TEXT NOT NULL,
  po NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT stock_po_overrides_unique_line UNIQUE (project_id, wbs, item_description)
);

COMMENT ON TABLE public.stock_po_overrides IS 'Manual PO quantity overrides for stock monitoring per project/WBS/item.';

ALTER TABLE public.stock_po_overrides ENABLE ROW LEVEL SECURITY;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_stock_po_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_po_overrides_updated_at
  BEFORE UPDATE ON public.stock_po_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_po_overrides_updated_at();

-- Update helper to allow material_control to access warehouse projects (same as purchasing)
CREATE OR REPLACE FUNCTION public.user_can_access_warehouse_project(target_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_superadmin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('purchasing', 'material_control')
      AND status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = target_project_id 
      AND project_manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = target_project_id 
      AND project_inspector_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = target_project_id 
      AND warehouseman_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for stock_po_overrides

-- SELECT: anyone who can access the project can see PO overrides
CREATE POLICY "Users can view PO overrides for accessible projects"
  ON public.stock_po_overrides
  FOR SELECT
  USING (public.user_can_access_warehouse_project(project_id));

-- INSERT / UPDATE: only material_control (or superadmin) can edit PO overrides
CREATE POLICY "Material Control can manage PO overrides"
  ON public.stock_po_overrides
  FOR ALL
  USING (
    public.user_can_access_warehouse_project(project_id) AND
    (
      public.is_superadmin() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'material_control'
        AND status = 'active'
      )
    )
  )
  WITH CHECK (
    public.user_can_access_warehouse_project(project_id) AND
    (
      public.is_superadmin() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'material_control'
        AND status = 'active'
      )
    )
  );

