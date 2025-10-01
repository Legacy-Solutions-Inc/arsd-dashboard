export interface AccomplishmentReport {
  id: string;
  project_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number;
  file_url: string;
  upload_date: string;
  week_ending_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Flattened data from view
  project_table_id?: string;
  project_name?: string;
  client?: string;
  location?: string;
  project_status?: string;
  project_manager_id?: string;
  project_inspector_id?: string;
  profile_id?: string;
  display_name?: string;
  email?: string;
}

export interface CreateAccomplishmentReportData {
  project_id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  week_ending_date: string;
  notes?: string;
}

export interface AccomplishmentReportFilters {
  project_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  week_ending_date?: string;
  uploaded_by?: string;
}

export interface WeeklyUploadStatus {
  project_id: string;
  project_name: string;
  week_ending_date: string;
  has_upload: boolean;
  report?: AccomplishmentReport;
}

// Helper functions
export function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

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

export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: saturday.toISOString().split('T')[0]
  };
}