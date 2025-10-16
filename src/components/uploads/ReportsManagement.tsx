'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  FileUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useAllAccomplishmentReports, useUpdateReportStatus } from '@/hooks/useAccomplishmentReports';
import { useFileDownload } from '@/hooks/useFileDownload';
import { useRBAC } from '@/hooks/useRBAC';
import { getStatusText, getStatusColor, formatFileSize } from '@/types/accomplishment-reports';
import type { AccomplishmentReport, AccomplishmentReportFilters } from '@/types/accomplishment-reports';
import { AccomplishmentReportParser } from './AccomplishmentReportParser';
import { UniversalLoading, InlineLoading } from '@/components/ui/universal-loading';

export default function ReportsManagement() {
  const [filters, setFilters] = useState<AccomplishmentReportFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRejectedReport, setSelectedRejectedReport] = useState<AccomplishmentReport | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectingReport, setRejectingReport] = useState<AccomplishmentReport | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isApprovalConfirmOpen, setIsApprovalConfirmOpen] = useState(false);
  const [approvingReport, setApprovingReport] = useState<AccomplishmentReport | null>(null);
  const itemsPerPage = 5;
  
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

  // Pagination logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

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
      
      if (status === 'approved') {
        setIsApproving(true);
      } else if (status === 'rejected') {
        setIsRejecting(true);
      }
      
      await updateStatus(reportId, status, notes);
      await refetch(); // Refresh the reports list
      
      // Dispatch event to refresh projects dashboard
      if (status === 'approved') {
        console.log('✅ Dispatching projectReportApproved event');
        window.dispatchEvent(new CustomEvent('projectReportApproved'));
      } else if (status === 'rejected') {
        console.log('❌ Dispatching projectReportRejected event');
        window.dispatchEvent(new CustomEvent('projectReportRejected'));
      }
    } catch (error) {
      console.error('Status update failed:', error);
      alert(`Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingStatus(null);
      setIsApproving(false);
      setIsRejecting(false);
    }
  };

  const handleApproveClick = (report: AccomplishmentReport) => {
    setApprovingReport(report);
    setIsApprovalConfirmOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!approvingReport) return;
    try {
      await handleStatusUpdate(approvingReport.id, 'approved');
      setIsApprovalConfirmOpen(false);
      setApprovingReport(null);
    } catch (error) {
      // Error is already handled in handleStatusUpdate
      // Keep dialog open to show error state
    }
  };

  const handleCancelApproval = () => {
    setIsApprovalConfirmOpen(false);
    setApprovingReport(null);
  };

  const handleViewRejectionDetails = (report: AccomplishmentReport) => {
    setSelectedRejectedReport(report);
    setRejectionNotes(report.notes || '');
    setIsRejectionModalOpen(true);
  };

  const handleResubmitReport = async (report: AccomplishmentReport) => {
    try {
      setUpdatingStatus(report.id);
      setIsResubmitting(true);
      
      // Reset status to pending for resubmission
      await updateStatus(report.id, 'pending', 'Resubmitted by user');
      await refetch();
      
      // Dispatch event to refresh projects dashboard
      window.dispatchEvent(new CustomEvent('projectReportResubmitted'));
      
      setIsRejectionModalOpen(false);
      setSelectedRejectedReport(null);
    } catch (error) {
      console.error('Resubmit failed:', error);
      alert(`Resubmit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingStatus(null);
      setIsResubmitting(false);
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

  // Show loading state while initial data is being fetched
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-glass-subtle rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-arsd-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-glass-primary text-arsd-red">Accomplishment Reports</h2>
            <p className="text-glass-secondary">View and manage all uploaded accomplishment reports</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <UniversalLoading
            type="report"
            message="Loading Reports"
            subtitle="Fetching accomplishment reports from database..."
            size="lg"
            showProgress={false}
          />
        </div>
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
        {/* Loading Overlay for Operations */}
        {(isApproving || isRejecting || isResubmitting) && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md mx-4">
              <UniversalLoading
                type={isApproving ? "report" : isRejecting ? "general" : "report"}
                message={
                  isApproving ? "Approving Report" : 
                  isRejecting ? "Rejecting Report" : 
                  "Resubmitting Report"
                }
                subtitle={
                  isApproving ? "Processing report approval and parsing data..." : 
                  isRejecting ? "Updating report status..." : 
                  "Resetting report to pending status..."
                }
                size="md"
                showProgress={false}
              />
            </div>
          </div>
        )}

        {/* Accomplishment Report Parser
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
        <div className="flex items-center gap-3">
          <Badge variant="glass" className="text-sm bg-arsd-red/20 text-arsd-red border-arsd-red/30">
            {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
          </Badge>
          {totalPages > 1 && (
            <Badge variant="glass" className="text-sm bg-blue-500/20 text-blue-700 border-blue-300/30">
              Page {currentPage} of {totalPages}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Force refresh of reports list
              refetch();
            }}
            className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <GlassCard variant="elevated">
        <GlassCardHeader className="bg-gradient-to-r from-arsd-red/5 to-red-500/5 border-b border-arsd-red/10 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-arsd-red/20 rounded-md flex items-center justify-center">
              <Filter className="h-3 w-3 text-arsd-red" />
            </div>
            <GlassCardTitle className="text-base text-arsd-red">Filters</GlassCardTitle>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-glass-primary">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-arsd-red/60" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="glass-input pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-glass-primary">Status</label>
              <Select onValueChange={handleStatusFilter}>
                <SelectTrigger className="glass-input h-8 text-sm">
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
              <label className="text-xs font-medium text-glass-primary">Week Ending</label>
              <Input
                type="date"
                value={filters.week_ending_date || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  week_ending_date: e.target.value || undefined
                }))}
                className="glass-input h-8 text-sm"
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
                  {paginatedReports.map((report, index) => (
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
                          {report.status === 'rejected' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRejectionDetails(report)}
                              className="glass-button bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-700 border-red-300/50 hover:from-red-500/30 hover:to-rose-500/30"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <div className="text-sm text-glass-secondary font-medium">
                          {formatDate(report.upload_date)}
                        </div>
                      </TableCell>
                      <TableCell className="glass-table-cell">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="glass-button bg-gradient-to-r from-arsd-red/20 to-red-500/20 text-arsd-red border-arsd-red/30 hover:from-arsd-red/30 hover:to-red-500/30 flex items-center gap-1"
                            >
                              Actions
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[12rem]">
                            <DropdownMenuItem onClick={() => handleDownload(report)} disabled={isDownloading} className="flex items-center gap-2">
                              {isDownloading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-arsd-red" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              <span>Download</span>
                            </DropdownMenuItem>
                            {report.status === 'rejected' && (
                              <DropdownMenuItem onClick={() => handleViewRejectionDetails(report)} className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>View rejection details</span>
                              </DropdownMenuItem>
                            )}
                            {canUpdateStatus(report) && report.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleApproveClick(report)}
                                  disabled={updatingStatus === report.id || statusLoading || isApproving}
                                  className="flex items-center gap-2 text-green-700"
                                >
                                  {updatingStatus === report.id || isApproving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  <span>{isApproving ? 'Approving...' : 'Approve'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRejectingReport(report);
                                    setRejectNotes('');
                                    setIsRejectConfirmOpen(true);
                                  }}
                                  disabled={updatingStatus === report.id || statusLoading || isRejecting}
                                  className="flex items-center gap-2 text-red-700"
                                >
                                  {updatingStatus === report.id || isRejecting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4" />
                                  )}
                                  <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <GlassCard variant="elevated">
          <GlassCardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-glass-secondary text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className={`w-8 h-8 p-0 ${
                          currentPage === pageNumber
                            ? 'bg-arsd-red text-white hover:bg-arsd-red/90'
                            : 'glass-button'
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Rejection Details Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent className="glass-elevated max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-arsd-red flex items-center gap-2 text-xl">
              <XCircle className="h-5 w-5" />
              Report Rejection Details
            </DialogTitle>
            <DialogDescription className="text-glass-secondary">
              Review the rejection reason and take appropriate action.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRejectedReport && (
            <div className="space-y-6 py-4">
              {/* Report Info */}
              <div className="bg-red-50/50 border border-red-200/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Rejected Report</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Project:</span> {selectedRejectedReport.project_name}</div>
                  <div><span className="font-medium">File:</span> {selectedRejectedReport.file_name}</div>
                  <div><span className="font-medium">Week Ending:</span> {formatDate(selectedRejectedReport.week_ending_date)}</div>
                  <div><span className="font-medium">Uploaded:</span> {formatDate(selectedRejectedReport.upload_date)}</div>
                </div>
              </div>

              {/* Rejection Notes */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-glass-primary">Rejection Reason</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[100px]">
                  {selectedRejectedReport.notes ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRejectedReport.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No specific reason provided for rejection.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">What would you like to do?</p>
                  <ul className="text-xs space-y-1">
                    <li>• Review the rejection reason above</li>
                    <li>• Fix any issues in your report</li>
                    <li>• Resubmit the corrected report</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectionModalOpen(false)}
                    className="glass-button bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-glass-primary border-gray-400/50 hover:from-gray-500/30 hover:to-gray-600/30"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleResubmitReport(selectedRejectedReport)}
                    disabled={updatingStatus === selectedRejectedReport.id || isResubmitting}
                    className="glass-button bg-gradient-to-r from-arsd-red/100 to-red-500/100 text-white border-arsd-red/50 hover:from-arsd-red/80 hover:to-red-500/80"
                  >
                    {updatingStatus === selectedRejectedReport.id || isResubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Resubmitting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resubmit Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
        <DialogContent className="glass-elevated max-w-md">
          <DialogHeader>
            <DialogTitle className="text-arsd-red flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5" />
              Reject Report
            </DialogTitle>
            <DialogDescription className="text-glass-secondary">
              Please provide a brief reason. This will be visible to the uploader.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-glass-primary">Reason for rejection</label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Wrong week ending, missing section, incorrect totals..."
              className="min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsRejectConfirmOpen(false)}
              className="glass-button"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!rejectingReport) return;
                await handleStatusUpdate(rejectingReport.id, 'rejected', rejectNotes.trim());
                setIsRejectConfirmOpen(false);
                setRejectNotes('');
                setRejectingReport(null);
              }}
              disabled={!!updatingStatus || statusLoading || isRejecting}
              className="glass-button bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-700 border-red-300/50 hover:from-red-500/30 hover:to-rose-500/30"
            >
              {updatingStatus || isRejecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Modal */}
      <Dialog open={isApprovalConfirmOpen} onOpenChange={setIsApprovalConfirmOpen}>
        <DialogContent className="glass-elevated max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-700 flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5" />
              Confirm Approval
            </DialogTitle>
            <DialogDescription className="text-glass-secondary">
              Before approving this report, please ensure you have reviewed all data thoroughly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isApproving ? (
              <div className="flex items-center justify-center py-8">
                <UniversalLoading
                  type="report"
                  message="Approving Report..."
                  subtitle="Please wait while we process your approval"
                  size="md"
                  showProgress={false}
                />
              </div>
            ) : (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Make sure to check all the data and refresh the data before approving the accomplishment report.
                  </AlertDescription>
                </Alert>
                
                {approvingReport && (
                  <div className="bg-green-50/50 border border-green-200/50 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900">Report to approve:</p>
                    <p className="text-sm text-green-700">{approvingReport.project_name}</p>
                    <p className="text-xs text-green-600">{approvingReport.file_name}</p>
                    <p className="text-xs text-green-600">Week ending: {formatDate(approvingReport.week_ending_date)}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelApproval}
              disabled={isApproving}
              className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApproval}
              disabled={isApproving}
              className="bg-arsd-red hover:bg-arsd-red/80 text-white disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}