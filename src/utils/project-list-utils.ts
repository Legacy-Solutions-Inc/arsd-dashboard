/**
 * Utility functions for ProjectList component computations
 */

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: string;
}

export interface ProjectListProps {
  projects: Project[];
  onSelect: (projectId: string) => void;
}

export interface ProjectListFilters {
  searchTerm: string;
  statusFilter: string;
  clientFilter: string;
  locationFilter: string;
}

export interface ProjectListSorting {
  field: 'name' | 'client' | 'location' | 'status';
  direction: 'asc' | 'desc';
}

export interface ProcessedProjectList {
  filteredProjects: Project[];
  paginatedProjects: Project[];
  paginationInfo: PaginationInfo;
  summaryStats: ProjectListSummaryStats;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
}

export interface ProjectListSummaryStats {
  totalProjects: number;
  activeProjects: number;
  inactiveProjects: number;
  uniqueClients: number;
  uniqueLocations: number;
}

/**
 * Filter projects based on search term and filters
 */
export const filterProjects = (
  projects: Project[],
  filters: ProjectListFilters
): Project[] => {
  return projects.filter(project => {
    // Search term filter (case-insensitive)
    const matchesSearch = !filters.searchTerm || 
      project.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      project.id.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filters.statusFilter === 'all' || 
      project.status.toLowerCase() === filters.statusFilter.toLowerCase();

    // Client filter
    const matchesClient = !filters.clientFilter || 
      project.client.toLowerCase() === filters.clientFilter.toLowerCase();

    // Location filter
    const matchesLocation = !filters.locationFilter || 
      project.location.toLowerCase() === filters.locationFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesClient && matchesLocation;
  });
};

/**
 * Sort projects based on field and direction
 */
export const sortProjects = (
  projects: Project[],
  sorting: ProjectListSorting
): Project[] => {
  return [...projects].sort((a, b) => {
    const fieldA = a[sorting.field];
    const fieldB = b[sorting.field];

    // Handle string comparison
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      const comparison = fieldA.toLowerCase().localeCompare(fieldB.toLowerCase());
      return sorting.direction === 'asc' ? comparison : -comparison;
    }

    // Handle numeric comparison (if needed for future fields)
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sorting.direction === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }

    return 0;
  });
};

/**
 * Calculate pagination information
 */
export const calculatePagination = (
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex
  };
};

/**
 * Get paginated projects
 */
export const getPaginatedProjects = (
  projects: Project[],
  paginationInfo: PaginationInfo
): Project[] => {
  return projects.slice(paginationInfo.startIndex, paginationInfo.endIndex);
};

/**
 * Calculate summary statistics for project list
 */
export const calculateProjectListSummaryStats = (projects: Project[]): ProjectListSummaryStats => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status.toLowerCase() === 'active').length;
  const inactiveProjects = totalProjects - activeProjects;
  
  const uniqueClients = new Set(projects.map(p => p.client)).size;
  const uniqueLocations = new Set(projects.map(p => p.location)).size;

  return {
    totalProjects,
    activeProjects,
    inactiveProjects,
    uniqueClients,
    uniqueLocations
  };
};

/**
 * Get unique values for filter dropdowns
 */
export const getUniqueFilterValues = (projects: Project[]) => {
  const clients = Array.from(new Set(projects.map(p => p.client))).sort();
  const locations = Array.from(new Set(projects.map(p => p.location))).sort();
  const statuses = Array.from(new Set(projects.map(p => p.status))).sort();

  return {
    clients,
    locations,
    statuses
  };
};

/**
 * Get status badge styling
 */
export const getStatusBadgeStyling = (status: string): string => {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'active':
      return 'bg-green-100 text-green-700 border border-green-300';
    case 'inactive':
    case 'paused':
      return 'bg-gray-100 text-gray-700 border border-gray-300';
    case 'completed':
      return 'bg-blue-100 text-blue-700 border border-blue-300';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-300';
  }
};

/**
 * Format status for display
 */
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Validate project data
 */
export const validateProject = (project: Project): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!project.id || project.id.trim() === '') {
    errors.push('Project ID is required');
  }

  if (!project.name || project.name.trim() === '') {
    errors.push('Project name is required');
  }

  if (!project.client || project.client.trim() === '') {
    errors.push('Client is required');
  }

  if (!project.location || project.location.trim() === '') {
    errors.push('Location is required');
  }

  if (!project.status || project.status.trim() === '') {
    errors.push('Status is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Search projects with fuzzy matching
 */
export const fuzzySearchProjects = (
  projects: Project[],
  searchTerm: string
): Project[] => {
  if (!searchTerm.trim()) return projects;

  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return projects.filter(project => {
    const searchableText = [
      project.id,
      project.name,
      project.client,
      project.location,
      project.status
    ].join(' ').toLowerCase();

    // Simple fuzzy matching - check if all characters of search term exist in order
    let searchIndex = 0;
    for (let i = 0; i < searchableText.length && searchIndex < normalizedSearchTerm.length; i++) {
      if (searchableText[i] === normalizedSearchTerm[searchIndex]) {
        searchIndex++;
      }
    }

    return searchIndex === normalizedSearchTerm.length;
  });
};

/**
 * Calculate project list performance metrics
 */
export const calculateProjectListMetrics = (projects: Project[]) => {
  const activeProjects = projects.filter(p => p.status.toLowerCase() === 'active');
  const completedProjects = projects.filter(p => p.status.toLowerCase() === 'completed');
  
  const totalProjects = projects.length;
  const completionRate = totalProjects > 0 ? (completedProjects.length / totalProjects) * 100 : 0;
  const activeRate = totalProjects > 0 ? (activeProjects.length / totalProjects) * 100 : 0;

  return {
    totalProjects,
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    completionRate: Math.round(completionRate * 100) / 100,
    activeRate: Math.round(activeRate * 100) / 100
  };
};

/**
 * Main function to process all project list data
 */
export const processProjectListData = (
  projects: Project[],
  filters: ProjectListFilters,
  sorting: ProjectListSorting,
  currentPage: number,
  itemsPerPage: number
): ProcessedProjectList => {
  // Filter projects
  const filteredProjects = filterProjects(projects, filters);
  
  // Sort projects
  const sortedProjects = sortProjects(filteredProjects, sorting);
  
  // Calculate pagination
  const paginationInfo = calculatePagination(sortedProjects.length, currentPage, itemsPerPage);
  
  // Get paginated projects
  const paginatedProjects = getPaginatedProjects(sortedProjects, paginationInfo);
  
  // Calculate summary stats
  const summaryStats = calculateProjectListSummaryStats(projects);

  return {
    filteredProjects: sortedProjects,
    paginatedProjects,
    paginationInfo,
    summaryStats
  };
};

/**
 * Export projects data to CSV format
 */
export const exportProjectsToCSV = (projects: Project[]): string => {
  const headers = ['ID', 'Name', 'Client', 'Location', 'Status'];
  const csvRows = [headers.join(',')];

  projects.forEach(project => {
    const values = [
      `"${project.id}"`,
      `"${project.name}"`,
      `"${project.client}"`,
      `"${project.location}"`,
      `"${project.status}"`
    ];
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Get projects by client
 */
export const getProjectsByClient = (projects: Project[], client: string): Project[] => {
  return projects.filter(project => 
    project.client.toLowerCase() === client.toLowerCase()
  );
};

/**
 * Get projects by location
 */
export const getProjectsByLocation = (projects: Project[], location: string): Project[] => {
  return projects.filter(project => 
    project.location.toLowerCase() === location.toLowerCase()
  );
};

/**
 * Get projects by status
 */
export const getProjectsByStatus = (projects: Project[], status: string): Project[] => {
  return projects.filter(project => 
    project.status.toLowerCase() === status.toLowerCase()
  );
};
