"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { WebsiteProject } from "@/types/website-projects";

interface ProjectDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  project: WebsiteProject | null;
}

export function ProjectDeleteModal({ isOpen, onClose, onConfirm, project }: ProjectDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">
                  Are you sure you want to delete this project?
                </h4>
                <p className="text-sm text-red-700">
                  This action cannot be undone. The project and all associated photos will be permanently removed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Project Details:</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {project.name}</p>
              <p><span className="font-medium">Location:</span> {project.location}</p>
              <p><span className="font-medium">Photos:</span> {project.photos?.length || 0} photos</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

