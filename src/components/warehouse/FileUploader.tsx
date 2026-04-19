"use client";

import React, { useRef } from 'react';
import { Upload, X, FileCheck2 } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  accept?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}

export function FileUploader({
  label,
  accept = 'image/*',
  value,
  onChange,
  required = false,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] || null);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`file-upload-${label.replace(/\s+/g, '-')}`}
        />

        <label
          htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`}
          className="flex flex-col items-center justify-center w-full h-32 sm:h-40 bg-muted/30 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 hover:border-foreground/20 transition-colors mobile-touch-target"
        >
          {value ? (
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center">
                <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-full px-2">
                {value.name}
              </span>
              <span className="text-xs text-muted-foreground nums">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-foreground">
                Click to upload
              </span>
              <span className="text-xs text-muted-foreground">
                or drag and drop
              </span>
            </div>
          )}
        </label>

        {value && (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-card border border-border p-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors mobile-touch-target"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
