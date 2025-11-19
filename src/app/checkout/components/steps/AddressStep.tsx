'use client';

import { useState, useCallback } from 'react';
import { CheckoutState, Address } from '@/services/checkoutStateMachine';
import { toast } from 'react-hot-toast';
import { Loader2, MapPin, Plus, Check } from 'lucide-react';

interface AddressStepProps {
  state: CheckoutState;
  onNextStep: () => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
  onSetAddress: (address: Address) => void;
  onMarkStepComplete: (step: 'address') => void;
}

interface FormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  reference: string;
}

/**
 * Step de seleção/adição de endereço de entrega
 *
 * Responsabilidades:
 * - Exibir endereços salvos
 * - Permitir selecionar endereço existente
 * - Permitir adicionar novo endereço
 * - Validar dados de endereço
 * - Salvar endereço no estado global
 */
export default function AddressStep({
  state,
  onNextStep,
  onSetLoading,
  onSetError,
  onSetAddress,
  onMarkStepComplete,
}: AddressStepProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    street: state.selectedAddress?.street || '',
    number: state.selectedAddress?.number || '',
    complement: state.selectedAddress?.complement || '',
    neighborhood: state.selectedAddress?.neighborhood || '',
    city: state.selectedAddress?.city || '',
    state: state.selectedAddress?.state || '',
    zipCode: state.selectedAddress?.zipCode || '',
    reference: state.selectedAddress?.reference || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Format CEP
  const formatZipCode = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  }, []);

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    if (field === 'zipCode') {
      formattedValue = formatZipCode(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // Clear error
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else {
      const numbersOnly = formData.zipCode.replace(/\D/g, '');
      if (numbersOnly.length !== 8) {
        newErrors.zipCode = 'CEP deve ter 8 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);
    onSetLoading(true);

    try {
      const address: Address = {
        street: formData.street.trim(),
        number: formData.number.trim(),
        complement: formData.complement.trim() || undefined,
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim() || undefined,
        zipCode: formData.zipCode.replace(/\D/g, ''),
        reference: formData.reference.trim() || undefined,
      };

      onSetAddress(address);
      onMarkStepComplete('address');

      console.log('✅ Endereço salvo:', address);
      toast.success('Endereço salvo com sucesso!');

      setTimeout(() => {
        onNextStep();
      }, 500);
    } catch (error: any) {
      console.error('❌ Erro ao salvar endereço:', error);
      onSetError(error?.message || 'Erro ao salvar endereço');
      toast.error('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setSubmitting(false);
      onSetLoading(false);
    }
  }, [validateForm, onSetAddress, onMarkStepComplete, onNextStep, onSetLoading, onSetError]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
          <MapPin className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Endereço de Entrega</h2>
        <p className="text-gray-600">Onde você gostaria de receber seu pedido?</p>
      </div>

      {/* Address Form */}
      {isAddingNew && (
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          {/* Street */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rua *
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.street ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ex: Rua das Flores"
              disabled={submitting}
            />
            {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
          </div>

          {/* Number and Complement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: 123"
                disabled={submitting}
              />
              {errors.number && <p className="text-red-600 text-sm mt-1">{errors.number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento (opcional)
              </label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => handleInputChange('complement', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Apto 401"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Neighborhood and City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.neighborhood ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Centro"
                disabled={submitting}
              />
              {errors.neighborhood && (
                <p className="text-red-600 text-sm mt-1">{errors.neighborhood}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: São Paulo"
                disabled={submitting}
              />
              {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* State and ZipCode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado (opcional)
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: SP"
                disabled={submitting}
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP *
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.zipCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: 01234-567"
                disabled={submitting}
              />
              {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ponto de referência (opcional)
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: Próximo ao parque"
              disabled={submitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsAddingNew(false)}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Endereço
            </button>
          </div>
        </div>
      )}

      {/* Show form or add button */}
      {!isAddingNew && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center text-gray-600 py-8">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="mb-4">Nenhum endereço selecionado</p>
            <button
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600"
            >
              <Plus className="w-5 h-5" />
              Adicionar Endereço
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
