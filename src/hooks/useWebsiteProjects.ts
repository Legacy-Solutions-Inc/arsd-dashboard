"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { WebsiteProjectsService } from "@/services/website-projects";
import { useOptimisticUpdates } from "./useOptimisticUpdates";
import { useLoadingStates } from "./useLoadingStates";
import type {
  WebsiteProject,
  ProjectListFilters,
  CreateWebsiteProjectData,
  UpdateWebsiteProjectData,
} from "@/types/website-projects";

interface UseWebsiteProjectsState {
  projects: WebsiteProject[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseWebsiteProjectsReturn {
  // State
  projects: WebsiteProject[];
  total: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: (filters: ProjectListFilters) => Promise<void>;
  createProject: (data: CreateWebsiteProjectData) => Promise<void>;
  updateProject: (id: string, data: UpdateWebsiteProjectData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getSignedUrl: (filePath: string) => Promise<string | null>;
  getPublicUrl: (filePath: string) => Promise<string | null>;
  deletePhoto: (photoId: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
  
  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUploading: boolean;
}

export function useWebsiteProjects(): UseWebsiteProjectsReturn {
  const [{ projects, total, loading, error }, setState] = useState<UseWebsiteProjectsState>({
    projects: [],
    total: 0,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const currentFiltersRef = useRef<ProjectListFilters | null>(null);

  const { setLoading, isLoading, clearLoading } = useLoadingStates();
  const {
    addOptimisticUpdate,
    removeOptimisticUpdate,
    applyOptimisticUpdates,
    hasOptimisticUpdates,
  } = useOptimisticUpdates();

  const setSafeState = useCallback((updater: (prev: UseWebsiteProjectsState) => UseWebsiteProjectsState) => {
    if (!isMountedRef.current) return;
    setState(updater);
  }, []);

  const handleError = useCallback((err: any, operation: string) => {
    console.error(`WebsiteProjects ${operation} error:`, err);
    setSafeState((prev) => ({
      ...prev,
      loading: false,
      error: err.message ?? `Failed to ${operation}`,
    }));
  }, [setSafeState]);

  const fetchProjects = useCallback(async (filters: ProjectListFilters): Promise<void> => {
    setSafeState((prev) => ({ ...prev, loading: true, error: null }));
    currentFiltersRef.current = filters;

    try {
      console.log('Fetching projects with filters:', filters);
      const result = await WebsiteProjectsService.fetchProjects(filters);
      console.log('Fetched projects:', result.projects.length, 'total:', result.total);
      setSafeState((prev) => ({
        ...prev,
        projects: result.projects,
        total: result.total,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      handleError(err, "fetch projects");
    }
  }, [setSafeState, handleError]);

  const createProject = useCallback(async (data: CreateWebsiteProjectData): Promise<void> => {
    setLoading('create', true);
    setSafeState((prev) => ({ ...prev, error: null }));

    // Create optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticProject: WebsiteProject = {
      id: tempId,
      name: data.name,
      location: data.location,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      is_deleted: false,
      created_by: null,
      updated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      photos: [],
    };

    const updateId = addOptimisticUpdate('create', optimisticProject);

    try {
      const projectId = await WebsiteProjectsService.createProject(data);
      
      // Remove optimistic update and refresh
      removeOptimisticUpdate(updateId);
      if (currentFiltersRef.current) {
        await fetchProjects(currentFiltersRef.current);
      }
    } catch (err: any) {
      removeOptimisticUpdate(updateId);
      handleError(err, "create project");
      throw err;
    } finally {
      setLoading('create', false);
    }
  }, [setLoading, setSafeState, addOptimisticUpdate, removeOptimisticUpdate, fetchProjects, handleError]);

  const updateProject = useCallback(async (id: string, data: UpdateWebsiteProjectData): Promise<void> => {
    setLoading('update', true);
    setSafeState((prev) => ({ ...prev, error: null }));

    // Find original project for rollback
    const originalProject = projects.find(p => p.id === id);
    if (!originalProject) {
      setLoading('update', false);
      throw new Error('Project not found');
    }

    // Create optimistic update
    const optimisticProject = { ...originalProject, ...data };
    const updateId = addOptimisticUpdate('update', optimisticProject, originalProject);

    try {
      await WebsiteProjectsService.updateProject(id, data);
      
      // Remove optimistic update and refresh
      removeOptimisticUpdate(updateId);
      if (currentFiltersRef.current) {
        await fetchProjects(currentFiltersRef.current);
      }
    } catch (err: any) {
      removeOptimisticUpdate(updateId);
      handleError(err, "update project");
      throw err;
    } finally {
      setLoading('update', false);
    }
  }, [setLoading, setSafeState, projects, addOptimisticUpdate, removeOptimisticUpdate, fetchProjects, handleError]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    setLoading('delete', true);
    setSafeState((prev) => ({ ...prev, error: null }));

    // Find original project for rollback
    const originalProject = projects.find(p => p.id === id);
    if (!originalProject) {
      setLoading('delete', false);
      throw new Error('Project not found');
    }

    console.log('Deleting project:', { id, name: originalProject.name });

    // Create optimistic update
    const updateId = addOptimisticUpdate('delete', originalProject, originalProject);

    try {
      await WebsiteProjectsService.deleteProject(id);
      console.log('Project deleted successfully from database');
      
      // Remove optimistic update and refresh
      removeOptimisticUpdate(updateId);
      if (currentFiltersRef.current) {
        console.log('Refreshing projects list...');
        await fetchProjects(currentFiltersRef.current);
        console.log('Projects list refreshed');
      }
    } catch (err: any) {
      console.error('Error deleting project:', err);
      removeOptimisticUpdate(updateId);
      handleError(err, "delete project");
      throw err;
    } finally {
      setLoading('delete', false);
    }
  }, [setLoading, setSafeState, projects, addOptimisticUpdate, removeOptimisticUpdate, fetchProjects, handleError]);

  const getSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    setLoading('upload', true);
    try {
      return await WebsiteProjectsService.getSignedUrl(filePath);
    } catch (err: any) {
      console.error("Failed to get signed URL:", err);
      return null;
    } finally {
      setLoading('upload', false);
    }
  }, [setLoading]);

  const getPublicUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      // For existing photos, we can use public URLs instead of signed URLs
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-projects/${filePath}`;
      return publicUrl;
    } catch (err: any) {
      console.error("Failed to get public URL:", err);
      return null;
    }
  }, []);

  const deletePhoto = useCallback(async (photoId: string): Promise<void> => {
    try {
      console.log('Hook: Deleting photo with ID:', photoId);
      await WebsiteProjectsService.deletePhoto(photoId);
      console.log('Hook: Photo deleted successfully');
      
      // Refresh the projects list to reflect the changes
      if (currentFiltersRef.current) {
        console.log('Hook: Refreshing projects list after photo deletion...');
        await fetchProjects(currentFiltersRef.current);
        console.log('Hook: Projects list refreshed');
      }
    } catch (err: any) {
      console.error('Hook: Error deleting photo:', err);
      handleError(err, "delete photo");
      throw err;
    }
  }, [fetchProjects, handleError]);

  const clearError = useCallback(() => {
    setSafeState((prev) => ({ ...prev, error: null }));
  }, [setSafeState]);

  const refresh = useCallback(async (): Promise<void> => {
    if (currentFiltersRef.current) {
      await fetchProjects(currentFiltersRef.current);
    }
  }, [fetchProjects]);

  // Apply optimistic updates to projects
  const projectsWithOptimisticUpdates = useMemo(() => {
    if (!hasOptimisticUpdates) return projects;
    return applyOptimisticUpdates(projects);
  }, [projects, hasOptimisticUpdates, applyOptimisticUpdates]);

  // Cleanup
  useMemo(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // State
    projects: projectsWithOptimisticUpdates,
    total,
    loading,
    error,
    
    // Actions
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getSignedUrl,
    getPublicUrl,
    deletePhoto,
    
    // Utilities
    clearError,
    refresh,
    
    // Loading states
    isCreating: isLoading('create'),
    isUpdating: isLoading('update'),
    isDeleting: isLoading('delete'),
    isUploading: isLoading('upload'),
  } as const;
}