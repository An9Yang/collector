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
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
          px-3 py-2 w-full rounded-md border focus:outline-none focus:ring-2 transition-colors
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;