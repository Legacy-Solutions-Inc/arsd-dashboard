"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ARSDCard } from './ARSDCard';
import { Project } from '@/data/warehouseMock';
import { Building2, MapPin, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const router = useRouter();

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'on_hold':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200'
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
      {projects.map((project) => (
        <ARSDCard
          key={project.id}
          onClick={() => router.push(`/dashboard/warehouse/stocks/${project.id}`)}
          className="hover:scale-105 transition-transform duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-arsd-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-arsd-primary text-sm sm:text-base truncate">
                    {project.name}
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{project.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{project.siteEngineer}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-red-200/30">
              {getStatusBadge(project.status)}
            </div>
          </div>
        </ARSDCard>
      ))}
    </div>
  );
}

