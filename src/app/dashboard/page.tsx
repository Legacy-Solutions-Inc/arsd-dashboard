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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Project Overview</h1>
      
      {/* Summary Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h1 className="text-2xl font-bold mb-4">TO BE DISCUSSED</h1>
      </div>
      
      {/* Project List Section */}
      {error ? (
        <div className="text-red-600 bg-red-50 p-4 rounded">
          Error: {error}
        </div>
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
