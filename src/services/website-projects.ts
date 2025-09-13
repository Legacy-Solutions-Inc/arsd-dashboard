// Centralized data service for website projects (client-side only)
import { createClient } from "@/utils/auth";
import type {
  WebsiteProject,
  WebsiteProjectPhoto,
  ProjectListFilters,
  CreateWebsiteProjectData,
  UpdateWebsiteProjectData,
} from "@/types/website-projects";

export class WebsiteProjectsService {
  // Client-side operations
  static async fetchProjects(filters: ProjectListFilters) {
    const supabase = createClient();
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
      query = query.or(
        `name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      projects: (data || []) as WebsiteProject[],
      total: count ?? 0,
    };
  }

  static async createProject(payload: CreateWebsiteProjectData) {
    const supabase = createClient();
    const { data: insertData, error: insertError } = await supabase
      .from("website_projects")
      .insert({ name: payload.name, location: payload.location })
      .select("id")
      .single();
    
    if (insertError) throw insertError;

    const projectId = insertData!.id as string;

    if (payload.photos && payload.photos.length > 0) {
      await this.uploadPhotos(projectId, payload.photos);
    }

    return projectId;
  }

  static async updateProject(projectId: string, payload: UpdateWebsiteProjectData) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("website_projects")
      .update({ name: payload.name, location: payload.location })
      .eq("id", projectId);
    
    if (updateError) throw updateError;

    if (payload.photos && payload.photos.length > 0) {
      await this.uploadPhotos(projectId, payload.photos);
    }

    if (payload.existing_photos) {
      for (const photo of payload.existing_photos) {
        await supabase
          .from("website_project_photos")
          .update({ order_index: photo.order_index })
          .eq("id", photo.id);
      }
    }
  }

  static async deleteProject(projectId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("website_projects")
      .update({ is_deleted: true })
      .eq("id", projectId);
    
    if (error) throw error;
  }

  static async getSignedUrl(filePath: string): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("website-projects")
      .createSignedUrl(filePath, 60 * 60);
    
    if (error) return null;
    return data.signedUrl ?? null;
  }

  private static async uploadPhotos(projectId: string, files: File[]) {
    const supabase = createClient();
    
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const path = `${projectId}/${Date.now()}-${index}.${file.name.split(".").pop()}`;

      const { error: uploadError } = await supabase.storage
        .from("website-projects")
        .upload(path, file, { upsert: false });
      
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
  }

}
