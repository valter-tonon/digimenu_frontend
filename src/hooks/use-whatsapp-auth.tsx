'use client';

import { useState, useCallback } from 'react';
import { requestWhatsAppAuth, validateWhatsAppToken } from '@/services/api';
import { useAuth } from './use-auth';

interface WhatsAppAuthState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  rateLimitRemaining: number | null;
  expiresInMinutes: number | null;
}

interface UseWhatsAppAuthReturn {
  state: WhatsAppAuthState;
  requestAuth: (
    phone: string, 
    storeId: string, 
    fingerprint: string, 
    sessionId?: string,
    sessionContext?: {
      tableId?: string;
      isDelivery: boolean;
    }
  ) => Promise<void>;
  validateToken: (token: string) => Promise<void>;
  reset: () => void;
}

export const useWhatsAppAuth = (): UseWhatsAppAuthReturn => {
  const { login } = useAuth();
  const [state, setState] = useState<WhatsAppAuthState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    rateLimitRemaining: null,
    expiresInMinutes: null,
  });

  const requestAuth = useCallback(async (
    phone: string, 
    storeId: string, 
    fingerprint: string, 
    sessionId?: string,
    sessionContext?: {
      tableId?: string;
      isDelivery: boolean;
    }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await requestWhatsAppAuth(phone, storeId, fingerprint, sessionId, sessionContext);
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isSuccess: true,
          expiresInMinutes: response.data.expires_in_minutes || 15,
          rateLimitRemaining: response.data.rate_limit_remaining || null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.data.message || 'Erro ao solicitar autenticação',
          rateLimitRemaining: response.data.rate_limit_remaining || null,
        }));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao solicitar autenticação via WhatsApp';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        rateLimitRemaining: error.response?.data?.rate_limit_remaining || null,
      }));
    }
  }, []);

  const validateToken = useCallback(async (token: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await validateWhatsAppToken(token);
      
      if (response.data.success) {
        // Login automático com o token de autenticação
        login(response.data.data.auth_token);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          isSuccess: true,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.data.message || 'Token inválido',
        }));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao validar token';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [login]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
      rateLimitRemaining: null,
      expiresInMinutes: null,
    });
  }, []);

  return {
    state,
    requestAuth,
    validateToken,
    reset,
  };
};