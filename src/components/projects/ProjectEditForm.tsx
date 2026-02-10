'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectStatus, UpdateProjectData, ProjectManager, ProjectInspector, Warehouseman } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectService } from '@/services/projects/project.service';

interface ProjectEditFormProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectManagers: ProjectManager[];
  projectInspectors: ProjectInspector[];
  projectWarehousemen: Warehouseman[];
}

export default function ProjectEditForm({
  project,
  isOpen,
  onClose,
  onSuccess,
  projectManagers,
  projectInspectors,
  projectWarehousemen,
}: ProjectEditFormProps) {
  const [formData, setFormData] = useState<UpdateProjectData & { project_manager_id: string | null; project_inspector_id: string | null; warehouseman_id: string | null }>({
    project_name: '',
    client: '',
    location: '',
    status: 'in_planning',
    project_manager_id: 'none',
    project_inspector_id: 'none',
    warehouseman_id: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const projectService = new ProjectService();

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        project_name: project.project_name,
        client: project.client,
        location: project.location,
        status: project.status,
        project_manager_id: project.project_manager_id || 'none',
        project_inspector_id: project.project_inspector_id || 'none',
        warehouseman_id: project.warehouseman_id || 'none',
      });
      setErrors({});
    }
  }, [project, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (id: keyof UpdateProjectData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_name?.trim()) newErrors.project_name = 'Project Name is required.';
    if (!formData.client?.trim()) newErrors.client = 'Client is required.';
    if (!formData.location?.trim()) newErrors.location = 'Location is required.';
    if (!formData.status) newErrors.status = 'Status is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert 'none' to null for project_manager_id, project_inspector_id, and warehouseman_id
      const dataToSubmit = {
        ...formData,
        project_manager_id: formData.project_manager_id === 'none' ? null : formData.project_manager_id,
        project_inspector_id: formData.project_inspector_id === 'none' ? null : formData.project_inspector_id,
        warehouseman_id: formData.warehouseman_id === 'none' ? null : formData.warehouseman_id,
      };
      
      await projectService.updateProject(project.id, dataToSubmit);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update project:', error);
      setErrors({ submit: 'Failed to update project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project details below. Project ID: {project.project_id}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              value={formData.project_name || ''}
              onChange={handleChange}
              placeholder="Enter project name"
              required
            />
            {errors.project_name && <p className="text-red-500 text-sm">{errors.project_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Input
              id="client"
              value={formData.client || ''}
              onChange={handleChange}
              placeholder="Enter client name"
              required
            />
            {errors.client && <p className="text-red-500 text-sm">{errors.client}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder="Enter project location"
              required
            />
            {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status || 'in_planning'}
              onValueChange={(value: ProjectStatus) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_planning">In Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_manager_id">Site Engineer</Label>
            <Select
              value={formData.project_manager_id || 'none'}
              onValueChange={(value) => handleSelectChange('project_manager_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign Project Manager (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {projectManagers.map((pm) => (
                  <SelectItem key={pm.user_id} value={pm.user_id}>
                    {pm.display_name} ({pm.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_inspector_id">Project Manager</Label>
            <Select
              value={formData.project_inspector_id || 'none'}
              onValueChange={(value) => handleSelectChange('project_inspector_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign Project Inspector (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {projectInspectors.map((pi) => (
                  <SelectItem key={pi.user_id} value={pi.user_id}>
                    {pi.display_name} ({pi.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouseman_id">Warehouseman</Label>
            <Select
              value={formData.warehouseman_id || 'none'}
              onValueChange={(value) => handleSelectChange('warehouseman_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign Warehouseman (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {projectWarehousemen.map((wh) => (
                  <SelectItem key={wh.user_id} value={wh.user_id}>
                    {wh.display_name} ({wh.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errors.submit && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
              {errors.submit}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
