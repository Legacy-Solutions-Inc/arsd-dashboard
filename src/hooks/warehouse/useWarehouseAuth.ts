"use client";

import { useState, useEffect } from 'react';
import { getCurrentWarehouseUser, WarehouseUser, canCreateDRRelease, canUnlockDRRelease, canViewAllProjects } from '@/lib/warehouse/rbac';

export function useWarehouseAuth() {
  const [user, setUser] = useState<WarehouseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const warehouseUser = await getCurrentWarehouseUser();
        if (mounted) {
          setUser(warehouseUser);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load user'));
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    user,
    loading,
    error,
    canCreate: user ? canCreateDRRelease(user) : false,
    canUnlock: user ? canUnlockDRRelease(user) : false,
    canViewAll: user ? canViewAllProjects(user) : false,
  };
}
