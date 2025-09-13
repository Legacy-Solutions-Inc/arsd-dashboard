"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { WebsiteProject } from "@/types/website-projects";
import { ProjectFormModal } from "./ProjectFormModal";
import { ProjectDeleteModal } from "./ProjectDeleteModal";
import { ProjectTable } from "./ProjectTable";
import { ProjectPagination } from "./ProjectPagination";
import { ProjectTableSkeleton, ProjectSkeleton } from "./ProjectSkeleton";
import { useWebsiteProjects } from "../../hooks/useWebsiteProjects";
import { useProjectFilters } from "../../hooks/useProjectFilters";

export function WebsiteProjectsTab() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<WebsiteProject | null>(null);
  
  const { toast } = useToast();
  const { 
    projects, 
    total, 
    loading, 
    error,
    fetchProjects, 
    createProject, 
    updateProject, 
    deleteProject,
    clearError,
    isCreating,
    isUpdating,
    isDeleting,
  } = useWebsiteProjects();

  const {
    filters,
    handleSearch,
    handleSort,
    handlePageChange,
  } = useProjectFilters();

  // Fetch projects when filters change
  useEffect(() => {
    fetchProjects(filters);
  }, [filters, fetchProjects]);

  const handleEdit = (project: WebsiteProject) => {
    setSelectedProject(project);
    setIsFormModalOpen(true);
  };

  const handleDelete = (project: WebsiteProject) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedProject) {
        await updateProject(selectedProject.id, data);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        await createProject(data);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }
      setIsFormModalOpen(false);
      setSelectedProject(null);
    } catch (error) {
      // Error is handled by the hook
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    
    try {
      console.log('Starting delete process for project:', selectedProject.id);
      await deleteProject(selectedProject.id);
      console.log('Delete completed, showing success toast');
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      setIsDeleteModalOpen(false);
      setSelectedProject(null);
      
      // Force refresh the projects list
      console.log('Force refreshing projects list...');
      await fetchProjects(filters);
    } catch (error) {
      console.error('Delete failed:', error);
      // Error is handled by the hook
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const handleAddProject = () => {
    setSelectedProject(null);
    setIsFormModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedProject(null);
  };

  const handleRefresh = async () => {
    try {
      await fetchProjects(filters);
      toast({
        title: "Refreshed",
        description: "Projects list updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh projects",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <div className="flex gap-2 justify-center">
          <Button onClick={clearError} variant="outline">
            Clear Error
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects by name or location..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleAddProject}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Website Projects ({total})
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ProjectTableSkeleton />
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
                {filters.search ? "No projects match your search criteria." : "Get started by creating your first project."}
              </p>
              {!filters.search && (
                <Button onClick={handleAddProject} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <>
              <ProjectTable
                projects={projects}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSort={handleSort}
                sortBy={filters.sort_by}
                sortOrder={filters.sort_order}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
              />

              <ProjectPagination
                currentPage={filters.page}
                totalPages={Math.ceil(total / filters.limit)}
                totalItems={total}
                itemsPerPage={filters.limit}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        project={selectedProject}
      />

      <ProjectDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        project={selectedProject}
        isDeleting={isDeleting}
      />
    </div>
  );
}