/**
 * Hook principal de autenticação
 * 
 * Integra fingerprint, sessões contextuais e autenticação
 * para fornecer uma interface unificada de autenticação.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ContextualSession, 
  SessionContext,
  SessionValidationResult 
} from '../types/session';
import { FingerprintResult } from '../types/fingerprint';
import { fingerprintService } from '../services/fingerprint';
import { sessionService } from '../services/sessionService';
import { fingerprintDetectionService } from '../services/fingerprintDetection';
import { useCartStore } from '../store/cart-store';

export interface AuthState {
  session: ContextualSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  canOrderAsGuest: boolean;
  fingerprint: string | null;
  error: string | null;
  // Integração com sistema existente
  customer: any | null;
  token: string | null;
}

export interface AuthActions {
  initializeSession: (context: Omit<SessionContext, 'fingerprint'>) => Promise<void>;
  validateCurrentSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkGuestOrderPermission: () => Promise<boolean>;
  associateCustomer: (customerId: string) => Promise<void>;
  updateActivity: () => Promise<void>;
  // Integração com sistema existente
  login: (token: string) => void;
  logoutUser: () => Promise<void>;
}

export interface UseAuthReturn extends AuthState, AuthActions {}

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isGuest: false,
    canOrderAsGuest: false,
    fingerprint: null,
    error: null,
    customer: null,
    token: null
  });

  const fingerprintRef = useRef<string | null>(null);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const cartStore = useCartStore();

  /**
   * Inicializa fingerprint na primeira execução
   */
  useEffect(() => {
    initializeFingerprint();
    checkExistingAuth();
    
    // Cleanup
    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, []);

  /**
   * Verifica se existe autenticação tradicional no localStorage
   */
  const checkExistingAuth = async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        // Integra com sistema existente
        await handleTraditionalLogin(storedToken);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação existente:', error);
    }
  };

  /**
   * Integra com sistema de autenticação tradicional
   */
  const handleTraditionalLogin = async (token: string): Promise<void> => {
    try {
      // Importa dinamicamente para evitar dependência circular
      const { getMe } = await import('../services/api');
      const response = await getMe(token);
      
      setState(prev => ({
        ...prev,
        token,
        customer: response.data,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false
      }));

      // Se há sessão contextual, associa o cliente
      if (state.session) {
        await associateCustomer(response.data.uuid);
      }
      
    } catch (error) {
      console.error('Erro ao validar token:', error);
      // Remove token inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Login tradicional (compatibilidade com sistema existente)
   */
  const login = useCallback((newToken: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', newToken);
    }
    handleTraditionalLogin(newToken);
  }, []);

  /**
   * Logout tradicional (compatibilidade com sistema existente)
   */
  const logoutUser = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (state.token) {
        // Importa dinamicamente para evitar dependência circular
        const { logout: apiLogout } = await import('../services/api');
        await apiLogout(state.token);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpa dados de autenticação tradicional
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      
      // Limpa carrinho
      cartStore.clearCart();
      
      // Atualiza estado
      setState(prev => ({
        ...prev,
        token: null,
        customer: null,
        isAuthenticated: false,
        isGuest: !!prev.session, // Mantém como guest se há sessão contextual
        isLoading: false
      }));
    }
  }, [state.token, cartStore]);

  /**
   * Gera fingerprint do dispositivo
   */
  const initializeFingerprint = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const fingerprintResult = await fingerprintService.generateFingerprint();
      fingerprintRef.current = fingerprintResult.hash;
      
      setState(prev => ({ 
        ...prev, 
        fingerprint: fingerprintResult.hash,
        isLoading: false 
      }));

      // Tenta recuperar sessão existente se houver contexto na URL
      await tryRecoverExistingSession();
      
    } catch (error) {
      console.error('Erro ao inicializar fingerprint:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao inicializar autenticação',
        isLoading: false 
      }));
    }
  };

  /**
   * Tenta recuperar sessão existente baseada no contexto da URL
   */
  const tryRecoverExistingSession = async (): Promise<void> => {
    if (!fingerprintRef.current) return;

    try {
      // Verifica se há parâmetros de contexto na URL
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = urlParams.get('store');
      
      if (storeId) {
        // Procura sessão existente para este fingerprint/loja
        const existingSession = await sessionService.getActiveSessions(storeId);
        const userSession = existingSession.find(s => s.fingerprint === fingerprintRef.current);
        
        if (userSession) {
          const validation = await sessionService.validateSession(userSession.id);
          if (validation.isValid && validation.session) {
            updateStateWithSession(validation.session);
            startSessionMonitoring();
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao recuperar sessão existente:', error);
    }
  };

  /**
   * Inicializa nova sessão contextual
   */
  const initializeSession = useCallback(async (
    context: Omit<SessionContext, 'fingerprint'>
  ): Promise<void> => {
    if (!fingerprintRef.current) {
      throw new Error('Fingerprint não inicializado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Valida fingerprint antes de criar sessão
      const fingerprintValidation = await fingerprintDetectionService.validateFingerprint(
        fingerprintRef.current
      );

      if (fingerprintValidation.isBlocked) {
        throw new Error('Dispositivo bloqueado por atividade suspeita');
      }

      // Cria contexto completo com fingerprint
      const fullContext: SessionContext = {
        ...context,
        fingerprint: fingerprintRef.current,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };

      // Cria sessão
      const session = await sessionService.createSession(fullContext);
      
      updateStateWithSession(session);
      startSessionMonitoring();

      console.log('Sessão inicializada:', session.id);
      
    } catch (error) {
      console.error('Erro ao inicializar sessão:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao criar sessão',
        isLoading: false 
      }));
      throw error;
    }
  }, []);

  /**
   * Valida sessão atual
   */
  const validateCurrentSession = useCallback(async (): Promise<boolean> => {
    if (!state.session) return false;

    try {
      const validation = await sessionService.validateSession(state.session.id);
      
      if (validation.isValid && validation.session) {
        updateStateWithSession(validation.session);
        return true;
      } else {
        // Sessão inválida, limpa estado
        setState(prev => ({
          ...prev,
          session: null,
          isAuthenticated: false,
          isGuest: false,
          canOrderAsGuest: false,
          error: validation.reason || 'Sessão inválida'
        }));
        stopSessionMonitoring();
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return false;
    }
  }, [state.session]);

  /**
   * Faz logout e limpa sessão
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (state.session) {
        await sessionService.expireSession(state.session.id);
      }

      setState({
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
        canOrderAsGuest: false,
        fingerprint: fingerprintRef.current,
        error: null
      });

      stopSessionMonitoring();
      console.log('Logout realizado');
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [state.session]);

  /**
   * Atualiza sessão atual
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!state.session) return;

    try {
      const validation = await sessionService.validateSession(state.session.id);
      if (validation.isValid && validation.session) {
        updateStateWithSession(validation.session);
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
    }
  }, [state.session]);

  /**
   * Verifica se pode fazer pedidos como visitante
   */
  const checkGuestOrderPermission = useCallback(async (): Promise<boolean> => {
    if (!state.session || !fingerprintRef.current) return false;

    try {
      // Verifica configurações da loja (mock - integração com backend)
      const storeSettings = await getStoreSettings(state.session.storeId);
      
      if (!storeSettings.allowQuickRegistration) {
        return false;
      }

      // Verifica se fingerprint é válido
      const fingerprintValidation = await fingerprintDetectionService.validateFingerprint(
        fingerprintRef.current
      );

      return fingerprintValidation.isValid && !fingerprintValidation.isBlocked;
      
    } catch (error) {
      console.error('Erro ao verificar permissão de visitante:', error);
      return false;
    }
  }, [state.session]);

  /**
   * Associa cliente à sessão atual
   */
  const associateCustomer = useCallback(async (customerId: string): Promise<void> => {
    if (!state.session) {
      throw new Error('Nenhuma sessão ativa');
    }

    try {
      await sessionService.associateCustomer(state.session.id, customerId);
      
      // Atualiza estado local
      setState(prev => ({
        ...prev,
        session: prev.session ? {
          ...prev.session,
          customerId,
          isAuthenticated: true
        } : null,
        isAuthenticated: true,
        isGuest: false
      }));

      console.log('Cliente associado à sessão:', customerId);
      
    } catch (error) {
      console.error('Erro ao associar cliente:', error);
      throw error;
    }
  }, [state.session]);

  /**
   * Atualiza atividade da sessão
   */
  const updateActivity = useCallback(async (): Promise<void> => {
    if (!state.session) return;

    try {
      await sessionService.updateActivity(state.session.id);
      
      // Atualiza timestamp local
      setState(prev => ({
        ...prev,
        session: prev.session ? {
          ...prev.session,
          lastActivity: new Date()
        } : null
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
    }
  }, [state.session]);

  /**
   * Atualiza estado com dados da sessão
   */
  const updateStateWithSession = (session: ContextualSession): void => {
    setState(prev => ({
      ...prev,
      session,
      isLoading: false,
      isAuthenticated: session.isAuthenticated,
      isGuest: !session.isAuthenticated,
      canOrderAsGuest: !session.isAuthenticated, // Será validado posteriormente
      error: null
    }));
  };

  /**
   * Inicia monitoramento automático da sessão
   */
  const startSessionMonitoring = (): void => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    // Verifica sessão a cada 5 minutos
    sessionCheckInterval.current = setInterval(() => {
      validateCurrentSession();
    }, 5 * 60 * 1000);
  };

  /**
   * Para monitoramento da sessão
   */
  const stopSessionMonitoring = (): void => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
  };

  return {
    // State
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isGuest: state.isGuest,
    canOrderAsGuest: state.canOrderAsGuest,
    fingerprint: state.fingerprint,
    error: state.error,
    customer: state.customer,
    token: state.token,

    // Actions
    initializeSession,
    validateCurrentSession,
    logout,
    refreshSession,
    checkGuestOrderPermission,
    associateCustomer,
    updateActivity,
    login,
    logoutUser
  };
};

/**
 * Obtém IP do cliente (mock - integração com serviço real)
 */
async function getClientIP(): Promise<string> {
  try {
    // Em produção, usar serviço real de IP
    return '127.0.0.1';
  } catch {
    return 'unknown';
  }
}

/**
 * Obtém configurações da loja (mock - integração com backend)
 */
async function getStoreSettings(storeId: string): Promise<{
  allowQuickRegistration: boolean;
  requireAuthForOrders: boolean;
}> {
  // Mock - em produção, fazer chamada para API
  return {
    allowQuickRegistration: true,
    requireAuthForOrders: false
  };
}

// Hook para uso em contextos específicos
export const useAuthContext = () => {
  const auth = useAuth();
  
  if (!auth.session && !auth.isLoading) {
    console.warn('useAuthContext usado fora de contexto de sessão ativa');
  }
  
  return auth;
};