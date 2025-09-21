-- Create comprehensive tables for accomplishment report data
-- This migration creates all the detailed tables needed to store parsed Excel data

-- Project Details Table (extends basic project info)
CREATE TABLE IF NOT EXISTS public.project_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  project_name TEXT,
  client TEXT,
  contractor_license TEXT,
  project_location TEXT,
  contract_amount DECIMAL(15,2),
  direct_contract_amount DECIMAL(15,2),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  calendar_days INTEGER,
  working_days INTEGER,
  pm_name TEXT,
  site_engineer_name TEXT,
  priority_level TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Costs Summary Table
CREATE TABLE IF NOT EXISTS public.project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  target_cost_total DECIMAL(15,2),
  swa_cost_total DECIMAL(15,2),
  billed_cost_total DECIMAL(15,2),
  direct_cost_total DECIMAL(15,2),
  balance DECIMAL(15,2),
  collectibles DECIMAL(15,2),
  direct_cost_savings DECIMAL(15,2),
  received_percentage DECIMAL(5,2),
  utilization_percentage DECIMAL(5,2),
  total_pos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Man Hours Tracking Table
CREATE TABLE IF NOT EXISTS public.man_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  date DATE NOT NULL,
  actual_man_hours DECIMAL(10,2),
  projected_man_hours DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Items Table 1 (with WBS)
CREATE TABLE IF NOT EXISTS public.cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  item_no TEXT,
  description TEXT,
  date DATE,
  type TEXT,
  cost DECIMAL(15,2),
  wbs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Items Table 2 (without WBS)
CREATE TABLE IF NOT EXISTS public.cost_items_secondary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  item_no TEXT,
  description TEXT,
  date DATE,
  type TEXT,
  cost DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Costs Table
CREATE TABLE IF NOT EXISTS public.monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  month DATE,
  target_cost DECIMAL(15,2),
  swa_cost DECIMAL(15,2),
  billed_cost DECIMAL(15,2),
  direct_cost DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  material TEXT,
  type TEXT,
  unit TEXT,
  sum_qty DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials Summary Table
CREATE TABLE IF NOT EXISTS public.materials_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  count_received INTEGER DEFAULT 0,
  count_requested INTEGER DEFAULT 0,
  count_utilized INTEGER DEFAULT 0,
  grand_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  po_number TEXT,
  date_requested DATE,
  expected_delivery_date DATE,
  materials_requested TEXT,
  qty DECIMAL(15,2),
  unit TEXT,
  status TEXT,
  priority_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  equipment_name TEXT,
  equipment_type TEXT,
  quantity INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productivity Table
CREATE TABLE IF NOT EXISTS public.productivity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_report_id UUID NOT NULL REFERENCES public.accomplishment_reports(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  date DATE,
  productivity_metric TEXT,
  value DECIMAL(10,2),
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_details_accomplishment_report_id ON public.project_details(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_project_details_project_id ON public.project_details(project_id);

CREATE INDEX IF NOT EXISTS idx_project_costs_accomplishment_report_id ON public.project_costs(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_project_id ON public.project_costs(project_id);

CREATE INDEX IF NOT EXISTS idx_man_hours_accomplishment_report_id ON public.man_hours(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_man_hours_project_id ON public.man_hours(project_id);
CREATE INDEX IF NOT EXISTS idx_man_hours_date ON public.man_hours(date);

CREATE INDEX IF NOT EXISTS idx_cost_items_accomplishment_report_id ON public.cost_items(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_project_id ON public.cost_items(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_date ON public.cost_items(date);

CREATE INDEX IF NOT EXISTS idx_cost_items_secondary_accomplishment_report_id ON public.cost_items_secondary(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_secondary_project_id ON public.cost_items_secondary(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_secondary_date ON public.cost_items_secondary(date);

CREATE INDEX IF NOT EXISTS idx_monthly_costs_accomplishment_report_id ON public.monthly_costs(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_monthly_costs_project_id ON public.monthly_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_costs_month ON public.monthly_costs(month);

CREATE INDEX IF NOT EXISTS idx_materials_accomplishment_report_id ON public.materials(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON public.materials(project_id);

CREATE INDEX IF NOT EXISTS idx_materials_summary_accomplishment_report_id ON public.materials_summary(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_materials_summary_project_id ON public.materials_summary(project_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_accomplishment_report_id ON public.purchase_orders(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders(po_number);

CREATE INDEX IF NOT EXISTS idx_equipment_accomplishment_report_id ON public.equipment(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_equipment_project_id ON public.equipment(project_id);

CREATE INDEX IF NOT EXISTS idx_productivity_accomplishment_report_id ON public.productivity(accomplishment_report_id);
CREATE INDEX IF NOT EXISTS idx_productivity_project_id ON public.productivity(project_id);
CREATE INDEX IF NOT EXISTS idx_productivity_date ON public.productivity(date);

-- Enable RLS on all tables
ALTER TABLE public.project_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.man_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_items_secondary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity ENABLE ROW LEVEL SECURITY;

-- Superadmins can view all data
CREATE POLICY "Superadmins can view all project details" ON public.project_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all project costs" ON public.project_costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all man hours" ON public.man_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all cost items" ON public.cost_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all secondary cost items" ON public.cost_items_secondary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all monthly costs" ON public.monthly_costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all materials" ON public.materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all materials summary" ON public.materials_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all purchase orders" ON public.purchase_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all equipment" ON public.equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view all productivity" ON public.productivity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );
