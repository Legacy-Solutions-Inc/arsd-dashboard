import { createClient } from '@/lib/supabase';

const supabase = createClient();
import { BaseService } from '../base-service';
import {
  ProjectDetails,
  ProjectCosts,
  ManHours,
  CostItem,
  CostItemSecondary,
  MonthlyCost,
  Material,
  PurchaseOrder,
  ParsedAccomplishmentData,
  AccomplishmentDataInput,
  AccomplishmentReportWithData
} from '@/types/accomplishment-report-data';

export class AccomplishmentDataService extends BaseService {
  /**
   * Insert parsed accomplishment data into all relevant tables
   */
  async insertAccomplishmentData(input: AccomplishmentDataInput): Promise<void> {
    const { accomplishment_report_id, project_id, data } = input;

    try {
      // Insert project details
      if (data.project_details && data.project_details.length > 0) {
        await this.insertProjectDetails(accomplishment_report_id, data.project_details);
      }

      // Insert project costs
      if (data.project_costs && data.project_costs.length > 0) {
        await this.insertProjectCosts(accomplishment_report_id, data.project_costs);
      }

      // Insert man hours
      if (data.man_hours && data.man_hours.length > 0) {
        await this.insertManHours(accomplishment_report_id, data.man_hours);
      }

      // Insert cost items
      if (data.cost_items && data.cost_items.length > 0) {
        await this.insertCostItems(accomplishment_report_id, data.cost_items);
      }

      // Insert secondary cost items
      if (data.cost_items_secondary && data.cost_items_secondary.length > 0) {
        await this.insertCostItemsSecondary(accomplishment_report_id, data.cost_items_secondary);
      }

      // Insert monthly costs
      if (data.monthly_costs && data.monthly_costs.length > 0) {
        await this.insertMonthlyCosts(accomplishment_report_id, data.monthly_costs);
      }

      // Insert materials
      if (data.materials && data.materials.length > 0) {
        await this.insertMaterials(accomplishment_report_id, data.materials);
      }

      // Insert purchase orders
      if (data.purchase_orders && data.purchase_orders.length > 0) {
        await this.insertPurchaseOrders(accomplishment_report_id, data.purchase_orders);
      }

    } catch (error) {
      console.error('Error inserting accomplishment data:', error);
      throw new Error(`Failed to insert accomplishment data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get accomplishment report with all detailed data
   */
  async getAccomplishmentReportWithData(reportId: string): Promise<AccomplishmentReportWithData | null> {
    try {
      // Get basic report info
      const { data: report, error: reportError } = await supabase
        .from('accomplishment_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        throw new Error('Report not found');
      }

      // Get all detailed data
      const [
        projectDetails,
        projectCosts,
        manHours,
        costItems,
        costItemsSecondary,
        monthlyCosts,
        materials,
        purchaseOrders,
      ] = await Promise.all([
        this.getProjectDetails(reportId),
        this.getProjectCosts(reportId),
        this.getManHours(reportId),
        this.getCostItems(reportId),
        this.getCostItemsSecondary(reportId),
        this.getMonthlyCosts(reportId),
        this.getMaterials(reportId),
        this.getPurchaseOrders(reportId),
      ]);

      return {
        ...report,
        project_details: projectDetails,
        project_costs: projectCosts,
        man_hours: manHours,
        cost_items: costItems,
        cost_items_secondary: costItemsSecondary,
        monthly_costs: monthlyCosts,
        materials: materials,
        purchase_orders: purchaseOrders,
      };

    } catch (error) {
      console.error('Error getting accomplishment report with data:', error);
      throw new Error(`Failed to get accomplishment report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Individual table insert methods
  private async insertProjectDetails(accomplishment_report_id: string, data: ProjectDetails[]): Promise<void> {
    const { error } = await supabase
      .from('project_details')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  private async insertProjectCosts(accomplishment_report_id: string, data: ProjectCosts[]): Promise<void> {
    const { error } = await supabase
      .from('project_costs')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  private async insertManHours(accomplishment_report_id: string, data: ManHours[]): Promise<void> {
    const { error } = await supabase
      .from('man_hours')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  private async insertCostItems(accomplishment_report_id: string, data: CostItem[]): Promise<void> {
    const { error } = await supabase
      .from('cost_items')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  private async insertCostItemsSecondary(accomplishment_report_id: string, data: CostItemSecondary[]): Promise<void> {
    const { error } = await supabase
      .from('cost_items_secondary')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  private async insertMonthlyCosts(accomplishment_report_id: string, data: MonthlyCost[]): Promise<void> {
    const { error } = await supabase
      .from('monthly_costs')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  private async insertMaterials(accomplishment_report_id: string, data: Material[]): Promise<void> {
    const { error } = await supabase
      .from('materials')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  private async insertPurchaseOrders(accomplishment_report_id: string, data: PurchaseOrder[]): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .insert(data.map(item => ({ ...item, accomplishment_report_id })));

    if (error) throw error;
  }

  // Individual table get methods
  private async getProjectDetails(accomplishment_report_id: string): Promise<ProjectDetails[]> {
    const { data, error } = await supabase
      .from('project_details')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id);

    if (error) throw error;
    return data || [];
  }

  private async getProjectCosts(accomplishment_report_id: string): Promise<ProjectCosts[]> {
    const { data, error } = await supabase
      .from('project_costs')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id);

    if (error) throw error;
    return data || [];
  }

  private async getManHours(accomplishment_report_id: string): Promise<ManHours[]> {
    const { data, error } = await supabase
      .from('man_hours')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private async getCostItems(accomplishment_report_id: string): Promise<CostItem[]> {
    const { data, error } = await supabase
      .from('cost_items')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private async getCostItemsSecondary(accomplishment_report_id: string): Promise<CostItemSecondary[]> {
    const { data, error } = await supabase
      .from('cost_items_secondary')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private async getMonthlyCosts(accomplishment_report_id: string): Promise<MonthlyCost[]> {
    const { data, error } = await supabase
      .from('monthly_costs')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('month', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private async getMaterials(accomplishment_report_id: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id);

    if (error) throw error;
    return data || [];
  }

  private async getPurchaseOrders(accomplishment_report_id: string): Promise<PurchaseOrder[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('date_requested', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete all data for a specific accomplishment report
   */
  async deleteAccomplishmentData(accomplishment_report_id: string): Promise<void> {
    try {
      // Delete from all tables (CASCADE should handle this, but being explicit)
      const tables = [
        'project_details',
        'project_costs',
        'man_hours',
        'cost_items',
        'cost_items_secondary',
        'monthly_costs',
        'materials',
        'purchase_orders',
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('accomplishment_report_id', accomplishment_report_id);

        if (error) {
          console.warn(`Error deleting from ${table}:`, error);
        }
      }
    } catch (error) {
      console.error('Error deleting accomplishment data:', error);
      throw new Error(`Failed to delete accomplishment data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
