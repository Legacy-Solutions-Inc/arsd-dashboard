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
  /**
   * `week_ending_date` of the latest accomplishment report consumed for this
   * page load. Surfaces on the project header as "Data as of …" so PMs can
   * tell whether the numbers reflect this week or three weeks ago.
   * Null when no accomplishment report exists yet.
   */
  latest_report_date?: string | null;
}

export class ProjectDetailsService {
  private supabase = createClient();

  /**
   * Get the latest accomplishment report (id + week_ending_date) for a project.
   * Tries (1) latest approved+parsed, then (2) latest parsed-any-status,
   * then (3) latest approved (may not be parsed), then (4) latest of any kind.
   */
  private async getLatestAccomplishmentReport(
    projectId: string,
  ): Promise<{ id: string; week_ending_date: string | null } | null> {
    // 1) Latest APPROVED + successfully PARSED
    const { data: approvedParsed, error: approvedParsedError } = await this.supabase
      .from('accomplishment_reports')
      .select('id, week_ending_date, created_at')
      .eq('project_id', projectId)
      .eq('status', 'approved')
      .eq('parsed_status', 'success')
      .order('week_ending_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approvedParsed && approvedParsed.id) {
      return { id: approvedParsed.id, week_ending_date: approvedParsed.week_ending_date ?? null };
    }

    if (approvedParsedError) {
      console.warn('Fallback: approved+parsed lookup failed:', approvedParsedError.message);
    }

    // 2) Latest PARSED (any status)
    const { data: anyParsed, error: anyParsedError } = await this.supabase
      .from('accomplishment_reports')
      .select('id, week_ending_date, created_at')
      .eq('project_id', projectId)
      .eq('parsed_status', 'success')
      .order('week_ending_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (anyParsed && anyParsed.id) {
      return { id: anyParsed.id, week_ending_date: anyParsed.week_ending_date ?? null };
    }

    if (anyParsedError) {
      console.warn('Fallback: parsed-only lookup failed:', anyParsedError.message);
    }

    // 3) Latest APPROVED (may not be parsed yet)
    const { data: approvedOnly, error: approvedOnlyError } = await this.supabase
      .from('accomplishment_reports')
      .select('id, week_ending_date, created_at')
      .eq('project_id', projectId)
      .eq('status', 'approved')
      .order('week_ending_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approvedOnly && approvedOnly.id) {
      return { id: approvedOnly.id, week_ending_date: approvedOnly.week_ending_date ?? null };
    }

    if (approvedOnlyError) {
      console.warn('Fallback: approved-only lookup failed:', approvedOnlyError.message);
    }

    // 4) Last resort: latest report of any kind
    const { data: latestReport, error } = await this.supabase
      .from('accomplishment_reports')
      .select('id, week_ending_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest accomplishment report (last resort):', error);
      return null;
    }

    if (!latestReport?.id) return null;
    return { id: latestReport.id, week_ending_date: latestReport.week_ending_date ?? null };
  }

  /**
   * Get project details with all accomplishment data.
   * Resolves the latest accomplishment report ID once, then runs the seven
   * sub-fetches in parallel against that single ID — instead of each helper
   * doing its own report-ID lookup (formerly up to 32 queries per page load).
   */
  async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
    try {
      const [projectResult, latestReport] = await Promise.all([
        this.supabase
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
          .single(),
        this.getLatestAccomplishmentReport(projectId),
      ]);

      const { data: project, error: projectError } = projectResult;
      if (projectError || !project) {
        console.error('Error fetching project:', projectError);
        return null;
      }

      // No accomplishment report yet — return the project shell with empty arrays.
      if (!latestReport) {
        return {
          ...project,
          project_details: [],
          project_costs: [],
          man_hours: [],
          cost_items: [],
          cost_items_secondary: [],
          monthly_costs: [],
          materials: [],
          purchase_orders: [],
          latest_report_date: null,
        };
      }

      const reportId = latestReport.id;
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
        this.getProjectDetailsData(reportId),
        this.getProjectCostsData(reportId),
        this.getManHoursData(reportId),
        this.getCostItemsData(reportId),
        this.getCostItemsSecondaryData(reportId),
        this.getMonthlyCostsData(reportId),
        this.getMaterialsData(reportId),
        this.getPurchaseOrdersData(reportId),
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
        purchase_orders: purchaseOrders,
        latest_report_date: latestReport.week_ending_date,
      };
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  }

  private async getProjectDetailsData(reportId: string) {
    const { data, error } = await this.supabase
      .from('project_details')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching project details:', error);
    return data || [];
  }

  private async getProjectCostsData(reportId: string) {
    const { data, error } = await this.supabase
      .from('project_costs')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching project costs:', error);
    return data || [];
  }

  private async getManHoursData(reportId: string) {
    const { data, error } = await this.supabase
      .from('man_hours')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .order('date', { ascending: false });
    if (error) console.error('Error fetching man hours:', error);
    return data || [];
  }

  private async getCostItemsData(reportId: string) {
    const { data, error } = await this.supabase
      .from('cost_items')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .in('type', ['Target', 'Equipment', 'Labor', 'Materials'])
      .order('date', { ascending: true });
    if (error) console.error('Error fetching cost items:', error);
    return data || [];
  }

  private async getCostItemsSecondaryData(reportId: string) {
    const { data, error } = await this.supabase
      .from('cost_items_secondary')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching cost items secondary:', error);
    return data || [];
  }

  private async getMonthlyCostsData(reportId: string) {
    const { data, error } = await this.supabase
      .from('monthly_costs')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .order('month', { ascending: true });
    if (error) console.error('Error fetching monthly costs:', error);
    return data || [];
  }

  private async getMaterialsData(reportId: string) {
    const { data, error } = await this.supabase
      .from('materials')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching materials:', error);
    return data || [];
  }

  private async getPurchaseOrdersData(reportId: string) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('*')
      .eq('accomplishment_report_id', reportId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching purchase orders:', error);
    return data || [];
  }
}
