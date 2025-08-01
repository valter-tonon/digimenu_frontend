'use client';

import React from 'react';
import { FieldError } from '@/hooks/useFormValidation';

export interface FormErrorDisplayProps {
  errors: Record<string, FieldError | null>;
  touched: Record<string, boolean>;
  submitCount: number;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
  showFieldErrors?: boolean;
  showSummary?: boolean;
  maxErrors?: number;
}

const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
  errors,
  touched,
  submitCount,
  onRetry,
  onReset,
  className = '',
  showFieldErrors = true,
  showSummary = true,
  maxErrors = 5
}) => {
  // Get all errors that should be displayed
  const displayErrors = Object.entries(errors)
    .filter(([field, error]) => {
      if (!error) return false;
      
      // Show error if field is touched or form has been submitted
      return touched[field] || submitCount > 0;
    })
    .slice(0, maxErrors);

  // Don't render if no errors
  if (displayErrors.length === 0) {
    return null;
  }

  const hasMultipleErrors = displayErrors.length > 1;

  return (
    <div className={`form-error-display ${className}`}>
      {/* Error Summary */}
      {showSummary && hasMultipleErrors && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {displayErrors.length === 1 
                  ? 'Há um erro no formulário'
                  : `Há ${displayErrors.length} erros no formulário`
                }
              </h3>
              <p className="mt-1 text-xs text-red-700">
                Corrija os campos destacados abaixo para continuar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Field Errors */}
      {showFieldErrors && (
        <div className="space-y-2">
          {displayErrors.map(([field, error]) => (
            <FieldErrorItem
              key={field}
              field={field}
              error={error!}
              onFocus={() => focusField(field)}
            />
          ))}
        </div>
      )}

      {/* Recovery Actions */}
      {(onRetry || onReset) && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tentar Novamente
            </button>
          )}
          
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar Formulário
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface FieldErrorItemProps {
  field: string;
  error: FieldError;
  onFocus: () => void;
}

const FieldErrorItem: React.FC<FieldErrorItemProps> = ({ field, error, onFocus }) => {
  const getFieldLabel = (fieldName: string): string => {
    // Convert camelCase to readable labels
    const labels: Record<string, string> = {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      cpf: 'CPF',
      address: 'Endereço',
      cep: 'CEP',
      city: 'Cidade',
      state: 'Estado',
      number: 'Número',
      complement: 'Complemento',
      neighborhood: 'Bairro',
      paymentMethod: 'Método de Pagamento',
      cardNumber: 'Número do Cartão',
      cardName: 'Nome no Cartão',
      cardExpiry: 'Validade',
      cardCvv: 'CVV',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha'
    };

    return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'required':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'email':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        );
      case 'phone':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'pattern':
      case 'minLength':
      case 'maxLength':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors">
      <div className="flex-shrink-0 text-red-400 mt-0.5">
        {getErrorIcon(error.type)}
      </div>
      
      <div className="ml-3 flex-1">
        <button
          type="button"
          onClick={onFocus}
          className="text-left w-full group focus:outline-none"
        >
          <p className="text-sm font-medium text-red-800 group-hover:text-red-900 group-focus:underline">
            {getFieldLabel(field)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {error.message}
          </p>
        </button>
      </div>
      
      <div className="flex-shrink-0 ml-2">
        <button
          type="button"
          onClick={onFocus}
          className="text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition-colors"
          aria-label={`Ir para o campo ${getFieldLabel(field)}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Utility function to focus a field
function focusField(fieldName: string): void {
  const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
  if (field) {
    field.focus();
    
    // Scroll into view if needed
    field.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Add a temporary highlight effect
    field.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
    setTimeout(() => {
      field.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
    }, 2000);
  }
}

export default FormErrorDisplay;