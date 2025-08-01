'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckoutSession } from '@/services/checkoutSession';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { useAddressManagement } from '@/hooks/useAddressManagement';
import { toast } from 'react-hot-toast';
import { Loader2, MapPin, Plus, Home, Building2 } from 'lucide-react';

interface AddressFormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  reference: string;
}

export default function CheckoutAddressPage() {
  const router = useRouter();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext();
  const { items: cartItems, deliveryMode } = useCartStore();
  const { session, updateSession, setCurrentStep } = useCheckoutSession(contextData?.storeId);
  const { 
    addresses, 
    selectedAddress, 
    selectAddress, 
    createAddress, 
    isLoading: addressLoading,
    isGuest 
  } = useAddressManagement();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    zipCode: '',
    reference: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verificações iniciais
  useEffect(() => {
    if (contextLoading) return;

    // Verificar se contexto é válido
    if (!contextValid) {
      toast.error('Sessão inválida. Redirecionando...');
      router.push('/');
      return;
    }

    // Verificar se há itens no carrinho
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio. Redirecionando para o menu...');
      router.push('/menu');
      return;
    }

    // Verificar se há sessão de checkout
    if (!session) {
      toast.error('Sessão de checkout não encontrada. Redirecionando...');
      router.push('/checkout/authentication');
      return;
    }

    // Se não é delivery, pular para pagamento
    if (!deliveryMode) {
      router.push('/checkout/payment');
      return;
    }

    // Se é guest mas não tem dados do cliente, voltar
    if (session.isGuest && !session.customerData?.name) {
      router.push('/checkout/customer-data');
      return;
    }

    // Atualizar step atual
    setCurrentStep('address');
    setLoading(false);
  }, [contextLoading, contextValid, cartItems, session, deliveryMode, router, setCurrentStep]);

  // Auto-mostrar formulário se for guest ou não tiver endereços
  useEffect(() => {
    if (!loading && !addressLoading) {
      if (isGuest || addresses.length === 0) {
        setShowAddressForm(true);
      }
    }
  }, [loading, addressLoading, isGuest, addresses.length]);

  // Buscar CEP
  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    setFormData(prev => ({ ...prev, zipCode: cep }));
    
    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city
          }));
          
          // Limpar erros relacionados aos campos preenchidos
          setErrors(prev => {
            const newErrors = { ...prev };
            if (data.logradouro) delete newErrors.street;
            if (data.bairro) delete newErrors.neighborhood;
            if (data.localidade) delete newErrors.city;
            return newErrors;
          });
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast.error('Erro ao buscar CEP');
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleInputChange = (field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAddress = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);

    try {
      const addressData = {
        street: formData.street.trim(),
        number: formData.number.trim(),
        complement: formData.complement.trim(),
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: 'SP', // Você pode adicionar um campo para estado se necessário
        zip_code: formData.zipCode.replace(/\D/g, ''),
        reference: formData.reference.trim(),
        is_default: true,
        label: 'Endereço de Entrega'
      };

      await createAddress(addressData);
      setShowAddressForm(false);
      
      // Continuar para próxima etapa
      router.push('/checkout/payment');
    } catch (error: any) {
      console.error('Erro ao criar endereço:', error);
      toast.error('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectExistingAddress = (address: any) => {
    selectAddress(address);
    router.push('/checkout/payment');
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da etapa */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
          <MapPin className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Endereço de Entrega</h2>
        <p className="text-gray-600">Onde você gostaria de receber seu pedido?</p>
      </div>

      {/* Endereços salvos (apenas para usuários logados) */}
      {!isGuest && addresses.length > 0 && !showAddressForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Endereços Salvos</h3>
            <button
              onClick={() => setShowAddressForm(true)}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Endereço
            </button>
          </div>
          
          <div className="space-y-3">
            {addresses.map((address) => (
              <button
                key={address.id}
                onClick={() => handleSelectExistingAddress(address)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 mt-1">
                    {address.label?.toLowerCase().includes('casa') ? (
                      <Home className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Building2 className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{address.label || 'Endereço'}</p>
                      {address.is_default && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.street}, {address.number}
                      {address.complement && `, ${address.complement}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.neighborhood}, {address.city}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de novo endereço */}
      {showAddressForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isGuest || addresses.length === 0 ? 'Endereço de Entrega' : 'Novo Endereço'}
            </h3>
            {!isGuest && addresses.length > 0 && (
              <button
                onClick={() => setShowAddressForm(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleCepChange(formatZipCode(e.target.value))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="00000-000"
                  maxLength={9}
                  disabled={submitting}
                />
                {cepLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Rua e Número */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua/Avenida *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.street ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome da rua ou avenida"
                  disabled={submitting}
                />
                {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
              </div>
              
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
                  placeholder="123"
                  disabled={submitting}
                />
                {errors.number && <p className="text-red-600 text-sm mt-1">{errors.number}</p>}
              </div>
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => handleInputChange('complement', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Apto, bloco, casa, etc."
                disabled={submitting}
              />
            </div>

            {/* Bairro e Cidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Nome do bairro"
                  disabled={submitting}
                />
                {errors.neighborhood && <p className="text-red-600 text-sm mt-1">{errors.neighborhood}</p>}
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
                  placeholder="Nome da cidade"
                  disabled={submitting}
                />
                {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
              </div>
            </div>

            {/* Referência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ponto de Referência
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Próximo ao mercado, em frente à escola..."
                disabled={submitting}
              />
            </div>
          </div>

          {/* Botão de salvar */}
          <div className="mt-6">
            <button
              onClick={handleCreateAddress}
              disabled={submitting}
              className="w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Continuar para Pagamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}