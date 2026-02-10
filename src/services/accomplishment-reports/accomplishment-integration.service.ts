import { AccomplishmentDataService } from './accomplishment-data.service';
import { AccomplishmentReportParser } from '@/lib/accomplishment-report-parser';
import { AccomplishmentDataInput, ParsedAccomplishmentData } from '@/types/accomplishment-report-data';

export class AccomplishmentIntegrationService {
  private dataService: AccomplishmentDataService;

  constructor() {
    this.dataService = new AccomplishmentDataService();
  }

  /**
   * Complete workflow: Parse Excel file and save to database
   */
  async processAccomplishmentReport(
    file: File | ArrayBuffer,
    accomplishmentReportId: string,
    projectId: string
  ): Promise<void> {
    try {
      console.log('🔄 Starting accomplishment report processing...');
      
      // Step 1: Parse the Excel file
      console.log('📊 Parsing Excel file...');
      const parser = new AccomplishmentReportParser(file);
      const parsedData = await parser.parseAccomplishmentReport(accomplishmentReportId);
      
      console.log('✅ Excel parsing completed:', {
        project_details: parsedData.project_details?.length || 0,
        project_costs: parsedData.project_costs?.length || 0,
        man_hours: parsedData.man_hours?.length || 0,
        cost_items: parsedData.cost_items?.length || 0,
        cost_items_secondary: parsedData.cost_items_secondary?.length || 0,
        monthly_costs: parsedData.monthly_costs?.length || 0,
        materials: parsedData.materials?.length || 0,
        purchase_orders: parsedData.purchase_orders?.length || 0,
        ipow_items: parsedData.ipow_items?.length || 0,
      });

      // Step 2: Prepare data for database insertion
      const inputData: AccomplishmentDataInput = {
        accomplishment_report_id: accomplishmentReportId,
        project_id: projectId,
        data: parsedData
      };

      // Step 3: Save to database
      console.log('💾 Saving to database...');
      await this.dataService.insertAccomplishmentData(inputData);
      
      console.log('✅ Accomplishment report processing completed successfully!');
      
    } catch (error) {
      console.error('❌ Error processing accomplishment report:', error);
      throw new Error(`Failed to process accomplishment report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get accomplishment report with all detailed data
   */
  async getAccomplishmentReportWithData(reportId: string) {
    return await this.dataService.getAccomplishmentReportWithData(reportId);
  }

  /**
   * Delete accomplishment report data
   */
  async deleteAccomplishmentReportData(reportId: string) {
    return await this.dataService.deleteAccomplishmentData(reportId);
  }

  /**
   * Parse Excel file without saving to database (for testing/preview)
   */
  async parseAccomplishmentReport(file: File | ArrayBuffer): Promise<ParsedAccomplishmentData> {
    const parser = new AccomplishmentReportParser(file);
    return await parser.parseAccomplishmentReport();
  }
}
