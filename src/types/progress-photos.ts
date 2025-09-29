export interface ProgressPhoto {
  id: string;
  project_id: string;
  uploaded_by: string; // UUID from auth.users(id)
  file_name: string;
  file_size: number;
  file_url: string;
  week_ending_date: string;
  upload_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  // Joined data from views
  project_name?: string;
  client?: string;
  location?: string;
  project_status?: string;
  uploader_name?: string;
  uploader_email?: string;
}

export interface CreateProgressPhotoData {
  project_id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  week_ending_date: string;
  description?: string;
}

export interface ProgressPhotoFilters {
  project_id?: string;
  week_ending_date?: string;
  uploaded_by?: string;
}

export interface WeeklyProgressPhotos {
  project_id: string;
  project_name: string;
  week_ending_date: string;
  photos: ProgressPhoto[];
  total_photos: number;
}

// Helper functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getWeekEndingDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return saturday.toISOString().split('T')[0];
}
