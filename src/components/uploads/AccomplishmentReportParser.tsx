'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AccomplishmentReportParser as AccomplishmentParser } from '@/lib/accomplishment-report-parser';
import { ParsedAccomplishmentData } from '@/types/accomplishment-report-data';
import { FileText, Download, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export function AccomplishmentReportParser() {
  const [parsedData, setParsedData] = useState<ParsedAccomplishmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const testXLSXLibrary = async () => {
    try {
      setDebugInfo(['Testing XLSX library...']);
      setLoading(true);
      
      // Test if we can import XLSX dynamically
      const XLSX = await import('xlsx');
      setDebugInfo(prev => [...prev, 'XLSX library loaded successfully']);
      setDebugInfo(prev => [...prev, `XLSX version: ${XLSX.version || 'unknown'}`]);
      
      // Test basic functionality
      const testWorkbook = XLSX.utils.book_new();
      const testSheet = XLSX.utils.aoa_to_sheet([['Test', 'Data'], [1, 2]]);
      XLSX.utils.book_append_sheet(testWorkbook, testSheet, 'Test');
      
      setDebugInfo(prev => [...prev, 'XLSX basic functionality test passed!']);
      setDebugInfo(prev => [...prev, 'XLSX library is ready for use!']);
    } catch (err) {
      setError('XLSX library not available: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setDebugInfo(prev => [...prev, 'XLSX library test failed!']);
    } finally {
      setLoading(false);
    }
  };

  const testWithSampleFile = async () => {
    setLoading(true);
    setError(null);
    setParsedData(null);
    setDebugInfo(['Starting sample file test...']);

    try {
      const sampleFileUrl = '/samples/sample-accomplishment-report.xlsx';
      
      setDebugInfo(prev => [...prev, 'Fetching sample file from URL...']);
      console.log('🔄 Testing accomplishment report parsing...');
      
      // Fetch the file
      const response = await fetch(sampleFileUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      setDebugInfo(prev => [...prev, 'File fetched, starting parsing...']);
      
      // Parse with new parser
      const parser = new AccomplishmentParser(arrayBuffer);
      const result = await parser.parseAccomplishmentReport();
      
      setParsedData(result);
      setDebugInfo(prev => [...prev, 'Parsing completed successfully!']);
      console.log('✅ Parsing successful!', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setDebugInfo(prev => [...prev, `Error: ${errorMessage}`]);
      console.error('❌ Parsing failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testWithCustomFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      setDebugInfo(['No file selected']);
      return;
    }

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      setDebugInfo(['Invalid file type selected']);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Please select a file smaller than 50MB.');
      setDebugInfo(['File too large']);
      return;
    }

    setLoading(true);
    setError(null);
    setParsedData(null);
    setDebugInfo([`Processing file: ${file.name} (${file.size} bytes)`]);

    try {
      console.log('🔄 Processing file:', file.name, 'Size:', file.size, 'bytes');
      
      // Test XLSX import first
      setDebugInfo(prev => [...prev, 'Testing XLSX import...']);
      const XLSX = await import('xlsx');
      setDebugInfo(prev => [...prev, 'XLSX import successful']);
      
      setDebugInfo(prev => [...prev, 'Converting file to ArrayBuffer...']);
      const arrayBuffer = await file.arrayBuffer();
      setDebugInfo(prev => [...prev, `ArrayBuffer created: ${arrayBuffer.byteLength} bytes`]);
      
      setDebugInfo(prev => [...prev, 'Starting XLSX parsing...']);
      console.log('🔄 Testing with custom accomplishment report...');
      
      // Parse with new parser
      const parser = new AccomplishmentParser(arrayBuffer);
      const result = await parser.parseAccomplishmentReport();
      
      setParsedData(result);
      setDebugInfo(prev => [...prev, 'Parsing completed successfully!']);
      console.log('✅ Parsing successful!', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setDebugInfo(prev => [...prev, `Error: ${errorMessage}`]);
      console.error('❌ Parsing failed:', errorMessage);
      console.error('Full error:', err);
    } finally {
      setLoading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const renderParsedData = (data: ParsedAccomplishmentData) => {
    const sections = [
      { name: 'Project Details', data: data.project_details, count: data.project_details?.length || 0 },
      { name: 'Project Costs', data: data.project_costs, count: data.project_costs?.length || 0 },
      { name: 'Man Hours', data: data.man_hours, count: data.man_hours?.length || 0 },
      { name: 'Cost Items', data: data.cost_items, count: data.cost_items?.length || 0 },
      { name: 'Cost Items Secondary', data: data.cost_items_secondary, count: data.cost_items_secondary?.length || 0 },
      { name: 'Monthly Costs', data: data.monthly_costs, count: data.monthly_costs?.length || 0 },
      { name: 'Materials', data: data.materials, count: data.materials?.length || 0 },
      { name: 'Purchase Orders', data: data.purchase_orders, count: data.purchase_orders?.length || 0 },
    
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">{section.name}</h4>
              <div className="text-2xl font-bold text-arsd-red">{section.count}</div>
              <div className="text-sm text-gray-600">records found</div>
            </div>
          ))}
        </div>

        {showDetails && (
          <div className="space-y-4">
            {sections.filter(s => s.count > 0).map((section, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h5 className="font-semibold text-lg mb-3">{section.name} ({section.count} records)</h5>
                {section.data && section.data.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          {Object.keys(section.data[0]).filter(key => key !== 'id' && key !== 'accomplishment_report_id' && key !== 'created_at').map((key, keyIndex) => (
                            <TableHead key={keyIndex} className="font-medium text-gray-700">
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.data.slice(0, 5).map((item: any, itemIndex: number) => (
                          <TableRow key={itemIndex} className={itemIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.keys(item).filter(key => key !== 'id' && key !== 'accomplishment_report_id' && key !== 'created_at').map((key, keyIndex) => (
                              <TableCell key={keyIndex} className="text-sm">
                                {item[key] || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {section.data.length > 5 && (
                      <div className="text-center py-2 text-sm text-gray-500 bg-gray-100">
                        ... and {section.data.length - 5} more records
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-arsd-red" />
          Accomplishment Report Parser
        </CardTitle>
        <CardDescription>
          Test parsing accomplishment reports and view DATA SHEET content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Button 
            onClick={testWithSampleFile}
            disabled={loading}
            className="bg-arsd-red hover:bg-arsd-red/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Test with Sample Report
              </>
            )}
          </Button>

          <Button 
            onClick={testXLSXLibrary}
            variant="outline"
            disabled={loading}
          >
            Test XLSX Library
          </Button>

          <Button 
            onClick={() => {
              setDebugInfo([]);
              setError(null);
              setParsedData(null);
            }}
            variant="outline"
            disabled={loading}
          >
            Clear Results
          </Button>
          
          <div className="flex items-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={testWithCustomFile}
              disabled={loading}
              className="hidden"
              id="accomplishment-file-input"
            />
            <label
              htmlFor="accomplishment-file-input"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Accomplishment Report
                </>
              )}
            </label>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Processing file... Please wait while we parse the Excel data.
            </AlertDescription>
          </Alert>
        )}

        {debugInfo.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Debug Information:</h4>
            <div className="bg-gray-100 p-3 rounded-lg text-sm">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-600">
                  {index + 1}. {info}
                </div>
              ))}
            </div>
          </div>
        )}

        {parsedData && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully parsed accomplishment report!
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Parsed Data Sections</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2"
              >
                {showDetails ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Show Details
                  </>
                )}
              </Button>
            </div>

            {renderParsedData(parsedData)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
