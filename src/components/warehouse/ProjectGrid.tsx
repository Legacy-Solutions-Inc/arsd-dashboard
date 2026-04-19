"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ARSDCard } from './ARSDCard';
import { Project, ProjectStatus } from '@/types/projects';
import { Building2, MapPin, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const router = useRouter();

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'in_progress':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'in_planning':
        return <AlertCircle className="h-3.5 w-3.5" />;
      default:
        return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const statusClasses: Record<ProjectStatus, string> = {
      in_progress: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
      completed: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50',
      in_planning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${statusClasses[status]}`}>
        {getStatusIcon(status)}
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => {
        const warehousemanLabel =
          project.warehouseman?.display_name ||
          project.project_manager?.display_name ||
          'Unassigned';
        const isUnassigned = warehousemanLabel === 'Unassigned';

        return (
          <ARSDCard
            key={project.id}
            variant="neutral"
            onClick={() => router.push(`/dashboard/warehouse/stocks/${project.id}`)}
            className="min-w-0"
          >
            <div className="space-y-3 min-w-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 flex-shrink-0 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                    {project.project_name}
                  </h3>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{project.location}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className={`truncate ${isUnassigned ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                    {warehousemanLabel}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                {getStatusBadge(project.status)}
              </div>
            </div>
          </ARSDCard>
        );
      })}
    </div>
  );
}
