import { createClient } from '@/lib/supabase';
import { BaseService } from '@/services/base-service';
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

  // Get reports for assigned projects (PM view)
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

  // Get all reports (Superadmin/HR/PI view)
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

  // Get weekly upload status for assigned projects
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
      
      // Get reports for current week
      const { data: reports, error: reportsError } = await supabase
        .from('accomplishment_reports')
        .select('id, project_id, week_ending_date, status')
        .eq('week_ending_date', currentWeekEnding);

      if (reportsError) throw reportsError;

      // Combine data
      return projects.map(project => {
        const report = reports.find(r => r.project_id === project.id);
        return {
          project_id: project.id,
          project_name: project.project_name,
          week_ending_date: currentWeekEnding,
          has_upload: !!report,
          report: report ? {
            id: report.id,
            status: report.status as 'pending' | 'approved' | 'rejected'
          } as AccomplishmentReport : undefined
        };
      });
    } catch (error) {
      throw error;
    }
  }

  // Upload a new report
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

  // Update report status (for superadmins and project inspectors)
  async updateReportStatus(
    reportId: string, 
    status: 'pending' | 'approved' | 'rejected',
    notes?: string
  ): Promise<AccomplishmentReport> {
    try {
      const supabase = createClient();
      
      console.log('Updating report status:', { reportId, status, notes });
      
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

      console.log('Report data fetched:', reportData);

      // Update the report status (simplified - no complex joins)
      const updateData: any = { 
        status
      };
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      console.log('Update data:', updateData);

      const { error: updateError } = await supabase
        .from('accomplishment_reports')
        .update(updateData)
        .eq('id', reportId);

      if (updateError) {
        console.error('Error updating report:', updateError);
        throw updateError;
      }

      console.log('Report status updated successfully');

      // If approved, update the project's latest accomplishment date
      if (status === 'approved') {
        console.log('Updating project accomplishment date...');
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            latest_accomplishment_update: reportData.week_ending_date
          })
          .eq('id', reportData.project_id);

        if (projectError) {
          console.warn('Failed to update project accomplishment date:', projectError);
          // Don't throw here as the main operation succeeded
        } else {
          console.log('Project accomplishment date updated successfully');
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

      console.log('Updated report fetched successfully:', updatedReport);
      return updatedReport;
    } catch (error) {
      console.error('updateReportStatus error:', error);
      throw error;
    }
  }

  // Delete a report
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

  // Upload file to Supabase Storage
  async uploadFile(file: File, projectId: string): Promise<{ url: string; path: string }> {
    try {
      const supabase = createClient();
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${projectId}-${timestamp}-${file.name}`;
      const filePath = `accomplishment-reports/${fileName}`;

      console.log('Uploading file:', { fileName, filePath, fileSize: file.size });

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

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('accomplishment-reports')
        .getPublicUrl(filePath);

      console.log('Generated URL:', urlData.publicUrl);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  // Helper function to get week ending date
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