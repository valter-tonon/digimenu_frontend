'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckoutSession } from '@/services/checkoutSession';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'react-hot-toast';
import { Loader2, User, Phone, Mail } from 'lucide-react';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
}

export default function CheckoutCustomerDataPage() {
  const router = useRouter();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext();
  const { items: cartItems } = useCartStore();
  const { session, updateSession, setCurrentStep } = useCheckoutSession(contextData?.storeId);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verificações iniciais e carregamento de dados da sessão
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

    // Se não é guest, redirecionar para endereço
    if (!session.isGuest && session.isAuthenticated) {
      router.push('/checkout/address');
      return;
    }

    // Se é guest mas não passou pela autenticação, voltar
    if (!session.isGuest && !session.isAuthenticated) {
      router.push('/checkout/authentication');
      return;
    }

    // Carregar dados existentes da sessão
    if (session.customerData) {
      setFormData({
        name: session.customerData.name || '',
        phone: session.customerData.phone || '',
        email: session.customerData.email || ''
      });
    }

    setLoading(false);
  }, [contextLoading, contextValid, cartItems.length, router]);

  // Atualizar step atual em useEffect separado
  useEffect(() => {
    if (!loading && session && session.currentStep !== 'customer_data') {
      setCurrentStep('customer_data');
    }
  }, [loading, session?.currentStep, setCurrentStep]);

  // Formatação de telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
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

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else {
      const numbersOnly = formData.phone.replace(/\D/g, '');
      if (numbersOnly.length < 10) {
        newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
      }
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);

    try {
      // Atualizar sessão com dados do cliente
      const updatedSession = updateSession({
        customerData: {
          name: formData.name.trim(),
          phone: formData.phone.replace(/\D/g, ''), // Salvar apenas números
          email: formData.email.trim() || undefined
        }
      });

      if (updatedSession) {
        toast.success('Dados salvos com sucesso!');
        router.push('/checkout/address');
      } else {
        throw new Error('Erro ao salvar dados na sessão');
      }
    } catch (error: any) {
      console.error('Erro ao salvar dados do cliente:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
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
          <User className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Seus Dados</h2>
        <p className="text-gray-600">Precisamos de algumas informações para finalizar seu pedido</p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Seu nome completo"
                disabled={submitting}
                data-testid="customer-name"
              />
            </div>
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="(11) 99999-9999"
                disabled={submitting}
                data-testid="customer-phone"
              />
            </div>
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail (opcional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
                disabled={submitting}
                data-testid="customer-email"
              />
            </div>
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Botão de continuar */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            data-testid="continue-btn"
          >
            {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Continuar para Endereço
          </button>
        </div>

        {/* Informação sobre privacidade */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Seus dados são utilizados apenas para processar seu pedido e não são compartilhados com terceiros.
          </p>
        </div>
      </div>
    </div>
  );
}