import { createClient } from '@/lib/supabase';
import type { Project } from '@/types/projects';

export interface ProjectDetails extends Project {
  // Accomplishment data
  project_details?: any[];
  project_costs?: any[];
  man_hours?: any[];
  cost_items?: any[];
  cost_items_secondary?: any[];
  monthly_costs?: any[];
  materials?: any[];
  purchase_orders?: any[];
}

export class ProjectDetailsService {
  private supabase = createClient();

  /**
   * Get the latest accomplishment report ID for a project
   * @param projectId - The project ID
   * @returns Latest accomplishment report ID or null
   */
  private async getLatestAccomplishmentReportId(projectId: string): Promise<string | null> {
    const { data: latestReport, error } = await this.supabase
      .from('accomplishment_reports')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching latest accomplishment report:', error);
      return null;
    }

    return latestReport?.id || null;
  }

  /**
   * Get project details with all accomplishment data
   * @param projectId - The project ID
   * @returns Project details with accomplishment data
   */
  async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
    try {
      // First, get the basic project information
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .select(`
          *,
          project_manager:project_manager_id (
            user_id,
            display_name,
            email
          )
        `)
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        console.error('Error fetching project:', projectError);
        return null;
      }

      // Get accomplishment data from all related tables
      const [
        projectDetails,
        projectCosts,
        manHours,
        costItems,
        costItemsSecondary,
        monthlyCosts,
        materials,
        purchaseOrders
      ] = await Promise.all([
        this.getProjectDetailsData(projectId),
        this.getProjectCostsData(projectId),
        this.getManHoursData(projectId),
        this.getCostItemsData(projectId),
        this.getCostItemsSecondaryData(projectId),
        this.getMonthlyCostsData(projectId),
        this.getMaterialsData(projectId),
        this.getPurchaseOrdersData(projectId)
      ]);

      return {
        ...project,
        project_details: projectDetails,
        project_costs: projectCosts,
        man_hours: manHours,
        cost_items: costItems,
        cost_items_secondary: costItemsSecondary,
        monthly_costs: monthlyCosts,
        materials: materials,
        purchase_orders: purchaseOrders
      };
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  }

  private async getProjectDetailsData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get project details ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('project_details')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching project details:', error);
    return data || [];
  }

  private async getProjectCostsData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get project costs ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('project_costs')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching project costs:', error);
    return data || [];
  }

  private async getManHoursData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get man hours ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('man_hours')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
      .order('date', { ascending: false });
    
    if (error) console.error('Error fetching man hours:', error);
    return data || [];
  }

  private async getCostItemsData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get cost items ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('cost_items')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
    
    if (error) console.error('Error fetching cost items:', error);
    return data || [];
  }

  private async getCostItemsSecondaryData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get cost items secondary ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('cost_items_secondary')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching cost items secondary:', error);
    return data || [];
  }

  private async getMonthlyCostsData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get monthly costs ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('monthly_costs')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
      .order('month', { ascending: true });
    
    if (error) console.error('Error fetching monthly costs:', error);
    return data || [];
  }

  private async getMaterialsData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get materials ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('materials')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching materials:', error);
    return data || [];
  }

  private async getPurchaseOrdersData(projectId: string) {
    const latestReportId = await this.getLatestAccomplishmentReportId(projectId);
    if (!latestReportId) return [];

    // Get purchase orders ONLY from the latest accomplishment report
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('*')
      .eq('accomplishment_report_id', latestReportId)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching purchase orders:', error);
    return data || [];
  }
}