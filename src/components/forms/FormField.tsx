'use client';

import React, { forwardRef, useState } from 'react';
import { FieldError } from '@/hooks/useFormValidation';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'textarea' | 'select';
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: FieldError | null;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  helpText?: string;
  options?: Array<{ value: any; label: string }>;
  rows?: number;
  maxLength?: number;
  autoComplete?: string;
  mask?: string;
  showCharCount?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(
  ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    onFocus,
    error,
    touched,
    placeholder,
    disabled = false,
    required = false,
    className = '',
    helpText,
    options,
    rows = 3,
    maxLength,
    autoComplete,
    mask,
    showCharCount = false,
    icon,
    rightIcon,
    loading = false,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = touched && error;
    const showSuccess = touched && !error && value;

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let newValue = e.target.value;
      
      // Apply mask if provided
      if (mask && type !== 'textarea' && type !== 'select') {
        newValue = applyMask(newValue, mask);
      }
      
      onChange(newValue);
    };

    const getFieldClasses = () => {
      const baseClasses = `
        w-full px-3 py-2 border rounded-md transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        ${icon ? 'pl-10' : ''}
        ${rightIcon || loading ? 'pr-10' : ''}
      `;

      if (hasError) {
        return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50`;
      }

      if (showSuccess) {
        return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50`;
      }

      if (isFocused) {
        return `${baseClasses} border-blue-300 focus:border-blue-500 focus:ring-blue-200`;
      }

      return `${baseClasses} border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-200`;
    };

    const getLabelClasses = () => {
      const baseClasses = `
        block text-sm font-medium mb-1 transition-colors duration-200
        ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}
      `;

      if (hasError) {
        return `${baseClasses} text-red-700`;
      }

      if (showSuccess) {
        return `${baseClasses} text-green-700`;
      }

      if (isFocused) {
        return `${baseClasses} text-blue-700`;
      }

      return `${baseClasses} text-gray-700`;
    };

    const renderField = () => {
      const fieldProps = {
        id: name,
        name,
        value: value || '',
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        disabled,
        placeholder,
        className: getFieldClasses(),
        maxLength,
        autoComplete,
        'aria-invalid': hasError ? 'true' : 'false',
        'aria-describedby': `${name}-help ${name}-error`,
        ...props
      };

      switch (type) {
        case 'textarea':
          return (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              {...fieldProps}
            />
          );

        case 'select':
          return (
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              {...fieldProps}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        default:
          return (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={type}
              {...fieldProps}
            />
          );
      }
    };

    const renderIcon = (iconElement: React.ReactNode, position: 'left' | 'right') => {
      const positionClasses = position === 'left' 
        ? 'left-3' 
        : 'right-3';

      return (
        <div className={`absolute ${positionClasses} top-1/2 transform -translate-y-1/2 text-gray-400`}>
          {iconElement}
        </div>
      );
    };

    const renderStatusIcon = () => {
      if (loading) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      }

      if (hasError) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      }

      if (showSuccess) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      }

      return null;
    };

    return (
      <div className={`form-field ${className}`}>
        <label htmlFor={name} className={getLabelClasses()}>
          {label}
        </label>

        <div className="relative">
          {icon && renderIcon(icon, 'left')}
          {renderField()}
          {rightIcon && renderIcon(rightIcon, 'right')}
          {!rightIcon && renderStatusIcon()}
        </div>

        {/* Character count */}
        {showCharCount && maxLength && (
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${
              (value?.length || 0) > maxLength * 0.8 
                ? 'text-orange-500' 
                : 'text-gray-500'
            }`}>
              {value?.length || 0}/{maxLength}
            </span>
          </div>
        )}

        {/* Help text */}
        {helpText && !hasError && (
          <p id={`${name}-help`} className="mt-1 text-xs text-gray-500">
            {helpText}
          </p>
        )}

        {/* Error message */}
        {hasError && (
          <div className="mt-1 flex items-center">
            <svg className="h-4 w-4 text-red-500 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p id={`${name}-error`} className="text-xs text-red-600" role="alert">
              {error.message}
            </p>
          </div>
        )}

        {/* Success message */}
        {showSuccess && !hasError && (
          <div className="mt-1 flex items-center">
            <svg className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-green-600">
              Campo válido
            </p>
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;

// Mask utility function
function applyMask(value: string, mask: string): string {
  if (!value || !mask) return value;

  let maskedValue = '';
  let valueIndex = 0;

  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar = mask[i];
    const valueChar = value[valueIndex];

    if (maskChar === '9') {
      // Numeric character
      if (/\d/.test(valueChar)) {
        maskedValue += valueChar;
        valueIndex++;
      } else {
        break;
      }
    } else if (maskChar === 'A') {
      // Alphabetic character
      if (/[a-zA-Z]/.test(valueChar)) {
        maskedValue += valueChar.toUpperCase();
        valueIndex++;
      } else {
        break;
      }
    } else if (maskChar === '*') {
      // Any character
      maskedValue += valueChar;
      valueIndex++;
    } else {
      // Fixed character
      maskedValue += maskChar;
      if (valueChar === maskChar) {
        valueIndex++;
      }
    }
  }

  return maskedValue;
}

// Common mask patterns
export const MASKS = {
  CPF: '999.999.999-99',
  CNPJ: '99.999.999/9999-99',
  PHONE: '(99) 99999-9999',
  CEP: '99999-999',
  DATE: '99/99/9999',
  TIME: '99:99',
  CREDIT_CARD: '9999 9999 9999 9999'
};