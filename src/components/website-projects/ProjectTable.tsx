import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Loader2, Image, Calendar, MapPin, Building2 } from "lucide-react";
import type { WebsiteProject } from "@/types/website-projects";

interface ProjectTableProps {
  projects: WebsiteProject[];
  onEdit: (project: WebsiteProject) => void;
  onDelete: (project: WebsiteProject) => void;
  onSort: (field: 'created_at' | 'name' | 'location') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function ProjectTable({ 
  projects, 
  onEdit, 
  onDelete, 
  onSort, 
  sortBy, 
  sortOrder,
  isUpdating = false,
  isDeleting = false,
}: ProjectTableProps) {
  const SortableHeader = ({ 
    field, 
    children 
  }: { 
    field: 'created_at' | 'name' | 'location'; 
    children: React.ReactNode; 
  }) => (
    <TableHead 
      className="glass-table-header-cell text-arsd-red cursor-pointer hover:bg-red-50/10 transition-colors duration-200"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortBy === field && (
          <span className="text-sm text-arsd-red font-semibold">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto scrollbar-glass">
      <Table>
        <TableHeader>
          <TableRow className="glass-table-header">
            <SortableHeader field="name">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Project Name
              </div>
            </SortableHeader>
            <SortableHeader field="location">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </div>
            </SortableHeader>
            <TableHead className="glass-table-header-cell text-arsd-red">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Photos
              </div>
            </TableHead>
            <SortableHeader field="created_at">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </div>
            </SortableHeader>
            <TableHead className="glass-table-header-cell text-arsd-red text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <TableRow key={project.id} className={`glass-table-row group ${index % 2 === 0 ? 'bg-white/5' : 'bg-white/2'}`}>
              <TableCell className="glass-table-cell">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-arsd-red/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-arsd-red" />
                  </div>
                  <div>
                    <div className="font-semibold text-glass-primary text-md">
                      {project.name}
                    </div>
                    {isUpdating && (
                      <div className="flex items-center gap-2 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin text-arsd-red" />
                        <span className="text-xs text-glass-muted">Updating...</span>
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="glass-table-cell">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-arsd-red" />
                  <span className="text-glass-primary font-medium">{project.location}</span>
                </div>
              </TableCell>
              <TableCell className="glass-table-cell">
                <Badge variant="glass" className="bg-arsd-red/20 text-arsd-red border-arsd-red/30">
                  <Image className="h-3 w-3 mr-1" />
                  {project.photos?.length || 0} photos
                </Badge>
              </TableCell>
              <TableCell className="glass-table-cell">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-arsd-red" />
                  <span className="text-glass-secondary font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="glass-table-cell text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(project)}
                    disabled={isUpdating || isDeleting}
                    className="glass-button bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-glass-primary border-blue-300/50 hover:from-blue-500/30 hover:to-cyan-500/30 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    aria-label={`Edit ${project.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(project)}
                    disabled={isUpdating || isDeleting}
                    className="glass-button bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-600 border-red-300/50 hover:from-red-500/30 hover:to-pink-500/30 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    aria-label={`Delete ${project.name}`}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}