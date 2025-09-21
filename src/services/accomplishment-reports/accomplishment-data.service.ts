import { createServiceSupabaseClient } from '@/lib/supabase';
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
   * @param input - The accomplishment data input containing report ID, project ID, and parsed data
   * @throws Error if any table insertion fails
   */
  async insertAccomplishmentData(input: AccomplishmentDataInput): Promise<void> {
    const { accomplishment_report_id, project_id, data } = input;

    const supabase = createServiceSupabaseClient();

    try {
      // Insert project details
      if (data.project_details && data.project_details.length > 0) {
        try {
          await this.insertProjectDetails(supabase, accomplishment_report_id, data.project_details);
        } catch (error) {
          console.error('Project details insert failed:', error);
          throw new Error(`Project details insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

      // Insert project costs
      if (data.project_costs && data.project_costs.length > 0) {
        try {
          await this.insertProjectCosts(supabase, accomplishment_report_id, data.project_costs);
        } catch (error) {
          console.error('Project costs insert failed:', error);
          throw new Error(`Project costs insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

      // Insert man hours
      if (data.man_hours && data.man_hours.length > 0) {
        try {
          await this.insertManHours(supabase, accomplishment_report_id, data.man_hours);
        } catch (error) {
          console.error('Man hours insert failed:', error);
          throw new Error(`Man hours insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

      // Insert cost items
      if (data.cost_items && data.cost_items.length > 0) {
        try {
          await this.insertCostItems(supabase, accomplishment_report_id, project_id, data.cost_items);
        } catch (error) {
          console.error('Cost items insert failed:', error);
          throw new Error(`Cost items insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

      // Insert secondary cost items
      if (data.cost_items_secondary && data.cost_items_secondary.length > 0) {
        try {
          await this.insertCostItemsSecondary(supabase, accomplishment_report_id, data.cost_items_secondary);
        } catch (error) {
          console.error('Cost items secondary insert failed:', error);
          throw new Error(`Cost items secondary insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

      // Insert monthly costs
      if (data.monthly_costs && data.monthly_costs.length > 0) {
        try {
          await this.insertMonthlyCosts(supabase, accomplishment_report_id, data.monthly_costs);
        } catch (error) {
          console.error('Monthly costs insert failed:', error);
          throw new Error(`Monthly costs insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

      // Insert materials
      if (data.materials && data.materials.length > 0) {
        try {
          await this.insertMaterials(supabase, accomplishment_report_id, data.materials);
        } catch (error) {
          console.error('Materials insert failed:', error);
          throw new Error(`Materials insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

      // Insert purchase orders
      if (data.purchase_orders && data.purchase_orders.length > 0) {
        try {
          await this.insertPurchaseOrders(supabase, accomplishment_report_id, data.purchase_orders);
        } catch (error) {
          console.error('Purchase orders insert failed:', error);
          throw new Error(`Purchase orders insert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
      }

    } catch (error) {
      console.error('Error inserting accomplishment data:', error);
      throw new Error(`Failed to insert accomplishment data: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  /**
   * Get accomplishment report with all detailed data
   * @param reportId - The ID of the accomplishment report
   * @returns The report with all detailed data or null if not found
   * @throws Error if database query fails
   */
  async getAccomplishmentReportWithData(reportId: string): Promise<AccomplishmentReportWithData | null> {
    try {
      const supabase = createServiceSupabaseClient();
      
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
        this.getProjectDetails(supabase, reportId),
        this.getProjectCosts(supabase, reportId),
        this.getManHours(supabase, reportId),
        this.getCostItems(supabase, reportId),
        this.getCostItemsSecondary(supabase, reportId),
        this.getMonthlyCosts(supabase, reportId),
        this.getMaterials(supabase, reportId),
        this.getPurchaseOrders(supabase, reportId),
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
  
  /**
   * Insert project details data
   * @private
   */
  private async insertProjectDetails(supabase: any, accomplishment_report_id: string, data: ProjectDetails[]): Promise<void> {
    const insertData = data.map(item => {
      const { id, accomplishment_report_id: _, ...rest } = item; // Remove id and any existing accomplishment_report_id
      return { ...rest, accomplishment_report_id };
    });
    
    const { error } = await supabase
      .from('project_details')
      .insert(insertData);

    if (error) {
      console.error('Project details insert error:', error);
      throw error;
    }
  }

  /**
   * Insert project costs data
   * @private
   */
  private async insertProjectCosts(supabase: any, accomplishment_report_id: string, data: ProjectCosts[]): Promise<void> {
    const insertData = data.map(item => {
      const { id, accomplishment_report_id: _, ...rest } = item; // Remove id and any existing accomplishment_report_id
      return { ...rest, accomplishment_report_id };
    });
    
    const { error } = await supabase
      .from('project_costs')
      .insert(insertData);

    if (error) {
      console.error('Project costs insert error:', error);
      throw error;
    }
  }

  /**
   * Insert man hours data
   * @private
   */
  private async insertManHours(supabase: any, accomplishment_report_id: string, data: ManHours[]): Promise<void> {
    const insertData = data.map(item => ({ ...item, accomplishment_report_id }));
    
    const { error } = await supabase
      .from('man_hours')
      .insert(insertData);

    if (error) {
      console.error('Error inserting man hours:', error);
      throw error;
    }
  }

  /**
   * Insert cost items data
   * @private
   */
  private async insertCostItems(supabase: any, accomplishment_report_id: string, project_id: string, data: CostItem[]): Promise<void> {
    const insertData = data.map(item => {
      const { id, accomplishment_report_id, project_id, ...rest } = item; // Remove id, accomplishment_report_id, and project_id
      return { ...rest, accomplishment_report_id, project_id };
    });
    
    const { error } = await supabase
      .from('cost_items')
      .insert(insertData);

    if (error) {
      console.error('Error inserting cost items:', error);
      throw error;
    }
  }

  /**
   * Insert secondary cost items data
   * @private
   */
  private async insertCostItemsSecondary(supabase: any, accomplishment_report_id: string, data: CostItemSecondary[]): Promise<void> {
    const insertData = data.map(item => {
      const { id, accomplishment_report_id: _, ...rest } = item; // Remove id and any existing accomplishment_report_id
      return { ...rest, accomplishment_report_id };
    });
    
    const { error } = await supabase
      .from('cost_items_secondary')
      .insert(insertData);

    if (error) {
      console.error('Cost items secondary insert error:', error);
      throw error;
    }
  }

  /**
   * Insert monthly costs data
   * @private
   */
  private async insertMonthlyCosts(supabase: any, accomplishment_report_id: string, data: MonthlyCost[]): Promise<void> {
    const insertData = data.map(item => {
      const { id, accomplishment_report_id: _, ...rest } = item; // Remove id and any existing accomplishment_report_id
      return { ...rest, accomplishment_report_id };
    });
    
    const { error } = await supabase
      .from('monthly_costs')
      .insert(insertData);

    if (error) {
      console.error('Monthly costs insert error:', error);
      throw error;
    }
  }

  /**
   * Insert materials data
   * @private
   */
  private async insertMaterials(supabase: any, accomplishment_report_id: string, data: Material[]): Promise<void> {
    const insertData = data.map(item => {
      const { id, accomplishment_report_id: _, ...rest } = item; // Remove id and any existing accomplishment_report_id
      return { ...rest, accomplishment_report_id };
    });
    
    const { error } = await supabase
      .from('materials')
      .insert(insertData);

    if (error) {
      console.error('Materials insert error:', error);
      throw error;
    }
  }

  /**
   * Insert purchase orders data
   * @private
   */
  private async insertPurchaseOrders(supabase: any, accomplishment_report_id: string, data: PurchaseOrder[]): Promise<void> {
    const insertData = data.map(item => {
      const { id, accomplishment_report_id: _, ...rest } = item; // Remove id and any existing accomplishment_report_id
      return { ...rest, accomplishment_report_id };
    });
    
    const { error } = await supabase
      .from('purchase_orders')
      .insert(insertData);

    if (error) {
      console.error('Purchase orders insert error:', error);
      throw error;
    }
  }

  // Individual table get methods
  
  /**
   * Get project details data
   * @private
   */
  private async getProjectDetails(supabase: any, accomplishment_report_id: string): Promise<ProjectDetails[]> {
    const { data, error } = await supabase
      .from('project_details')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get project costs data
   * @private
   */
  private async getProjectCosts(supabase: any, accomplishment_report_id: string): Promise<ProjectCosts[]> {
    const { data, error } = await supabase
      .from('project_costs')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get man hours data
   * @private
   */
  private async getManHours(supabase: any, accomplishment_report_id: string): Promise<ManHours[]> {
    const { data, error } = await supabase
      .from('man_hours')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get cost items data
   * @private
   */
  private async getCostItems(supabase: any, accomplishment_report_id: string): Promise<CostItem[]> {
    const { data, error } = await supabase
      .from('cost_items')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get secondary cost items data
   * @private
   */
  private async getCostItemsSecondary(supabase: any, accomplishment_report_id: string): Promise<CostItemSecondary[]> {
    const { data, error } = await supabase
      .from('cost_items_secondary')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get monthly costs data
   * @private
   */
  private async getMonthlyCosts(supabase: any, accomplishment_report_id: string): Promise<MonthlyCost[]> {
    const { data, error } = await supabase
      .from('monthly_costs')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id)
      .order('month', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get materials data
   * @private
   */
  private async getMaterials(supabase: any, accomplishment_report_id: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('accomplishment_report_id', accomplishment_report_id);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get purchase orders data
   * @private
   */
  private async getPurchaseOrders(supabase: any, accomplishment_report_id: string): Promise<PurchaseOrder[]> {
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
   * @param accomplishment_report_id - The ID of the accomplishment report
   * @throws Error if deletion fails
   */
  async deleteAccomplishmentData(accomplishment_report_id: string): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient();
      
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
