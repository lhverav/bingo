import { useState, useCallback } from 'react';

export function useFormState(initialValues: Record<string, any> = {}) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);

  const setValue = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setValues = useCallback((values: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, ...values }));
  }, []);

  const getValue = useCallback(
    (field: string) => {
      return formData[field];
    },
    [formData]
  );

  const reset = useCallback((newValues: Record<string, any> = {}) => {
    setFormData(newValues);
  }, []);

  const clear = useCallback(() => {
    setFormData({});
  }, []);

  return {
    formData,
    setValue,
    setValues,
    getValue,
    reset,
    clear,
  };
}
