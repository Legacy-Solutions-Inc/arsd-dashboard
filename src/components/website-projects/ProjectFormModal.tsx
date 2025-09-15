"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, X } from "lucide-react";
import { WebsiteProject, ProjectFormData, VALID_IMAGE_TYPES, MAX_FILE_SIZE, MAX_PHOTOS_PER_PROJECT } from "@/types/website-projects";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { ProjectFormSkeleton } from "./ProjectSkeleton";
import { useWebsiteProjects } from "../../hooks/useWebsiteProjects";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  project?: WebsiteProject | null;
}

export function ProjectFormModal({ isOpen, onClose, onSubmit, project }: ProjectFormModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    location: "",
    photos: [],
    existing_photos: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { getSignedUrl, getPublicUrl, deletePhoto, isUploading } = useWebsiteProjects();

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        location: project.location,
        photos: [],
        existing_photos: project.photos || []
      });
    } else {
      setFormData({
        name: "",
        location: "",
        photos: [],
        existing_photos: []
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Project name must be at least 2 characters";
    } else if (formData.name.length > 120) {
      newErrors.name = "Project name must be less than 120 characters";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    } else if (formData.location.length < 2) {
      newErrors.location = "Location must be at least 2 characters";
    } else if (formData.location.length > 120) {
      newErrors.location = "Location must be less than 120 characters";
    }

    const totalPhotos = formData.photos.length + formData.existing_photos.length;
    if (totalPhotos > MAX_PHOTOS_PER_PROJECT) {
      newErrors.photos = `Maximum ${MAX_PHOTOS_PER_PROJECT} photos allowed per project`;
    }

    // Validate file types and sizes
    formData.photos.forEach((file, index) => {
      if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
        newErrors[`photo_${index}`] = "Invalid file type. Only JPG, PNG, WebP, and HEIC are allowed";
      }
      if (file.size > MAX_FILE_SIZE) {
        newErrors[`photo_${index}`] = `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePhotosChange = (photos: File[]) => {
    handleInputChange('photos', photos);
    // Clear photo errors
    const photoErrors = Object.keys(errors).filter(key => key.startsWith('photo_'));
    if (photoErrors.length > 0) {
      const newErrors = { ...errors };
      photoErrors.forEach(key => delete newErrors[key]);
      setErrors(newErrors);
    }
  };

  const handleExistingPhotosChange = (photos: any[]) => {
    handleInputChange('existing_photos', photos);
  };

  const isFormDisabled = isSubmitting || isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {project ? "Edit Project" : "Add New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter project name"
                className={errors.name ? "border-red-500" : ""}
                disabled={isFormDisabled}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter project location"
                className={errors.location ? "border-red-500" : ""}
                disabled={isFormDisabled}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-4">
            <Label>Photos</Label>
            {isUploading ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Uploading photos...</p>
              </div>
            ) : (
              <PhotoUploadSection
                photos={formData.photos}
                existingPhotos={formData.existing_photos}
                onPhotosChange={handlePhotosChange}
                onExistingPhotosChange={handleExistingPhotosChange}
                getSignedUrl={getSignedUrl}
                getPublicUrl={getPublicUrl}
                deletePhoto={deletePhoto}
                errors={errors}
              />
            )}
            {errors.photos && (
              <p className="text-sm text-red-500">{errors.photos}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isFormDisabled}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isFormDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {project ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {project ? "Update Project" : "Create Project"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}