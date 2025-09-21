export type ProjectStatus = 'in_planning' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  project_id: string;           // System generated (e.g., PRJ-2024-0001)
  project_name: string;
  client: string;
  location: string;
  status: ProjectStatus;
  project_manager_id: string | null;
  project_manager: ProjectManager | null;
  latest_accomplishment_update: string | null; // ISO date string
  has_parsed_data: boolean;     // Whether project has successfully parsed accomplishment data
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectManager {
  user_id: string;
  display_name: string;
  email: string;
}

export interface CreateProjectData {
  project_name: string;
  client: string;
  location: string;
  status?: ProjectStatus;
  project_manager_id?: string | undefined;
}

export interface UpdateProjectData {
  project_name?: string;
  client?: string;
  location?: string;
  status?: ProjectStatus;
  project_manager_id?: string | null;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  project_manager_id?: string;
  search?: string;
}

// Helper functions
export const getProjectStatusText = (status: ProjectStatus): string => {
  switch (status) {
    case 'in_planning':
      return 'In Planning';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

export const getProjectStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case 'in_planning':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
