import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-gray-700 dark:text-gray-300">
          {message || 'Loading...'}
        </p>
      </div>
    </div>
  );
};