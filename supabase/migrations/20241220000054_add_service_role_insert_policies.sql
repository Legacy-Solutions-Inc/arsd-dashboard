-- Add INSERT policies for service role on all accomplishment report tables
-- This allows the backend service to insert data when parsing approved reports

-- Project Details
CREATE POLICY "Service role can insert project details" ON public.project_details
FOR INSERT TO service_role
WITH CHECK (true);

-- Project Costs  
CREATE POLICY "Service role can insert project costs" ON public.project_costs
FOR INSERT TO service_role
WITH CHECK (true);

-- Man Hours
CREATE POLICY "Service role can insert man hours" ON public.man_hours
FOR INSERT TO service_role
WITH CHECK (true);

-- Cost Items
CREATE POLICY "Service role can insert cost items" ON public.cost_items
FOR INSERT TO service_role
WITH CHECK (true);

-- Cost Items Secondary
CREATE POLICY "Service role can insert cost items secondary" ON public.cost_items_secondary
FOR INSERT TO service_role
WITH CHECK (true);

-- Monthly Costs
CREATE POLICY "Service role can insert monthly costs" ON public.monthly_costs
FOR INSERT TO service_role
WITH CHECK (true);

-- Materials
CREATE POLICY "Service role can insert materials" ON public.materials
FOR INSERT TO service_role
WITH CHECK (true);

-- Purchase Orders
CREATE POLICY "Service role can insert purchase orders" ON public.purchase_orders
FOR INSERT TO service_role
WITH CHECK (true);

-- Also add UPDATE policies for service role (needed for marking reports as parsed)
CREATE POLICY "Service role can update accomplishment reports" ON public.accomplishment_reports
FOR UPDATE TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update projects" ON public.projects
FOR UPDATE TO service_role
WITH CHECK (true);
