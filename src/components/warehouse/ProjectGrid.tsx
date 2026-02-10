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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'in_planning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const statusClasses = {
      in_progress: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      in_planning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${statusClasses[status]}`}>
        {getStatusIcon(status)}
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {projects.map((project) => {
        const warehousemanLabel =
          project.warehouseman?.display_name ||
          project.project_manager?.display_name ||
          'Unassigned';
        const isUnassigned = warehousemanLabel === 'Unassigned';

        return (
          <div key={project.id} className="min-w-0">
            <ARSDCard
              variant="neutral"
              onClick={() => router.push(`/dashboard/warehouse/stocks/${project.id}`)}
              className="hover:scale-105 transition-transform duration-200"
            >
              <div className="space-y-3 min-w-0">
                <div className="flex items-start justify-between min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-arsd-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-arsd-primary text-sm sm:text-base line-clamp-2">
                        {project.project_name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-gray-600 min-w-0">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate min-w-0">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-600" />
                    <span
                      className={`truncate min-w-0 ${isUnassigned ? 'text-gray-400 italic' : 'text-gray-600'}`}
                    >
                      {warehousemanLabel}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  {getStatusBadge(project.status)}
                </div>
              </div>
            </ARSDCard>
          </div>
        );
      })}
    </div>
  );
}

