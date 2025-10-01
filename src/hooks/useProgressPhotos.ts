import { useState, useEffect, useCallback } from 'react';
import { ProgressPhotosService } from '@/services/progress-photos/progress-photos.service';
import { useRBAC } from './useRBAC';
import type { 
  ProgressPhoto, 
  ProgressPhotoFilters,
  WeeklyProgressPhotos,
  CreateProgressPhotoData
} from '@/types/progress-photos';

export function useProgressPhotos(filters?: ProgressPhotoFilters) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = new ProgressPhotosService();

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAssignedProjectPhotos(filters);
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress photos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const refetch = useCallback(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    error,
    refetch
  };
}

export function useAllProgressPhotos(filters?: ProgressPhotoFilters) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useRBAC();

  const service = new ProgressPhotosService();

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all photos from database
      const data = await service.getAllProgressPhotos(filters);
      
      // ROLE-BASED FILTERING:
      // - Superadmins: See ALL photos (no filtering applied)
      // - HR: See ALL photos (no filtering applied)
      // - Project Inspectors: See ONLY photos for their assigned projects
      // - Project Managers: See ONLY photos for their assigned projects
      let filteredData = data;
      
      if (user?.role === 'project_inspector' && user?.user_id) {
        // Filter to only show photos where this inspector is assigned to the project
        filteredData = data.filter(photo => 
          photo.project_inspector_id === user.user_id
        );
      } else if (user?.role === 'project_manager' && user?.user_id) {
        // Filter to only show photos where this manager is assigned to the project
        filteredData = data.filter(photo => 
          photo.project_manager_id === user.user_id
        );
      }
      // Note: Superadmins and HR bypass this filter and see all photos
      
      setPhotos(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress photos');
    } finally {
      setLoading(false);
    }
  }, [filters, user?.role, user?.user_id]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const refetch = useCallback(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    error,
    refetch
  };
}

export function useWeeklyProgressPhotos(weekEndingDate?: string) {
  const [weeklyPhotos, setWeeklyPhotos] = useState<WeeklyProgressPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = new ProgressPhotosService();

  const fetchWeeklyPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getWeeklyProgressPhotos(weekEndingDate);
      setWeeklyPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weekly progress photos');
    } finally {
      setLoading(false);
    }
  }, [weekEndingDate]);

  useEffect(() => {
    fetchWeeklyPhotos();
  }, [fetchWeeklyPhotos]);

  const refetch = useCallback(() => {
    fetchWeeklyPhotos();
  }, [fetchWeeklyPhotos]);

  return {
    weeklyPhotos,
    loading,
    error,
    refetch
  };
}

export function useUploadProgressPhotos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new ProgressPhotosService();

  const uploadPhotos = useCallback(async (photosData: CreateProgressPhotoData[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await service.uploadProgressPhotos(photosData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload progress photos';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (files: File[], projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Upload files to storage first
      const uploadPromises = files.map(file => service.uploadFile(file, projectId));
      const uploadResults = await Promise.all(uploadPromises);
      
      return uploadResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload files';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadPhotos,
    uploadFiles,
    loading,
    error
  };
}

export function useDeleteProgressPhoto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new ProgressPhotosService();

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      setLoading(true);
      setError(null);
      await service.deleteProgressPhoto(photoId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete progress photo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deletePhoto,
    loading,
    error
  };
}
