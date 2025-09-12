"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/auth";
import type {
  WebsiteProject,
  WebsiteProjectPhoto,
  ProjectListFilters,
  ProjectListResponse,
  CreateWebsiteProjectData,
  UpdateWebsiteProjectData,
} from "@/types/website-projects";

interface UseWebsiteProjectsState {
  projects: WebsiteProject[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useWebsiteProjects() {
  const [{ projects, total, loading, error }, setState] = useState<UseWebsiteProjectsState>({
    projects: [],
    total: 0,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);

  const supabase = useMemo(() => createClient(), []);

  const setSafeState = useCallback((updater: (prev: UseWebsiteProjectsState) => UseWebsiteProjectsState) => {
    if (!isMountedRef.current) return;
    setState(updater);
  }, []);

  // Fetch list of projects with basic filtering/pagination
  const fetchProjects = useCallback(async (filters: ProjectListFilters): Promise<void> => {
    setSafeState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;

      let query = supabase
        .from("website_projects")
        .select(
          `id, name, location, slug, is_deleted, created_by, updated_by, created_at, updated_at,
           photos:website_project_photos(id, project_id, file_path, order_index, alt_text, created_at)`,
          { count: "exact" }
        )
        .eq("is_deleted", false)
        .order(filters.sort_by, { ascending: filters.sort_order === "asc" })
        .range(from, to);

      if (filters.search) {
        // Simple ilike search on name/location
        query = query.or(
          `name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const projects = (data || []) as unknown as WebsiteProject[];
      setSafeState((prev) => ({
        ...prev,
        projects,
        total: count ?? projects.length,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      setSafeState((prev) => ({ ...prev, loading: false, error: err.message ?? "Failed to load projects" }));
    }
  }, [supabase, setSafeState]);

  // Create a project and upload photos
  const createProject = useCallback(async (payload: CreateWebsiteProjectData): Promise<void> => {
    setSafeState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data: insertData, error: insertError } = await supabase
        .from("website_projects")
        .insert({ name: payload.name, location: payload.location })
        .select("id")
        .single();
      if (insertError) throw insertError;

      const projectId = insertData!.id as string;

      if (payload.photos && payload.photos.length > 0) {
        await uploadPhotos(projectId, payload.photos);
      }

      setSafeState((prev) => ({ ...prev, loading: false }));
    } catch (err: any) {
      setSafeState((prev) => ({ ...prev, loading: false, error: err.message ?? "Failed to create project" }));
      throw err;
    }
  }, [supabase, setSafeState]);

  // Update a project and reconcile photos
  const updateProject = useCallback(async (projectId: string, payload: UpdateWebsiteProjectData): Promise<void> => {
    setSafeState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error: updateError } = await supabase
        .from("website_projects")
        .update({ name: payload.name, location: payload.location })
        .eq("id", projectId);
      if (updateError) throw updateError;

      if (payload.photos && payload.photos.length > 0) {
        await uploadPhotos(projectId, payload.photos);
      }

      if (payload.existing_photos) {
        // Update order for existing photos
        for (const photo of payload.existing_photos) {
          await supabase
            .from("website_project_photos")
            .update({ order_index: photo.order_index })
            .eq("id", photo.id);
        }
      }

      setSafeState((prev) => ({ ...prev, loading: false }));
    } catch (err: any) {
      setSafeState((prev) => ({ ...prev, loading: false, error: err.message ?? "Failed to update project" }));
      throw err;
    }
  }, [supabase, setSafeState]);

  // Soft delete project; cascade removes photos via FK
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    setSafeState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error: delError } = await supabase
        .from("website_projects")
        .update({ is_deleted: true })
        .eq("id", projectId);
      if (delError) throw delError;

      setSafeState((prev) => ({ ...prev, loading: false }));
    } catch (err: any) {
      setSafeState((prev) => ({ ...prev, loading: false, error: err.message ?? "Failed to delete project" }));
      throw err;
    }
  }, [supabase, setSafeState]);

  // Storage helpers
  const getSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("website-projects")
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    if (error) return null;
    return data.signedUrl ?? null;
  }, [supabase]);

  const uploadPhotos = useCallback(async (projectId: string, files: File[]): Promise<void> => {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const path = `${projectId}/${Date.now()}-${index}.${file.name.split(".").pop()}`;

      const { error: uploadError } = await supabase.storage
        .from("website-projects")
        .upload(path, file, {
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { error: insertPhotoError } = await supabase
        .from("website_project_photos")
        .insert({
          project_id: projectId,
          file_path: path,
          order_index: index,
        });
      if (insertPhotoError) throw insertPhotoError;
    }
  }, [supabase]);

  // Cleanup
  useMemo(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // state
    projects,
    total,
    loading,
    error,
    // operations
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getSignedUrl,
  } as const;
}


