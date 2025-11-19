'use client';

import { useReducer, useCallback, useEffect } from 'react';
import {
  CheckoutState,
  CheckoutAction,
  checkoutReducer,
  initialCheckoutState,
  canGoToStep,
  canGoNext,
  canGoPrev,
  isSessionExpired,
  CheckoutStep,
  AuthenticationMethod,
  CustomerData,
  Address,
} from '@/services/checkoutStateMachine';

const STORAGE_KEY = 'checkout_state';

/**
 * Hook para gerenciar estado do checkout usando máquina de estados
 *
 * Características:
 * - Persiste estado em localStorage (exceto tokens)
 * - Valida transições de steps
 * - Recupera estado anterior ao recarregar página
 * - Detecta expiração de sessão
 * - Fornece métodos convenientes de dispatch
 */
export function useCheckoutStateMachine() {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState, (initial) => {
    // Tentar restaurar estado do localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CheckoutState;

        // Verificar se sessão ainda é válida
        if (!isSessionExpired(parsed)) {
          console.log('✅ Estado do checkout restaurado do localStorage');
          return parsed;
        } else {
          console.log('⏰ Sessão de checkout expirada, usando estado inicial');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao restaurar estado do checkout:', error);
    }
    return initial;
  });

  // Persistir estado em localStorage sempre que muda
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('❌ Erro ao salvar estado do checkout:', error);
    }
  }, [state]);

  // Verificar expiração de sessão periodicamente (a cada 1 minuto)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSessionExpired(state) && state.currentStep !== 'authentication') {
        console.warn('⏰ Sessão de checkout expirada');
        reset();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [state]);

  // Métodos convenientes para dispatch

  const initSession = useCallback((storeId: string, customerId?: string) => {
    console.log('🔧 Inicializando sessão de checkout', { storeId, customerId });
    dispatch({ type: 'INIT_SESSION', payload: { storeId, customerId } });
  }, []);

  const setJWT = useCallback((jwt: string) => {
    console.log('🔐 Definindo JWT');
    dispatch({ type: 'SET_JWT', payload: jwt });
  }, []);

  const setAuthentication = useCallback(
    (user: any, isGuest: boolean, method: AuthenticationMethod) => {
      console.log('✅ Definindo autenticação', { method, isGuest, userName: user?.name });
      dispatch({
        type: 'SET_AUTHENTICATION',
        payload: { isGuest, method, user },
      });
    },
    []
  );

  const setCustomerData = useCallback((data: CustomerData) => {
    console.log('👤 Definindo dados do cliente', { name: data.name, phone: data.phone });
    dispatch({ type: 'SET_CUSTOMER_DATA', payload: data });
  }, []);

  const setAddress = useCallback((address: Address) => {
    console.log('📍 Definindo endereço', { street: address.street, city: address.city });
    dispatch({ type: 'SET_ADDRESS', payload: address });
  }, []);

  const setPaymentMethod = useCallback((method: string) => {
    console.log('💳 Definindo método de pagamento', { method });
    dispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
  }, []);

  const goToStep = useCallback(
    (step: CheckoutStep) => {
      if (canGoToStep(state, step)) {
        console.log('➡️ Navegando para step', { step });
        dispatch({ type: 'GO_TO_STEP', payload: step });
      } else {
        console.warn('⚠️ Não é permitido ir para step', { step, currentStep: state.currentStep });
      }
    },
    [state]
  );

  const nextStep = useCallback(() => {
    if (canGoNext(state)) {
      console.log('⬇️ Avançando para próximo step');
      dispatch({ type: 'NEXT_STEP' });
    } else {
      console.warn('⚠️ Não há próximo step disponível');
    }
  }, [state]);

  const prevStep = useCallback(() => {
    if (canGoPrev(state)) {
      console.log('⬆️ Voltando para step anterior');
      dispatch({ type: 'PREV_STEP' });
    } else {
      console.warn('⚠️ Não há step anterior disponível');
    }
  }, [state]);

  const markStepComplete = useCallback((step: CheckoutStep) => {
    console.log('✓ Marcando step como completo', { step });
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: step });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    if (error) {
      console.error('❌ Erro no checkout:', error);
    }
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    console.log('🔄 Resetando estado do checkout');
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'RESET' });
  }, []);

  const showAuthModal = useCallback((show: boolean) => {
    console.log('🔐 Mostrando modal de autenticação', { show });
    dispatch({ type: 'SHOW_AUTH_MODAL', payload: show });
  }, []);

  const confirmIdentity = useCallback(() => {
    console.log('✅ Identidade confirmada');
    dispatch({ type: 'CONFIRM_IDENTITY' });
  }, []);

  return {
    // Estado
    state,
    dispatch,

    // Informações de navegação
    canGoNext: canGoNext(state),
    canGoPrev: canGoPrev(state),
    isSessionExpired: isSessionExpired(state),

    // Métodos de navegação
    goToStep,
    nextStep,
    prevStep,
    markStepComplete,

    // Métodos de dados
    initSession,
    setJWT,
    setAuthentication,
    setCustomerData,
    setAddress,
    setPaymentMethod,

    // Métodos de UI
    setLoading,
    setError,
    reset,

    // Métodos de modal
    showAuthModal,
    confirmIdentity,
  };
}
