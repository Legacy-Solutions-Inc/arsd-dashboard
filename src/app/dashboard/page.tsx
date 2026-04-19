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
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Calendar, BarChart3, Medal, AlertCircle } from 'lucide-react';
import { DashboardLoading } from '@/components/ui/universal-loading';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { cn } from '@/lib/utils';

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  ratio?: number;
  delay?: number;
};

function StatCard({ icon, label, value, ratio, delay = 0 }: StatCardProps) {
  const pct = ratio == null ? 100 : Math.round(ratio * 100);
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 transition-colors hover:border-foreground/15 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground nums">
          {pct}%
        </span>
      </div>
      <div className="text-display-2 font-display font-bold text-foreground leading-none nums">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      <div className="mt-3 h-[2px] w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

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
  const [, setLoadingManagers] = useState(false);

  const { user: warehouseUser, loading: warehouseAuthLoading } = useWarehouseAuth();

  const projectService = new ProjectService();

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

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'in_progress').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const projectsWithReports = projects.filter((p) => hasReports(p)).length;

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
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
            ARSD Construction
          </div>
          <h1 className="text-display-2 font-display text-foreground leading-none">
            Projects
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Overview of every ongoing and completed project. Stats update as reports are approved.
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/leaderboard')}
          >
            <Medal className="h-4 w-4" />
            <span className="hidden sm:inline">Performance leaderboard</span>
            <span className="sm:hidden">Leaderboard</span>
          </Button>
        )}
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Total projects"
          value={totalProjects}
          delay={0}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Active"
          value={activeProjects}
          ratio={totalProjects ? activeProjects / totalProjects : 0}
          delay={50}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Completed"
          value={completedProjects}
          ratio={totalProjects ? completedProjects / totalProjects : 0}
          delay={100}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="With reports"
          value={projectsWithReports}
          ratio={totalProjects ? projectsWithReports / totalProjects : 0}
          delay={150}
        />
      </div>

      {/* Table / error */}
      {error ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="text-base font-semibold text-foreground">
            We couldn't load your projects
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{error}</div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <ProjectsTable
          projects={projects}
          loading={loading}
          onViewProject={handleViewProject}
          onEditProject={(p) => {
            setEditingProject(p);
            setIsEditFormOpen(true);
          }}
          onCreateProject={() => setIsCreateFormOpen(true)}
          canCreate={canCreateProjects}
          canEdit={canEditProjects}
          hasReports={hasReports}
          itemsPerPage={5}
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
