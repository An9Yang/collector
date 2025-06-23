import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  error: string | null;
  onClose?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};