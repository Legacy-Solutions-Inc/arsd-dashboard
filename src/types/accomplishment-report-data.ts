// TypeScript types for accomplishment report data tables

export interface ProjectDetails {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  project_name?: string;
  client?: string;
  contractor_license?: string;
  project_location?: string;
  contract_amount?: number;
  direct_contract_amount?: number;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  calendar_days?: number;
  working_days?: number;
  pm_name?: string;
  site_engineer_name?: string;
  priority_level?: string;
  remarks?: string;
  created_at: string;
}

export interface ProjectCosts {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  target_cost_total?: number;
  swa_cost_total?: number;
  billed_cost_total?: number;
  direct_cost_total?: number;
  balance?: number;
  collectibles?: number;
  direct_cost_savings?: number;
  target_percentage?: number;
  received_percentage?: number;
  utilization_percentage?: number;
  total_pos?: number;
  created_at: string;
}

export interface ManHours {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  date: string;
  actual_man_hours?: number;
  projected_man_hours?: number;
  created_at: string;
}

export interface CostItem {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  item_no?: string;
  description?: string;
  date?: string;
  type?: string;
  cost?: number;
  wbs?: string;
  created_at: string;
}

export interface CostItemSecondary {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  item_no?: string;
  description?: string;
  date?: string;
  type?: string;
  cost?: number;
  created_at: string;
}

export interface MonthlyCost {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  month?: string;
  target_cost?: number;
  swa_cost?: number;
  billed_cost?: number;
  direct_cost?: number;
  created_at: string;
}

export interface Material {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  material?: string;
  type?: string;
  unit?: string;
  sum_qty?: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  accomplishment_report_id: string;
  project_id: string;
  po_number?: string;
  date_requested?: string;
  expected_delivery_date?: string;
  materials_requested?: string;
  qty?: number;
  unit?: string;
  status?: string;
  priority_level?: string;
  created_at: string;
}

// Combined data structure for parsing
export interface ParsedAccomplishmentData {
  project_details?: ProjectDetails[];
  project_costs?: ProjectCosts[];
  man_hours?: ManHours[];
  cost_items?: CostItem[];
  cost_items_secondary?: CostItemSecondary[];
  monthly_costs?: MonthlyCost[];
  materials?: Material[];
  purchase_orders?: PurchaseOrder[];
}

// Input data structure for database insertion
export interface AccomplishmentDataInput {
  accomplishment_report_id: string;
  project_id: string;
  data: ParsedAccomplishmentData;
}

// Response types for API calls
export interface AccomplishmentReportWithData {
  id: string;
  project_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number;
  file_url: string;
  upload_date: string;
  week_ending_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Detailed data
  project_details?: ProjectDetails[];
  project_costs?: ProjectCosts[];
  man_hours?: ManHours[];
  cost_items?: CostItem[];
  cost_items_secondary?: CostItemSecondary[];
  monthly_costs?: MonthlyCost[];
  materials?: Material[];
  purchase_orders?: PurchaseOrder[];
}
