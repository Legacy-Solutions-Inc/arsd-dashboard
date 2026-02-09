"use client";

import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import ProjectCreateForm from '@/components/projects/ProjectCreateForm';
import ProjectEditForm from '@/components/projects/ProjectEditForm';
import { Project, ProjectManager, ProjectInspector, Warehouseman } from '@/types/projects';
import { ProjectService } from '@/services/projects/project.service';
import { useRBAC } from '@/hooks/useRBAC';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { TrendingUp, Users, Calendar, BarChart3, Sparkles, Medal } from 'lucide-react';
import { DashboardLoading, InlineLoading } from '@/components/ui/universal-loading';

export default function DashboardPage() {
  const { projects, loading, error, refetch } = useProjects();
  const { hasPermission, isSuperAdmin } = useRBAC();
  const router = useRouter();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [projectInspectors, setProjectInspectors] = useState<ProjectInspector[]>([]);
  const [warehousemen, setWarehousemen] = useState<Warehouseman[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const projectService = new ProjectService();

  // Load project managers, inspectors, and warehousemen when component mounts
  useEffect(() => {
    const loadAssignees = async () => {
      try {
        setLoadingManagers(true);
        const [managers, inspectors, wh] = await Promise.all([
          projectService.getAvailableProjectManagers(),
          projectService.getAvailableProjectInspectors(),
          projectService.getAvailableWarehousemen()
        ]);
        setProjectManagers(managers);
        setProjectInspectors(inspectors);
        setWarehousemen(wh);
      } catch (error) {
        console.error('Failed to load project managers/inspectors/warehousemen:', error);
      } finally {
        setLoadingManagers(false);
      }
    };

    loadAssignees();
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

  // Function to check if a project has reports and parsed data
  const hasReports = (project: Project): boolean => {
    return project.latest_accomplishment_update !== null && project.has_parsed_data === true;
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

  if (loading) {
    return <DashboardLoading 
      message="Loading Dashboard"
      subtitle="Preparing your project overview and statistics"
      size="lg"
      fullScreen={true}
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-arsd-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                      <span className="hidden sm:inline">ARSD Project Dashboard</span>
                      <span className="sm:hidden">Dashboard</span>
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base font-medium">
                      Construction Project Management Hub
                    </p>
                  </div>
                </div>
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => router.push('/dashboard/leaderboard')}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-0"
                >
                  <Medal className="h-4 w-4" />
                  <span className="hidden sm:inline">View Performance Leaderboard</span>
                  <span className="sm:hidden">Leaderboard</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="group">
            <GlassCard variant="elevated" className="text-center hover:scale-[1.02] transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500">
              <GlassCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mb-2 mx-auto shadow-md group-hover:shadow-blue-500/25">
                  <BarChart3 className="h-3 w-3 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{totalProjects}</div>
                <div className="text-gray-600 text-xs font-medium">Total Projects</div>
                <div className="w-full bg-blue-100 rounded-full h-0.5 mt-1">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-0.5 rounded-full" style={{width: '100%'}}></div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          <div className="group">
            <GlassCard variant="elevated" className="text-center hover:scale-[1.02] transition-all duration-200 hover:shadow-lg border-l-4 border-l-green-500">
              <GlassCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mb-2 mx-auto shadow-md group-hover:shadow-green-500/25">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{activeProjects}</div>
                <div className="text-gray-600 text-xs font-medium">Active Projects</div>
                <div className="w-full bg-green-100 rounded-full h-0.5 mt-1">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-0.5 rounded-full" style={{width: `${totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0}%`}}></div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          <div className="group">
            <GlassCard variant="elevated" className="text-center hover:scale-[1.02] transition-all duration-200 hover:shadow-lg border-l-4 border-l-purple-500">
              <GlassCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mb-2 mx-auto shadow-md group-hover:shadow-purple-500/25">
                  <Calendar className="h-3 w-3 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{completedProjects}</div>
                <div className="text-gray-600 text-xs font-medium">Completed</div>
                <div className="w-full bg-purple-100 rounded-full h-0.5 mt-1">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-0.5 rounded-full" style={{width: `${totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0}%`}}></div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          <div className="group">
            <GlassCard variant="elevated" className="text-center hover:scale-[1.02] transition-all duration-200 hover:shadow-lg border-l-4 border-l-pink-500">
              <GlassCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg mb-2 mx-auto shadow-md group-hover:shadow-pink-500/25">
                  <Users className="h-3 w-3 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{projectsWithReports}</div>
                <div className="text-gray-600 text-xs font-medium">With Reports</div>
                <div className="w-full bg-pink-100 rounded-full h-0.5 mt-1">
                  <div className="bg-gradient-to-r from-pink-500 to-pink-600 h-0.5 rounded-full" style={{width: `${totalProjects > 0 ? (projectsWithReports / totalProjects) * 100 : 0}%`}}></div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>

        {/* Project List Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            {error ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">!</span>
                  </div>
                </div>
                <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Projects</div>
                <div className="text-gray-600 text-sm">{error}</div>
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
                itemsPerPage={5}
              />
            )}
          </div>
        </div>

        {/* Project Creation Form */}
        <ProjectCreateForm
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          onSuccess={handleCreateSuccess}
          projectManagers={projectManagers}
          projectInspectors={projectInspectors}
          projectWarehousemen={warehousemen}
        />

        {/* Project Edit Form */}
        <ProjectEditForm
          project={editingProject}
          isOpen={isEditFormOpen}
          onClose={handleCloseEditForm}
          onSuccess={handleEditSuccess}
          projectManagers={projectManagers}
          projectInspectors={projectInspectors}
          projectWarehousemen={warehousemen}
        />
      </div>
    </div>
  );
}