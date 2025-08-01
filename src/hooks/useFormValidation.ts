/**
 * Form Validation Hook
 * Provides real-time form validation with visual feedback and error handling
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  cpf?: boolean;
  cep?: boolean;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface FieldConfig {
  rules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export interface FormConfig {
  [fieldName: string]: FieldConfig;
}

export interface FieldError {
  message: string;
  type: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, FieldError | null>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  submitCount: number;
}

export interface FormActions {
  setValue: (field: string, value: any) => void;
  setError: (field: string, error: FieldError | null) => void;
  setTouched: (field: string, touched: boolean) => void;
  validateField: (field: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  resetForm: (newValues?: Record<string, any>) => void;
  resetField: (field: string) => void;
  handleSubmit: (onSubmit: (values: Record<string, any>) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>;
  clearErrors: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
}

const DEFAULT_MESSAGES = {
  required: 'Este campo é obrigatório',
  email: 'Digite um email válido',
  phone: 'Digite um telefone válido',
  cpf: 'Digite um CPF válido',
  cep: 'Digite um CEP válido',
  minLength: 'Mínimo de {min} caracteres',
  maxLength: 'Máximo de {max} caracteres',
  pattern: 'Formato inválido'
};

export function useFormValidation(
  initialValues: Record<string, any> = {},
  config: FormConfig = {}
): FormState & FormActions {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, FieldError | null>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [baselineValues, setBaselineValues] = useState<Record<string, any>>(initialValues);

  // Computed properties
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => error === null);
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => values[key] !== baselineValues[key]);
  }, [values, baselineValues]);

  // Validation functions
  const validateValue = useCallback((value: any, rules: ValidationRule[]): FieldError | null => {
    for (const rule of rules) {
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return {
          message: rule.message || DEFAULT_MESSAGES.required,
          type: 'required'
        };
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        continue;
      }

      // String-based validations
      if (typeof value === 'string') {
        // Min length validation
        if (rule.minLength && value.length < rule.minLength) {
          return {
            message: rule.message || DEFAULT_MESSAGES.minLength.replace('{min}', rule.minLength.toString()),
            type: 'minLength'
          };
        }

        // Max length validation
        if (rule.maxLength && value.length > rule.maxLength) {
          return {
            message: rule.message || DEFAULT_MESSAGES.maxLength.replace('{max}', rule.maxLength.toString()),
            type: 'maxLength'
          };
        }

        // Email validation
        if (rule.email && !isValidEmail(value)) {
          return {
            message: rule.message || DEFAULT_MESSAGES.email,
            type: 'email'
          };
        }

        // Phone validation
        if (rule.phone && !isValidPhone(value)) {
          return {
            message: rule.message || DEFAULT_MESSAGES.phone,
            type: 'phone'
          };
        }

        // CPF validation
        if (rule.cpf && !isValidCPF(value)) {
          return {
            message: rule.message || DEFAULT_MESSAGES.cpf,
            type: 'cpf'
          };
        }

        // CEP validation
        if (rule.cep && !isValidCEP(value)) {
          return {
            message: rule.message || DEFAULT_MESSAGES.cep,
            type: 'cep'
          };
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
          return {
            message: rule.message || DEFAULT_MESSAGES.pattern,
            type: 'pattern'
          };
        }
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          return {
            message: customError,
            type: 'custom'
          };
        }
      }
    }

    return null;
  }, []);

  const validateField = useCallback(async (field: string): Promise<boolean> => {
    const fieldConfig = config[field];
    if (!fieldConfig?.rules) return true;

    const value = values[field];
    const error = validateValue(value, fieldConfig.rules);
    
    setErrors(prev => ({ ...prev, [field]: error }));
    
    return error === null;
  }, [values, config, validateValue]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors: Record<string, FieldError | null> = {};
    let isFormValid = true;

    for (const field of Object.keys(config)) {
      const fieldConfig = config[field];
      if (fieldConfig?.rules) {
        const value = values[field];
        const error = validateValue(value, fieldConfig.rules);
        newErrors[field] = error;
        if (error) isFormValid = false;
      }
    }

    setErrors(newErrors);
    return isFormValid;
  }, [values, config, validateValue]);

  // Actions
  const setValue = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));

    const fieldConfig = config[field];
    if (fieldConfig?.validateOnChange) {
      const debounceMs = fieldConfig.debounceMs || 300;
      
      // Clear existing timer
      if (debounceTimers[field]) {
        clearTimeout(debounceTimers[field]);
      }

      // Set new timer
      const timer = setTimeout(() => {
        validateField(field);
      }, debounceMs);

      setDebounceTimers(prev => ({ ...prev, [field]: timer }));
    }
  }, [config, validateField, debounceTimers]);

  const setError = useCallback((field: string, error: FieldError | null) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setTouched = useCallback((field: string, touched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: touched }));

    const fieldConfig = config[field];
    if (touched && fieldConfig?.validateOnBlur) {
      validateField(field);
    }
  }, [config, validateField]);

  const resetForm = useCallback((newValues?: Record<string, any>) => {
    const resetValues = newValues || initialValues;
    setValues(resetValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
    setSubmitCount(0);
    
    // Update baseline values for isDirty calculation
    setBaselineValues(resetValues);
    
    // Clear debounce timers
    Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    setDebounceTimers({});
  }, [initialValues, debounceTimers]);

  const resetField = useCallback((field: string) => {
    setValues(prev => ({ ...prev, [field]: initialValues[field] }));
    setErrors(prev => ({ ...prev, [field]: null }));
    setTouchedState(prev => ({ ...prev, [field]: false }));
    
    // Clear debounce timer for this field
    if (debounceTimers[field]) {
      clearTimeout(debounceTimers[field]);
      setDebounceTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[field];
        return newTimers;
      });
    }
  }, [initialValues, debounceTimers]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  const handleSubmit = useCallback((onSubmit: (values: Record<string, any>) => Promise<void> | void) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setIsSubmitting(true);
      setSubmitCount(prev => prev + 1);

      try {
        // Mark all fields as touched
        const allTouched: Record<string, boolean> = {};
        Object.keys(config).forEach(field => {
          allTouched[field] = true;
        });
        setTouchedState(allTouched);

        // Validate form
        const isFormValid = await validateForm();
        
        if (isFormValid) {
          await onSubmit(values);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        // Handle submission error - could set a general form error here
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, config, validateForm]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    };
  }, [debounceTimers]);

  return {
    // State
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    submitCount,
    
    // Actions
    setValue,
    setError,
    setTouched,
    validateField,
    validateForm,
    resetForm,
    resetField,
    handleSubmit,
    clearErrors,
    setSubmitting
  };
}

// Validation helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Brazilian phone number validation
  const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function isValidCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

function isValidCEP(cep: string): boolean {
  // Brazilian postal code validation
  const cepRegex = /^\d{5}-?\d{3}$/;
  return cepRegex.test(cep);
}