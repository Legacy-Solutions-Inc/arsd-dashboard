import * as XLSX from 'xlsx';
import {
  ParsedAccomplishmentData,
  ProjectDetails,
  ProjectCosts,
  ManHours,
  CostItem,
  CostItemSecondary,
  MonthlyCost,
  Material,
  PurchaseOrder,
} from '@/types/accomplishment-report-data';

export class AccomplishmentReportParser {
  private workbook: XLSX.WorkBook;
  private dataSheet: XLSX.WorkSheet | null = null;

  constructor(file: File | ArrayBuffer) {
    if (file instanceof File) {
      // Handle File object
      this.workbook = XLSX.read(file, { type: 'array' });
    } else {
      // Handle ArrayBuffer
      this.workbook = XLSX.read(file, { type: 'array' });
    }
    
    this.findDataSheet();
  }

  /**
   * Find the DATA SHEET in the workbook
   */
  private findDataSheet(): void {
    const dataSheetName = this.workbook.SheetNames.find(name => 
      name.toLowerCase().includes('data sheet') || 
      name.toLowerCase().includes('datasheet') ||
      name.toLowerCase() === 'data sheet'
    );

    if (dataSheetName) {
      this.dataSheet = this.workbook.Sheets[dataSheetName];
    } else {
      throw new Error('DATA SHEET not found in the Excel file');
    }
  }

  /**
   * Parse the entire accomplishment report
   */
  async parseAccomplishmentReport(accomplishmentReportId?: string): Promise<ParsedAccomplishmentData> {
    if (!this.dataSheet) {
      throw new Error('No data sheet available');
    }

    // Convert sheet to JSON array
    const jsonData = XLSX.utils.sheet_to_json(this.dataSheet, { header: 1, defval: '' }) as any[][];
    
    // Find section boundaries
    const sections = this.findSectionBoundaries(jsonData);

    const parsedData: ParsedAccomplishmentData = {};

    // Parse each section
    if (sections.projectDetails) {
      parsedData.project_details = this.parseProjectDetails(jsonData, sections.projectDetails, accomplishmentReportId);
    }

    if (sections.projectCosts) {
      parsedData.project_costs = this.parseProjectCosts(jsonData, sections.projectCosts, accomplishmentReportId);
    }

    if (sections.manHours) {
      parsedData.man_hours = this.parseManHours(jsonData, sections.manHours, accomplishmentReportId);
    }

    if (sections.costItems) {
      parsedData.cost_items = this.parseCostItems(jsonData, sections.costItems, accomplishmentReportId);
    }

    if (sections.costItemsSecondary) {
      parsedData.cost_items_secondary = this.parseCostItemsSecondary(jsonData, sections.costItemsSecondary, accomplishmentReportId);
    } else {
      // Fallback: Try to parse Cost Items Secondary data from columns BM-BR (63-68) without section detection
      parsedData.cost_items_secondary = this.parseCostItemsSecondaryFallback(jsonData, accomplishmentReportId);
    }

    if (sections.monthlyCosts) {
      parsedData.monthly_costs = this.parseMonthlyCosts(jsonData, sections.monthlyCosts, accomplishmentReportId);
    }

    if (sections.materials) {
      parsedData.materials = this.parseMaterials(jsonData, sections.materials, accomplishmentReportId);
    }

    if (sections.purchaseOrders) {
      parsedData.purchase_orders = this.parsePurchaseOrders(jsonData, sections.purchaseOrders, accomplishmentReportId);
    }

    console.log('Parsed data:', parsedData);
    return parsedData;
  }

  /**
   * Find section boundaries in the data
   */
  private findSectionBoundaries(jsonData: any[][]): Record<string, { start: number; end: number }> {
    const sections: Record<string, { start: number; end: number }> = {};

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      // Check all cells in the row, not just the first one
      const rowText = row.map(cell => cell?.toString().toLowerCase() || '').join(' ');

      // Look for section headers that contain the expected column names
      
      // Project Details section - look for headers like "projectid", "project name", "client"
      if (rowText.includes('projectid') && (rowText.includes('project name') || rowText.includes('client'))) {
        sections.projectDetails = { start: i, end: this.findNextSection(jsonData, i) };
      }

      // Project Costs section - look for headers like "target cost total", "swa cost total"
      if (rowText.includes('target cost total') || rowText.includes('swa cost total')) {
        sections.projectCosts = { start: i, end: this.findNextSection(jsonData, i) };
      }

      // Man Hours section - look for headers like "actual_manhours", "projected_manhours", "Actual_ManHours", "Projected_ManHours"
      if (rowText.includes('actual_manhours') || rowText.includes('projected_manhours')) {
        sections.manHours = { start: i, end: this.findNextSection(jsonData, i) };
      }

      // Cost Items section - look for headers like "item_no", "description", "cost", "wbs"
      if (rowText.includes('item_no') && rowText.includes('description') && rowText.includes('cost') && rowText.includes('wbs')) {
        sections.costItems = { start: i, end: this.findNextSection(jsonData, i) };
      }

      // Cost Items Secondary section - look for headers like "item_no", "description", "cost" but no "wbs"
      if (rowText.includes('item_no') && rowText.includes('description') && rowText.includes('cost') && !rowText.includes('wbs')) {
        if (!sections.costItems) { // Only if Cost Items wasn't already found
          sections.costItemsSecondary = { start: i, end: this.findNextSection(jsonData, i) };
        }
      }

      // Monthly Costs section - look for headers like "month", "targetcost", "swa_cost"
      if (rowText.includes('month') && (rowText.includes('targetcost') || rowText.includes('swa_cost'))) {
        sections.monthlyCosts = { start: i, end: this.findNextSection(jsonData, i) };
      }

      // Materials section - look for headers like "material", "type", "unit", "sumqty"
      if (rowText.includes('material') && rowText.includes('type') && rowText.includes('sumqty')) {
        sections.materials = { start: i, end: this.findNextSection(jsonData, i) };
      }

      // Purchase Orders section - look for headers like "po number", "date requested", "materials requested"
      if (rowText.includes('po number') || rowText.includes('date requested') || rowText.includes('materials requested')) {
        sections.purchaseOrders = { start: i, end: this.findNextSection(jsonData, i) };
      }
    }

    return sections;
  }

  /**
   * Find the next section boundary
   */
  private findNextSection(jsonData: any[][], startIndex: number): number {
    for (let i = startIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const rowText = row.map(cell => cell?.toString().toLowerCase() || '').join(' ');
      
      // Look for the start of a new section header by checking for column names
      if ((rowText.includes('projectid') && (rowText.includes('project name') || rowText.includes('client'))) ||
          (rowText.includes('target cost total') || rowText.includes('swa cost total')) ||
          (rowText.includes('actual_manhours') || rowText.includes('projected_manhours')) ||
          (rowText.includes('item_no') && rowText.includes('description') && rowText.includes('wbs')) ||
          (rowText.includes('item_no') && rowText.includes('description') && rowText.includes('cost')) ||
          (rowText.includes('month') && (rowText.includes('targetcost') || rowText.includes('swa_cost'))) ||
          (rowText.includes('material') && rowText.includes('type') && rowText.includes('sumqty')) ||
          (rowText.includes('po number') || rowText.includes('date requested') || rowText.includes('materials requested'))) {
        return i; // Found next section header
      }
    }
    
    return jsonData.length; // No more sections found
  }

  /**
   * Parse Project Details section
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parseProjectDetails(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): ProjectDetails[] {
    const details: ProjectDetails[] = [];
    
    // COLUMN MAPPING - Project Details is from V to AL (columns 21-37):
    const COLUMNS = {
      project_id: 21,          // Column V = 21
      project_name: 22,        // Column W = 22
      client: 23,              // Column X = 23
      contractor_license: 24,  // Column Y = 24
      project_location: 25,    // Column Z = 25
      contract_amount: 26,     // Column AA = 26
      direct_contract_amount: 27, // Column AB = 27
      planned_start_date: 28,  // Column AC = 28
      planned_end_date: 29,    // Column AD = 29
      actual_start_date: 30,   // Column AE = 30
      actual_end_date: 31,     // Column AF = 31
      calendar_days: 32,       // Column AG = 32
      working_days: 33,        // Column AH = 33
      pm_name: 34,             // Column AI = 34
      site_engineer_name: 35,  // Column AJ = 35
      priority_level: 36,      // Column AK = 36
      remarks: 37              // Column AL = 37
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      if (!projectId) continue;

      details.push({
        id: '', // Will be set by database
        accomplishment_report_id: accomplishmentReportId || '', // Will be set by caller
        project_id: projectId,
        project_name: this.getCellValueByIndex(row, COLUMNS.project_name),
        client: this.getCellValueByIndex(row, COLUMNS.client),
        contractor_license: this.getCellValueByIndex(row, COLUMNS.contractor_license),
        project_location: this.getCellValueByIndex(row, COLUMNS.project_location),
        contract_amount: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.contract_amount)),
        direct_contract_amount: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.direct_contract_amount)),
        planned_start_date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.planned_start_date)),
        planned_end_date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.planned_end_date)),
        actual_start_date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.actual_start_date)),
        actual_end_date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.actual_end_date)),
        calendar_days: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.calendar_days)),
        working_days: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.working_days)),
        pm_name: this.getCellValueByIndex(row, COLUMNS.pm_name),
        site_engineer_name: this.getCellValueByIndex(row, COLUMNS.site_engineer_name),
        priority_level: this.getCellValueByIndex(row, COLUMNS.priority_level),
        remarks: this.getCellValueByIndex(row, COLUMNS.remarks),
        created_at: new Date().toISOString()
      });
    }

    return details;
  }

  /**
   * Parse Project Costs section
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parseProjectCosts(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): ProjectCosts[] {
    const costs: ProjectCosts[] = [];
    
    // COLUMN MAPPING - Project Costs is from AN to AX (columns 39-49):
    const COLUMNS = {
      project_id: 39,                  // Column AN = 39
      target_cost_total: 40,           // Column AO = 40
      swa_cost_total: 41,              // Column AP = 41
      billed_cost_total: 42,           // Column AQ = 42
      direct_cost_total: 43,           // Column AR = 43
      balance: 44,                     // Column AS = 44
      collectibles: 45,                // Column AT = 45
      direct_cost_savings: 46,         // Column AU = 46
      received_percentage: 47,         // Column AV = 47
      utilization_percentage: 48,      // Column AW = 48
      total_pos: 49                    // Column AX = 49
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      if (!projectId) continue;

      costs.push({
        id: '',
        accomplishment_report_id: accomplishmentReportId || '',
        project_id: projectId,
        target_cost_total: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.target_cost_total)),
        swa_cost_total: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.swa_cost_total)),
        billed_cost_total: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.billed_cost_total)),
        direct_cost_total: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.direct_cost_total)),
        balance: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.balance)),
        collectibles: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.collectibles)),
        direct_cost_savings: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.direct_cost_savings)),
        received_percentage: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.received_percentage)),
        utilization_percentage: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.utilization_percentage)),
        total_pos: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.total_pos)),
        created_at: new Date().toISOString()
      });
    }

    return costs;
  }

  /**
   * Parse Man Hours section
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parseManHours(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): ManHours[] {
    const manHours: ManHours[] = [];
    
    // COLUMN MAPPING - Man Hours is from BA to BC (columns 52-54):
    const COLUMNS = {
      project_id: null,           // No project_id column in this section
      date: 52,                   // Column BA = 52 (Date)
      actual_man_hours: 53,       // Column BB = 53 (Actual_Man)
      projected_man_hours: 54     // Column BC = 54 (Projected_Man)
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const date = this.parseDate(this.getCellValueByIndex(row, COLUMNS.date));
      
      if (!date) continue;

      manHours.push({
        id: '',
        accomplishment_report_id: accomplishmentReportId || '',
        project_id: 'A', // Default project ID since there's no project_id column
        date: date,
        actual_man_hours: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.actual_man_hours)),
        projected_man_hours: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.projected_man_hours)),
        created_at: new Date().toISOString()
      });
    }

    return manHours;
  }

  /**
   * Parse Cost Items section (with WBS)
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parseCostItems(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): CostItem[] {
    const costItems: CostItem[] = [];
    
    // COLUMN MAPPING - Cost Items is from BE to BK (columns 55-61):
    const COLUMNS = {
      project_id: 56,       // Column BE = 56
      item_no: 57,          // Column BF = 56
      description: 58,      // Column BG = 57
      date: 59,             // Column BH = 58
      type: 60,             // Column BI = 59
      cost: 61,             // Column BJ = 60
      wbs: 62               // Column BK = 61
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      if (!projectId) continue;

      costItems.push({
        id: '',
        accomplishment_report_id: accomplishmentReportId || '',
        project_id: projectId,
        item_no: this.getCellValueByIndex(row, COLUMNS.item_no),
        description: this.getCellValueByIndex(row, COLUMNS.description),
        date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.date)),
        type: this.getCellValueByIndex(row, COLUMNS.type),
        cost: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.cost)),
        wbs: this.getCellValueByIndex(row, COLUMNS.wbs),
        created_at: new Date().toISOString()
      });
    }

    return costItems;
  }

  /**
   * Parse Cost Items Secondary section (without WBS)
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parseCostItemsSecondary(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): CostItemSecondary[] {
    const costItemsSecondary: CostItemSecondary[] = [];
    
    // COLUMN MAPPING - Cost Items Secondary is from BM to BR (columns 63-68):
    const COLUMNS = {
      project_id: 64,       // Column BM = 63
      item_no: 65,          // Column BN = 64
      description: 66,      // Column BO = 65
      date: 67,             // Column BP = 66
      type: 68,             // Column BQ = 67
      cost: 69              // Column BR = 68
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      if (!projectId) continue;

      costItemsSecondary.push({
        id: '',
        accomplishment_report_id: accomplishmentReportId || '',
        project_id: projectId,
        item_no: this.getCellValueByIndex(row, COLUMNS.item_no),
        description: this.getCellValueByIndex(row, COLUMNS.description),
        date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.date)),
        type: this.getCellValueByIndex(row, COLUMNS.type),
        cost: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.cost)),
        created_at: new Date().toISOString()
      });
    }

    return costItemsSecondary;
  }

  /**
   * Fallback method to parse Cost Items Secondary data without section detection
   */
  private parseCostItemsSecondaryFallback(jsonData: any[][], accomplishmentReportId?: string): CostItemSecondary[] {
    const costItemsSecondary: CostItemSecondary[] = [];
    
    // COLUMN MAPPING - Cost Items Secondary is from BM to BR (columns 63-68):
    const COLUMNS = {
      project_id: 64,       // Column BM = 63
      item_no: 65,          // Column BN = 64
      description: 66,      // Column BO = 65
      date: 67,             // Column BP = 66
      type: 68,             // Column BQ = 67
      cost: 69              // Column BR = 68
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 70) continue; // Need at least 70 columns (0-69)

      // Check if this row has data in the Cost Items Secondary columns
      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      const itemNo = this.getCellValueByIndex(row, COLUMNS.item_no);
      const description = this.getCellValueByIndex(row, COLUMNS.description);
      const cost = this.getCellValueByIndex(row, COLUMNS.cost);

      // Only process rows that have meaningful data
      if (projectId && (itemNo || description || cost)) {
        costItemsSecondary.push({
          id: '',
          accomplishment_report_id: accomplishmentReportId || '',
          project_id: projectId,
          item_no: itemNo,
          description: description,
          date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.date)),
          type: this.getCellValueByIndex(row, COLUMNS.type),
          cost: this.parseNumber(cost),
          created_at: new Date().toISOString()
        });
      }
    }

    return costItemsSecondary;
  }

  /**
   * Parse Monthly Costs section
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parseMonthlyCosts(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): MonthlyCost[] {
    const monthlyCosts: MonthlyCost[] = [];
    
    // COLUMN MAPPING - Monthly Costs is from BT to BY (columns 71-76):
    const COLUMNS = {
      project_id: 71,       // Column BT = 71
      month: 72,            // Column BU = 72
      target_cost: 73,      // Column BV = 73
      swa_cost: 74,         // Column BW = 74
      billed_cost: 75,      // Column BX = 75
      direct_cost: 76       // Column BY = 76
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      if (!projectId) continue;

      monthlyCosts.push({
        id: '',
        accomplishment_report_id: accomplishmentReportId || '',
        project_id: projectId,
        month: this.parseDate(this.getCellValueByIndex(row, COLUMNS.month)),
        target_cost: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.target_cost)),
        swa_cost: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.swa_cost)),
        billed_cost: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.billed_cost)),
        direct_cost: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.direct_cost)),
        created_at: new Date().toISOString()
      });
    }

    return monthlyCosts;
  }

  /**
   * Parse Materials section
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parseMaterials(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): Material[] {
    const materials: Material[] = [];
    
    // COLUMN MAPPING - Materials is from CA to CE (columns 78-82):
    const COLUMNS = {
      project_id: 78,       // Column CA = 78
      material: 79,         // Column CB = 79
      type: 80,             // Column CC = 80
      unit: 81,             // Column CD = 81
      sum_qty: 82           // Column CE = 82
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      if (!projectId) continue;

      materials.push({
        id: '',
        accomplishment_report_id: accomplishmentReportId || '',
        project_id: projectId,
        material: this.getCellValueByIndex(row, COLUMNS.material),
        type: this.getCellValueByIndex(row, COLUMNS.type),
        unit: this.getCellValueByIndex(row, COLUMNS.unit),
        sum_qty: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.sum_qty)),
        created_at: new Date().toISOString()
      });
    }

    return materials;
  }

  /**
   * Parse Purchase Orders section
   * 
   * COLUMN MAPPING TEMPLATE - Replace the numbers with your actual column indices:
   * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25
   */
  private parsePurchaseOrders(jsonData: any[][], section: { start: number; end: number }, accomplishmentReportId?: string): PurchaseOrder[] {
    const purchaseOrders: PurchaseOrder[] = [];
    
    // COLUMN MAPPING - Purchase Orders is from CG to CO (columns 84-92):
    const COLUMNS = {
      project_id: 84,                  // Column CG = 84
      po_number: 85,                  // Column CH = 85
      date_requested: 86,             // Column CI = 86
      expected_delivery_date: 87,     // Column CJ = 87
      materials_requested: 88,        // Column CK = 88
      qty: 89,                        // Column CL = 89
      unit: 90,                       // Column CM = 90
      status: 91,                     // Column CN = 91
      priority_level: 92              // Column CO = 92
    };

    for (let i = section.start + 1; i < section.end; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const projectId = this.getCellValueByIndex(row, COLUMNS.project_id);
      if (!projectId) continue;

      purchaseOrders.push({
        id: '',
        accomplishment_report_id: accomplishmentReportId || '',
        project_id: projectId,
        po_number: this.getCellValueByIndex(row, COLUMNS.po_number),
        date_requested: this.parseDate(this.getCellValueByIndex(row, COLUMNS.date_requested)),
        expected_delivery_date: this.parseDate(this.getCellValueByIndex(row, COLUMNS.expected_delivery_date)),
        materials_requested: this.getCellValueByIndex(row, COLUMNS.materials_requested),
        qty: this.parseNumber(this.getCellValueByIndex(row, COLUMNS.qty)),
        unit: this.getCellValueByIndex(row, COLUMNS.unit),
        status: this.getCellValueByIndex(row, COLUMNS.status),
        priority_level: this.getCellValueByIndex(row, COLUMNS.priority_level),
        created_at: new Date().toISOString()
      });
    }

    return purchaseOrders;
  }

  
  /**
   * Helper method to get cell value by column index
   */
  private getCellValueByIndex(row: any[], columnIndex: number): string {
    if (columnIndex < 0 || columnIndex >= row.length) return '';
    
    const value = row[columnIndex];
    return value ? value.toString().trim() : '';
  }

  /**
   * Helper method to get cell value by header name (fallback)
   */
  private getCellValue(row: any[], headers: any[], headerName: string): string {
    const headerIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes(headerName.toLowerCase())
    );
    
    if (headerIndex === -1) return '';
    
    const value = row[headerIndex];
    return value ? value.toString().trim() : '';
  }

  /**
   * Helper method to parse numbers
   */
  private parseNumber(value: string): number | undefined {
    if (!value || value === '') return undefined;
    
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Helper method to parse dates
   */
  private parseDate(value: string): string | undefined {
    if (!value || value === '') return undefined;
    
    try {
      // Handle Excel date serial numbers
      if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        if (isNaN(date.getTime())) return undefined;
        
        // Check if date is within reasonable range (1900-2100)
        const year = date.getFullYear();
        if (year < 1900 || year > 2100) {
          console.warn(`Invalid Excel date year: ${year} for value: ${value}`);
          return undefined;
        }
        
        return date.toISOString().split('T')[0];
      }
      
      // Handle string dates
      const date = new Date(value);
      if (isNaN(date.getTime())) return undefined;
      
      // Check if date is within reasonable range (1900-2100)
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        console.warn(`Invalid string date year: ${year} for value: ${value}`);
        return undefined;
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn(`Date parsing error for value: ${value}`, error);
      return undefined;
    }
  }
}
