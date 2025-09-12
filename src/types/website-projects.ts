export interface WebsiteProject {
  id: string;
  name: string;
  location: string;
  slug: string;
  is_deleted: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  photos?: WebsiteProjectPhoto[];
}

export interface WebsiteProjectPhoto {
  id: string;
  project_id: string;
  file_path: string;
  order_index: number;
  alt_text: string | null;
  created_at: string;
  url?: string;
}

export interface CreateWebsiteProjectData {
  name: string;
  location: string;
  photos?: File[];
}

export interface UpdateWebsiteProjectData {
  name?: string;
  location?: string;
  photos?: File[];
  existing_photos?: WebsiteProjectPhoto[];
}

export interface ProjectFormData {
  name: string;
  location: string;
  photos: File[];
  existing_photos: WebsiteProjectPhoto[];
}

export interface ProjectListFilters {
  search: string;
  page: number;
  limit: number;
  sort_by: 'created_at' | 'name' | 'location';
  sort_order: 'asc' | 'desc';
}

export interface ProjectListResponse {
  projects: WebsiteProject[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PhotoUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTOS_PER_PROJECT = 30;
export const PROJECTS_PER_PAGE = 20;

