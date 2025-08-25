import React, { useCallback, useState } from 'react';
import { ImageFile } from '../types';
import { createImagePreview, validateImageFile, generateId } from '../utils/imageProcessing';

interface ImageUploaderProps {
  onImagesSelected: (images: ImageFile[]) => void;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImagesSelected,
  maxFiles = 50 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList) => {
    setError(null);
    const validFiles: ImageFile[] = [];
    const errors: string[] = [];

    const filesToProcess = Math.min(files.length, maxFiles);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      
      if (!validateImageFile(file)) {
        errors.push(`${file.name} is not a valid image file`);
        continue;
      }

      try {
        const preview = await createImagePreview(file);
        validFiles.push({
          id: generateId(),
          file,
          preview,
          status: 'pending'
        });
      } catch (err) {
        errors.push(`Failed to process ${file.name}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      onImagesSelected(validFiles);
    }
  }, [maxFiles, onImagesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              />
            </svg>
            
            <div>
              <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              <span className="text-sm text-gray-500"> or drag and drop</span>
            </div>
            
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG or WebP up to 10MB (max {maxFiles} files)
            </p>
          </div>
        </label>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};