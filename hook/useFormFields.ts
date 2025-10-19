import { useState } from 'react';

export interface FormField {
  id: string;
  key: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  helpText?: string;
}

/**
 * Custom hook for managing form fields with validation
 * @param initialValues - Initial form data
 * @param fieldConfigs - Array of field configurations for validation
 * @returns Object with form state, errors, and validation functions
 */
export function useFormFields<T extends Record<string, any>>(
  initialValues: T,
  fieldConfigs: FormField[]
) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const updateField = (key: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const validateField = (key: keyof T): boolean => {
    const config = fieldConfigs.find((f) => f.key === key);
    if (!config) return true;

    const value = formData[key];

    // Required validation
    if (config.required && !value) {
      setErrors((prev) => ({ ...prev, [key]: `${config.label} is required` }));
      return false;
    }

    // Number range validation
    if (config.type === 'number') {
      const numValue = Number(value);
      if (config.min !== undefined && numValue < config.min) {
        setErrors((prev) => ({
          ...prev,
          [key]: `Minimum value is ${config.min}`,
        }));
        return false;
      }
      if (config.max !== undefined && numValue > config.max) {
        setErrors((prev) => ({
          ...prev,
          [key]: `Maximum value is ${config.max}`,
        }));
        return false;
      }
    }

    // Clear error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
    return true;
  };

  const validateAll = (): boolean => {
    let isValid = true;
    fieldConfigs.forEach((config) => {
      if (!validateField(config.key as keyof T)) {
        isValid = false;
      }
    });
    return isValid;
  };

  const resetForm = () => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  };

  const setFieldError = (key: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [key]: error }));
  };

  const clearFieldError = (key: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  return {
    formData,
    errors,
    touched,
    updateField,
    validateField,
    validateAll,
    resetForm,
    setFieldError,
    clearFieldError,
    setFormData,
  };
}
