import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { WebsiteProject } from "@/types/website-projects";

interface ProjectDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  project: WebsiteProject | null;
  isDeleting?: boolean;
}

export function ProjectDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  project, 
  isDeleting = false 
}: ProjectDeleteModalProps) {
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the project
            and remove all associated photos from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-1">Project to be deleted:</h4>
            <p className="text-red-700 font-medium">{project.name}</p>
            <p className="text-red-600 text-sm">{project.location}</p>
            {project.photos && project.photos.length > 0 && (
              <p className="text-red-600 text-sm mt-1">
                {project.photos.length} photo{project.photos.length !== 1 ? 's' : ''} will also be deleted
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}