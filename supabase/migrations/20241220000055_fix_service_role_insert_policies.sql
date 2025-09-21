-- Fix service role INSERT policies for accomplishment report tables
-- This allows the service role to insert data into all detailed tables

-- Project Details
CREATE POLICY "Service role can insert project_details" ON public.project_details
FOR INSERT TO service_role WITH CHECK (true);

-- Project Costs
CREATE POLICY "Service role can insert project_costs" ON public.project_costs
FOR INSERT TO service_role WITH CHECK (true);

-- Man Hours
CREATE POLICY "Service role can insert man_hours" ON public.man_hours
FOR INSERT TO service_role WITH CHECK (true);

-- Cost Items
CREATE POLICY "Service role can insert cost_items" ON public.cost_items
FOR INSERT TO service_role WITH CHECK (true);

-- Cost Items Secondary
CREATE POLICY "Service role can insert cost_items_secondary" ON public.cost_items_secondary
FOR INSERT TO service_role WITH CHECK (true);

-- Monthly Costs
CREATE POLICY "Service role can insert monthly_costs" ON public.monthly_costs
FOR INSERT TO service_role WITH CHECK (true);

-- Materials
CREATE POLICY "Service role can insert materials" ON public.materials
FOR INSERT TO service_role WITH CHECK (true);

-- Purchase Orders
CREATE POLICY "Service role can insert purchase_orders" ON public.purchase_orders
FOR INSERT TO service_role WITH CHECK (true);
