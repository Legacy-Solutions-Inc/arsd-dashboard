'use client';

import { Project, getProjectStatusText } from '@/types/projects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  MapPin,
  Building2,
  ArrowRight,
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SkeletonTable } from '@/components/ui/universal-loading';
import { cn } from '@/lib/utils';

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

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'default';
  if (status === 'on_hold') return 'warning';
  return 'secondary';
}

function SectionHeader({
  canCreate,
  onCreateProject,
}: {
  canCreate?: boolean;
  onCreateProject?: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-border bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-h3 text-foreground">Project Portfolio</h2>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your construction projects
          </p>
        </div>
      </div>
      {canCreate && onCreateProject && (
        <Button onClick={onCreateProject} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create project</span>
          <span className="sm:hidden">Create</span>
        </Button>
      )}
    </div>
  );
}

function PersonCell({
  name,
  email,
}: {
  name?: string;
  email?: string;
}) {
  if (!name) {
    return (
      <span className="text-xs text-muted-foreground italic">Unassigned</span>
    );
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{name}</div>
        {email && (
          <div className="text-[11px] text-muted-foreground truncate">{email}</div>
        )}
      </div>
    </div>
  );
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
  itemsPerPage = 5,
}: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  const goToPage = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SectionHeader canCreate={canCreate} onCreateProject={onCreateProject} />
        <div className="p-6">
          <SkeletonTable rows={5} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <SectionHeader canCreate={canCreate} onCreateProject={onCreateProject} />

      {projects.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
          {canCreate && onCreateProject && (
            <Button onClick={onCreateProject} className="mt-4">
              <Plus className="h-4 w-4" />
              Create project
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="block lg:hidden divide-y divide-border">
            {paginatedProjects.map((project) => {
              const reportsReady = hasReports ? hasReports(project) : true;
              return (
                <div key={project.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded inline-block mb-1.5 nums">
                        {project.parsed_project_id || project.project_id}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {project.project_name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant(project.status)}>
                      {getProjectStatusText(project.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <PersonCell
                      name={project.project_manager?.display_name}
                      email={project.project_manager?.email}
                    />
                    <PersonCell
                      name={project.warehouseman?.display_name}
                      email={project.warehouseman?.email}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Client:</span>{' '}
                    {project.client}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Latest update:</span>{' '}
                    {project.latest_accomplishment_update ? (
                      <span className="nums">
                        {new Date(project.latest_accomplishment_update).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="italic">No reports</span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {canEdit && onEditProject && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditProject(project)}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant={reportsReady ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewProject?.(project)}
                      disabled={!reportsReady}
                      className="w-full sm:w-auto"
                      title={
                        reportsReady
                          ? 'View project details'
                          : 'No approved reports with parsed data available'
                      }
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto scrollbar-glass">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Project ID</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Project Name</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Site Engineer</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Warehouseman</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Client</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Location</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Latest Update</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => {
                  const reportsReady = hasReports ? hasReports(project) : true;
                  return (
                    <TableRow
                      key={project.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded inline-block nums">
                          {project.parsed_project_id || project.project_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">
                          {project.project_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PersonCell
                          name={project.project_manager?.display_name}
                          email={project.project_manager?.email}
                        />
                      </TableCell>
                      <TableCell>
                        <PersonCell
                          name={project.warehouseman?.display_name}
                          email={project.warehouseman?.email}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{project.client}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{project.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(project.status)}>
                          {getProjectStatusText(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {project.latest_accomplishment_update ? (
                          <span className="text-xs text-foreground nums">
                            {new Date(project.latest_accomplishment_update).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No reports
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {canEdit && onEditProject && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditProject(project)}
                              aria-label={`Edit ${project.project_name}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                          <Button
                            variant={reportsReady ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onViewProject?.(project)}
                            disabled={!reportsReady}
                            title={
                              reportsReady
                                ? 'View project details'
                                : 'No approved reports with parsed data available'
                            }
                            aria-label={`View ${project.project_name}`}
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground text-center sm:text-left nums">
                Showing {startIndex + 1}–{Math.min(endIndex, projects.length)} of{' '}
                {projects.length}
              </div>
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const shouldShow =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    if (!shouldShow) {
                      if (page === 2 && currentPage > 4) {
                        return (
                          <span
                            key={`ellipsis-${page}`}
                            className="px-2 text-muted-foreground text-sm"
                          >
                            …
                          </span>
                        );
                      }
                      if (page === totalPages - 1 && currentPage < totalPages - 3) {
                        return (
                          <span
                            key={`ellipsis-${page}`}
                            className="px-2 text-muted-foreground text-sm"
                          >
                            …
                          </span>
                        );
                      }
                      return null;
                    }
                    const active = currentPage === page;
                    return (
                      <Button
                        key={page}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={cn('w-8 h-8 p-0 nums', active && 'pointer-events-none')}
                        aria-label={`Page ${page}`}
                        aria-current={active ? 'page' : undefined}
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
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
