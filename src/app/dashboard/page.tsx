"use client";

import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import ProjectCreateForm from '@/components/projects/ProjectCreateForm';
import ProjectEditForm from '@/components/projects/ProjectEditForm';
import { Project, ProjectManager } from '@/types/projects';
import { ProjectService } from '@/services/projects/project.service';
import { useRBAC } from '@/hooks/useRBAC';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { TrendingUp, Users, Calendar, BarChart3, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { projects, loading, error, refetch } = useProjects();
  const { hasPermission } = useRBAC();
  const router = useRouter();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const projectService = new ProjectService();

  // Load project managers when component mounts
  useEffect(() => {
    const loadProjectManagers = async () => {
      try {
        setLoadingManagers(true);
        const managers = await projectService.getAvailableProjectManagers();
        setProjectManagers(managers);
      } catch (error) {
        console.error('Failed to load project managers:', error);
      } finally {
        setLoadingManagers(false);
      }
    };

    loadProjectManagers();
  }, []);

  // Listen for project report approval events to refresh projects
  useEffect(() => {
    const handleProjectReportApproved = () => {
      refetch(); // Refresh projects when a report is approved
    };

    window.addEventListener('projectReportApproved', handleProjectReportApproved);
    
    return () => {
      window.removeEventListener('projectReportApproved', handleProjectReportApproved);
    };
  }, [refetch]);

  const handleViewProject = (project: any) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const handleCreateProject = () => {
    setIsCreateFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditFormOpen(true);
  };

  const handleCreateSuccess = () => {
    refetch(); // Refresh the projects list
  };

  const handleEditSuccess = () => {
    refetch(); // Refresh the projects list
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
    setEditingProject(null);
  };

  // Function to check if a project has reports
  const hasReports = (project: Project): boolean => {
    return project.latest_accomplishment_update !== null;
  };

  const [canCreateProjects, setCanCreateProjects] = useState(false);
  const [canEditProjects, setCanEditProjects] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const hasCreatePermission = await hasPermission('create_projects');
      const hasEditPermission = await hasPermission('edit_all_projects');
      setCanCreateProjects(hasCreatePermission);
      setCanEditProjects(hasEditPermission);
    };
    checkPermissions();
  }, [hasPermission]);

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const projectsWithReports = projects.filter(p => hasReports(p)).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-glass-primary mb-2 flex items-center gap-3 text-arsd-red">
            ARSD's Project Dashboard
          </h1>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl mb-4 mx-auto">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-glass-primary mb-1">{totalProjects}</div>
            <div className="text-glass-secondary text-sm">Total Projects</div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl mb-4 mx-auto">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-glass-primary mb-1">{activeProjects}</div>
            <div className="text-glass-secondary text-sm">Active Projects</div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl mb-4 mx-auto">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-glass-primary mb-1">{completedProjects}</div>
            <div className="text-glass-secondary text-sm">Completed</div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="elevated" className="text-center">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-400/20 to-pink-600/20 rounded-xl mb-4 mx-auto">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
            <div className="text-3xl font-bold text-glass-primary mb-1">{projectsWithReports}</div>
            <div className="text-glass-secondary text-sm">With Reports</div>
          </GlassCardContent>
        </GlassCard>
      </div>
      
      {/* Project List Section */}
      {error ? (
        <GlassCard variant="elevated">
          <GlassCardContent className="p-6 text-center">
            <div className="text-glass-error text-lg font-medium">Error: {error}</div>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <ProjectsTable 
          projects={projects}
          loading={loading}
          onViewProject={handleViewProject}
          onEditProject={handleEditProject}
          onCreateProject={handleCreateProject}
          canCreate={canCreateProjects}
          canEdit={canEditProjects}
          hasReports={hasReports}
          itemsPerPage={8}
        />
      )}

      {/* Project Creation Form */}
      <ProjectCreateForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onSuccess={handleCreateSuccess}
        projectManagers={projectManagers}
      />

      {/* Project Edit Form */}
      <ProjectEditForm
        project={editingProject}
        isOpen={isEditFormOpen}
        onClose={handleCloseEditForm}
        onSuccess={handleEditSuccess}
        projectManagers={projectManagers}
      />
    </div>
  );
}