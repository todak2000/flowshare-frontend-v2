import React from 'react';

interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  icon: Icon,
  disabled = false,
  required = false,
  error,
  helpText,
  min,
  max,
  step,
}) => {
  const hasError = Boolean(error);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-white"
      >
        {label}
        {required && <span className="text-red-400 ml-1" aria-label="required">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helpText ? `${id}-help` : undefined
          }
          aria-required={required}
          className={`
            w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            bg-white/5 backdrop-blur-sm
            border ${hasError ? 'border-red-500' : 'border-white/10'}
            rounded-xl
            text-white
            placeholder-gray-500
            focus:outline-none focus:ring-2
            ${hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
            focus:border-transparent
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      </div>

      {helpText && !error && (
        <p id={`${id}-help`} className="text-xs text-gray-400">
          {helpText}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
