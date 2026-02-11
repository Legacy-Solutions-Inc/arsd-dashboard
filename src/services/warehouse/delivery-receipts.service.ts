import { createClient } from '@/lib/supabase';
import { DeliveryReceipt, DRItem, CreateDeliveryReceiptInput, DeliveryReceiptFilters } from '@/types/warehouse';

export type DeliveryReceiptsSupabaseClient = ReturnType<typeof createClient>;

export class DeliveryReceiptsService {
  public supabase: DeliveryReceiptsSupabaseClient;

  constructor(supabaseClient?: DeliveryReceiptsSupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  /**
   * Get all delivery receipts with optional filters
   */
  async list(filters?: DeliveryReceiptFilters): Promise<DeliveryReceipt[]> {
    let query = this.supabase
      .from('delivery_receipts')
      .select(`
        *,
        items:dr_items(*)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters?.date_from) {
      query = query.gte('date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('date', filters.date_to);
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`dr_no.ilike.${searchTerm},supplier.ilike.${searchTerm},warehouseman.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch delivery receipts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single delivery receipt by ID
   */
  async getById(id: string): Promise<DeliveryReceipt> {
    const { data, error } = await this.supabase
      .from('delivery_receipts')
      .select(`
        *,
        items:dr_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch delivery receipt: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new delivery receipt with items
   * Note: File URLs should already be uploaded to storage before calling this
   */
  async create(input: CreateDeliveryReceiptInput & { dr_photo_url?: string; delivery_proof_url?: string }): Promise<DeliveryReceipt> {
    const { items, dr_photo_url, delivery_proof_url, ...drData } = input;

    // Get next DR number
    const drNo = await this.getNextDrNo();

    // Insert delivery receipt
    const { data: dr, error: drError } = await this.supabase
      .from('delivery_receipts')
      .insert({
        dr_no: drNo,
        project_id: drData.project_id,
        supplier: drData.supplier,
        date: drData.date,
        time: drData.time || null,
        warehouseman: drData.warehouseman,
        locked: true, // Always locked on create per business rules
        dr_photo_url: dr_photo_url || null,
        delivery_proof_url: delivery_proof_url || null,
      })
      .select()
      .single();

    if (drError) {
      throw new Error(`Failed to create delivery receipt: ${drError.message}`);
    }

    // Insert DR items
    const drItems = items.map((item, index) => ({
      delivery_receipt_id: dr.id,
      item_description: item.item_description,
      wbs: item.wbs ?? null,
      qty_in_dr: item.qty_in_dr,
      qty_in_po: item.qty_in_po,
      unit: item.unit,
      sort_order: index,
    }));

    const { error: itemsError } = await this.supabase
      .from('dr_items')
      .insert(drItems);

    if (itemsError) {
      // Rollback: delete the DR
      await this.supabase.from('delivery_receipts').delete().eq('id', dr.id);
      throw new Error(`Failed to create DR items: ${itemsError.message}`);
    }

    // Fetch complete DR with items
    return this.getById(dr.id);
  }

  /**
   * Update delivery receipt lock status
   */
  async updateLock(id: string, locked: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('delivery_receipts')
      .update({ locked })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update lock status: ${error.message}`);
    }
  }

  /**
   * Generate next DR number (format: DR-YYYY-NNN)
   */
  private async getNextDrNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DR-${year}-`;

    // Get the highest DR number for current year
    const { data, error } = await this.supabase
      .from('delivery_receipts')
      .select('dr_no')
      .like('dr_no', `${prefix}%`)
      .order('dr_no', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to generate DR number: ${error.message}`);
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastDrNo = data[0].dr_no;
      const lastNumber = parseInt(lastDrNo.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Get next DR number (public method for API/UI)
   */
  async getNextDrNoPublic(): Promise<string> {
    return this.getNextDrNo();
  }
}
