import { useState, useCallback } from 'react';
import { validate, ValidationResult } from '../validation/rules';

export function useValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: any): ValidationResult => {
    const result = validate(field, value);

    setErrors((prev) => {
      if (result.valid) {
        const { [field]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [field]: result.message || 'Error' };
      }
    });

    return result;
  }, []);

  const validateFields = useCallback((formData: Record<string, any>): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(formData).forEach(([field, value]) => {
      const result = validate(field, value);
      if (!result.valid && result.message) {
        newErrors[field] = result.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    errors,
    validateField,
    validateFields,
    clearErrors,
    clearError,
  };
}
