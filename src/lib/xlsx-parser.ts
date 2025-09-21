import * as XLSX from 'xlsx';

export interface ParsedSheetData {
  sheetName: string;
  data: any[][];
  headers: string[];
  rows: any[][];
  isTargetSheet: boolean;
}

export interface ParsedReportData {
  fileName: string;
  sheets: ParsedSheetData[];
  targetSheet: ParsedSheetData | null;
  totalSheets: number;
  foundTargetSheet: boolean;
}

export class XLSXParserService {
  // Common sheet names to look for in accomplishment reports
  private static TARGET_SHEET_NAMES = [
    'DATA SHEET',
    'Data Sheet',
    'data sheet',
    'Sheet1',
    'Sheet 1'
  ];

  async parseFileFromUrl(fileUrl: string, fileName: string): Promise<ParsedReportData> {
    try {
      console.log('🔄 Parsing file from URL:', fileUrl);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return this.parseFileFromBuffer(arrayBuffer, fileName);
    } catch (error) {
      console.error('❌ Error parsing file from URL:', error);
      throw new Error(`Failed to parse XLSX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async parseFileFromBuffer(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedReportData> {
    try {
      console.log('📊 Parsing XLSX file:', fileName);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheets: ParsedSheetData[] = [];
      let targetSheet: ParsedSheetData | null = null;
      let foundTargetSheet = false;

      console.log('📋 Available sheets:', workbook.SheetNames);

      // Parse all sheets
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '', 
          blankrows: false 
        }) as any[][];

        if (jsonData.length > 0) {
          const headers = jsonData[0] || [];
          const rows = jsonData.slice(1) || [];
          
          // Check if this is our target sheet
          const isTargetSheet = this.isTargetSheet(sheetName);
          
          const sheetData: ParsedSheetData = {
            sheetName,
            data: jsonData,
            headers,
            rows,
            isTargetSheet
          };

          sheets.push(sheetData);

          // Set as target sheet if it matches our criteria
          if (isTargetSheet && !foundTargetSheet) {
            targetSheet = sheetData;
            foundTargetSheet = true;
            console.log(`✅ Found target sheet: "${sheetName}"`);
          }
        }
      });

      // If no target sheet found, use the first sheet with data
      if (!foundTargetSheet && sheets.length > 0) {
        targetSheet = sheets[0];
        targetSheet.isTargetSheet = true;
        foundTargetSheet = true;
        console.log(`⚠️ Using first available sheet: "${targetSheet.sheetName}"`);
      }

      console.log('📈 Parsed sheets:', sheets.length);
      console.log('🎯 Target sheet:', targetSheet?.sheetName);

      return {
        fileName,
        sheets,
        targetSheet,
        totalSheets: sheets.length,
        foundTargetSheet
      };
    } catch (error) {
      console.error('❌ Error parsing XLSX:', error);
      throw new Error(`Failed to parse XLSX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isTargetSheet(sheetName: string): boolean {
    const normalizedSheetName = sheetName.toUpperCase().trim();
    return XLSXParserService.TARGET_SHEET_NAMES.some(searchName => 
      normalizedSheetName === searchName.toUpperCase().trim()
    );
  }

  // Method to get specific columns from the target sheet
  getSpecificColumns(sheetData: ParsedSheetData, columnNames: string[]): { [key: string]: any[] } {
    const result: { [key: string]: any[] } = {};
    
    columnNames.forEach(columnName => {
      const columnIndex = sheetData.headers.findIndex(header => 
        header.toUpperCase().trim() === columnName.toUpperCase().trim()
      );
      
      if (columnIndex !== -1) {
        result[columnName] = sheetData.rows.map(row => row[columnIndex] || '');
      } else {
        result[columnName] = [];
        console.warn(`Column "${columnName}" not found in sheet "${sheetData.sheetName}"`);
      }
    });
    
    return result;
  }

  // Method to get summary statistics from the target sheet
  getSheetSummary(sheetData: ParsedSheetData): {
    totalRows: number;
    totalColumns: number;
    headers: string[];
    hasData: boolean;
  } {
    return {
      totalRows: sheetData.rows.length,
      totalColumns: sheetData.headers.length,
      headers: sheetData.headers,
      hasData: sheetData.rows.length > 0
    };
  }
}

