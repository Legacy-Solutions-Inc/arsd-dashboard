-- Allow purchasing to manage PO overrides (same as material_control) for stock monitoring

DROP POLICY IF EXISTS "Material Control can manage PO overrides" ON public.stock_po_overrides;

CREATE POLICY "Material Control and Purchasing can manage PO overrides"
  ON public.stock_po_overrides
  FOR ALL
  USING (
    public.user_can_access_warehouse_project(project_id) AND
    (
      public.is_superadmin() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role IN ('material_control', 'purchasing')
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
        AND role IN ('material_control', 'purchasing')
        AND status = 'active'
      )
    )
  );
