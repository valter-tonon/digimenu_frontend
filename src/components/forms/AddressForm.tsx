'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader2, Home, Building, AlertCircle, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { addressService } from '@/services/addressService';
import { 
  DeliveryAddress, 
  AddressFormData, 
  AddressFormProps,
  BRAZILIAN_STATES 
} from '@/types/address';
import { cn } from '@/lib/utils';

export const AddressForm: React.FC<AddressFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  showSaveOption = true,
  isLoading = false,
  className
}) => {
  const [formData, setFormData] = useState<AddressFormData>({
    label: initialData?.label || 'Casa',
    zip_code: initialData?.zip_code || '',
    street: initialData?.street || '',
    number: initialData?.number || '',
    complement: initialData?.complement || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    reference: initialData?.reference || '',
    delivery_instructions: initialData?.delivery_instructions || '',
    is_default: initialData?.is_default || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Clear errors when field values change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = { ...errors };
      Object.keys(formData).forEach(key => {
        if (newErrors[key]) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  }, [formData]);

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    const formattedCep = addressService.formatCep(cleanCep);
    
    setFormData(prev => ({ ...prev, zip_code: formattedCep }));
    setCepFound(false);

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const cepData = await addressService.lookupCep(cleanCep);
        
        if (cepData) {
          setFormData(prev => ({
            ...prev,
            street: cepData.logradouro || prev.street,
            neighborhood: cepData.bairro || prev.neighborhood,
            city: cepData.localidade || prev.city,
            state: cepData.uf || prev.state,
            complement: cepData.complemento || prev.complement
          }));
          setCepFound(true);
          toast.success('CEP encontrado!');
        }
      } catch (error: any) {
        toast.error(error.message || 'Erro ao buscar CEP');
        setErrors(prev => ({ ...prev, zip_code: error.message || 'CEP não encontrado' }));
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || isLoading) return;

    // Validate form
    const validation = addressService.validateAddress(formData);
    if (!validation.isValid) {
      const fieldErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        fieldErrors[error.field] = error.message;
      });
      setErrors(fieldErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);
    try {
      const addressData: DeliveryAddress = {
        ...initialData,
        ...formData,
        id: initialData?.id
      };

      onSubmit(addressData);
      toast.success('Endereço salvo com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar endereço');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (
    field: keyof AddressFormData,
    label: string,
    placeholder: string,
    type: 'text' | 'select' | 'textarea' = 'text',
    required = false,
    options?: { value: string; label: string }[]
  ) => {
    const hasError = !!errors[field];
    const fieldValue = formData[field];

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {type === 'select' ? (
          <select
            value={fieldValue as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={cn(
              "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              hasError ? "border-red-300 bg-red-50" : "border-gray-300 bg-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={isLoading || submitting}
          >
            <option value="">{placeholder}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={fieldValue as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={cn(
              "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none",
              hasError ? "border-red-300 bg-red-50" : "border-gray-300 bg-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={isLoading || submitting}
          />
        ) : (
          <input
            type={type}
            value={fieldValue as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              hasError ? "border-red-300 bg-red-50" : "border-gray-300 bg-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={isLoading || submitting}
          />
        )}
        
        {hasError && (
          <div className="flex items-center space-x-1 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{errors[field]}</span>
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
          <MapPin className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData?.id ? 'Editar Endereço' : 'Novo Endereço'}
            </h3>
            <p className="text-sm text-gray-600">
              Preencha os dados do endereço de entrega
            </p>
          </div>
        </div>

        {/* Address Label */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Nome do Endereço *
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleInputChange('label', 'Casa')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors",
                formData.label === 'Casa' 
                  ? "border-blue-500 bg-blue-50 text-blue-700" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
              disabled={isLoading || submitting}
            >
              <Home className="w-4 h-4" />
              <span>Casa</span>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('label', 'Trabalho')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors",
                formData.label === 'Trabalho' 
                  ? "border-blue-500 bg-blue-50 text-blue-700" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
              disabled={isLoading || submitting}
            >
              <Building className="w-4 h-4" />
              <span>Trabalho</span>
            </button>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              placeholder="Ou digite um nome"
              className={cn(
                "flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.label ? "border-red-300 bg-red-50" : "border-gray-300"
              )}
              disabled={isLoading || submitting}
            />
          </div>
          {errors.label && (
            <div className="flex items-center space-x-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.label}</span>
            </div>
          )}
        </div>

        {/* CEP Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            CEP *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.zip_code}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={cn(
                "w-full px-3 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                errors.zip_code ? "border-red-300 bg-red-50" : "border-gray-300",
                cepFound && "border-green-300 bg-green-50"
              )}
              disabled={isLoading || submitting}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {cepLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : cepFound ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : null}
            </div>
          </div>
          {errors.zip_code && (
            <div className="flex items-center space-x-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.zip_code}</span>
            </div>
          )}
        </div>

        {/* Street and Number */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            {renderFormField('street', 'Rua', 'Nome da rua', 'text', true)}
          </div>
          <div>
            {renderFormField('number', 'Número', '123', 'text', true)}
          </div>
        </div>

        {/* Complement */}
        {renderFormField('complement', 'Complemento', 'Apto, bloco, etc. (opcional)')}

        {/* Neighborhood */}
        {renderFormField('neighborhood', 'Bairro', 'Nome do bairro', 'text', true)}

        {/* City and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderFormField('city', 'Cidade', 'Nome da cidade', 'text', true)}
          </div>
          <div>
            {renderFormField(
              'state', 
              'Estado', 
              'Selecione o estado', 
              'select', 
              true,
              BRAZILIAN_STATES.map(state => ({ value: state.code, label: state.name }))
            )}
          </div>
        </div>

        {/* Reference */}
        {renderFormField('reference', 'Ponto de Referência', 'Ex: Próximo ao mercado (opcional)')}

        {/* Delivery Instructions */}
        {renderFormField(
          'delivery_instructions', 
          'Instruções de Entrega', 
          'Instruções especiais para o entregador (opcional)', 
          'textarea'
        )}

        {/* Default Address Option */}
        {showSaveOption && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => handleInputChange('is_default', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading || submitting}
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">
              Definir como endereço padrão
            </label>
          </div>
        )}

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
            disabled={isLoading || submitting}
            className="flex-1"
          >
            {(isLoading || submitting) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData?.id ? 'Atualizar Endereço' : 'Salvar Endereço'}
          </ShimmerButton>
        </div>
      </form>
    </MagicCard>
  );
};