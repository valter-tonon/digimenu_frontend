'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckoutState, Address } from '@/services/checkoutStateMachine';
import { toast } from 'react-hot-toast';
import { Loader2, MapPin, Plus, Check, Search, Star, Home, Building, ChevronRight } from 'lucide-react';
import { whatsappAuthService } from '@/services/whatsappAuth';
import {
  getCustomerAddresses,
  validateAddressByCep,
  findCustomerByPhone,
  addCustomerAddress,
  type CustomerAddress,
} from '@/services/customerService';

interface AddressStepProps {
  state: CheckoutState;
  onNextStep: () => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
  onSetAddress: (address: Address) => void;
  onMarkStepComplete: (step: 'address') => void;
}

interface FormData {
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  reference: string;
}

const getTypeIcon = (label: string | null | undefined) => {
  const lower = (label || '').toLowerCase();
  if (lower.includes('casa') || lower.includes('home')) return <Home className="w-4 h-4" />;
  if (lower.includes('trabalho') || lower.includes('work') || lower.includes('escritório')) return <Building className="w-4 h-4" />;
  return <MapPin className="w-4 h-4" />;
};

/**
 * Step de seleção/adição de endereço de entrega
 *
 * Fluxo:
 * 1. Mostra apenas o endereço padrão (ou primeiro) já selecionado + "Selecionar outro"
 * 2. "Selecionar outro" exibe os demais endereços + "Cadastrar novo"
 * 3. Se não houver endereços, formulário de cadastro direto
 */
export default function AddressStep({
  state,
  onNextStep,
  onSetLoading,
  onSetError,
  onSetAddress,
  onMarkStepComplete,
}: AddressStepProps) {
  // 'selected' = mostra endereço atual | 'choosing' = lista de outros | 'adding' = formulário
  const [view, setView] = useState<'selected' | 'choosing' | 'adding'>('selected');
  const [submitting, setSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [resolvedCustomerId, setResolvedCustomerId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    label: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', zipCode: '', reference: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resolver customer ID e carregar endereços salvos
  useEffect(() => {
    const loadSavedAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const storedAuth = whatsappAuthService.getStoredAuth();
        const phone = storedAuth?.user?.phone;
        const tenantId = storedAuth?.user?.tenant_id;

        if (!phone) {
          setView('adding');
          setLoadingAddresses(false);
          return;
        }

        const customerResult = await findCustomerByPhone(phone, tenantId);
        if (!customerResult.success || !customerResult.data?.id) {
          setView('adding');
          setLoadingAddresses(false);
          return;
        }

        const customerId = customerResult.data.id;
        setResolvedCustomerId(customerId);

        const addressResult = await getCustomerAddresses(customerId);
        if (addressResult.success && addressResult.data && addressResult.data.length > 0) {
          setSavedAddresses(addressResult.data);

          // Auto-selecionar endereço padrão ou primeiro
          const defaultAddr = addressResult.data.find(a => a.is_default) || addressResult.data[0];
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
            onSetAddress(mapToAddress(defaultAddr));
            setView('selected');
          }
        } else {
          // Sem endereços → formulário direto
          setView('adding');
        }
      } catch (err) {
        console.error('Erro ao carregar endereços:', err);
        setView('adding');
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadSavedAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapToAddress = (addr: CustomerAddress): Address => ({
    id: String(addr.id),
    street: addr.street,
    number: addr.number,
    complement: addr.complement || undefined,
    neighborhood: addr.neighborhood,
    city: addr.city,
    state: addr.state || undefined,
    zipCode: addr.zip_code?.replace(/\D/g, '') || '',
    reference: addr.reference || undefined,
    isDefault: addr.is_default,
  });

  const handleCepSearch = async () => {
    const cep = formData.zipCode.replace(/\D/g, '');
    if (cep.length !== 8) {
      setErrors(prev => ({ ...prev, zipCode: 'CEP deve ter 8 dígitos' }));
      return;
    }
    setIsSearchingCep(true);
    setErrors(prev => ({ ...prev, zipCode: '' }));
    try {
      const result = await validateAddressByCep(cep);
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          street: result.data!.street || prev.street,
          neighborhood: result.data!.neighborhood || prev.neighborhood,
          city: result.data!.city || prev.city,
          state: result.data!.state || prev.state,
          zipCode: result.data!.zip_code?.replace(/(\d{5})(\d{3})/, '$1-$2') || prev.zipCode,
        }));
        toast.success('CEP encontrado!');
      } else {
        setErrors(prev => ({ ...prev, zipCode: result.message || 'CEP não encontrado' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, zipCode: 'Erro ao consultar CEP' }));
    } finally {
      setIsSearchingCep(false);
    }
  };

  const formatZipCode = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    if (field === 'zipCode') formattedValue = formatZipCode(value);
    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.street.trim()) newErrors.street = 'Rua é obrigatória';
    if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
    if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else if (formData.zipCode.replace(/\D/g, '').length !== 8) {
      newErrors.zipCode = 'CEP deve ter 8 dígitos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Confirmar endereço selecionado e avançar
  const handleConfirmSelected = useCallback(() => {
    if (!selectedAddress) {
      toast.error('Selecione um endereço');
      return;
    }
    onMarkStepComplete('address');
    toast.success('Endereço selecionado!');
    setTimeout(() => onNextStep(), 300);
  }, [selectedAddress, onMarkStepComplete, onNextStep]);

  // Selecionar outro endereço da lista
  const handleSelectOther = useCallback((addr: CustomerAddress) => {
    setSelectedAddress(addr);
    onSetAddress(mapToAddress(addr));
    setView('selected');
  }, [onSetAddress]);

  // Submeter novo endereço
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

      // Salvar no backend
      if (resolvedCustomerId) {
        try {
          await addCustomerAddress(resolvedCustomerId, {
            label: formData.label.trim() || 'Endereço',
            street: formData.street.trim(),
            number: formData.number.trim(),
            complement: formData.complement.trim(),
            neighborhood: formData.neighborhood.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            zip_code: formData.zipCode.replace(/\D/g, ''),
            reference: formData.reference.trim(),
            is_default: savedAddresses.length === 0,
          });
        } catch {
          console.warn('Não foi possível salvar endereço no backend');
        }
      }

      onSetAddress(address);
      onMarkStepComplete('address');
      toast.success('Endereço salvo com sucesso!');
      setTimeout(() => onNextStep(), 500);
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      onSetError(error?.message || 'Erro ao salvar endereço');
      toast.error('Erro ao salvar endereço.');
    } finally {
      setSubmitting(false);
      onSetLoading(false);
    }
  }, [validateForm, formData, resolvedCustomerId, savedAddresses.length, onSetAddress, onMarkStepComplete, onNextStep, onSetLoading, onSetError]);

  const otherAddresses = savedAddresses.filter(a => a.id !== selectedAddress?.id);

  // ─── LOADING ───
  if (loadingAddresses) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
            <MapPin className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Endereço de Entrega</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin mr-2" />
          <span className="text-gray-600">Carregando endereços...</span>
        </div>
      </div>
    );
  }

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

      {/* ─── VIEW: Endereço selecionado ─── */}
      {view === 'selected' && selectedAddress && (
        <div className="space-y-3">
          {/* Card do endereço atual */}
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-600">
                {getTypeIcon(selectedAddress.label)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{selectedAddress.label || 'Endereço'}</span>
                  {selectedAddress.is_default && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  {selectedAddress.street}, {selectedAddress.number}
                  {selectedAddress.complement && ` - ${selectedAddress.complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAddress.neighborhood}, {selectedAddress.city} - {selectedAddress.state}
                </p>
                {selectedAddress.zip_code && (
                  <p className="text-xs text-gray-500">
                    CEP: {selectedAddress.zip_code.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Selecionar outro ou cadastrar */}
          <button
            onClick={() => {
              if (otherAddresses.length > 0) {
                setView('choosing');
              } else {
                setFormData({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', reference: '' });
                setView('adding');
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
          >
            <MapPin className="w-4 h-4" />
            {otherAddresses.length > 0 ? 'Selecionar outro endereço' : 'Cadastrar novo endereço'}
          </button>

          {/* Confirmar e avançar */}
          <button
            onClick={handleConfirmSelected}
            className="w-full px-4 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Usar este Endereço
          </button>
        </div>
      )}

      {/* ─── VIEW: Escolhendo outro endereço ─── */}
      {view === 'choosing' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Selecione um endereço:</p>

          {otherAddresses.map((addr) => (
            <button
              key={addr.id}
              onClick={() => handleSelectOther(addr)}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-amber-300 transition"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-amber-600">{getTypeIcon(addr.label)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{addr.label || 'Endereço'}</span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Padrão
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

          <button
            onClick={() => {
              setFormData({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', reference: '' });
              setView('adding');
            }}
            className="w-full px-4 py-2.5 border border-amber-500 text-amber-600 rounded-lg font-medium hover:bg-amber-50 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Cadastrar novo endereço
          </button>

          <button
            onClick={() => setView('selected')}
            className="w-full px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            Voltar
          </button>
        </div>
      )}

      {/* ─── VIEW: Sem endereços → form direto ─── */}
      {view === 'selected' && !selectedAddress && savedAddresses.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 text-sm mb-3">Nenhum endereço cadastrado</p>
          <button
            onClick={() => {
              setFormData({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', reference: '' });
              setView('adding');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 text-sm"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Endereço
          </button>
        </div>
      )}

      {/* ─── VIEW: Formulário de novo endereço ─── */}
      {view === 'adding' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Novo Endereço</h3>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Endereço</label>
            <input type="text" value={formData.label} onChange={(e) => handleInputChange('label', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: Casa, Trabalho" disabled={submitting} />
          </div>

          {/* CEP com busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
            <div className="flex gap-2">
              <input type="text" value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className={`flex-1 px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.zipCode ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="00000-000" disabled={submitting} maxLength={9} />
              <button type="button" onClick={handleCepSearch} disabled={isSearchingCep || submitting}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isSearchingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="text-sm">Buscar</span>
              </button>
            </div>
            {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
          </div>

          {/* Rua */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
            <input type="text" value={formData.street} onChange={(e) => handleInputChange('street', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.street ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Ex: Rua das Flores" disabled={submitting} />
            {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
              <input type="text" value={formData.number} onChange={(e) => handleInputChange('number', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.number ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Ex: 123" disabled={submitting} />
              {errors.number && <p className="text-red-600 text-sm mt-1">{errors.number}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input type="text" value={formData.complement} onChange={(e) => handleInputChange('complement', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Apto 401" disabled={submitting} />
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
            <input type="text" value={formData.neighborhood} onChange={(e) => handleInputChange('neighborhood', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.neighborhood ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Ex: Centro" disabled={submitting} />
            {errors.neighborhood && <p className="text-red-600 text-sm mt-1">{errors.neighborhood}</p>}
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
              <input type="text" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.city ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Ex: São Paulo" disabled={submitting} />
              {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${errors.state ? 'border-red-300' : 'border-gray-300'}`}
                disabled={submitting}>
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
              placeholder="Ex: Próximo ao supermercado" disabled={submitting} />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {(savedAddresses.length > 0) && (
              <button
                onClick={() => setView(selectedAddress ? 'selected' : 'selected')}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Voltar
              </button>
            )}
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
    </div>
  );
}
