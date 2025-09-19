import { useState, useEffect, useCallback } from 'react';
import { AccomplishmentReportsService } from '@/services/accomplishment-reports/accomplishment-reports.service';
import type { 
  AccomplishmentReport, 
  AccomplishmentReportFilters,
  WeeklyUploadStatus 
} from '@/types/accomplishment-reports';

export function useAccomplishmentReports(filters?: AccomplishmentReportFilters) {
  const [reports, setReports] = useState<AccomplishmentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = new AccomplishmentReportsService();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAssignedProjectReports(filters);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const refetch = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch
  };
}

export function useAllAccomplishmentReports(filters?: AccomplishmentReportFilters) {
  const [reports, setReports] = useState<AccomplishmentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = new AccomplishmentReportsService();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAllReports(filters);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const refetch = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch
  };
}

export function useWeeklyUploadStatus() {
  const [status, setStatus] = useState<WeeklyUploadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = new AccomplishmentReportsService();

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getWeeklyUploadStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weekly status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const refetch = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch
  };
}

export function useUpdateReportStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new AccomplishmentReportsService();

  const updateStatus = useCallback(async (
    reportId: string, 
    status: 'pending' | 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await service.updateReportStatus(reportId, status, notes);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update report status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateStatus,
    loading,
    error
  };
}