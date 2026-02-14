'use client';

import { useState, useCallback } from 'react';
import { Loader2, Plus, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Address } from '@/store/checkout-store';

interface AddressFormProps {
  addresses?: Address[];
  selected?: Address | null;
  onSelect: (address: Address) => void;
  disabled?: boolean;
}

interface FormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

/**
 * Componente reutilizável para seleção e adição de endereço
 */
export default function AddressForm({
  addresses = [],
  selected,
  onSelect,
  disabled = false,
}: AddressFormProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    street: selected?.street || '',
    number: selected?.number || '',
    complement: selected?.complement || '',
    neighborhood: selected?.neighborhood || '',
    city: selected?.city || '',
    state: selected?.state || '',
    zip_code: selected?.zip_code || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatZipCode = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    if (field === 'zip_code') {
      formattedValue = formatZipCode(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

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

    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'CEP é obrigatório';
    } else {
      const numbersOnly = formData.zip_code.replace(/\D/g, '');
      if (numbersOnly.length !== 8) {
        newErrors.zip_code = 'CEP deve ter 8 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);

    try {
      const address: Address = {
        id: Date.now(),
        street: formData.street.trim(),
        number: formData.number.trim(),
        complement: formData.complement.trim() || '',
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim() || '',
        zip_code: formData.zip_code.replace(/\D/g, ''),
      };

      onSelect(address);
      setIsAddingNew(false);
      toast.success('Endereço selecionado!');
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      toast.error('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, onSelect]);

  if (!isAddingNew) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Endereço de Entrega</h3>

        {/* Saved Addresses List */}
        {addresses && addresses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">Seus endereços salvos:</p>
            {addresses.map((address) => (
              <button
                key={address.id}
                onClick={() => onSelect(address)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selected?.id === address.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-amber-300'
                }`}
                disabled={disabled}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-900 font-medium">
                      {address.street}, {address.number}
                      {address.complement && ` - ${address.complement}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.neighborhood}, {address.city} - {address.state}
                    </p>
                    <p className="text-xs text-gray-500">{address.zip_code}</p>
                  </div>
                  {selected?.id === address.id && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Address (if no saved addresses) */}
        {(!addresses || addresses.length === 0) && selected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  {selected.street}, {selected.number}
                  {selected.complement && ` - ${selected.complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {selected.neighborhood}, {selected.city} - {selected.state}
                </p>
                <p className="text-sm text-gray-600">{selected.zip_code}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add/Change Address Button */}
        <button
          onClick={() => setIsAddingNew(true)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-amber-500 text-amber-600 rounded-lg font-medium hover:bg-amber-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {selected && addresses && addresses.length > 0 ? 'Adicionar outro endereço' : selected ? 'Alterar Endereço' : 'Adicionar Endereço'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Endereço de Entrega</h3>

      <div className="bg-white rounded-lg border p-4 space-y-4">
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
            disabled={submitting || disabled}
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
              disabled={submitting || disabled}
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
              disabled={submitting || disabled}
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
              disabled={submitting || disabled}
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
              disabled={submitting || disabled}
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
              disabled={submitting || disabled}
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP *
            </label>
            <input
              type="text"
              value={formData.zip_code}
              onChange={(e) => handleInputChange('zip_code', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.zip_code ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ex: 01234-567"
              disabled={submitting || disabled}
            />
            {errors.zip_code && <p className="text-red-600 text-sm mt-1">{errors.zip_code}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setIsAddingNew(false)}
            disabled={submitting || disabled}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || disabled}
            className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Endereço
          </button>
        </div>
      </div>
    </div>
  );
}
