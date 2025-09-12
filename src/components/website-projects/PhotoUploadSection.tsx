"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  Upload, 
  X, 
  GripVertical, 
  Image as ImageIcon,
  Eye,
  Trash2
} from "lucide-react";
import { WebsiteProjectPhoto, VALID_IMAGE_TYPES, MAX_FILE_SIZE } from "@/types/website-projects";

interface PhotoUploadSectionProps {
  photos: File[];
  existingPhotos: WebsiteProjectPhoto[];
  onPhotosChange: (photos: File[]) => void;
  onExistingPhotosChange: (photos: WebsiteProjectPhoto[]) => void;
  getSignedUrl: (filePath: string) => Promise<string | null>;
  errors: Record<string, string>;
}

export function PhotoUploadSection({
  photos,
  existingPhotos,
  onPhotosChange,
  onExistingPhotosChange,
  getSignedUrl,
  errors
}: PhotoUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
        errors.push(`${file.name}: Invalid file type. Only JPG, PNG, WebP, and HEIC are allowed.`);
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: "Invalid Files",
        description: errors.join(" "),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      const newPhotos = [...photos, ...validFiles];
      onPhotosChange(newPhotos);
      
      // Create preview URLs
      validFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        setPreviewUrls(prev => ({ ...prev, [file.name]: url }));
      });
    }
  };

  const removePhoto = (index: number) => {
    const fileToRemove = photos[index];
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    
    // Clean up preview URL
    if (fileToRemove) {
      URL.revokeObjectURL(previewUrls[fileToRemove.name]);
      setPreviewUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[fileToRemove.name];
        return newUrls;
      });
    }
  };

  const removeExistingPhoto = (photoId: string) => {
    const newExistingPhotos = existingPhotos.filter(photo => photo.id !== photoId);
    onExistingPhotosChange(newExistingPhotos);
  };

  const reorderExistingPhotos = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...existingPhotos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    
    // Update order_index
    const updatedPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      order_index: index
    }));
    
    onExistingPhotosChange(updatedPhotos);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop photos here or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports JPG, PNG, WebP, HEIC up to 10MB each
        </p>
        <Button type="button" onClick={openFileDialog} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={VALID_IMAGE_TYPES.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Photo Previews */}
      {(photos.length > 0 || existingPhotos.length > 0) && (
        <div className="space-y-4">
          <Label>Photos ({photos.length + existingPhotos.length})</Label>
          
          {/* New Photos */}
          {photos.map((photo, index) => (
            <Card key={`new-${index}`} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={previewUrls[photo.name]}
                      alt={photo.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {photo.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(photo.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    {errors[`photo_${index}`] && (
                      <p className="text-sm text-red-500">{errors[`photo_${index}`]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">New</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhoto(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Existing Photos */}
          {existingPhotos.map((photo, index) => (
            <ExistingPhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onRemove={() => removeExistingPhoto(photo.id)}
              onReorder={reorderExistingPhotos}
              getSignedUrl={getSignedUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ExistingPhotoCardProps {
  photo: WebsiteProjectPhoto;
  index: number;
  onRemove: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getSignedUrl: (filePath: string) => Promise<string | null>;
}

function ExistingPhotoCard({ 
  photo, 
  index, 
  onRemove, 
  onReorder, 
  getSignedUrl 
}: ExistingPhotoCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const url = await getSignedUrl(photo.file_path);
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [photo.file_path, getSignedUrl]);

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {loading ? (
              <div className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={photo.alt_text || "Project photo"}
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Photo {index + 1}
            </p>
            <p className="text-sm text-gray-500">
              Order: {photo.order_index}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-grab"
              onMouseDown={(e) => {
                // Simple drag and drop implementation
                e.preventDefault();
              }}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

