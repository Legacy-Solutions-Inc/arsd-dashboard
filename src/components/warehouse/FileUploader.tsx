"use client";

import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  accept?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}

export function FileUploader({ label, accept = 'image/*', value, onChange, required = false }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
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
          className="flex flex-col items-center justify-center w-full h-32 sm:h-40 glass-subtle border-2 border-dashed border-red-300/50 rounded-xl cursor-pointer hover:bg-red-50/20 hover:border-red-400/70 transition-all duration-200 mobile-touch-target"
        >
          {value ? (
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 truncate max-w-full px-2">
                {value.name}
              </span>
              <span className="text-xs text-gray-500">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-12 h-12 bg-red-100/50 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-arsd-red" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Click to upload
              </span>
              <span className="text-xs text-gray-500">
                or drag and drop
              </span>
            </div>
          )}
        </label>

        {value && (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors mobile-touch-target"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

