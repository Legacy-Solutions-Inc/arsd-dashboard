import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Loader2 } from "lucide-react";
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
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === field && (
          <span className="text-sm">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader field="name">Project Name</SortableHeader>
          <SortableHeader field="location">Location</SortableHeader>
          <TableHead>Photos</TableHead>
          <SortableHeader field="created_at">Created</SortableHeader>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="group">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {project.name}
                {isUpdating && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>
            </TableCell>
            <TableCell>{project.location}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {project.photos?.length || 0} photos
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(project.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(project)}
                  disabled={isUpdating || isDeleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Edit ${project.name}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(project)}
                  disabled={isUpdating || isDeleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
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
  );
}