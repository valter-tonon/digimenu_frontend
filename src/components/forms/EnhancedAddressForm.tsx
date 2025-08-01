'use client';

import React, { useState, useCallback } from 'react';
import { MapPin, Loader2, Home, Building } from 'lucide-react';
import { useFormValidation, ValidationRule } from '@/hooks/useFormValidation';
import FormField, { MASKS } from './FormField';
import FormErrorDisplay from './FormErrorDisplay';
import { addressService } from '@/services/addressService';
import { DeliveryAddress, BRAZILIAN_STATES } from '@/types/address';
import { apiErrorHandler } from '@/services/apiErrorHandler';

export interface EnhancedAddressFormProps {
  onSubmit: (address: DeliveryAddress) => void;
  onCancel?: () => void;
  initialData?: Partial<DeliveryAddress>;
  showSaveOption?: boolean;
  isLoading?: boolean;
  className?: string;
}

const EnhancedAddressForm: React.FC<EnhancedAddressFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  showSaveOption = true,
  isLoading = false,
  className = ''
}) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFound, setCepFound] = useState(false);

  // Form validation configuration
  const formConfig = {
    label: {
      rules: [
        { required: true, message: 'Nome do endereço é obrigatório' },
        { minLength: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
        { maxLength: 50, message: 'Nome deve ter no máximo 50 caracteres' }
      ],
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300
    },
    zip_code: {
      rules: [
        { required: true, message: 'CEP é obrigatório' },
        { cep: true, message: 'CEP deve ter formato válido (00000-000)' }
      ],
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 500
    },
    street: {
      rules: [
        { required: true, message: 'Rua é obrigatória' },
        { minLength: 5, message: 'Nome da rua deve ter pelo menos 5 caracteres' },
        { maxLength: 100, message: 'Nome da rua deve ter no máximo 100 caracteres' }
      ],
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300
    },
    number: {
      rules: [
        { required: true, message: 'Número é obrigatório' },
        { pattern: /^[0-9A-Za-z\s\-\/]+$/, message: 'Número deve conter apenas letras, números, espaços e hífens' },
        { maxLength: 10, message: 'Número deve ter no máximo 10 caracteres' }
      ],
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300
    },
    complement: {
      rules: [
        { maxLength: 50, message: 'Complemento deve ter no máximo 50 caracteres' }
      ],
      validateOnChange: true,
      debounceMs: 300
    },
    neighborhood: {
      rules: [
        { required: true, message: 'Bairro é obrigatório' },
        { minLength: 2, message: 'Nome do bairro deve ter pelo menos 2 caracteres' },
        { maxLength: 50, message: 'Nome do bairro deve ter no máximo 50 caracteres' }
      ],
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300
    },
    city: {
      rules: [
        { required: true, message: 'Cidade é obrigatória' },
        { minLength: 2, message: 'Nome da cidade deve ter pelo menos 2 caracteres' },
        { maxLength: 50, message: 'Nome da cidade deve ter no máximo 50 caracteres' }
      ],
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300
    },
    state: {
      rules: [
        { required: true, message: 'Estado é obrigatório' }
      ],
      validateOnChange: true,
      validateOnBlur: true
    },
    reference: {
      rules: [
        { maxLength: 100, message: 'Ponto de referência deve ter no máximo 100 caracteres' }
      ],
      validateOnChange: true,
      debounceMs: 300
    },
    delivery_instructions: {
      rules: [
        { maxLength: 200, message: 'Instruções devem ter no máximo 200 caracteres' }
      ],
      validateOnChange: true,
      debounceMs: 300
    }
  };

  // Initialize form with validation
  const form = useFormValidation(
    {
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
    },
    formConfig
  );

  // CEP lookup with validation
  const handleCepChange = useCallback(async (cep: string) => {
    form.setValue('zip_code', cep);
    
    const cleanCep = cep.replace(/\D/g, '');
    setCepFound(false);

    if (cleanCep.length === 8) {
      setCepLoading(true);
      
      try {
        const cepData = await apiErrorHandler.executeWithRetry(
          () => addressService.lookupCep(cleanCep),
          { context: 'cep-lookup', showToast: true }
        );
        
        if (cepData) {
          // Update form fields with CEP data
          if (cepData.logradouro) form.setValue('street', cepData.logradouro);
          if (cepData.bairro) form.setValue('neighborhood', cepData.bairro);
          if (cepData.localidade) form.setValue('city', cepData.localidade);
          if (cepData.uf) form.setValue('state', cepData.uf);
          if (cepData.complemento) form.setValue('complement', cepData.complemento);
          
          setCepFound(true);
          apiErrorHandler.showSuccessToast('CEP encontrado com sucesso!');
          
          // Clear any previous CEP errors
          form.setError('zip_code', null);
        }
      } catch (error: any) {
        const apiError = apiErrorHandler.handleError(error, 'cep-lookup');
        form.setError('zip_code', {
          message: apiError.userMessage,
          type: 'api'
        });
      } finally {
        setCepLoading(false);
      }
    }
  }, [form]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const addressData: DeliveryAddress = {
        ...initialData,
        ...values,
        id: initialData?.id
      };

      await onSubmit(addressData);
      apiErrorHandler.showSuccessToast('Endereço salvo com sucesso!');
    } catch (error: any) {
      const apiError = apiErrorHandler.handleError(error, 'address-save');
      throw apiError;
    }
  });

  // Handle form reset
  const handleReset = useCallback(() => {
    form.resetForm();
    setCepFound(false);
    setCepLoading(false);
  }, [form]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    form.clearErrors();
  }, [form]);

  return (
    <div className={`enhanced-address-form ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
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

        {/* Form Error Display */}
        <FormErrorDisplay
          errors={form.errors}
          touched={form.touched}
          submitCount={form.submitCount}
          onRetry={handleRetry}
          onReset={handleReset}
          showSummary={true}
          showFieldErrors={false}
          maxErrors={3}
        />

        {/* Address Label */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Nome do Endereço *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => form.setValue('label', 'Casa')}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                form.values.label === 'Casa' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={form.isSubmitting || isLoading}
            >
              <Home className="w-4 h-4" />
              <span>Casa</span>
            </button>
            <button
              type="button"
              onClick={() => form.setValue('label', 'Trabalho')}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                form.values.label === 'Trabalho' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={form.isSubmitting || isLoading}
            >
              <Building className="w-4 h-4" />
              <span>Trabalho</span>
            </button>
          </div>
          
          <FormField
            name="label"
            label=""
            value={form.values.label}
            onChange={(value) => form.setValue('label', value)}
            onBlur={() => form.setTouched('label', true)}
            error={form.errors.label}
            touched={form.touched.label}
            placeholder="Ou digite um nome personalizado"
            disabled={form.isSubmitting || isLoading}
            maxLength={50}
            showCharCount={true}
          />
        </div>

        {/* CEP Field */}
        <FormField
          name="zip_code"
          label="CEP"
          value={form.values.zip_code}
          onChange={handleCepChange}
          onBlur={() => form.setTouched('zip_code', true)}
          error={form.errors.zip_code}
          touched={form.touched.zip_code}
          placeholder="00000-000"
          required={true}
          disabled={form.isSubmitting || isLoading}
          mask={MASKS.CEP}
          loading={cepLoading}
          rightIcon={cepFound ? (
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : undefined}
          helpText="Digite o CEP para preenchimento automático do endereço"
        />

        {/* Street and Number */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <FormField
              name="street"
              label="Rua"
              value={form.values.street}
              onChange={(value) => form.setValue('street', value)}
              onBlur={() => form.setTouched('street', true)}
              error={form.errors.street}
              touched={form.touched.street}
              placeholder="Nome da rua"
              required={true}
              disabled={form.isSubmitting || isLoading}
              maxLength={100}
            />
          </div>
          <div>
            <FormField
              name="number"
              label="Número"
              value={form.values.number}
              onChange={(value) => form.setValue('number', value)}
              onBlur={() => form.setTouched('number', true)}
              error={form.errors.number}
              touched={form.touched.number}
              placeholder="123"
              required={true}
              disabled={form.isSubmitting || isLoading}
              maxLength={10}
            />
          </div>
        </div>

        {/* Complement */}
        <FormField
          name="complement"
          label="Complemento"
          value={form.values.complement}
          onChange={(value) => form.setValue('complement', value)}
          onBlur={() => form.setTouched('complement', true)}
          error={form.errors.complement}
          touched={form.touched.complement}
          placeholder="Apto, bloco, etc. (opcional)"
          disabled={form.isSubmitting || isLoading}
          maxLength={50}
          helpText="Informações adicionais sobre o endereço"
        />

        {/* Neighborhood */}
        <FormField
          name="neighborhood"
          label="Bairro"
          value={form.values.neighborhood}
          onChange={(value) => form.setValue('neighborhood', value)}
          onBlur={() => form.setTouched('neighborhood', true)}
          error={form.errors.neighborhood}
          touched={form.touched.neighborhood}
          placeholder="Nome do bairro"
          required={true}
          disabled={form.isSubmitting || isLoading}
          maxLength={50}
        />

        {/* City and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="city"
            label="Cidade"
            value={form.values.city}
            onChange={(value) => form.setValue('city', value)}
            onBlur={() => form.setTouched('city', true)}
            error={form.errors.city}
            touched={form.touched.city}
            placeholder="Nome da cidade"
            required={true}
            disabled={form.isSubmitting || isLoading}
            maxLength={50}
          />
          
          <FormField
            name="state"
            label="Estado"
            type="select"
            value={form.values.state}
            onChange={(value) => form.setValue('state', value)}
            onBlur={() => form.setTouched('state', true)}
            error={form.errors.state}
            touched={form.touched.state}
            placeholder="Selecione o estado"
            required={true}
            disabled={form.isSubmitting || isLoading}
            options={BRAZILIAN_STATES.map(state => ({ 
              value: state.code, 
              label: state.name 
            }))}
          />
        </div>

        {/* Reference */}
        <FormField
          name="reference"
          label="Ponto de Referência"
          value={form.values.reference}
          onChange={(value) => form.setValue('reference', value)}
          onBlur={() => form.setTouched('reference', true)}
          error={form.errors.reference}
          touched={form.touched.reference}
          placeholder="Ex: Próximo ao mercado (opcional)"
          disabled={form.isSubmitting || isLoading}
          maxLength={100}
          showCharCount={true}
          helpText="Ajuda o entregador a encontrar o endereço"
        />

        {/* Delivery Instructions */}
        <FormField
          name="delivery_instructions"
          label="Instruções de Entrega"
          type="textarea"
          value={form.values.delivery_instructions}
          onChange={(value) => form.setValue('delivery_instructions', value)}
          onBlur={() => form.setTouched('delivery_instructions', true)}
          error={form.errors.delivery_instructions}
          touched={form.touched.delivery_instructions}
          placeholder="Instruções especiais para o entregador (opcional)"
          disabled={form.isSubmitting || isLoading}
          maxLength={200}
          showCharCount={true}
          rows={3}
          helpText="Ex: Tocar interfone, deixar com porteiro, etc."
        />

        {/* Default Address Option */}
        {showSaveOption && (
          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_default"
              checked={form.values.is_default}
              onChange={(e) => form.setValue('is_default', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={form.isSubmitting || isLoading}
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">
              Definir como endereço padrão
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={form.isSubmitting || isLoading}
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={form.isSubmitting || isLoading || !form.isValid}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {(form.isSubmitting || isLoading) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {initialData?.id ? 'Atualizar Endereço' : 'Salvar Endereço'}
          </button>
        </div>

        {/* Form Status */}
        <div className="text-xs text-gray-500 text-center">
          {form.isDirty && !form.isValid && (
            <span className="text-orange-600">
              Formulário possui erros que precisam ser corrigidos
            </span>
          )}
          {form.isDirty && form.isValid && (
            <span className="text-green-600">
              Formulário válido e pronto para envio
            </span>
          )}
          {!form.isDirty && (
            <span>
              Preencha os campos para continuar
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnhancedAddressForm;