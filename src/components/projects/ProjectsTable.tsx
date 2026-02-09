'use client';

import { Project, getProjectStatusText, getProjectStatusColor } from '@/types/projects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar, User, MapPin, Building2, ArrowRight, Plus, Edit, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { InlineLoading, SkeletonTable } from '@/components/ui/universal-loading';

interface ProjectsTableProps {
  projects: Project[];
  loading?: boolean;
  onViewProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onCreateProject?: () => void;
  canEdit?: boolean;
  canCreate?: boolean;
  hasReports?: (project: Project) => boolean;
  itemsPerPage?: number;
}

export function ProjectsTable({ 
  projects, 
  loading = false, 
  onViewProject, 
  onEditProject,
  onCreateProject,
  canEdit = false,
  canCreate = false,
  hasReports,
  itemsPerPage = 5
}: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, endIndex);
  
  // Reset to first page when projects change
  useMemo(() => {
    setCurrentPage(1);
  }, [projects.length]);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return (
      <div className="glass-table">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Project Portfolio
                </h2>
                <p className="text-gray-600 text-sm font-medium">Manage and monitor your construction projects</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <SkeletonTable rows={5} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-table">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                Project Portfolio
              </h2>
              <p className="text-gray-600 text-sm font-medium">Manage and monitor your construction projects</p>
            </div>
          </div>
          {canCreate && onCreateProject && (
            <Button 
              onClick={onCreateProject}
              className="bg-gradient-to-r from-arsd-red to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-3 rounded-xl font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Create New Project</span>
              <span className="sm:hidden">Create</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Show skeleton table when no projects exist */}
      {projects.length === 0 ? (
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No projects added yet</h3>
            <p className="text-gray-500 text-sm">Create your first project to get started with project management</p>
          </div>
          <SkeletonTable rows={itemsPerPage} columns={8} />
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            <div className="p-3 sm:p-4 space-y-3">
              {paginatedProjects.map((project) => (
            <div key={project.id} className="glass-subtle rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex flex-col gap-3">
                {/* Project Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-glass-accent font-medium bg-arsd-red/10 px-2 py-1 rounded-lg inline-block text-xs mb-1">
                      {project.project_id}
                    </div>
                    <h3 className="font-semibold text-glass-primary text-sm mb-1">
                      {project.project_name}
                    </h3>
                    <div className="flex items-center gap-2 text-glass-secondary text-xs">
                      <MapPin className="h-3 w-3" />
                      <span>{project.location}</span>
                    </div>
                  </div>
                  <Badge variant="glass" className="text-glass-primary text-xs">
                    {getProjectStatusText(project.status)}
                  </Badge>
                </div>

                {/* Project Manager */}
                {project.project_manager ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-arsd-red/10 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-arsd-red" />
                    </div>
                    <div>
                      <div className="font-medium text-glass-primary text-xs">
                        {project.project_manager.display_name}
                      </div>
                      <div className="text-xs text-glass-muted">
                        {project.project_manager.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-glass-muted italic bg-gray-100/50 px-2 py-1 rounded-lg text-xs">
                    No project manager assigned
                  </div>
                )}

                {/* Warehouseman */}
                {project.warehouseman ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-arsd-red/10 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-arsd-red" />
                    </div>
                    <div>
                      <div className="font-medium text-glass-primary text-xs">
                        {project.warehouseman.display_name}
                      </div>
                      <div className="text-xs text-glass-muted">
                        {project.warehouseman.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-glass-muted italic bg-gray-100/50 px-2 py-1 rounded-lg text-xs">
                    No warehouseman assigned
                  </div>
                )}

                {/* Client */}
                <div className="text-glass-secondary text-xs">
                  <span className="font-medium">Client:</span> {project.client}
                </div>

                {/* Latest Update */}
                <div className="text-glass-secondary text-xs">
                  <span className="font-medium">Latest Update:</span> 
                  {project.latest_accomplishment_update ? (
                    <span className="ml-2 bg-green-100/50 text-green-700 px-2 py-1 rounded-lg inline-block text-xs">
                      {new Date(project.latest_accomplishment_update).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="ml-2 text-glass-muted italic">No reports</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {canEdit && onEditProject && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEditProject(project)}
                      className="glass-button bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-glass-primary border-blue-300/50 hover:from-blue-500/30 hover:to-cyan-500/30 w-full sm:w-auto"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewProject?.(project)}
                    disabled={hasReports ? !hasReports(project) : false}
                    className={`glass-button w-full sm:w-auto ${
                      hasReports && !hasReports(project) 
                        ? 'bg-gray-100/50 text-glass-muted border-gray-300/50 cursor-not-allowed hover:scale-100' 
                        : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-glass-primary border-purple-300/50 hover:from-purple-500/30 hover:to-pink-500/30'
                    }`}
                    title={
                      hasReports && !hasReports(project) 
                        ? 'View disabled: No approved reports with parsed data available'
                        : 'View project details and parsed accomplishment data'
                    }
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    View
                    {hasReports && !hasReports(project) && (
                      <span className="ml-1 text-xs">⚠️</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto scrollbar-glass">
        <Table>
          <TableHeader>
            <TableRow className="glass-table-header">
              <TableHead className="glass-table-header-cell text-arsd-red">Project ID</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Project Name</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Site Engineer</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Warehouseman</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Client</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Location</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Status</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Latest Update</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.map((project, index) => (
              <TableRow key={project.id} className={`glass-table-row ${index % 2 === 0 ? 'bg-white/5' : 'bg-white/2'}`}>
                <TableCell className="glass-table-cell">
                  <div className="font-mono text-glass-accent font-medium bg-arsd-red/10 px-3 py-1 rounded-lg inline-block">
                    {project.parsed_project_id || project.project_id}
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="font-md text-glass-primary text-sm">
                    {project.project_name}
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  {project.project_manager ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-arsd-red/10 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-arsd-red" />
                      </div>
                      <div>
                        <div className="font-medium text-glass-primary text-xs">
                          {project.project_manager.display_name}
                        </div>
                        <div className="text-xs text-glass-muted">
                          {project.project_manager.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-glass-muted italic bg-gray-100/50 px-2 py-1 rounded-lg text-xs">Unassigned</span>
                  )}
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  {project.warehouseman ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-arsd-red/10 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-arsd-red" />
                      </div>
                      <div>
                        <div className="font-medium text-glass-primary text-xs">
                          {project.warehouseman.display_name}
                        </div>
                        <div className="text-xs text-glass-muted">
                          {project.warehouseman.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-glass-muted italic bg-gray-100/50 px-2 py-1 rounded-lg text-xs">Unassigned</span>
                  )}
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="flex items-center gap-2">
                    <span className="text-glass-primary">{project.client}</span>
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-glass-muted" />
                    <span className="text-glass-primary text-xs">{project.location}</span>
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <Badge variant="glass" className="text-glass-primary text-xs">
                    {getProjectStatusText(project.status)}
                  </Badge>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="text-glass-secondary">
                    {project.latest_accomplishment_update ? (
                      <div className="bg-green-100/50 text-green-700 px-2 py-1 rounded-lg inline-block text-xs">
                        {new Date(project.latest_accomplishment_update).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-glass-muted italic bg-gray-100/50 px-2 py-1 rounded-lg text-xs">No reports</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="flex gap-1">
                    {canEdit && onEditProject && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditProject(project)}
                        className="glass-button bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-glass-primary border-blue-300/50 hover:from-blue-500/30 hover:to-cyan-500/30 text-xs px-2 py-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewProject?.(project)}
                      disabled={hasReports ? !hasReports(project) : false}
                      className={`glass-button text-xs px-2 py-1 ${
                        hasReports && !hasReports(project) 
                          ? 'bg-gray-100/50 text-glass-muted border-gray-300/50 cursor-not-allowed hover:scale-100' 
                          : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-glass-primary border-purple-300/50 hover:from-purple-500/30 hover:to-pink-500/30'
                      }`}
                      title={
                        hasReports && !hasReports(project) 
                          ? 'View disabled: No approved reports with parsed data available'
                          : 'View project details and parsed accomplishment data'
                      }
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      View
                      {hasReports && !hasReports(project) && (
                        <span className="ml-1 text-xs">⚠️</span>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-table-header p-3 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-glass-secondary text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(endIndex, projects.length)} of {projects.length} projects
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current page
                  const shouldShow = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  if (!shouldShow) {
                    // Show ellipsis for gaps
                    if (page === 2 && currentPage > 4) {
                      return <span key={`ellipsis-${page}`} className="px-2 text-glass-muted">...</span>;
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 3) {
                      return <span key={`ellipsis-${page}`} className="px-2 text-glass-muted">...</span>;
                    }
                    return null;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className={`w-8 h-8 p-0 ${
                        currentPage === page 
                          ? 'bg-arsd-red text-white border-arsd-red' 
                          : 'glass-button hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
