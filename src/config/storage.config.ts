/**
 * Storage configuration for file operations
 * Centralized configuration for easy maintenance and updates
 */
export const STORAGE_CONFIG = {
  // Supabase Storage Configuration
  SUPABASE: {
    BASE_URL: 'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public',
    BUCKET_NAME: 'accomplishment-reports',
    SUBFOLDER: 'accomplishment-reports',
  },
  
  // File Upload Configuration
  UPLOAD: {
    MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB in bytes
    ALLOWED_EXTENSIONS: ['.csv', '.xlsx', '.xls'],
    ALLOWED_MIME_TYPES: [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
  },
  
  // File Naming Patterns
  NAMING: {
    PATTERN: '{projectId}-{timestamp}-{originalFileName}',
    TIMESTAMP_FORMAT: 'YYYY-MM-DDTHH-mm-ss-SSSZ',
  }
} as const;

export type StorageConfig = typeof STORAGE_CONFIG;
