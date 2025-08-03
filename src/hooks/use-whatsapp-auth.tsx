'use client';

import { useState, useCallback, useEffect } from 'react';
import { whatsappAuthService, User } from '@/services/whatsappAuth';
import { useAuth } from './use-auth';

interface WhatsAppAuthState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  expiresAt: Date | null;
  isAuthenticated: boolean;
  user: User | null;
}

interface UseWhatsAppAuthReturn {
  state: WhatsAppAuthState;
  requestMagicLink: (phone: string, tenantId: string) => Promise<void>;
  verifyToken: (token: string) => Promise<void>;
  validateStoredAuth: () => Promise<boolean>;
  logout: () => void;
  reset: () => void;
}

export const useWhatsAppAuth = (): UseWhatsAppAuthReturn => {
  const { login } = useAuth();
  const [state, setState] = useState<WhatsAppAuthState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    expiresAt: null,
    isAuthenticated: false,
    user: null,
  });

  // Verifica autenticação armazenada ao inicializar
  useEffect(() => {
    const checkStoredAuth = async () => {
      const isValid = await whatsappAuthService.validateStoredJWT();
      if (isValid) {
        const user = whatsappAuthService.getAuthenticatedUser();
        const jwt = whatsappAuthService.getCurrentJWT();
        
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
        }));

        // Integra com o sistema de auth existente
        if (jwt) {
          login(jwt);
        }
      }
    };

    checkStoredAuth();
  }, [login]);

  const requestMagicLink = useCallback(async (phone: string, tenantId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, isSuccess: false }));

    try {
      const response = await whatsappAuthService.requestMagicLink(phone, tenantId);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isSuccess: true,
          expiresAt: response.expiresAt || null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message,
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao solicitar link mágico',
      }));
    }
  }, []);

  const verifyToken = useCallback(async (token: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await whatsappAuthService.verifyToken(token);
      
      if (response.success && response.jwt && response.user) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isSuccess: true,
          isAuthenticated: true,
          user: response.user || null,
        }));

        // Integra com o sistema de auth existente
        login(response.jwt);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Token inválido',
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao verificar token',
      }));
    }
  }, [login]);

  const validateStoredAuth = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await whatsappAuthService.validateStoredJWT();
      
      if (isValid) {
        const user = whatsappAuthService.getAuthenticatedUser();
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
        }));
      }

      return isValid;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
      }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    whatsappAuthService.clearAuth();
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      isSuccess: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      isSuccess: false,
      error: null,
      expiresAt: null,
    }));
  }, []);

  return {
    state,
    requestMagicLink,
    verifyToken,
    validateStoredAuth,
    logout,
    reset,
  };
};