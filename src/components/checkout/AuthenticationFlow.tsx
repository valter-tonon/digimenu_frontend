'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWhatsAppAuth } from '@/hooks/use-whatsapp-auth';
import { User, Phone, Mail, Lock, UserPlus, LogIn, Loader2, MessageCircle, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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

type AuthStep = 'decision' | 'phone_input' | 'waiting_verification' | 'authenticated' | 'customer_data' | 'login' | 'register' | 'error';

export const AuthenticationFlow: React.FC<AuthenticationFlowProps> = ({
  storeId,
  onAuthenticationComplete,
  onSkipAuthentication,
  allowGuestCheckout = true,
  initialStep = 'decision'
}) => {
  const { isAuthenticated, customer, login } = useAuth();
  const { state: whatsappState, requestMagicLink, validateStoredAuth, logout: whatsappLogout, reset: resetWhatsApp } = useWhatsAppAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>(initialStep);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [linkExpiresAt, setLinkExpiresAt] = useState<Date | null>(null);

  // Check for existing WhatsApp authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      if (whatsappState.isAuthenticated && whatsappState.user) {
        setCurrentStep('authenticated');
        setCustomerData({
          id: whatsappState.user.id,
          name: whatsappState.user.name,
          phone: whatsappState.user.phone,
          email: whatsappState.user.email || '',
          isExisting: true
        });
      } else if (isAuthenticated && customer) {
        // Fallback to existing auth system
        onAuthenticationComplete(customer, false);
      } else {
        // Check for stored WhatsApp auth
        const isValid = await validateStoredAuth();
        if (isValid && whatsappState.user) {
          setCurrentStep('authenticated');
          setCustomerData({
            id: whatsappState.user.id,
            name: whatsappState.user.name,
            phone: whatsappState.user.phone,
            email: whatsappState.user.email || '',
            isExisting: true
          });
        }
      }
    };

    checkExistingAuth();
  }, [isAuthenticated, customer, onAuthenticationComplete, whatsappState.isAuthenticated, whatsappState.user, validateStoredAuth]);

  // Watch for WhatsApp state changes
  useEffect(() => {
    if (whatsappState.isSuccess && magicLinkSent === false && currentStep === 'phone_input') {
      setMagicLinkSent(true);
      setLinkExpiresAt(whatsappState.expiresAt);
      setCurrentStep('waiting_verification');
      toast.success('Link mágico enviado via WhatsApp!');
    } else if (whatsappState.error && currentStep === 'phone_input') {
      setErrors({ phone: whatsappState.error });
      setCurrentStep('error');
    } else if (whatsappState.isAuthenticated && whatsappState.user && currentStep !== 'authenticated') {
      setCurrentStep('authenticated');
      setCustomerData({
        id: whatsappState.user.id,
        name: whatsappState.user.name,
        phone: whatsappState.user.phone,
        email: whatsappState.user.email || '',
        isExisting: true
      });
    }
  }, [whatsappState.isSuccess, whatsappState.error, whatsappState.isAuthenticated, whatsappState.user, whatsappState.expiresAt, magicLinkSent, currentStep]);

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
    resetWhatsApp();

    if (!validatePhone(customerData.phone)) {
      setErrors({ phone: 'Telefone deve ter pelo menos 10 dígitos' });
      return;
    }

    setLoading(true);
    try {
      const numbersOnly = customerData.phone.replace(/\D/g, '');
      
      // Send WhatsApp magic link
      await requestMagicLink(numbersOnly, storeId);
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      setErrors({ phone: 'Erro ao enviar link mágico. Tente novamente.' });
      setCurrentStep('error');
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

  const handleUseAnotherNumber = () => {
    // Clear WhatsApp auth and reset state
    whatsappLogout();
    setMagicLinkSent(false);
    setLinkExpiresAt(null);
    setCustomerData({
      name: '',
      phone: '',
      email: ''
    });
    setErrors({});
    resetWhatsApp();
    setCurrentStep('phone_input');
    toast.info('Você pode usar outro número agora');
  };

  const handleConfirmAuthenticatedUser = () => {
    if (whatsappState.user) {
      onAuthenticationComplete(whatsappState.user, false);
      toast.success('Autenticação confirmada!');
    }
  };

  const handleRetryMagicLink = async () => {
    if (!customerData.phone) return;
    
    setErrors({});
    resetWhatsApp();
    setMagicLinkSent(false);
    
    await handlePhoneSubmit();
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
        <div className="relative">
          <Phone className="w-12 h-12 text-amber-600 mx-auto" />
          <MessageCircle className="w-6 h-6 text-green-500 absolute -bottom-1 -right-1" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Autenticação via WhatsApp</h2>
        <p className="text-gray-600">Digite seu telefone para receber um link mágico</p>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Como funciona:</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Enviaremos um link seguro para seu WhatsApp</li>
            <li>• Clique no link para se autenticar</li>
            <li>• Volte aqui para continuar seu pedido</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep('decision')}
            className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading || whatsappState.isLoading}
          >
            Voltar
          </button>
          <button
            onClick={handlePhoneSubmit}
            disabled={loading || whatsappState.isLoading || !customerData.phone}
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {(loading || whatsappState.isLoading) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4 mr-2" />
            )}
            Enviar Link
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

  const renderWaitingVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative">
          <MessageCircle className="w-16 h-16 text-green-600 mx-auto" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Link Enviado!</h2>
        <p className="text-gray-600">
          Enviamos um link mágico para seu WhatsApp
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {customerData.phone}
            </span>
          </div>
          
          <div className="text-sm text-green-700">
            <p className="font-medium mb-2">Como continuar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Procure pela mensagem que acabamos de enviar</li>
              <li>Clique no link para se autenticar</li>
              <li>Volte aqui para continuar seu pedido</li>
            </ol>
          </div>

          {linkExpiresAt && (
            <div className="text-xs text-green-600 mt-3">
              Link expira em: {new Date(linkExpiresAt).toLocaleTimeString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          Não recebeu o link? Verifique se o número está correto.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleUseAnotherNumber}
            className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Usar Outro Número
          </button>
          <button
            onClick={handleRetryMagicLink}
            disabled={whatsappState.isLoading}
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {whatsappState.isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Reenviar Link
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuthenticatedStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Autenticado com Sucesso!</h2>
        <p className="text-gray-600">
          Confirme seus dados para continuar
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="space-y-2">
          <p className="text-sm text-green-800">
            <strong>Nome:</strong> {whatsappState.user?.name || customerData.name}
          </p>
          <p className="text-sm text-green-800">
            <strong>Telefone:</strong> {whatsappState.user?.phone || customerData.phone}
          </p>
          {(whatsappState.user?.email || customerData.email) && (
            <p className="text-sm text-green-800">
              <strong>E-mail:</strong> {whatsappState.user?.email || customerData.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleUseAnotherNumber}
          className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Usar Outro Número
        </button>
        <button
          onClick={handleConfirmAuthenticatedUser}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirmar e Continuar
        </button>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">Ops! Algo deu errado</h2>
        <p className="text-gray-600">
          Não conseguimos enviar o link mágico
        </p>
      </div>

      {errors.phone && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{errors.phone}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Possíveis soluções:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Verifique se o número está correto</li>
          <li>• Certifique-se de que tem WhatsApp instalado</li>
          <li>• Tente novamente em alguns segundos</li>
          <li>• Use outro número se necessário</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('phone_input')}
          className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Corrigir Número
        </button>
        <button
          onClick={handleRetryMagicLink}
          disabled={whatsappState.isLoading}
          className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {whatsappState.isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Tentar Novamente
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
      case 'waiting_verification':
        return renderWaitingVerificationStep();
      case 'authenticated':
        return renderAuthenticatedStep();
      case 'customer_data':
        return renderCustomerDataStep();
      case 'login':
        return renderLoginStep();
      case 'error':
        return renderErrorStep();
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
