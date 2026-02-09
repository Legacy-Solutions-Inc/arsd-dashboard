"use client";

import { useState, useEffect, useCallback } from 'react';
import { ReleaseForm, ReleaseFormFilters } from '@/types/warehouse';

export function useReleases(filters?: ReleaseFormFilters) {
  const [releases, setReleases] = useState<ReleaseForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReleases = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.project_id) params.set('projectId', filters.project_id);
      if (filters?.date_from) params.set('dateFrom', filters.date_from);
      if (filters?.date_to) params.set('dateTo', filters.date_to);

      const response = await fetch(`/api/warehouse/releases?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch releases');
      
      const data = await response.json();
      setReleases(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters?.search, filters?.project_id, filters?.date_from, filters?.date_to]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const updateLock = useCallback(async (id: string, locked: boolean) => {
    try {
      const response = await fetch(`/api/warehouse/releases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked }),
      });

      if (!response.ok) throw new Error('Failed to update lock status');
      
      // Refresh list
      await fetchReleases();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update lock status');
    }
  }, [fetchReleases]);

  return {
    releases,
    loading,
    error,
    refresh: fetchReleases,
    updateLock,
  };
}
