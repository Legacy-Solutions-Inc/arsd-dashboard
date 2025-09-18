'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { AccomplishmentReportsService } from '@/services/accomplishment-reports/accomplishment-reports.service';
import { getWeekEndingDate, formatFileSize } from '@/types/accomplishment-reports';
import { createClient } from '@/lib/supabase';
import type { Project } from '@/types/projects';

interface CSVUploadFormProps {
  project: Project;
  onUploadSuccess: () => void;
  onCancel: () => void;
}

export default function CSVUploadForm({ project, onUploadSuccess, onCancel }: CSVUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const service = new AccomplishmentReportsService();

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const fileName = selectedFile.name.toLowerCase();
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const isValidFile = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFile) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    // Validate file size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Upload file to storage
      let url, path;
      try {
        const uploadResult = await service.uploadFile(file, project.id);
        url = uploadResult.url;
        path = uploadResult.path;
        
        console.log('Upload result:', { url, path });
        console.log('URL type:', typeof url);
        console.log('URL value:', url);
        
        // Validate URL
        if (!url || url.includes('test.com') || !url.includes('supabase')) {
          throw new Error(`Invalid URL generated: ${url}`);
        }
      } catch (uploadError) {
        console.error('Upload failed:', uploadError);
        throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }

      // Create report record
      const { data: reportData, error: reportError } = await supabase
        .from('accomplishment_reports')
        .insert({
          project_id: project.id,
          uploaded_by: user.id,
          file_name: file.name,
          file_size: file.size,
          file_url: url,
          week_ending_date: getWeekEndingDate(),
          notes: notes.trim() || undefined,
          status: 'pending'
        })
        .select(`
          *,
          projects!accomplishment_reports_project_id_fkey(
            id,
            project_id,
            project_name,
            client,
            location,
            status
          )
        `)
        .single();

      if (reportError) {
        throw new Error(`Report creation failed: ${reportError.message}`);
      }

      onUploadSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Accomplishment Report
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file for <strong>{project.project_name}</strong> (Week ending: {getWeekEndingDate()})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-2">
          <Label htmlFor="file">CSV/Excel File</Label>
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
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">File Selected</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{file.name}</div>
                  <div>{formatFileSize(file.size)}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your CSV or Excel file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Maximum file size: 20MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes about this report..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
            disabled={!file || uploading}
            className="min-w-[100px]"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
