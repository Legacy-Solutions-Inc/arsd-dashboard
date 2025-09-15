// Website Projects Constants
export const PROJECT_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PHOTOS_PER_PROJECT: 30,
  VALID_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'] as const,
  
  // Storage
  STORAGE_BUCKET: 'website-projects',
  SIGNED_URL_EXPIRY: 60 * 60, // 1 hour
  
  // UI
  SKELETON_ITEMS: 5,
  PAGINATION_VISIBLE_PAGES: 5,
} as const;

export const PROJECT_MESSAGES = {
  SUCCESS: {
    CREATED: 'Project created successfully',
    UPDATED: 'Project updated successfully',
    DELETED: 'Project deleted successfully',
  },
  ERROR: {
    CREATE_FAILED: 'Failed to create project',
    UPDATE_FAILED: 'Failed to update project',
    DELETE_FAILED: 'Failed to delete project',
    FETCH_FAILED: 'Failed to load projects',
    UPLOAD_FAILED: 'Failed to upload photos',
    INVALID_FILE_TYPE: 'Invalid file type. Only JPG, PNG, WebP, and HEIC are allowed',
    FILE_TOO_LARGE: 'File size must be less than 10MB',
    TOO_MANY_PHOTOS: 'Maximum 30 photos allowed per project',
  },
  VALIDATION: {
    NAME_REQUIRED: 'Project name is required',
    NAME_MIN_LENGTH: 'Project name must be at least 2 characters',
    NAME_MAX_LENGTH: 'Project name must be less than 120 characters',
    LOCATION_REQUIRED: 'Location is required',
    LOCATION_MIN_LENGTH: 'Location must be at least 2 characters',
    LOCATION_MAX_LENGTH: 'Location must be less than 120 characters',
  },
} as const;
