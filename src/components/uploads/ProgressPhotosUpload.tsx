'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, X, CheckCircle, AlertCircle, ImageIcon, Trash2 } from 'lucide-react';
import { useUploadProgressPhotos } from '@/hooks/useProgressPhotos';
import { getWeekEndingDate, formatFileSize } from '@/types/progress-photos';
import type { Project } from '@/types/projects';

interface ProgressPhotosUploadProps {
  project: Project;
  onUploadSuccess: () => void;
  onCancel: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  description: string;
}

const MAX_PHOTOS = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ProgressPhotosUpload({ project, onUploadSuccess, onCancel }: ProgressPhotosUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, uploadPhotos } = useUploadProgressPhotos();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Only JPEG, PNG, and WebP images are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Maximum size is 10MB.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    // Check if adding these files would exceed the limit
    if (files.length + selectedFiles.length > MAX_PHOTOS) {
      setError(`Cannot upload more than ${MAX_PHOTOS} photos. Currently have ${files.length} photos.`);
      return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      // Check for duplicates
      const isDuplicate = files.some(f => f.file.name === file.name && f.file.size === file.size);
      if (isDuplicate) {
        errors.push(`${file.name}: File already selected.`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newFiles.push({
        file,
        preview,
        description: ''
      });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    setError(null);
  };

  const updateDescription = (index: number, description: string) => {
    setFiles(prev => {
      const updated = [...prev];
      updated[index].description = description;
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      // Upload files to storage
      const uploadResults = await uploadFiles(files.map(f => f.file), project.id);

      // Create photo records
      const photosData = uploadResults.map((result, index) => ({
        project_id: project.id,
        file_name: files[index].file.name,
        file_size: files[index].file.size,
        file_url: result.url,
        week_ending_date: getWeekEndingDate(),
        description: files[index].description.trim() || undefined
      }));

      await uploadPhotos(photosData);

      // Trigger a custom event to refresh the projects list
      window.dispatchEvent(new CustomEvent('progressPhotosUploaded', {
        detail: { projectId: project.id }
      }));

      // Clean up previews
      files.forEach(f => URL.revokeObjectURL(f.preview));
      
      onUploadSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Progress Photos
        </CardTitle>
        <CardDescription>
          Upload progress photos for <strong>{project.project_name}</strong> (Week ending: {getWeekEndingDate()})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="photos">Progress Photos</Label>
            <Badge variant="outline" className="text-xs">
              {files.length}/{MAX_PHOTOS} photos
            </Badge>
          </div>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              multiple
              onChange={handleFileInputChange}
              disabled={files.length >= MAX_PHOTOS}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            
            <div className="space-y-2">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your photos here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Upload up to {MAX_PHOTOS} photos (JPEG, PNG, WebP - max 10MB each)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files Preview */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Selected Photos ({files.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {files.map((fileWithPreview, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="relative">
                    <img
                      src={fileWithPreview.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={fileWithPreview.file.name}>
                      {fileWithPreview.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileWithPreview.file.size)}
                    </p>
                    <Textarea
                      placeholder="Add description (optional)"
                      value={fileWithPreview.description}
                      onChange={(e) => updateDescription(index, e.target.value)}
                      disabled={uploading}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="min-w-[120px]"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
