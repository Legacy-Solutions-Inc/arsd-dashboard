import { useState, useCallback } from 'react';
import { StorageCleanupService, CleanupResult, CleanupOptions } from '@/services/storage/storage-cleanup.service';

export interface UseStorageCleanupReturn {
  cleanup: (options?: CleanupOptions) => Promise<CleanupResult>;
  getStats: (weeksToKeep?: number) => Promise<any>;
  loading: boolean;
  error: string | null;
  result: CleanupResult | null;
}

export function useStorageCleanup(): UseStorageCleanupReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CleanupResult | null>(null);

  const cleanup = useCallback(async (options: CleanupOptions = {}) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/storage/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cleanup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async (weeksToKeep: number = 2) => {
    setError(null);

    try {
      const response = await fetch(`/api/storage/cleanup?weeksToKeep=${weeksToKeep}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get stats';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    cleanup,
    getStats,
    loading,
    error,
    result
  };
}
