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
  itemsPerPage = 10
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
    return <ProjectsTableSkeleton />;
  }

  return (
    <div className="glass-table">
      <div className="glass-table-header p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-arsd-red" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-glass-primary flex items-center gap-2 text-arsd-red">
                Projects
              </h2>
              <p className="text-glass-secondary text-sm">Manage project portfolio</p>
            </div>
          </div>
          {canCreate && onCreateProject && (
            <Button 
              onClick={onCreateProject}
              variant="glass-gradient"
              size="glass-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto scrollbar-glass">
        <Table>
          <TableHeader>
            <TableRow className="glass-table-header">
              <TableHead className="glass-table-header-cell text-arsd-red">Project ID</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Project Name</TableHead>
              <TableHead className="glass-table-header-cell text-arsd-red">Project Manager</TableHead>
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
                    {project.project_id}
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="font-md text-glass-primary text-md">
                    {project.project_name}
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  {project.project_manager ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-arsd-red/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-arsd-red" />
                      </div>
                      <div>
                        <div className="font-medium text-glass-primary text-md">
                          {project.project_manager.display_name}
                        </div>
                        <div className="text-xs text-glass-muted">
                          {project.project_manager.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-glass-muted italic bg-gray-100/50 px-3 py-1 rounded-lg">Unassigned</span>
                  )}
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="flex items-center gap-2">
                    <span className="text-glass-primary">{project.client}</span>
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-glass-muted" />
                    <span className="text-glass-primary">{project.location}</span>
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <Badge variant="glass" className="text-glass-primary">
                    {getProjectStatusText(project.status)}
                  </Badge>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="text-glass-secondary">
                    {project.latest_accomplishment_update ? (
                      <div className="bg-green-100/50 text-green-700 px-3 py-1 rounded-lg inline-block">
                        {new Date(project.latest_accomplishment_update).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-glass-muted italic bg-gray-100/50 px-3 py-1 rounded-lg">No reports</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="glass-table-cell">
                  <div className="flex gap-2">
                    {canEdit && onEditProject && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditProject(project)}
                        className="glass-button bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-glass-primary border-blue-300/50 hover:from-blue-500/30 hover:to-cyan-500/30"
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
                      className={`glass-button ${
                        hasReports && !hasReports(project) 
                          ? 'bg-gray-100/50 text-glass-muted border-gray-300/50 cursor-not-allowed hover:scale-100' 
                          : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-glass-primary border-purple-300/50 hover:from-purple-500/30 hover:to-pink-500/30'
                      }`}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      View
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
        <div className="glass-table-header p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-glass-secondary">
              Showing {startIndex + 1} to {Math.min(endIndex, projects.length)} of {projects.length} projects
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
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
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading skeleton component
function ProjectsTableSkeleton() {
  return (
    <div className="glass-table">
      <div className="glass-table-header p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              {[...Array(8)].map((_, j) => (
                <div key={j} className="h-4 bg-white/10 rounded animate-pulse flex-1"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}