import { createServiceSupabaseClient } from '@/lib/supabase';
import { AccomplishmentReportParser } from '@/lib/accomplishment-report-parser';
import { AccomplishmentDataService } from './accomplishment-data.service';

export class AutoParseService {
  /**
   * Parse a specific approved report by ID and save data to database
   */
  static async parseApprovedReport(reportId: string): Promise<{
    success: boolean;
    error?: string;
    recordsSaved?: number;
  }> {
    try {
      const supabase = createServiceSupabaseClient();
      
      // Get the full report data
      const { data: fullReport, error: fetchError } = await supabase
        .from('accomplishment_reports')
        .select('id, file_url, status, project_id')
        .eq('id', reportId)
        .eq('status', 'approved')
        .single();

      if (fetchError || !fullReport) {
        console.error('Error fetching report data:', fetchError);
        throw new Error(`Failed to fetch report data: ${fetchError?.message || 'Unknown error'}`);
      }

      // Download and parse the file
      const fileResponse = await fetch(fullReport.file_url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.statusText}`);
      }
      
      const arrayBuffer = await fileResponse.arrayBuffer();
      
      // Parse the Excel file
      const parser = new AccomplishmentReportParser(arrayBuffer);
      const parsedData = await parser.parseAccomplishmentReport(fullReport.id);
      
      // Count total records to be saved
      const totalRecords = Object.values(parsedData).reduce((sum, section) => 
        sum + (Array.isArray(section) ? section.length : 0), 0
      );
      
      // Save parsed data to database
      const dataService = new AccomplishmentDataService();
      await dataService.insertAccomplishmentData({
        accomplishment_report_id: fullReport.id,
        project_id: fullReport.project_id,
        data: parsedData
      });
      
      // Mark the report as parsed
      const { error: updateError } = await supabase
        .from('accomplishment_reports')
        .update({ 
          parsed_at: new Date().toISOString(),
          parsed_status: 'success'
        })
        .eq('id', fullReport.id);
      
      if (updateError) {
        throw new Error(`Failed to update parsed status: ${updateError.message}`);
      }

      // Update project to indicate it has parsed data
      const { error: projectUpdateError } = await supabase
        .from('projects')
        .update({
          has_parsed_data: true
        })
        .eq('id', fullReport.project_id);

      if (projectUpdateError) {
        console.warn('Failed to update project parsing status:', projectUpdateError);
      }

      return { success: true, recordsSaved: totalRecords };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error parsing report ${reportId}:`, errorMessage);
      
      // Mark the report as failed
      try {
        const supabase = createServiceSupabaseClient();
        await supabase
          .from('accomplishment_reports')
          .update({ 
            parsed_at: new Date().toISOString(),
            parsed_status: 'failed',
            parse_error: errorMessage
          })
          .eq('id', reportId);
      } catch (updateError) {
        console.error('Failed to update report status:', updateError);
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Parse all approved reports that haven't been parsed yet
   */
  static async parseAllApprovedReports(): Promise<{
    parsed: number;
    total: number;
    errors: string[];
  }> {
    try {
      const supabase = createServiceSupabaseClient();
      
      // Get all approved reports that haven't been parsed
      const { data: approvedReports, error: fetchError } = await supabase
        .from('accomplishment_reports')
        .select('id, file_url, status, project_id')
        .eq('status', 'approved')
        .is('parsed_at', null);

      if (fetchError) {
        throw new Error(`Failed to fetch approved reports: ${fetchError.message}`);
      }

      if (!approvedReports || approvedReports.length === 0) {
        return { parsed: 0, total: 0, errors: [] };
      }

      // Process each approved report in parallel
      const results = await Promise.all(
        approvedReports.map(async (report) => {
          const result = await this.parseApprovedReport(report.id);
          return { ...result, reportId: report.id };
        })
      );

      const parsedCount = results.filter(r => r.success).length;
      const errors = results
        .filter(r => !r.success)
        .map(r => `Report ${r.reportId}: ${r.error}`);

      return {
        parsed: parsedCount,
        total: approvedReports.length,
        errors
      };

    } catch (error) {
      console.error('Error in parseAllApprovedReports:', error);
      throw error;
    }
  }
}
