import { createClient } from '@/lib/supabase';
import {
  ReleaseForm,
  ReleaseItem,
  CreateReleaseFormInput,
  ReleaseFormFilters,
  UpdateReleaseFormInput,
} from '@/types/warehouse';

export type ReleasesSupabaseClient = ReturnType<typeof createClient>;

export class ReleasesService {
  public supabase: ReleasesSupabaseClient;

  constructor(supabaseClient?: ReleasesSupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  /**
   * Get all release forms with optional filters
   */
  async list(filters?: ReleaseFormFilters): Promise<ReleaseForm[]> {
    let query = this.supabase
      .from('release_forms')
      .select(`
        *,
        items:release_items(*)
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
      query = query.or(`release_no.ilike.${searchTerm},received_by.ilike.${searchTerm},warehouseman.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch release forms: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single release form by ID
   */
  async getById(id: string): Promise<ReleaseForm> {
    const { data, error } = await this.supabase
      .from('release_forms')
      .select(`
        *,
        items:release_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch release form: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new release form with items
   * Note: File URL should already be uploaded to storage before calling this
   */
  async create(input: CreateReleaseFormInput & { attachment_url?: string }): Promise<ReleaseForm> {
    const { items, attachment_url, ...releaseData } = input;

    // Get next release number
    const releaseNo = await this.getNextReleaseNo();

    // Insert release form
    const { data: release, error: releaseError } = await this.supabase
      .from('release_forms')
      .insert({
        release_no: releaseNo,
        project_id: releaseData.project_id,
        received_by: releaseData.received_by,
        date: releaseData.date,
        warehouseman: releaseData.warehouseman || null,
        purpose: releaseData.purpose || null,
        locked: true, // Always locked on create per business rules
        attachment_url: attachment_url || null,
      })
      .select()
      .single();

    if (releaseError) {
      throw new Error(`Failed to create release form: ${releaseError.message}`);
    }

    // Insert release items
    const releaseItems = items.map((item, index) => ({
      release_form_id: release.id,
      item_description: item.item_description,
      wbs: item.wbs ?? null,
      qty: item.qty,
      unit: item.unit,
      sort_order: index,
    }));

    const { error: itemsError } = await this.supabase
      .from('release_items')
      .insert(releaseItems);

    if (itemsError) {
      // Rollback: delete the release
      await this.supabase.from('release_forms').delete().eq('id', release.id);
      throw new Error(`Failed to create release items: ${itemsError.message}`);
    }

    // Fetch complete release with items
    return this.getById(release.id);
  }

  /**
   * Update release form lock status
   */
  async updateLock(id: string, locked: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('release_forms')
      .update({ locked })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update lock status: ${error.message}`);
    }
  }

  /**
   * Update an existing release form and its items.
   * Intended for inline edit flows. Does not handle attachment uploads.
   */
  async update(id: string, input: UpdateReleaseFormInput): Promise<ReleaseForm> {
    const current = await this.getById(id);
    if (current.locked) {
      throw new Error('Cannot edit a locked release form');
    }

    const { items, ...releaseData } = input;

    const { error: releaseError } = await this.supabase
      .from('release_forms')
      .update({
        project_id: releaseData.project_id,
        received_by: releaseData.received_by,
        date: releaseData.date,
        warehouseman: releaseData.warehouseman || null,
        purpose: releaseData.purpose || null,
      })
      .eq('id', id);

    if (releaseError) {
      throw new Error(`Failed to update release form: ${releaseError.message}`);
    }

    const { error: deleteError } = await this.supabase
      .from('release_items')
      .delete()
      .eq('release_form_id', id);

    if (deleteError) {
      throw new Error(`Failed to clear release items: ${deleteError.message}`);
    }

    const releaseItems = items.map((item, index) => ({
      release_form_id: id,
      item_description: item.item_description,
      wbs: item.wbs ?? null,
      qty: item.qty,
      unit: item.unit,
      sort_order: index,
    }));

    const { error: insertError } = await this.supabase
      .from('release_items')
      .insert(releaseItems as ReleaseItem[]);

    if (insertError) {
      throw new Error(`Failed to update release items: ${insertError.message}`);
    }

    return this.getById(id);
  }

  /**
   * Generate next release number (format: REL-YYYY-NNN)
   */
  private async getNextReleaseNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REL-${year}-`;

    // Get the highest release number for current year
    const { data, error } = await this.supabase
      .from('release_forms')
      .select('release_no')
      .like('release_no', `${prefix}%`)
      .order('release_no', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to generate release number: ${error.message}`);
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastReleaseNo = data[0].release_no;
      const lastNumber = parseInt(lastReleaseNo.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Get next release number (public method for API/UI)
   */
  async getNextReleaseNoPublic(): Promise<string> {
    return this.getNextReleaseNo();
  }
}
