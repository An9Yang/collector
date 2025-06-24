import React from 'react';

interface InputProps {
  id: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          px-4 py-2.5 w-full rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200
          ${error 
            ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent'
          }
          ${disabled 
            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' 
            : 'bg-white dark:bg-gray-900/50 backdrop-blur-sm'
          }
          text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
          shadow-sm hover:shadow-md focus:shadow-lg
        `}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;