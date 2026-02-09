// Warehouse Management Types

export interface DRItem {
  id: string;
  delivery_receipt_id: string;
  item_description: string;
  qty_in_dr: number;
  qty_in_po: number;
  unit: string;
  sort_order: number;
}

export interface DeliveryReceipt {
  id: string;
  dr_no: string;
  project_id: string;
  supplier: string;
  date: string;
  time?: string | null;
  locked: boolean;
  warehouseman: string;
  dr_photo_url?: string | null;
  po_photo_url?: string | null;
  created_at: string;
  updated_at: string;
  items?: DRItem[]; // included when fetched with items
}

export interface ReleaseItem {
  id: string;
  release_form_id: string;
  item_description: string;
  qty: number;
  unit: string;
  sort_order: number;
}

export interface ReleaseForm {
  id: string;
  release_no: string;
  project_id: string;
  received_by: string;
  date: string;
  locked: boolean;
  warehouseman?: string | null;
  purpose?: string | null;
  attachment_url?: string | null;
  created_at: string;
  updated_at: string;
  items?: ReleaseItem[]; // included when fetched with items
}

// Input types for creating DRs and Releases

export interface CreateDRItemInput {
  item_description: string;
  qty_in_dr: number;
  qty_in_po: number;
  unit: string;
}

export interface CreateDeliveryReceiptInput {
  project_id: string;
  supplier: string;
  date: string;
  time?: string;
  warehouseman: string;
  items: CreateDRItemInput[];
  dr_photo?: File;
  po_photo?: File;
}

export interface CreateReleaseItemInput {
  item_description: string;
  qty: number;
  unit: string;
}

export interface CreateReleaseFormInput {
  project_id: string;
  received_by: string;
  date: string;
  warehouseman?: string;
  purpose?: string;
  items: CreateReleaseItemInput[];
  attachment?: File;
}

// Filter types

export interface DeliveryReceiptFilters {
  search?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface ReleaseFormFilters {
  search?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
}

// Stock item (computed from IPOW + DRs + Releases)
export interface StockItem {
  wbs: string | null;
  item_description: string;
  ipow_qty: number;
  delivered: number;
  utilized: number;
  running_balance: number;
  total_cost: number;
  variance: number;
}
