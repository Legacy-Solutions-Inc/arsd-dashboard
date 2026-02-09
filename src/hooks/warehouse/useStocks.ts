"use client";

import { useState, useEffect } from 'react';
import { StockItem } from '@/types/warehouse';

export function useStocks(projectId: string) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStocks() {
      if (!projectId) {
        setStockItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/warehouse/stocks/${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch stock items');
        
        const data = await response.json();
        if (mounted) {
          setStockItems(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStocks();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  return { stockItems, loading, error };
}
