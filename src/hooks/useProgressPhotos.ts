import { useState, useEffect, useCallback } from 'react';
import { ProgressPhotosService } from '@/services/progress-photos/progress-photos.service';
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

  const service = new ProgressPhotosService();

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAllProgressPhotos(filters);
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
