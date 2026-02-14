export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export const validationRules: Record<string, ValidationRule> = {
  Email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email invalido',
  },
  Contrasena: {
    required: true,
    minLength: 6,
    message: 'Minimo 6 caracteres',
  },
  'Numero de telefono': {
    required: true,
    pattern: /^\+?[0-9]{10,15}$/,
    message: 'Numero invalido',
  },
  'Codigo de verificacion': {
    required: true,
    pattern: /^[0-9]{4,6}$/,
    message: 'Codigo invalido',
  },
  Nombre: {
    required: true,
    minLength: 2,
    message: 'Nombre requerido (minimo 2 caracteres)',
  },
  'Fecha de nacimiento': {
    required: true,
    validator: (value: any) => {
      if (!value) return false;
      const date = new Date(value);
      if (isNaN(date.getTime())) return false;
      const age = calculateAge(date);
      return age >= 18;
    },
    message: 'Debes ser mayor de 18 anos',
  },
};

export function validate(field: string, value: any): ValidationResult {
  const rule = validationRules[field];

  if (!rule) {
    return { valid: true };
  }

  // Check required
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { valid: false, message: rule.message || 'Campo requerido' };
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: true };
  }

  // Check minLength
  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return { valid: false, message: rule.message };
  }

  // Check maxLength
  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return { valid: false, message: rule.message };
  }

  // Check pattern
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return { valid: false, message: rule.message };
  }

  // Check custom validator
  if (rule.validator && !rule.validator(value)) {
    return { valid: false, message: rule.message };
  }

  return { valid: true };
}

export function validateScreen(
  screenName: string,
  formData: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.entries(formData).forEach(([field, value]) => {
    const result = validate(field, value);
    if (!result.valid && result.message) {
      errors[field] = result.message;
    }
  });

  return errors;
}
