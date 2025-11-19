'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckoutStateMachine } from '@/hooks/useCheckoutStateMachine';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { toast } from 'react-hot-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import CheckoutHeader from './CheckoutHeader';
import CheckoutStepRouter from './CheckoutStepRouter';
import CheckoutNavigation from './CheckoutNavigation';
import ConfirmIdentityModal from './modals/ConfirmIdentityModal';

/**
 * Componente raiz do wizard de checkout
 *
 * Gerencia:
 * - Inicialização da máquina de estados
 * - Validações de entrada (contexto, carrinho, autenticação)
 * - Renderização condicional de steps
 * - Navegação entre steps
 * - Persistência de dados
 */
export default function CheckoutWizard() {
  const router = useRouter();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext();
  const { items: cartItems } = useCartStore();

  const {
    state,
    goToStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
    initSession,
    setJWT,
    setAuthentication,
    setCustomerData,
    setAddress,
    setPaymentMethod,
    markStepComplete,
    setLoading,
    setError,
    reset,
    showAuthModal,
    confirmIdentity,
  } = useCheckoutStateMachine();

  const [initialized, setInitialized] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // CAMADA 1: Validação de Contexto e Carrinho
  useEffect(() => {
    if (contextLoading) return;

    // Validar contexto
    if (!contextValid) {
      console.log('❌ Contexto inválido no CheckoutWizard');
      setValidationError('Sessão inválida. Redirecionando...');
      toast.error('Sessão inválida.');
      setTimeout(() => router.push('/'), 2000);
      return;
    }

    // Validar carrinho
    if (cartItems.length === 0) {
      console.log('❌ Carrinho vazio no CheckoutWizard');
      setValidationError('Carrinho vazio. Redirecionando...');
      toast.error('Carrinho vazio.');
      setTimeout(() => router.push('/menu'), 2000);
      return;
    }

    // Se passou nas validações, inicializar o wizard
    if (!initialized) {
      console.log('✅ Validações passadas, inicializando wizard...');
      initSession(contextData?.storeId || '', contextData?.customerId);
      setInitialized(true);
    }
  }, [contextLoading, contextValid, cartItems.length, contextData, initialized, initSession, router]);

  // CAMADA 2: Validação e Restauração de Autenticação
  useEffect(() => {
    if (!initialized) return;

    // Sempre verificar se há JWT válido
    const jwt = whatsappAuthService.getCurrentJWT();

    // Se há JWT mas estado não tem autenticação restaurada, restaurar agora
    if (jwt && !state.isAuthenticated) {
      console.log('🔄 JWT encontrado, restaurando autenticação...');
      const storedAuth = whatsappAuthService.getStoredAuth();
      if (storedAuth) {
        console.log('✅ Autenticação restaurada do storage');
        setJWT(jwt);
        setAuthentication(storedAuth.user, false, 'whatsapp');
      }
      return;
    }

    // Se não há JWT e não está no authentication step, redirecionar para auth
    if (!jwt && state.currentStep !== 'authentication') {
      console.log('❌ JWT não encontrado no step', state.currentStep);
      console.log('↩️ Redirecionando para autenticação');
      toast.error('Autenticação necessária');
      goToStep('authentication');
      return;
    }

    // Se está no authentication step e ainda não autenticado, aguardar login
    if (state.currentStep === 'authentication' && !state.isAuthenticated) {
      console.log('📝 Wizard no step de autenticação, aguardando login');
    }
  }, [initialized, state.currentStep, state.isAuthenticated, goToStep, setJWT, setAuthentication]);

  // CAMADA 3: Modal de Confirmação de Identidade (para usuários autenticados)
  useEffect(() => {
    if (!initialized || !state.isAuthenticated || state.authModalConfirmed) return;

    // Mostrar modal de confirmação quando autenticado e ainda não confirmou
    if (state.currentStep === 'authentication') {
      console.log('🔐 Usuário autenticado, mostrando modal de confirmação');
      showAuthModal(true);
    }
  }, [initialized, state.isAuthenticated, state.authModalConfirmed, state.currentStep, showAuthModal]);

  // CAMADA 4: Auto-skip de steps após confirmação de identidade
  useEffect(() => {
    if (!initialized || !state.authModalConfirmed) return;

    // Não fazer nada se já está no confirmation step (último passo)
    if (state.currentStep === 'confirmation') {
      console.log('✅ Já no step de confirmação, sem necessidade de avançar');
      return;
    }

    // Se confirmou identidade, avançar conforme estado
    if (state.selectedAddress) {
      // Se já tem endereço, ir para pagamento
      console.log('🏠 Endereço encontrado, pulando para pagamento');
      goToStep('payment');
    } else {
      // Senão, avançar para próximo step (customer_data ou além)
      // Usamos nextStep para manter a sequência validada
      console.log('📍 Sem endereço, avançando para próximo step');
      nextStep();
    }
  }, [state.authModalConfirmed, state.selectedAddress, state.currentStep, initialized, nextStep, goToStep]);

  // Handlers de modal
  const handleConfirmIdentity = () => {
    console.log('✅ Identidade confirmada pelo usuário');
    confirmIdentity();
  };

  const handleEditData = () => {
    console.log('✏️ Usuário deseja editar dados');
    showAuthModal(false);
    // Usa nextStep para manter sequência validada
    nextStep();
  };

  const handleChangeAccount = () => {
    console.log('🔄 Usuário deseja trocar de conta');
    whatsappAuthService.clearAuth();
    showAuthModal(false);
    // Reseta a autenticação e volta para o step de autenticação
    reset();
  };

  // Mostrar erro de validação
  if (validationError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro na Sessão</h2>
          <p className="text-gray-600">{validationError}</p>
        </div>
      </div>
    );
  }

  // Mostrar loading durante inicialização
  if (contextLoading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-gray-600">Preparando checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Confirmação de Identidade */}
      {state.showAuthModal && state.isAuthenticated && !state.authModalConfirmed && (
        <ConfirmIdentityModal
          state={state}
          onConfirm={handleConfirmIdentity}
          onEditData={handleEditData}
          onChangeAccount={handleChangeAccount}
          isLoading={state.isLoading}
        />
      )}

      {/* Container do wizard */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Header com progresso */}
        <CheckoutHeader currentStep={state.currentStep} />

        {/* Container principal do step */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              {/* Renderizar step atual */}
              <CheckoutStepRouter
                currentStep={state.currentStep}
                state={state}
                onNextStep={nextStep}
                onPrevStep={prevStep}
                onGoToStep={goToStep}
                onSetLoading={setLoading}
                onSetError={setError}
                onSetAuthentication={setAuthentication}
                onSetJWT={setJWT}
                onSetCustomerData={setCustomerData}
                onSetAddress={setAddress}
                onSetPaymentMethod={setPaymentMethod}
                onMarkStepComplete={markStepComplete}
              />
            </div>
          </div>
        </div>

        {/* Navegação entre steps */}
        <CheckoutNavigation
          canGoBack={canGoPrev}
          canGoForward={canGoNext}
          currentStep={state.currentStep}
          onBack={prevStep}
          onForward={nextStep}
          isLoading={state.isLoading}
        />
      </div>
    </div>
  );
}
