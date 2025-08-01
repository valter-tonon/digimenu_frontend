'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { User, Phone, Mail, Lock, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { findCustomerByPhone, quickRegisterCustomer } from '@/services/api';

export interface AuthenticationFlowProps {
  storeId: string;
  onAuthenticationComplete: (customer: any, isGuest: boolean) => void;
  onSkipAuthentication: () => void;
  allowGuestCheckout?: boolean;
  initialStep?: AuthStep;
}

export interface CustomerData {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  isExisting?: boolean;
}

type AuthStep = 'decision' | 'phone_input' | 'customer_data' | 'login' | 'register';

export const AuthenticationFlow: React.FC<AuthenticationFlowProps> = ({
  storeId,
  onAuthenticationComplete,
  onSkipAuthentication,
  allowGuestCheckout = true,
  initialStep = 'decision'
}) => {
  const { isAuthenticated, customer, login } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>(initialStep);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If already authenticated, complete immediately
  useEffect(() => {
    if (isAuthenticated && customer) {
      onAuthenticationComplete(customer, false);
    }
  }, [isAuthenticated, customer, onAuthenticationComplete]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10;
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePhoneSubmit = async () => {
    setErrors({});

    if (!validatePhone(customerData.phone)) {
      setErrors({ phone: 'Telefone deve ter pelo menos 10 dígitos' });
      return;
    }

    setLoading(true);
    try {
      const numbersOnly = customerData.phone.replace(/\D/g, '');
      const response = await findCustomerByPhone(numbersOnly, storeId);

      if (response.data?.success && response.data?.data) {
        // Existing customer found
        const existingCustomer = response.data.data;
        setCustomerData({
          ...customerData,
          id: existingCustomer.id,
          name: existingCustomer.name || '',
          email: existingCustomer.email || '',
          isExisting: true
        });
        setCurrentStep('login');
      } else {
        // New customer
        setCustomerData({ ...customerData, isExisting: false });
        setCurrentStep('customer_data');
      }
    } catch (error) {
      console.warn('Customer not found, proceeding as new customer:', error);
      setCustomerData({ ...customerData, isExisting: false });
      setCurrentStep('customer_data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerDataSubmit = async () => {
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!customerData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (customerData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!validatePhone(customerData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (customerData.email && !validateEmail(customerData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const numbersOnly = customerData.phone.replace(/\D/g, '');

      const response = await quickRegisterCustomer({
        name: customerData.name.trim(),
        phone: numbersOnly,
        email: customerData.email?.trim() || undefined,
        tenant_id: storeId
      });

      if (response.data?.success && response.data?.data) {
        const newCustomer = response.data.data;
        toast.success('Cliente cadastrado com sucesso!');
        onAuthenticationComplete(newCustomer, true);
      } else {
        throw new Error(response.data?.message || 'Erro ao cadastrar cliente');
      }
    } catch (error: any) {
      console.error('Error registering customer:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao cadastrar cliente';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleExistingCustomerLogin = async () => {
    if (!customerData.id) return;

    setLoading(true);
    try {
      // For existing customers, we'll use the quick identification flow
      // In a real app, this might involve SMS verification or other auth methods
      const numbersOnly = customerData.phone.replace(/\D/g, '');
      const response = await findCustomerByPhone(numbersOnly, storeId);

      if (response.data?.success && response.data?.data) {
        toast.success('Cliente identificado com sucesso!');
        onAuthenticationComplete(response.data.data, false);
      } else {
        throw new Error('Cliente não encontrado');
      }
    } catch (error: any) {
      console.error('Error identifying customer:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao identificar cliente';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderDecisionStep = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <User className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">Como deseja continuar?</h2>
        <p className="text-gray-600">Escolha uma opção para finalizar seu pedido</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setCurrentStep('phone_input')}
          className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
        >
          <Phone className="w-5 h-5" />
          <span className="font-medium">Identificar por Telefone</span>
        </button>

        {allowGuestCheckout && (
          <button
            onClick={onSkipAuthentication}
            className="w-full flex items-center justify-center space-x-3 p-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Continuar como Visitante</span>
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Clientes cadastrados têm acesso ao histórico de pedidos e endereços salvos
      </p>
    </div>
  );

  const renderPhoneInputStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Phone className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">Identificação</h2>
        <p className="text-gray-600">Digite seu telefone para continuar</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="tel"
              value={customerData.phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setCustomerData({ ...customerData, phone: formatted });
                setErrors({ ...errors, phone: '' });
              }}
              placeholder="(11) 99999-9999"
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 placeholder-gray-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep('decision')}
            className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Voltar
          </button>
          <button
            onClick={handlePhoneSubmit}
            disabled={loading || !customerData.phone}
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continuar
          </button>
        </div>
      </div>
    </div>
  );

  const renderCustomerDataStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <UserPlus className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">Novo Cliente</h2>
        <p className="text-gray-600">Complete seus dados para continuar</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            value={customerData.name}
            onChange={(e) => {
              setCustomerData({ ...customerData, name: e.target.value });
              setErrors({ ...errors, name: '' });
            }}
            placeholder="Seu nome completo"
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 placeholder-gray-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="tel"
              value={customerData.phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setCustomerData({ ...customerData, phone: formatted });
                setErrors({ ...errors, phone: '' });
              }}
              placeholder="(11) 99999-9999"
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 placeholder-gray-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail (opcional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="email"
              value={customerData.email}
              onChange={(e) => {
                setCustomerData({ ...customerData, email: e.target.value });
                setErrors({ ...errors, email: '' });
              }}
              placeholder="seu@email.com"
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 placeholder-gray-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep('phone_input')}
            className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Voltar
          </button>
          <button
            onClick={handleCustomerDataSubmit}
            disabled={loading || !customerData.name || !customerData.phone}
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoginStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <LogIn className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">Cliente Encontrado</h2>
        <p className="text-gray-600">Confirme seus dados para continuar</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="space-y-2">
          <p className="text-sm text-amber-800">
            <strong>Nome:</strong> {customerData.name}
          </p>
          <p className="text-sm text-amber-800">
            <strong>Telefone:</strong> {customerData.phone}
          </p>
          {customerData.email && (
            <p className="text-sm text-amber-800">
              <strong>E-mail:</strong> {customerData.email}
            </p>
          )}
        </div>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('phone_input')}
          className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Voltar
        </button>
        <button
          onClick={handleExistingCustomerLogin}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Continuar
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'decision':
        return renderDecisionStep();
      case 'phone_input':
        return renderPhoneInputStep();
      case 'customer_data':
        return renderCustomerDataStep();
      case 'login':
        return renderLoginStep();
      default:
        return renderDecisionStep();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {renderCurrentStep()}
    </div>
  );
};
