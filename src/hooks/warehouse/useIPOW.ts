"use client";

import { useState, useEffect } from 'react';
import { IPOWItem } from '@/types/warehouse';

export function useIPOW(projectId: string) {
  const [items, setItems] = useState<IPOWItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!projectId) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/warehouse/ipow?projectId=${encodeURIComponent(projectId)}`);
        if (!res.ok) throw new Error('Failed to fetch IPOW items');
        const data = await res.json();
        if (mounted) {
          setItems(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [projectId]);

  return { ipowItems: items, loading, error };
}
