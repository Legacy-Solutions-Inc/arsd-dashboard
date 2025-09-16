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
   
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to create projects');
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from("website_projects")
      .insert({ 
        name: payload.name, 
        location: payload.location,
        created_by: user.id,
        updated_by: user.id
      })
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
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to update projects');
    }
    
    const { error: updateError } = await supabase
      .from("website_projects")
      .update({ 
        name: payload.name, 
        location: payload.location,
        updated_by: user.id
      })
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
    console.log('Service: Deleting project with ID:', projectId);
    
    // First, let's check if the project exists and get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Service: Current user:', user?.id);
    
    if (!user) {
      throw new Error('User must be authenticated to delete projects');
    }
    
    // Check if project exists
    const { data: existingProject, error: fetchError } = await supabase
      .from("website_projects")
      .select("id, name, is_deleted, created_by, updated_by")
      .eq("id", projectId)
      .single();
    
    if (fetchError) {
      console.error('Service: Error fetching project:', fetchError);
      throw new Error(`Project not found: ${fetchError.message}`);
    }
    
    console.log('Service: Found project:', existingProject);
    console.log('Service: Project created_by:', existingProject.created_by);
    console.log('Service: Project updated_by:', existingProject.updated_by);
    
    // Check if user has permission to delete this project
    if (existingProject.created_by !== user.id && existingProject.updated_by !== user.id) {
      console.warn('Service: User does not have permission to delete this project');
      // For now, we'll still try to delete (the RLS policy will handle it)
    }
    
    // Try to update the project
    const { data, error } = await supabase
      .from("website_projects")
      .update({ 
        is_deleted: true,
        updated_by: user.id 
      })
      .eq("id", projectId)
      .select();
    
    if (error) {
      console.error('Service: Error deleting project:', error);
      console.error('Service: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('Service: Project deleted successfully:', data);
  }

  static async getSignedUrl(filePath: string): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("website-projects")
      .createSignedUrl(filePath, 60 * 60);
    
    if (error) return null;
    return data.signedUrl ?? null;
  }

  static async deletePhoto(photoId: string): Promise<void> {
    const supabase = createClient();
    console.log('Service: Deleting photo with ID:', photoId);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to delete photos');
    }

    // First, get the photo details to delete from storage
    const { data: photo, error: fetchError } = await supabase
      .from("website_project_photos")
      .select("file_path")
      .eq("id", photoId)
      .single();

    if (fetchError) {
      console.error('Service: Error fetching photo:', fetchError);
      throw new Error(`Photo not found: ${fetchError.message}`);
    }

    console.log('Service: Found photo to delete:', photo);

    // Delete from database
    const { error: deleteError } = await supabase
      .from("website_project_photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      console.error('Service: Error deleting photo from database:', deleteError);
      throw deleteError;
    }

    // Delete from storage
    if (photo.file_path) {
      const { error: storageError } = await supabase.storage
        .from("website-projects")
        .remove([photo.file_path]);

      if (storageError) {
        console.error('Service: Error deleting photo from storage:', storageError);
        // Don't throw here as the database deletion succeeded
      } else {
        console.log('Service: Photo deleted from storage successfully');
      }
    }

    console.log('Service: Photo deleted successfully');
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
