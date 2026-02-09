-- RLS Policies for warehouse tables

-- Enable RLS on all warehouse tables
ALTER TABLE public.delivery_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dr_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_items ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user can access a project (warehouse context)
CREATE OR REPLACE FUNCTION public.user_can_access_warehouse_project(target_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Superadmin can access everything
    public.is_superadmin() OR
    -- Purchasing can view all
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'purchasing' 
      AND status = 'active'
    ) OR
    -- Project manager
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = target_project_id 
      AND project_manager_id = auth.uid()
    ) OR
    -- Project inspector
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = target_project_id 
      AND project_inspector_id = auth.uid()
    ) OR
    -- Warehouseman
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = target_project_id 
      AND warehouseman_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Delivery Receipts Policies
-- ================================================

-- SELECT: Users can view DRs for projects they can access
CREATE POLICY "Users can view DRs for accessible projects" ON public.delivery_receipts
  FOR SELECT USING (
    public.user_can_access_warehouse_project(project_id)
  );

-- INSERT: Warehousemen can create DRs for their assigned projects
CREATE POLICY "Warehousemen can create DRs for assigned projects" ON public.delivery_receipts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'warehouseman' 
      AND status = 'active'
    ) AND
    public.user_can_access_warehouse_project(project_id)
  );

-- UPDATE: Lock/unlock by project_inspector, project_manager, or superadmin
CREATE POLICY "Authorized users can update DR lock status" ON public.delivery_receipts
  FOR UPDATE USING (
    public.user_can_access_warehouse_project(project_id) AND
    (
      public.is_superadmin() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('project_inspector', 'project_manager') 
        AND status = 'active'
      )
    )
  );

-- ================================================
-- DR Items Policies (follow parent DR)
-- ================================================

CREATE POLICY "Users can view DR items for accessible DRs" ON public.dr_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_receipts 
      WHERE id = delivery_receipt_id 
      AND public.user_can_access_warehouse_project(project_id)
    )
  );

CREATE POLICY "Warehousemen can insert DR items" ON public.dr_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.delivery_receipts dr
      WHERE dr.id = delivery_receipt_id 
      AND public.user_can_access_warehouse_project(dr.project_id)
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'warehouseman' 
        AND status = 'active'
      )
    )
  );

-- ================================================
-- Release Forms Policies
-- ================================================

-- SELECT: Users can view releases for projects they can access
CREATE POLICY "Users can view releases for accessible projects" ON public.release_forms
  FOR SELECT USING (
    public.user_can_access_warehouse_project(project_id)
  );

-- INSERT: Warehousemen can create releases for their assigned projects
CREATE POLICY "Warehousemen can create releases for assigned projects" ON public.release_forms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'warehouseman' 
      AND status = 'active'
    ) AND
    public.user_can_access_warehouse_project(project_id)
  );

-- UPDATE: Lock/unlock by project_inspector, project_manager, or superadmin
CREATE POLICY "Authorized users can update release lock status" ON public.release_forms
  FOR UPDATE USING (
    public.user_can_access_warehouse_project(project_id) AND
    (
      public.is_superadmin() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('project_inspector', 'project_manager') 
        AND status = 'active'
      )
    )
  );

-- ================================================
-- Release Items Policies (follow parent release)
-- ================================================

CREATE POLICY "Users can view release items for accessible releases" ON public.release_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.release_forms 
      WHERE id = release_form_id 
      AND public.user_can_access_warehouse_project(project_id)
    )
  );

CREATE POLICY "Warehousemen can insert release items" ON public.release_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.release_forms rf
      WHERE rf.id = release_form_id 
      AND public.user_can_access_warehouse_project(rf.project_id)
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'warehouseman' 
        AND status = 'active'
      )
    )
  );
