'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCheckoutSession } from '@/services/checkoutSession';
import { AuthenticationFlow } from './AuthenticationFlow';
import { LoginRegisterModal } from './LoginRegisterModal';
import { User, UserPlus, Phone, LogIn, Shield, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface AuthenticationDecisionProps {
  storeId: string;
  onAuthenticationComplete: (customer: any, isGuest: boolean) => void;
  allowGuestCheckout?: boolean;
  showSessionInfo?: boolean;
}

type DecisionMode = 'initial' | 'phone_flow' | 'login_modal' | 'guest_checkout';

export const AuthenticationDecision: React.FC<AuthenticationDecisionProps> = ({
  storeId,
  onAuthenticationComplete,
  allowGuestCheckout = true,
  showSessionInfo = false
}) => {
  const { isAuthenticated, customer } = useAuth();
  const {
    session,
    setCustomerAuthentication,
    setAuthenticationMethod,
    shouldPromptAuthentication,
    getNextStepAfterAuthentication,
    progressPercentage
  } = useCheckoutSession(storeId);

  const [decisionMode, setDecisionMode] = useState<DecisionMode>('initial');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAuthenticationComplete = useCallback((customerData: any, isGuest: boolean) => {
    const authMethod = isGuest ? 'guest' : (customerData.id ? 'existing_account' : 'new_account');
    
    // Update session with authentication data
    setCustomerAuthentication(customerData, isGuest, authMethod);
    
    // Notify parent component
    onAuthenticationComplete(customerData, isGuest);
    
    toast.success(isGuest ? 'Continuando como visitante' : 'Autenticação realizada com sucesso!');
  }, [setCustomerAuthentication, onAuthenticationComplete]);

  // Check authentication state on mount and when auth changes - FIXED: Evitar loop infinito
  useEffect(() => {
    // Only handle automatic authentication for already logged in users
    if (isAuthenticated && customer?.id && decisionMode === 'initial') {
      // User is already authenticated, complete immediately
      handleAuthenticationComplete(customer, false);
    }
  }, [isAuthenticated, customer?.id, decisionMode]); // Removido handleAuthenticationComplete das dependências

  const handlePhoneAuthentication = () => {
    setAuthenticationMethod('phone');
    setDecisionMode('phone_flow');
  };

  const handleLoginModal = () => {
    setAuthenticationMethod('existing_account');
    setShowLoginModal(true);
  };

  const handleGuestCheckout = () => {
    setAuthenticationMethod('guest');
    setDecisionMode('guest_checkout');
    
    // For guest checkout, we'll collect basic data
    const guestData = {
      name: '',
      phone: '',
      email: ''
    };
    
    handleAuthenticationComplete(guestData, true);
  };

  const handleSkipAuthentication = () => {
    handleGuestCheckout();
  };

  const handleLoginModalSuccess = (customerData: any) => {
    setShowLoginModal(false);
    handleAuthenticationComplete(customerData, false);
  };

  const renderInitialDecision = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Shield className="w-16 h-16 text-amber-600 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Identificação</h2>
          <p className="text-gray-600">
            Como você gostaria de continuar com seu pedido?
          </p>
        </div>

        {/* Session Info */}
        {showSessionInfo && session && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-sm text-amber-800">
              <Clock className="w-4 h-4" />
              <span>Progresso: {Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Authentication Options */}
        <div className="space-y-3">
          {/* Phone Authentication */}
          <button
            onClick={handlePhoneAuthentication}
            className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors group"
          >
            <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold">Identificar por Telefone</div>
              <div className="text-sm opacity-75">Rápido e seguro</div>
            </div>
          </button>

          {/* Login/Register Modal */}
          <button
            onClick={handleLoginModal}
            className="w-full flex items-center justify-center space-x-3 p-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold">Entrar ou Criar Conta</div>
              <div className="text-sm opacity-75">Acesso completo aos recursos</div>
            </div>
          </button>

          {/* Guest Checkout */}
          {allowGuestCheckout && (
            <button
              onClick={handleGuestCheckout}
              className="w-full flex items-center justify-center space-x-3 p-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors group"
              data-testid="guest-btn"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">Continuar como Visitante</div>
                <div className="text-sm opacity-75">Sem necessidade de cadastro</div>
              </div>
            </button>
          )}
        </div>

        {/* Benefits Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Vantagens de se identificar:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Histórico de pedidos</li>
            <li>• Endereços salvos</li>
            <li>• Pedidos mais rápidos</li>
            <li>• Ofertas personalizadas</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPhoneFlow = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setDecisionMode('initial')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Voltar às opções
        </button>
      </div>
      
      <AuthenticationFlow
        storeId={storeId}
        onAuthenticationComplete={handleAuthenticationComplete}
        onSkipAuthentication={handleSkipAuthentication}
        allowGuestCheckout={allowGuestCheckout}
        initialStep="phone_input"
      />
    </div>
  );

  // If user is already authenticated, show success state
  if (isAuthenticated && customer) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bem-vindo de volta!</h3>
          <p className="text-gray-600">{customer.name}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            Você está autenticado e pode continuar com seu pedido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      {decisionMode === 'initial' && renderInitialDecision()}
      {decisionMode === 'phone_flow' && renderPhoneFlow()}
      
      {/* Login/Register Modal */}
      <LoginRegisterModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginModalSuccess}
        storeId={storeId}
        initialMode="login"
      />
    </div>
  );
};