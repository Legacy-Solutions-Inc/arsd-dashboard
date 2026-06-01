"use client";

import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useCommandCenter } from '@/hooks/useCommandCenter';
import { CommandCenterOverview } from '@/components/dashboard/command-center/CommandCenterOverview';
import { PortfolioTable } from '@/components/dashboard/command-center/PortfolioTable';
import ProjectCreateForm from '@/components/projects/ProjectCreateForm';
import ProjectEditForm from '@/components/projects/ProjectEditForm';
import { Project, ProjectManager, ProjectInspector, Warehouseman } from '@/types/projects';
import { ProjectService } from '@/services/projects/project.service';
import { useRBAC } from '@/hooks/useRBAC';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { DashboardLoading } from '@/components/ui/universal-loading';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';

export default function DashboardPage() {
  const { projects, loading, error, refetch } = useProjects();
  const { user, hasPermission, isSuperAdmin } = useRBAC();
  const router = useRouter();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [projectInspectors, setProjectInspectors] = useState<ProjectInspector[]>([]);
  const [warehousemen, setWarehousemen] = useState<Warehouseman[]>([]);
  const [, setLoadingManagers] = useState(false);

  const { user: warehouseUser, loading: warehouseAuthLoading } = useWarehouseAuth();

  const projectService = new ProjectService();

  // Single batched aggregation behind the whole Command Center (overview + table progress).
  const commandCenter = useCommandCenter(projects, loading);

  useEffect(() => {
    const loadAssignees = async () => {
      try {
        setLoadingManagers(true);
        const [managers, inspectors, wh] = await Promise.all([
          projectService.getAvailableProjectManagers(),
          projectService.getAvailableProjectInspectors(),
          projectService.getAvailableWarehousemen(),
        ]);
        setProjectManagers(managers);
        setProjectInspectors(inspectors);
        setWarehousemen(wh);
      } catch (err) {
        console.error('Failed to load project assignees:', err);
      } finally {
        setLoadingManagers(false);
      }
    };
    loadAssignees();
  }, []);

  useEffect(() => {
    if (!warehouseAuthLoading && warehouseUser?.role === 'warehouseman') {
      router.replace('/dashboard/warehouse');
    }
  }, [warehouseAuthLoading, warehouseUser, router]);

  useEffect(() => {
    const handleProjectReportApproved = () => refetch();
    window.addEventListener('projectReportApproved', handleProjectReportApproved);
    return () => {
      window.removeEventListener('projectReportApproved', handleProjectReportApproved);
    };
  }, [refetch]);

  const handleViewProject = (project: Project) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const hasReports = (project: Project): boolean =>
    project.latest_accomplishment_update !== null && project.has_parsed_data === true;

  const [canCreateProjects, setCanCreateProjects] = useState(false);
  const [canEditProjects, setCanEditProjects] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const [createPerm, editPerm] = await Promise.all([
        hasPermission('create_projects'),
        hasPermission('edit_all_projects'),
      ]);
      setCanCreateProjects(createPerm);
      setCanEditProjects(editPerm);
    };
    checkPermissions();
  }, [hasPermission]);

  if (loading) {
    return (
      <DashboardLoading
        message="Loading dashboard"
        subtitle="Preparing your project overview"
        size="lg"
        fullScreen={true}
      />
    );
  }

  return (
    <div className="space-y-10 lg:space-y-14">
      {/* Part A — at a glance */}
      <CommandCenterOverview
        data={commandCenter}
        userName={user?.name || user?.full_name || user?.email || undefined}
        canViewLeaderboard={isSuperAdmin}
      />

      {/* Part B — project portfolio */}
      {error ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="text-base font-semibold text-foreground">
            We couldn't load your projects
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{error}</div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <PortfolioTable
          projects={projects}
          progressByProjectId={commandCenter.progressByProjectId}
          detailsLoading={commandCenter.detailsLoading}
          hasReports={hasReports}
          onViewProject={handleViewProject}
          onEditProject={(p) => {
            setEditingProject(p);
            setIsEditFormOpen(true);
          }}
          onCreateProject={() => setIsCreateFormOpen(true)}
          canEdit={canEditProjects}
          canCreate={canCreateProjects}
          canViewLeaderboard={isSuperAdmin}
        />
      )}

      {/* Forms */}
      <ProjectCreateForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onSuccess={() => refetch()}
        projectManagers={projectManagers}
        projectInspectors={projectInspectors}
        projectWarehousemen={warehousemen}
      />
      <ProjectEditForm
        project={editingProject}
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingProject(null);
        }}
        onSuccess={() => refetch()}
        projectManagers={projectManagers}
        projectInspectors={projectInspectors}
        projectWarehousemen={warehousemen}
      />
    </div>
  );
}
