'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { useAllAccomplishmentReports } from '@/hooks/useAccomplishmentReports';
import { getStatusText, getStatusColor, formatFileSize } from '@/types/accomplishment-reports';
import type { AccomplishmentReport, AccomplishmentReportFilters } from '@/types/accomplishment-reports';

export default function ReportsManagement() {
  const [filters, setFilters] = useState<AccomplishmentReportFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const { reports, loading, error, refetch } = useAllAccomplishmentReports(filters);

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status as 'pending' | 'approved' | 'rejected'
    }));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // You could implement search logic here if needed
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      report.project_name?.toLowerCase().includes(searchLower) ||
      report.client?.toLowerCase().includes(searchLower) ||
      report.display_name?.toLowerCase().includes(searchLower) ||
      report.file_name.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const handleDownload = async (report: AccomplishmentReport) => {
    try {
      // Import Supabase client
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      
      // Get the file using the file_url (which should be the correct Supabase Storage URL)
      if (report.file_url && report.file_url.includes('supabase')) {
        const response = await fetch(report.file_url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = report.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
      
      // Method 2: Construct URL using the correct pattern
      const baseUrl = 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public';
      const bucketName = 'accomplishment-reports';
      
      // Search for files with the project ID pattern in the subfolder
      const { data: files, error: listError } = await supabase.storage
        .from('accomplishment-reports')
        .list('accomplishment-reports', {
          search: report.project_id
        });
      
      if (listError) throw listError;
      
      // Find the file that matches our report
      const matchingFile = files?.find(file => 
        file.name.includes(report.project_id) && 
        file.name.includes(report.file_name.split('.')[0])
      );
      
      if (!matchingFile) {
        throw new Error('File not found in storage');
      }
      
      // Construct the full URL using the correct pattern
      const fullUrl = `${baseUrl}/${bucketName}/${bucketName}/${matchingFile.name}`;
      
      // Download using the constructed URL
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'} ${report.file_url}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Accomplishment Reports</h2>
          <p className="text-sm text-gray-500">
            View and manage all uploaded accomplishment reports
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Week Ending</label>
              <Input
                type="date"
                value={filters.week_ending_date || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  week_ending_date: e.target.value || undefined
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-500">
                {searchTerm || filters.status || filters.week_ending_date
                  ? 'No reports match your current filters.'
                  : 'No accomplishment reports have been uploaded yet.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Week Ending</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{report.project_name}</div>
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {report.client}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {report.location}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{report.display_name}</div>
                          <div className="text-sm text-gray-500">{report.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(report.week_ending_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{report.file_name}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(report.file_size)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDate(report.upload_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(report.file_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
