"use client";

import { useState, useEffect } from 'react';
import { getAccessibleWarehouseProjects, WarehouseUser } from '@/lib/warehouse/rbac';
import { Project } from '@/types/projects';

export function useWarehouseProjects(user: WarehouseUser | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      if (!user) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        const accessibleProjects = await getAccessibleWarehouseProjects(user);
        if (mounted) {
          setProjects(accessibleProjects);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load projects'));
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { projects, loading, error };
}
