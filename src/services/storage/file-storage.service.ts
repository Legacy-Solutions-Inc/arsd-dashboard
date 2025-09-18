import { createClient } from '@/lib/supabase';
import { STORAGE_CONFIG } from '@/config/storage.config';

export interface FileDownloadResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export interface FileSearchResult {
  success: boolean;
  files?: any[];
  error?: string;
}

export class FileStorageService {
  private supabase = createClient();
  private readonly config = STORAGE_CONFIG.SUPABASE;

  /**
   * Downloads a file using the stored file_url
   */
  async downloadByUrl(fileUrl: string, fileName: string): Promise<FileDownloadResult> {
    try {
      if (!fileUrl || !fileUrl.includes('supabase')) {
        return {
          success: false,
          error: 'Invalid file URL'
        };
      }

      const response = await fetch(fileUrl);
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        };
      }

      const blob = await response.blob();
      return {
        success: true,
        blob
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Searches for files in storage by project ID
   */
  async searchFilesByProjectId(projectId: string): Promise<FileSearchResult> {
    try {
      const { data: files, error } = await this.supabase.storage
        .from(this.config.BUCKET_NAME)
        .list(this.config.SUBFOLDER, {
          search: projectId
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        files: files || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Downloads a file by constructing the URL using the correct pattern
   */
  async downloadByPattern(projectId: string, originalFileName: string): Promise<FileDownloadResult> {
    try {
      // Search for files with the project ID pattern
      const searchResult = await this.searchFilesByProjectId(projectId);
      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error
        };
      }

      // Find the file that matches our report
      const matchingFile = searchResult.files?.find(file => 
        file.name.includes(projectId) && 
        file.name.includes(originalFileName.split('.')[0])
      );

      if (!matchingFile) {
        return {
          success: false,
          error: 'File not found in storage'
        };
      }

      // Construct the full URL using the correct pattern
      const fullUrl = `${this.config.BASE_URL}/${this.config.BUCKET_NAME}/${this.config.SUBFOLDER}/${matchingFile.name}`;
      
      // Download using the constructed URL
      const response = await fetch(fullUrl);
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        };
      }

      const blob = await response.blob();
      return {
        success: true,
        blob
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Triggers a file download in the browser
   */
  triggerDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Main download method that tries multiple approaches
   */
  async downloadFile(projectId: string, originalFileName: string, fileUrl?: string): Promise<boolean> {
    try {
      // Method 1: Try using the stored file_url first
      if (fileUrl) {
        const urlResult = await this.downloadByUrl(fileUrl, originalFileName);
        if (urlResult.success && urlResult.blob) {
          this.triggerDownload(urlResult.blob, originalFileName);
          return true;
        }
      }

      // Method 2: Fallback to pattern-based download
      const patternResult = await this.downloadByPattern(projectId, originalFileName);
      if (patternResult.success && patternResult.blob) {
        this.triggerDownload(patternResult.blob, originalFileName);
        return true;
      }

      // If both methods fail, throw an error
      throw new Error(patternResult.error || 'Download failed');
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
}
