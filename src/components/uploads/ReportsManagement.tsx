'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
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
  Eye,
  BarChart3,
  FileUp
} from 'lucide-react';
import { useAllAccomplishmentReports, useUpdateReportStatus } from '@/hooks/useAccomplishmentReports';
import { useFileDownload } from '@/hooks/useFileDownload';
import { useRBAC } from '@/hooks/useRBAC';
import { getStatusText, getStatusColor, formatFileSize } from '@/types/accomplishment-reports';
import type { AccomplishmentReport, AccomplishmentReportFilters } from '@/types/accomplishment-reports';
import { AccomplishmentReportParser } from './AccomplishmentReportParser';

export default function ReportsManagement() {
  const [filters, setFilters] = useState<AccomplishmentReportFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  const { reports, loading, error, refetch } = useAllAccomplishmentReports(filters);
  const { downloadFile, isDownloading, error: downloadError } = useFileDownload();
  const { updateStatus, loading: statusLoading, error: statusError } = useUpdateReportStatus();
  const { user, hasPermission } = useRBAC();

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status as 'pending' | 'approved' | 'rejected'
    }));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
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
      await downloadFile(report.project_id, report.file_name, report.file_url);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStatusUpdate = async (reportId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      setUpdatingStatus(reportId);
      await updateStatus(reportId, status, notes);
      await refetch(); // Refresh the reports list
      
      // If approved, dispatch event to refresh projects dashboard
      if (status === 'approved') {
        window.dispatchEvent(new CustomEvent('projectReportApproved'));
      }
    } catch (error) {
      console.error('Status update failed:', error);
      alert(`Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const canUpdateStatus = (report: AccomplishmentReport): boolean => {
    if (!user) return false;
    
    // Superadmin and project inspector can update any report
    return ['superadmin', 'project_inspector'].includes(user.role);
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
      <div className="space-y-6 mt-4">
        <div className="flex items-center gap-4 mt-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Accomplishment Reports</h2>
            <p className="text-glass-secondary text-sm">View and manage all uploaded accomplishment reports</p>
          </div>
        </div>
        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arsd-red mx-auto mb-4"></div>
            <div className="text-glass-primary">Loading reports...</div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Accomplishment Reports</h2>
            <p className="text-glass-secondary">View and manage all uploaded accomplishment reports</p>
          </div>
        </div>
        <Alert variant="destructive" className="glass-elevated border-red-200/50 bg-red-50/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (downloadError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Accomplishment Reports</h2>
            <p className="text-glass-secondary">View and manage all uploaded accomplishment reports</p>
          </div>
        </div>
        <Alert variant="destructive" className="glass-elevated border-red-200/50 bg-red-50/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">Download error: {downloadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Accomplishment Reports</h2>
            <p className="text-glass-secondary">View and manage all uploaded accomplishment reports</p>
          </div>
        </div>
        <Alert variant="destructive" className="glass-elevated border-red-200/50 bg-red-50/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">Status update error: {statusError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
      <div className="space-y-8">
        {/* Accomplishment Report Parser */}
        <AccomplishmentReportParser />

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Accomplishment Reports</h2>
            <p className="text-glass-secondary text-md">
              View and manage all uploaded accomplishment reports
            </p>
          </div>
        </div>
        <Badge variant="glass" className="text-sm bg-arsd-red/20 text-arsd-red border-arsd-red/30">
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <GlassCard variant="elevated">
        <GlassCardHeader className="bg-gradient-to-r from-arsd-red/5 to-red-500/5 border-b border-arsd-red/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arsd-red/20 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-arsd-red" />
            </div>
            <GlassCardTitle className="text-lg text-arsd-red">Filters</GlassCardTitle>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-glass-primary">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-arsd-red/60" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-glass-primary">Status</label>
              <Select onValueChange={handleStatusFilter}>
                <SelectTrigger className="glass-input">
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
            <div className="space-y-3">
              <label className="text-sm font-medium text-glass-primary">Week Ending</label>
              <Input
                type="date"
                value={filters.week_ending_date || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  week_ending_date: e.target.value || undefined
                }))}
                className="glass-input"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Reports Table */}
      <GlassCard variant="elevated" className="overflow-hidden">
        <GlassCardContent className="p-0">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-arsd-red/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-arsd-red" />
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-3">No Reports Found</h3>
              <p className="text-glass-secondary text-lg max-w-md mx-auto">
                {searchTerm || filters.status || filters.week_ending_date
                  ? 'No reports match your current filters.'
                  : 'No accomplishment reports have been uploaded yet.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-glass">
              <Table>
                <TableHeader>
                  <TableRow className="glass-table-header">
                    <TableHead className="glass-table-header-cell text-arsd-red">Project</TableHead>
                    <TableHead className="glass-table-header-cell text-arsd-red">Uploaded By</TableHead>
                    <TableHead className="glass-table-header-cell text-arsd-red">Week Ending</TableHead>
                    <TableHead className="glass-table-header-cell text-arsd-red">File</TableHead>
                    <TableHead className="glass-table-header-cell text-arsd-red">Status</TableHead>
                    <TableHead className="glass-table-header-cell text-arsd-red">Upload Date</TableHead>
                    <TableHead className="glass-table-header-cell text-arsd-red">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report, index) => (
                    <TableRow key={report.id} className={`glass-table-row ${index % 2 === 0 ? 'bg-white/5' : 'bg-white/2'}`}>
                      <TableCell className="glass-table-cell">
                        <div className="space-y-2">
                          <div className="font-semibold text-glass-primary text-md">{report.project_name}</div>
                          <div className="text-sm text-glass-secondary">
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="h-3 w-3 text-arsd-red" />
                              <span>{report.client}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-arsd-red" />
                              <span>{report.location}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-arsd-red/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-arsd-red" />
                          </div>
                          <div>
                            <div className="font-medium text-glass-primary text-md">{report.display_name}</div>
                            <div className="text-sm text-glass-muted">{report.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-arsd-red" />
                          <span className="text-glass-primary font-medium">{formatDate(report.week_ending_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-glass-primary">{report.file_name}</div>
                          <div className="text-xs text-glass-muted bg-arsd-red/10 px-2 py-1 rounded-lg inline-block">
                            {formatFileSize(report.file_size)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(report.status)}
                          <Badge variant="glass" className={getStatusColor(report.status)}>
                            {getStatusText(report.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <div className="text-sm text-glass-secondary font-medium">
                          {formatDate(report.upload_date)}
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(report)}
                            disabled={isDownloading}
                            className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30"
                          >
                            {isDownloading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-arsd-red mr-1" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(report.file_url, '_blank')}
                            className="glass-button bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-glass-primary border-blue-300/50 hover:from-blue-500/30 hover:to-cyan-500/30"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button> */}
                          {canUpdateStatus(report) && report.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(report.id, 'approved')}
                                disabled={updatingStatus === report.id || statusLoading}
                                className="glass-button bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 border-green-300/50 hover:from-green-500/30 hover:to-emerald-500/30"
                              >
                                {updatingStatus === report.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(report.id, 'rejected')}
                                disabled={updatingStatus === report.id || statusLoading}
                                className="glass-button bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-700 border-red-300/50 hover:from-red-500/30 hover:to-rose-500/30"
                              >
                                {updatingStatus === report.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}