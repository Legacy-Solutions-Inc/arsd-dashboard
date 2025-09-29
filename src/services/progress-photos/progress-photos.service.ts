import { createClient } from '@/lib/supabase';
import { BaseService } from '@/services/base-service';
import type { 
  ProgressPhoto, 
  CreateProgressPhotoData, 
  ProgressPhotoFilters,
  WeeklyProgressPhotos 
} from '@/types/progress-photos';

export class ProgressPhotosService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get progress photos for assigned projects (PM view)
   * @param filters - Optional filters for querying photos
   * @returns Array of progress photos with project and uploader details
   */
  async getAssignedProjectPhotos(filters?: ProgressPhotoFilters): Promise<ProgressPhoto[]> {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('progress_photos')
        .select(`
          *,
          project:projects!inner(
            id,
            project_id,
            project_name,
            client,
            location,
            status,
            project_manager_id
          )
        `)
        .order('week_ending_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters?.week_ending_date) {
        query = query.eq('week_ending_date', filters.week_ending_date);
      }
      if (filters?.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all progress photos (Superadmin/HR/PI view)
   * @param filters - Optional filters for querying photos
   * @returns Array of progress photos with full details
   */
  async getAllProgressPhotos(filters?: ProgressPhotoFilters): Promise<ProgressPhoto[]> {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('progress_photos_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters?.week_ending_date) {
        query = query.eq('week_ending_date', filters.week_ending_date);
      }
      if (filters?.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get weekly progress photos grouped by project
   * @param weekEndingDate - The week ending date to filter by
   * @returns Array of weekly progress photos grouped by project
   */
  async getWeeklyProgressPhotos(weekEndingDate?: string): Promise<WeeklyProgressPhotos[]> {
    try {
      const supabase = createClient();
      
      // Get current week ending date if not provided
      const currentWeekEnding = weekEndingDate || this.getWeekEndingDate();
      
      // Get photos for the specified week
      const { data: photos, error } = await supabase
        .from('progress_photos_with_details')
        .select('*')
        .eq('week_ending_date', currentWeekEnding)
        .order('project_name', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group photos by project
      const groupedPhotos = photos.reduce((acc, photo) => {
        const projectId = photo.project_id;
        if (!acc[projectId]) {
          acc[projectId] = {
            project_id: projectId,
            project_name: photo.project_name || 'Unknown Project',
            week_ending_date: currentWeekEnding,
            photos: [],
            total_photos: 0
          };
        }
        acc[projectId].photos.push(photo);
        acc[projectId].total_photos++;
        return acc;
      }, {} as Record<string, WeeklyProgressPhotos>);

      return Object.values(groupedPhotos);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload progress photos
   * @param photosData - Array of photo data to upload
   * @returns Array of created progress photos
   */
  async uploadProgressPhotos(photosData: CreateProgressPhotoData[]): Promise<ProgressPhoto[]> {
    try {
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Add uploaded_by to each photo data
      const photosWithUploader = photosData.map(photo => ({
        ...photo,
        uploaded_by: user.id
      }));

      const { data, error } = await supabase
        .from('progress_photos')
        .insert(photosWithUploader)
        .select(`
          *,
          project:projects(
            id,
            project_id,
            project_name,
            client,
            location,
            status
          )
        `);

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a progress photo
   * @param photoId - The ID of the photo to delete
   */
  async deleteProgressPhoto(photoId: string): Promise<void> {
    try {
      const supabase = createClient();
      
      // First get the photo to access the file path
      const { data: photo, error: fetchError } = await supabase
        .from('progress_photos')
        .select('file_url')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const url = new URL(photo.file_url);
      const filePath = url.pathname.split('/storage/v1/object/public/progress-photos/')[1];

      // Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('progress-photos')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload file to Supabase Storage
   * @param file - The file to upload
   * @param projectId - The project ID for filename generation
   * @returns Object containing the public URL and file path
   */
  async uploadFile(file: File, projectId: string): Promise<{ url: string; path: string }> {
    try {
      const supabase = createClient();
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${projectId}-${timestamp}-${file.name}`;
      const filePath = `progress-photos/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  /**
   * Helper function to get week ending date (Saturday)
   * @param date - The date to calculate week ending for (defaults to current date)
   * @returns The week ending date in YYYY-MM-DD format
   */
  private getWeekEndingDate(date: Date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    return saturday.toISOString().split('T')[0];
  }
}
