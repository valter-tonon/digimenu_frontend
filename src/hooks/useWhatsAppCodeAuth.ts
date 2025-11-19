/**
 * Hook para autenticação via código WhatsApp
 *
 * Gerencia o fluxo completo de:
 * 1. Solicitar código de 6 dígitos
 * 2. Validar código digitado
 * 3. Armazenar token de autenticação
 * 4. Gerenciar erros e estados
 */

import { useState, useCallback } from 'react';
import { whatsappAuthService } from '@/services/whatsappAuth';

interface AuthCodeState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  token?: string;
  user?: any;
  isNewUser?: boolean;
  codeExpired?: boolean;
  locked?: boolean;
  attemptsLeft?: number;
}

interface UseWhatsAppCodeAuthReturn {
  state: AuthCodeState;
  requestCode: (phone: string, storeId: string) => Promise<void>;
  validateCode: (phone: string, code: string, storeId: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export const useWhatsAppCodeAuth = (): UseWhatsAppCodeAuthReturn => {
  const [state, setState] = useState<AuthCodeState>({
    isLoading: false,
    error: null,
    success: false,
    token: undefined,
    user: undefined,
    isNewUser: false,
    codeExpired: false,
    locked: false,
    attemptsLeft: 3
  });

  const requestCode = useCallback(async (phone: string, storeId: string) => {
    setState({
      isLoading: true,
      error: null,
      success: false,
      locked: false,
      codeExpired: false,
      attemptsLeft: 3
    });

    try {
      const result = await whatsappAuthService.requestAuthenticationCode(phone, storeId);

      if (result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          success: true,
          isNewUser: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Erro ao solicitar código',
          success: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao solicitar código',
        success: false
      }));
    }
  }, []);

  const validateCode = useCallback(async (phone: string, code: string, storeId: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const result = await whatsappAuthService.validateAuthenticationCode(
        phone,
        code,
        storeId
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          success: true,
          token: result.token,
          user: result.user,
          locked: false,
          codeExpired: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || result.message || 'Código inválido',
          success: false,
          locked: result.locked || false,
          codeExpired: result.locked || false,
          attemptsLeft: (prev.attemptsLeft || 3) - 1
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao validar código',
        success: false
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      token: undefined,
      user: undefined,
      isNewUser: false,
      codeExpired: false,
      locked: false,
      attemptsLeft: 3
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  return {
    state,
    requestCode,
    validateCode,
    reset,
    clearError
  };
};
