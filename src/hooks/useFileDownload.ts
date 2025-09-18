import { useState } from 'react';
import { FileStorageService } from '@/services/storage/file-storage.service';

export interface UseFileDownloadReturn {
  downloadFile: (projectId: string, fileName: string, fileUrl?: string) => Promise<void>;
  isDownloading: boolean;
  error: string | null;
}

export function useFileDownload(): UseFileDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileStorageService = new FileStorageService();

  const downloadFile = async (projectId: string, fileName: string, fileUrl?: string) => {
    try {
      setIsDownloading(true);
      setError(null);
      
      await fileStorageService.downloadFile(projectId, fileName, fileUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      throw err; // Re-throw to allow component to handle it
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadFile,
    isDownloading,
    error
  };
}
