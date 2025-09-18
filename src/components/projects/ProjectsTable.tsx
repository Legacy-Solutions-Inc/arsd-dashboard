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
import { Calendar, User, MapPin, Building2, ArrowRight, Plus, Edit } from 'lucide-react';

interface ProjectsTableProps {
  projects: Project[];
  loading?: boolean;
  onViewProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onCreateProject?: () => void;
  canEdit?: boolean;
  canCreate?: boolean;
  hasReports?: (project: Project) => boolean;
}

export function ProjectsTable({ 
  projects, 
  loading = false, 
  onViewProject, 
  onEditProject,
  onCreateProject,
  canEdit = false,
  canCreate = false,
  hasReports
}: ProjectsTableProps) {
  if (loading) {
    return <ProjectsTableSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-600">Projects</h2>
          </div>
          {canCreate && onCreateProject && (
            <Button 
              onClick={onCreateProject}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Project ID</TableHead>
              <TableHead className="font-semibold text-gray-700">Project Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Project Manager</TableHead>
              <TableHead className="font-semibold text-gray-700">Client</TableHead>
              <TableHead className="font-semibold text-gray-700">Location</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Latest Update</TableHead>
              <TableHead className="font-semibold text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-red-600 font-medium">
                  {project.project_id}
                </TableCell>
                
                <TableCell className="font-medium text-gray-900">
                  {project.project_name}
                </TableCell>
                
                <TableCell>
                  {project.project_manager ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {project.project_manager.display_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.project_manager.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{project.client}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{project.location}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge className={getProjectStatusColor(project.status)}>
                    {getProjectStatusText(project.status)}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-gray-600">
                  {project.latest_accomplishment_update ? (
                    new Date(project.latest_accomplishment_update).toLocaleDateString()
                  ) : (
                    <span className="text-gray-400 italic">No reports</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex gap-2">
                    {canEdit && onEditProject && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditProject(project)}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
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
                      className={`${
                        hasReports && !hasReports(project) 
                          ? 'bg-gray-400 hover:bg-gray-400 text-white border-gray-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
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
    </div>
  );
}

// Loading skeleton component
function ProjectsTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              {[...Array(8)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
