import { createClient } from '@/lib/supabase';
import { IPOWItem } from '@/types/warehouse';

export type IPOWSupabaseClient = ReturnType<typeof createClient>;

export class IPOWService {
  private supabase: IPOWSupabaseClient;

  constructor(supabaseClient?: IPOWSupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  /**
   * Get all IPOW items for a specific project
   */
  async getByProjectId(projectId: string): Promise<IPOWItem[]> {
    const { data, error } = await this.supabase
      .from('ipow_items')
      .select('*')
      .eq('project_id', projectId)
      .order('wbs', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch IPOW items: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get IPOW items with type 'Materials' for a specific project
   */
  async getMaterialsByProjectId(projectId: string): Promise<IPOWItem[]> {
    const { data, error } = await this.supabase
      .from('ipow_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'Materials')
      .order('wbs', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch IPOW items: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single IPOW item by ID
   */
  async getById(id: string): Promise<IPOWItem> {
    const { data, error } = await this.supabase
      .from('ipow_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch IPOW item: ${error.message}`);
    }

    return data;
  }

  /**
   * Get IPOW item by project ID and WBS
   */
  async getByProjectAndWBS(projectId: string, wbs: string): Promise<IPOWItem | null> {
    const { data, error } = await this.supabase
      .from('ipow_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('wbs', wbs)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch IPOW item: ${error.message}`);
    }

    return data;
  }
}
