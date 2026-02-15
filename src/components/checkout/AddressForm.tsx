'use client';

import { useState, useCallback } from 'react';
import { Loader2, Plus, MapPin, Search, Star, Home, Building, Check, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Address } from '@/store/checkout-store';
import { validateAddressByCep } from '@/services/customerService';

type AddressWithMeta = Address & { label?: string; is_default?: boolean };

interface AddressFormProps {
  addresses?: AddressWithMeta[];
  selected?: Address | null;
  onSelect: (address: Address) => void;
  disabled?: boolean;
}

interface FormData {
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  reference: string;
}

const getTypeIcon = (label: string | null | undefined) => {
  const lower = (label || '').toLowerCase();
  if (lower.includes('casa') || lower.includes('home')) return <Home className="w-4 h-4" />;
  if (lower.includes('trabalho') || lower.includes('work') || lower.includes('escritório')) return <Building className="w-4 h-4" />;
  return <MapPin className="w-4 h-4" />;
};

/**
 * Componente de endereço para checkout
 *
 * Fluxo:
 * 1. Mostra apenas o endereço padrão (ou primeiro) selecionado + botão "Selecionar outro"
 * 2. "Selecionar outro" exibe os demais endereços + botão "Cadastrar novo"
 * 3. Se não houver endereços, mostra formulário de cadastro direto
 */
export default function AddressForm({
  addresses = [],
  selected,
  onSelect,
  disabled = false,
}: AddressFormProps) {
  // 'selected' = mostra endereço atual | 'choosing' = mostra lista de outros | 'adding' = formulário novo
  const [view, setView] = useState<'selected' | 'choosing' | 'adding'>(
    addresses.length === 0 && !selected ? 'adding' : 'selected'
  );
  const [submitting, setSubmitting] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    label: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', zip_code: '', reference: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatZipCode = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    if (field === 'zip_code') formattedValue = formatZipCode(value);
    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleCepSearch = async () => {
    const cep = formData.zip_code.replace(/\D/g, '');
    if (cep.length !== 8) {
      setErrors(prev => ({ ...prev, zip_code: 'CEP deve ter 8 dígitos' }));
      return;
    }
    setIsSearchingCep(true);
    setErrors(prev => ({ ...prev, zip_code: '' }));
    try {
      const result = await validateAddressByCep(cep);
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          street: result.data!.street || prev.street,
          neighborhood: result.data!.neighborhood || prev.neighborhood,
          city: result.data!.city || prev.city,
          state: result.data!.state || prev.state,
          zip_code: result.data!.zip_code?.replace(/(\d{5})(\d{3})/, '$1-$2') || prev.zip_code,
        }));
        toast.success('CEP encontrado!');
      } else {
        setErrors(prev => ({ ...prev, zip_code: result.message || 'CEP não encontrado' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, zip_code: 'Erro ao consultar CEP' }));
    } finally {
      setIsSearchingCep(false);
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.street.trim()) newErrors.street = 'Rua é obrigatória';
    if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
    if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'CEP é obrigatório';
    } else {
      const numbersOnly = formData.zip_code.replace(/\D/g, '');
      if (numbersOnly.length !== 8) newErrors.zip_code = 'CEP deve ter 8 dígitos';
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
      setView('selected');
      toast.success('Endereço adicionado!');
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      toast.error('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, onSelect, formData]);

  // Endereços que NÃO são o selecionado atualmente
  const otherAddresses = addresses.filter(a => a.id !== selected?.id);

  // Encontrar o endereço selecionado com metadados (label, is_default)
  const selectedWithMeta = addresses.find(a => a.id === selected?.id);

  // ─── VIEW: Endereço selecionado ───
  if (view === 'selected') {
    // Se tem endereço selecionado, mostra ele
    if (selected) {
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Endereço de Entrega</h3>

          {/* Card do endereço atual */}
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-600">
                {getTypeIcon(selectedWithMeta?.label)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {selectedWithMeta?.label || 'Endereço'}
                  </span>
                  {selectedWithMeta?.is_default && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  {selected.street}, {selected.number}
                  {selected.complement && ` - ${selected.complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {selected.neighborhood}, {selected.city} - {selected.state}
                </p>
                {selected.zip_code && (
                  <p className="text-xs text-gray-500">
                    CEP: {selected.zip_code.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Botão "Selecionar outro" - só aparece se houver outros ou possibilidade de cadastrar */}
          <button
            onClick={() => {
              if (otherAddresses.length > 0) {
                setView('choosing');
              } else {
                setFormData({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '', reference: '' });
                setView('adding');
              }
            }}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <MapPin className="w-4 h-4" />
            {otherAddresses.length > 0 ? 'Selecionar outro endereço' : 'Cadastrar novo endereço'}
          </button>
        </div>
      );
    }

    // Sem endereço selecionado e sem endereços salvos → formulário direto
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Endereço de Entrega</h3>
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 text-sm mb-3">Nenhum endereço cadastrado</p>
          <button
            onClick={() => {
              setFormData({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '', reference: '' });
              setView('adding');
            }}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 text-sm"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Endereço
          </button>
        </div>
      </div>
    );
  }

  // ─── VIEW: Escolhendo outro endereço ───
  if (view === 'choosing') {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Selecionar Endereço</h3>

        <div className="space-y-2">
          {otherAddresses.map((addr) => (
            <button
              key={addr.id}
              onClick={() => {
                onSelect(addr);
                setView('selected');
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-amber-300 transition"
              disabled={disabled}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-amber-600">
                  {getTypeIcon(addr.label)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{addr.label || 'Endereço'}</span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {addr.street}, {addr.number}
                    {addr.complement && ` - ${addr.complement}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {addr.neighborhood}, {addr.city} - {addr.state}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              </div>
            </button>
          ))}
        </div>

        {/* Botão cadastrar novo */}
        <button
          onClick={() => {
            setFormData({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '', reference: '' });
            setView('adding');
          }}
          disabled={disabled}
          className="w-full px-4 py-2.5 border border-amber-500 text-amber-600 rounded-lg font-medium hover:bg-amber-50 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Cadastrar novo endereço
        </button>

        {/* Voltar */}
        <button
          onClick={() => setView('selected')}
          disabled={disabled}
          className="w-full px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  // ─── VIEW: Formulário de novo endereço ───
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Novo Endereço de Entrega</h3>

      <div className="bg-white rounded-lg border p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Endereço</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleInputChange('label', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Ex: Casa, Trabalho"
            disabled={submitting || disabled}
          />
        </div>

        {/* CEP com busca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.zip_code}
              onChange={(e) => handleInputChange('zip_code', e.target.value)}
              className={`flex-1 px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.zip_code ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="00000-000"
              disabled={submitting || disabled}
              maxLength={9}
            />
            <button
              type="button"
              onClick={handleCepSearch}
              disabled={isSearchingCep || submitting || disabled}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearchingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="text-sm">Buscar</span>
            </button>
          </div>
          {errors.zip_code && <p className="text-red-600 text-sm mt-1">{errors.zip_code}</p>}
        </div>

        {/* Rua */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
          <input type="text" value={formData.street} onChange={(e) => handleInputChange('street', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.street ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="Ex: Rua das Flores" disabled={submitting || disabled} />
          {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
        </div>

        {/* Número e Complemento */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
            <input type="text" value={formData.number} onChange={(e) => handleInputChange('number', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.number ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Ex: 123" disabled={submitting || disabled} />
            {errors.number && <p className="text-red-600 text-sm mt-1">{errors.number}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input type="text" value={formData.complement} onChange={(e) => handleInputChange('complement', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: Apto 401" disabled={submitting || disabled} />
          </div>
        </div>

        {/* Bairro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
          <input type="text" value={formData.neighborhood} onChange={(e) => handleInputChange('neighborhood', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.neighborhood ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="Ex: Centro" disabled={submitting || disabled} />
          {errors.neighborhood && <p className="text-red-600 text-sm mt-1">{errors.neighborhood}</p>}
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
            <input type="text" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.city ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Ex: São Paulo" disabled={submitting || disabled} />
            {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
            <select value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${errors.state ? 'border-red-300' : 'border-gray-300'}`}
              disabled={submitting || disabled}>
              <option value="">Selecione...</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
              ].map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
          </div>
        </div>

        {/* Referência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de referência</label>
          <input type="text" value={formData.reference} onChange={(e) => handleInputChange('reference', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Ex: Próximo ao supermercado" disabled={submitting || disabled} />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setView(selected ? 'selected' : addresses.length > 0 ? 'choosing' : 'selected')}
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
