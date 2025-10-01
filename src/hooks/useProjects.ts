'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectFilters } from '@/types/projects';
import { ProjectService } from '@/services/projects/project.service';
import { useRBAC } from './useRBAC';

export function useProjects(filters?: ProjectFilters) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useRBAC();

  const projectService = new ProjectService();

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Automatically filter projects for project inspectors to show only assigned projects
      const appliedFilters = { ...filters };
      if (user?.role === 'project_inspector' && user?.user_id) {
        appliedFilters.project_inspector_id = user.user_id;
      }
      
      const data = await projectService.getProjects(appliedFilters);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [filters, user?.role, user?.user_id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const refetch = useCallback(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    refetch
  };
}
