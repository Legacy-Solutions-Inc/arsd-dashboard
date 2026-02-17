import { createClient } from '@/lib/supabase';
import { BaseService } from '@/services/base-service';
import { ProjectService } from '@/services/projects/project.service';
import type { 
  AccomplishmentReport, 
  CreateAccomplishmentReportData, 
  AccomplishmentReportFilters,
  WeeklyUploadStatus 
} from '@/types/accomplishment-reports';

export class AccomplishmentReportsService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get reports for assigned projects (PM view)
   * @param filters - Optional filters for querying reports
   * @returns Array of accomplishment reports with project and uploader details
   */
  async getAssignedProjectReports(filters?: AccomplishmentReportFilters): Promise<AccomplishmentReport[]> {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('accomplishment_reports')
        .select(`
          *,
          project:projects!inner(
            id,
            project_id,
            project_name,
            client,
            location,
            status,
            project_manager_id
          ),
          uploader:profiles!accomplishment_reports_uploaded_by_fkey(
            id,
            display_name,
            email
          )
        `)
        .order('week_ending_date', { ascending: false });

      // Apply filters
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.week_ending_date) {
        query = query.eq('week_ending_date', filters.week_ending_date);
      }
      if (filters?.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all reports (Superadmin/HR/PI view)
   * @param filters - Optional filters for querying reports
   * @returns Array of accomplishment reports with full details
   */
  async getAllReports(filters?: AccomplishmentReportFilters): Promise<AccomplishmentReport[]> {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('accomplishment_reports_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.week_ending_date) {
        query = query.eq('week_ending_date', filters.week_ending_date);
      }
      if (filters?.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get weekly upload status for assigned projects
   * @returns Array of weekly upload status for each assigned project
   */
  async getWeeklyUploadStatus(): Promise<WeeklyUploadStatus[]> {
    try {
      const supabase = createClient();
      
      // Get assigned projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, project_id, project_name, project_manager_id')
        .eq('project_manager_id', (await supabase.auth.getUser()).data.user?.id);

      if (projectsError) throw projectsError;

      // Get current week ending date
      const currentWeekEnding = this.getWeekEndingDate();
      
      // Get reports for assigned projects (we'll consider current week for upload availability)
      const projectIds = projects.map(p => p.id);
      const { data: reports, error: reportsError } = await supabase
        .from('accomplishment_reports')
        .select('id, project_id, week_ending_date, status, upload_date, file_name, file_size, file_url, notes')
        .in('project_id', projectIds)
        .order('upload_date', { ascending: false }); // Order by upload_date to get the latest report first

      if (reportsError) throw reportsError;

      // Combine data - determine current week's status per project
      const result = projects.map(project => {
        // Get ALL reports for current week for this project, then pick the latest one
        const reportsForCurrentWeek = reports.filter(r => r.project_id === project.id && r.week_ending_date === currentWeekEnding);
        
        // Get the LATEST report (most recent upload_date) for current week
        // This ensures we get the most recent resubmission, not the original rejected one
        const reportForCurrentWeek = reportsForCurrentWeek.length > 0 
          ? reportsForCurrentWeek[0] // Since we ordered by upload_date desc, first one is latest
          : undefined;
          
        return {
          project_id: project.id,
          project_name: project.project_name,
          // Always show the current week's Saturday in the PM list
          week_ending_date: currentWeekEnding,
          has_upload: !!reportForCurrentWeek,
          report: reportForCurrentWeek ? {
            id: reportForCurrentWeek.id,
            project_id: reportForCurrentWeek.project_id,
            week_ending_date: reportForCurrentWeek.week_ending_date,
            status: reportForCurrentWeek.status as 'pending' | 'approved' | 'rejected',
            upload_date: reportForCurrentWeek.upload_date,
            file_name: reportForCurrentWeek.file_name,
            file_size: reportForCurrentWeek.file_size,
            file_url: reportForCurrentWeek.file_url,
            notes: reportForCurrentWeek.notes
          } as AccomplishmentReport : undefined
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload a new accomplishment report
   * @param reportData - The report data to upload
   * @returns The created accomplishment report with project and uploader details
   */
  async uploadReport(reportData: CreateAccomplishmentReportData): Promise<AccomplishmentReport> {
    try {
      const supabase = createClient();
      
      // Check for duplicate report
      const { data: existing, error: checkError } = await supabase
        .rpc('check_duplicate_report', {
          p_project_id: reportData.project_id,
          p_week_ending_date: reportData.week_ending_date
        });

      if (checkError) throw checkError;
      if (existing) {
        throw new Error('A report for this project and week already exists');
      }

      const { data, error } = await supabase
        .from('accomplishment_reports')
        .insert(reportData)
        .select(`
          *,
          project:projects(
            id,
            project_id,
            project_name,
            client,
            location,
            status
          ),
          uploader:profiles!accomplishment_reports_uploaded_by_fkey(
            id,
            display_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update report status (for superadmins and project inspectors)
   * Automatically triggers parsing when status is set to 'approved'
   */
  async updateReportStatus(
    reportId: string, 
    status: 'pending' | 'approved' | 'rejected',
    notes?: string
  ): Promise<AccomplishmentReport> {
    try {
      const supabase = createClient();
      
      // First, get the report to access project_id
      const { data: reportData, error: fetchError } = await supabase
        .from('accomplishment_reports')
        .select('project_id, week_ending_date')
        .eq('id', reportId)
        .single();

      if (fetchError) {
        console.error('Error fetching report:', fetchError);
        throw fetchError;
      }

      // Update the report status
      const updateData: any = { 
        status
      };
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('accomplishment_reports')
        .update(updateData)
        .eq('id', reportId);

      if (updateError) {
        console.error('Error updating report:', updateError);
        throw updateError;
      }

      // Update project flags based on status change
      if (status === 'approved') {
        try {
          // Update project's latest accomplishment date
          const projectService = new ProjectService();
          await projectService.updateLatestAccomplishmentDate(reportData.project_id, new Date().toISOString());
          
          // Add a small delay to ensure the database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify the report exists and is approved before parsing
          const { data: verifyReport, error: verifyError } = await supabase
            .from('accomplishment_reports')
            .select('id, status')
            .eq('id', reportId)
            .eq('status', 'approved')
            .single();
          
          if (verifyError || !verifyReport) {
            console.error('Report verification failed:', verifyError);
            // Fetch the full report to return
            const { data: fullReport } = await supabase
              .from('accomplishment_reports_with_details')
              .select('*')
              .eq('id', reportId)
              .single();
            return fullReport || reportData;
          }
          
          // Call the server-side API to trigger auto-parsing
          const response = await fetch('/api/accomplishment-reports/parse-approved', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reportId })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            console.error('Auto-parsing failed:', result.error);
          }
        } catch (parseError) {
          console.error('Error during auto-parsing:', parseError);
        }
      } else if (status === 'rejected') {
        // When rejecting, check if this was the latest approved report
        // If so, we need to update project flags to reflect the new latest approved report
        try {
          await this.updateProjectFlagsAfterRejection(reportData.project_id);
        } catch (error) {
          console.error('Error updating project flags after rejection:', error);
        }
      }

      // Return the updated report by fetching it from the view
      const { data: updatedReport, error: fetchUpdatedError } = await supabase
        .from('accomplishment_reports_with_details')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchUpdatedError) {
        console.error('Error fetching updated report:', fetchUpdatedError);
        throw fetchUpdatedError;
      }

      return updatedReport;
    } catch (error) {
      console.error('updateReportStatus error:', error);
      throw error;
    }
  }

  /**
   * Delete an accomplishment report
   * @param reportId - The ID of the report to delete
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('accomplishment_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload file to Supabase Storage
   * @param file - The file to upload
   * @param projectId - The project ID for filename generation
   * @returns Object containing the public URL and file path
   */
  async uploadFile(file: File, projectId: string): Promise<{ url: string; path: string }> {
    try {
      const supabase = createClient();
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${projectId}-${timestamp}-${file.name}`;
      const filePath = `accomplishment-reports/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from('accomplishment-reports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('accomplishment-reports')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  /**
   * Update project flags after a report is rejected
   * This ensures the project reflects the current latest approved and parsed report
   */
  private async updateProjectFlagsAfterRejection(projectId: string): Promise<void> {
    const supabase = createClient();
    
    // Find the latest approved and successfully parsed report
    const { data: latestApprovedParsed, error: latestError } = await supabase
      .from('accomplishment_reports')
      .select('id, week_ending_date, created_at')
      .eq('project_id', projectId)
      .eq('status', 'approved')
      .eq('parsed_status', 'success')
      .order('week_ending_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error('Error finding latest approved parsed report:', latestError);
      return;
    }

    if (latestApprovedParsed) {
      // Update project with the latest approved parsed report info
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          latest_accomplishment_update: latestApprovedParsed.week_ending_date,
          has_parsed_data: true
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('Error updating project flags:', updateError);
      } else {
        console.log(`Updated project ${projectId} flags after rejection`);
      }
    } else {
      // No approved parsed reports found, clear the flags
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          latest_accomplishment_update: null,
          has_parsed_data: false
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('Error clearing project flags:', updateError);
      } else {
        console.log(`Cleared project ${projectId} flags - no approved parsed reports found`);
      }
    }
  }

  /**
   * Helper function to get week ending date (Saturday)
   * @param date - The date to calculate week ending for (defaults to current date)
   * @returns The week ending date in YYYY-MM-DD format
   */
  private getWeekEndingDate(date: Date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    return saturday.toISOString().split('T')[0];
  }
}