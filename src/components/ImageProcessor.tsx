import React, { useState } from 'react';
import type { ImageFile, ProcessingResult } from '../types';
import axios from 'axios';

interface ImageProcessorProps {
  images: ImageFile[];
  onProcessingComplete: (results: ProcessingResult[]) => void;
  onCancel: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  images,
  onProcessingComplete,
  onCancel,
  isProcessing,
  setIsProcessing,
}) => {
  const [progress, setProgress] = useState(0);

  const processImages = async () => {
    setIsProcessing(true);
    const results: ProcessingResult[] = [];

    try {
      const formData = new FormData();
      
      if (images.length === 1) {
        // Single image processing
        formData.append('photo', images[0].file);
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/enhance/single`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 100)
              );
              setProgress(percentCompleted);
            },
          }
        );

        results.push(response.data);
      } else {
        // Batch processing
        images.forEach((image) => {
          formData.append('photos', image.file);
        });

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/enhance/batch`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 100)
              );
              setProgress(percentCompleted);
            },
          }
        );

        if (response.data.success) {
          results.push(...response.data.success);
        }
      }

      onProcessingComplete(results);
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process images. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Processing Your Photos
      </h2>

      <div className="space-y-4">
        {images.map((image, _index) => (
          <div
            key={image.id}
            className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <img
              src={image.preview}
              alt={image.file.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-800 dark:text-white">
                {image.file.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(image.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="w-8 h-8">
              {isProcessing && (
                <svg
                  className="animate-spin h-8 w-8 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex space-x-4">
        {!isProcessing && (
          <>
            <button
              onClick={processImages}
              className="flex-1 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-500 hover:to-red-600 transition-all"
            >
              Enhance {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};