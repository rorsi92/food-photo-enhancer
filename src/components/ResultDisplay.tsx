import React, { useState } from 'react';
import { ProcessingResult } from '../types';

interface ResultDisplayProps {
  results: ProcessingResult[];
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, onReset }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedResult = results[selectedIndex];

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `enhanced_${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    results.forEach((result) => {
      setTimeout(() => {
        downloadImage(result.enhancedUrl, result.fileName);
      }, 500);
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Enhanced Photos
        </h2>
        <button
          onClick={onReset}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          Process New Photos
        </button>
      </div>

      {results.length > 1 && (
        <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 p-1 rounded-lg transition-all ${
                selectedIndex === index
                  ? 'ring-2 ring-orange-500'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              <img
                src={result.enhancedUrl}
                alt={result.fileName}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Original</h3>
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={selectedResult.originalUrl}
              alt="Original"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Enhanced</h3>
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={selectedResult.enhancedUrl}
              alt="Enhanced"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">File:</span>
            <span className="ml-2 text-gray-800 dark:text-white font-medium">
              {selectedResult.fileName}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
            <span className="ml-2 text-gray-800 dark:text-white font-medium">
              {(selectedResult.processingTime / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
        
        {selectedResult.aiAnalysis && (
          <div className="mt-4">
            <span className="text-gray-600 dark:text-gray-400">AI Analysis:</span>
            <p className="mt-1 text-gray-800 dark:text-white text-sm">
              {selectedResult.aiAnalysis.description || 'Enhanced using AI'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => downloadImage(selectedResult.enhancedUrl, selectedResult.fileName)}
          className="flex-1 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-500 hover:to-red-600 transition-all"
        >
          Download Enhanced Photo
        </button>
        {results.length > 1 && (
          <button
            onClick={downloadAll}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Download All ({results.length})
          </button>
        )}
      </div>
    </div>
  );
};