'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, CreditCard, AlertCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { cn } from '@/lib/utils';

export interface CustomerData {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
}

export interface CustomerDataFormProps {
  onSubmit: (customerData: CustomerData) => void;
  onCancel?: () => void;
  initialData?: Partial<CustomerData>;
  isLoading?: boolean;
  showOptionalFields?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  general?: string;
}

export const CustomerDataForm: React.FC<CustomerDataFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  showOptionalFields = true,
  className,
  title = 'Dados do Cliente',
  subtitle = 'Preencha seus dados para continuar'
}) => {
  const [formData, setFormData] = useState<CustomerData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    cpf: initialData?.cpf || '',
    birth_date: initialData?.birth_date || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});

  // Clear errors when field values change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = { ...errors };
      Object.keys(formData).forEach(key => {
        if (newErrors[key as keyof FormErrors]) {
          delete newErrors[key as keyof FormErrors];
        }
      });
      setErrors(newErrors);
    }
  }, [formData]);

  // Format phone number
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Format CPF
  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Validate phone number
  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11;
  };

  // Validate email
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate CPF
  const validateCPF = (cpf: string): boolean => {
    if (!cpf) return true; // CPF is optional
    
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(10))) return false;
    
    return true;
  };

  // Validate birth date
  const validateBirthDate = (date: string): boolean => {
    if (!date) return true; // Birth date is optional
    
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    return age >= 0 && age <= 120;
  };

  // Handle input change with real-time validation
  const handleInputChange = (field: keyof CustomerData, value: string) => {
    let formattedValue = value;
    
    // Apply formatting
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Real-time validation
    let isValid = true;
    switch (field) {
      case 'name':
        isValid = value.trim().length >= 2;
        break;
      case 'phone':
        isValid = validatePhone(formattedValue);
        break;
      case 'email':
        isValid = validateEmail(value);
        break;
      case 'cpf':
        isValid = validateCPF(formattedValue);
        break;
      case 'birth_date':
        isValid = validateBirthDate(value);
        break;
    }
    
    setValidationState(prev => ({ ...prev, [field]: isValid }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone deve ter 10 ou 11 dígitos';
    }
    
    // Email validation (optional)
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // CPF validation (optional)
    if (formData.cpf && !validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    // Birth date validation (optional)
    if (formData.birth_date && !validateBirthDate(formData.birth_date)) {
      newErrors.birth_date = 'Data de nascimento inválida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || isLoading) return;
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setSubmitting(true);
    try {
      // Clean data before submission
      const cleanData: CustomerData = {
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''), // Remove formatting
        email: formData.email?.trim() || undefined,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : undefined,
        birth_date: formData.birth_date || undefined
      };
      
      onSubmit(cleanData);
      toast.success('Dados salvos com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar dados');
      setErrors({ general: error.message || 'Erro ao salvar dados' });
    } finally {
      setSubmitting(false);
    }
  };

  // Render form field with validation
  const renderFormField = (
    field: keyof CustomerData,
    label: string,
    placeholder: string,
    type: 'text' | 'email' | 'tel' | 'date' = 'text',
    required = false,
    icon?: React.ReactNode,
    maxLength?: number
  ) => {
    const hasError = !!(errors[field as keyof FormErrors]);
    const isValid = validationState[field];
    const fieldValue = formData[field] || '';
    const fieldId = `${field}-input`;

    return (
      <div className="space-y-1">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            id={fieldId}
            type={type}
            value={fieldValue}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className={cn(
              "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              icon && "pl-10",
              hasError ? "border-red-300 bg-red-50" : 
              isValid && fieldValue ? "border-green-300 bg-green-50" : "border-gray-300 bg-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={isLoading || submitting}
            aria-describedby={hasError ? `${field}-error` : undefined}
            aria-invalid={hasError}
            aria-required={required}
          />
          
          {/* Validation icon */}
          {fieldValue && !hasError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        
        {hasError && (
          <div 
            id={`${field}-error`}
            className="flex items-center space-x-1 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{errors[field as keyof FormErrors]}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <MagicCard className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <User className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name Field */}
          {renderFormField(
            'name',
            'Nome Completo',
            'Digite seu nome completo',
            'text',
            true,
            <User className="w-4 h-4" />,
            100
          )}

          {/* Phone Field */}
          {renderFormField(
            'phone',
            'Telefone',
            '(11) 99999-9999',
            'tel',
            true,
            <Phone className="w-4 h-4" />,
            15
          )}

          {/* Email Field */}
          {renderFormField(
            'email',
            'E-mail',
            'seu@email.com',
            'email',
            false,
            <Mail className="w-4 h-4" />,
            100
          )}

          {/* Optional Fields */}
          {showOptionalFields && (
            <>
              {/* CPF Field */}
              {renderFormField(
                'cpf',
                'CPF',
                '000.000.000-00',
                'text',
                false,
                <CreditCard className="w-4 h-4" />,
                14
              )}

              {/* Birth Date Field */}
              {renderFormField(
                'birth_date',
                'Data de Nascimento',
                '',
                'date',
                false
              )}
            </>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Form Persistence Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 Seus dados são salvos automaticamente durante o processo de checkout
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading || submitting}
            >
              Cancelar
            </button>
          )}
          
          <ShimmerButton
            type="submit"
            disabled={isLoading || submitting || !formData.name || !formData.phone}
            className="flex-1"
          >
            {(isLoading || submitting) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData?.id ? 'Atualizar Dados' : 'Salvar Dados'}
          </ShimmerButton>
        </div>
      </form>
    </MagicCard>
  );
};