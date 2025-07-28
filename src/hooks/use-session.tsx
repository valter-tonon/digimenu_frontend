'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createSession, 
  getSession, 
  validateSessionContext, 
  updateSessionActivity,
  associateCustomerToSession,
  extendSession,
  invalidateSession 
} from '@/services/api';

interface SessionData {
  id: string;
  store_id: string;
  table_id?: string;
  is_delivery: boolean;
  fingerprint: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  last_activity: string;
  order_count: number;
  total_spent: number;
  is_authenticated: boolean;
  customer_id?: string;
  created_at: string;
  updated_at: string;
}

interface UseSessionReturn {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
  createNewSession: (data: {
    store_id: string;
    table_id?: string;
    is_delivery: boolean;
    fingerprint: string;
    customer_id?: string;
  }) => Promise<SessionData | null>;
  validateSession: (sessionId: string, storeId: string, tableId?: string) => Promise<boolean>;
  updateActivity: () => Promise<void>;
  associateCustomer: (customerId: string) => Promise<void>;
  extendSessionDuration: (additionalMinutes?: number) => Promise<void>;
  endSession: () => Promise<void>;
  refreshSession: (sessionId: string) => Promise<void>;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Atualiza atividade automaticamente a cada 5 minutos
  useEffect(() => {
    if (session) {
      activityIntervalRef.current = setInterval(() => {
        updateActivity();
      }, 5 * 60 * 1000); // 5 minutos

      return () => {
        if (activityIntervalRef.current) {
          clearInterval(activityIntervalRef.current);
        }
      };
    }
  }, [session]);

  const createNewSession = useCallback(async (data: {
    store_id: string;
    table_id?: string;
    is_delivery: boolean;
    fingerprint: string;
    customer_id?: string;
  }): Promise<SessionData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await createSession(data);
      
      if (response.data.success) {
        const sessionData = response.data.data;
        setSession(sessionData);
        
        // Salva ID da sessão no localStorage para persistência
        localStorage.setItem('session_id', sessionData.id);
        
        return sessionData;
      } else {
        setError(response.data.message || 'Erro ao criar sessão');
        return null;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar sessão';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateSession = useCallback(async (
    sessionId: string, 
    storeId: string, 
    tableId?: string
  ): Promise<boolean> => {
    try {
      const response = await validateSessionContext(sessionId, storeId, tableId);
      
      if (response.data.success && response.data.valid) {
        setSession(response.data.data);
        return true;
      } else {
        setError(response.data.message || 'Sessão inválida');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao validar sessão';
      setError(errorMessage);
      return false;
    }
  }, []);

  const updateActivity = useCallback(async (): Promise<void> => {
    if (!session) return;

    try {
      const response = await updateSessionActivity(session.id);
      
      if (response.data.success) {
        setSession(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao atualizar atividade da sessão:', error);
      // Não mostra erro para o usuário, pois é uma operação em background
    }
  }, [session]);

  const associateCustomer = useCallback(async (customerId: string): Promise<void> => {
    if (!session) {
      throw new Error('Nenhuma sessão ativa');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await associateCustomerToSession(session.id, customerId);
      
      if (response.data.success) {
        setSession(response.data.data);
      } else {
        setError(response.data.message || 'Erro ao associar cliente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao associar cliente à sessão';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const extendSessionDuration = useCallback(async (additionalMinutes: number = 30): Promise<void> => {
    if (!session) {
      throw new Error('Nenhuma sessão ativa');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await extendSession(session.id, additionalMinutes);
      
      if (response.data.success) {
        setSession(response.data.data);
      } else {
        setError(response.data.message || 'Erro ao estender sessão');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao estender sessão';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const endSession = useCallback(async (): Promise<void> => {
    if (!session) return;

    try {
      await invalidateSession(session.id);
      setSession(null);
      localStorage.removeItem('session_id');
      
      // Limpa o intervalo de atividade
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
    } catch (error: any) {
      console.error('Erro ao finalizar sessão:', error);
      // Mesmo com erro, limpa a sessão local
      setSession(null);
      localStorage.removeItem('session_id');
    }
  }, [session]);

  const refreshSession = useCallback(async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getSession(sessionId);
      
      if (response.data.success) {
        setSession(response.data.data);
      } else {
        setError(response.data.message || 'Sessão não encontrada');
        localStorage.removeItem('session_id');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao buscar sessão';
      setError(errorMessage);
      localStorage.removeItem('session_id');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tenta recuperar sessão do localStorage na inicialização
  useEffect(() => {
    const savedSessionId = localStorage.getItem('session_id');
    if (savedSessionId && !session) {
      refreshSession(savedSessionId);
    }
  }, [refreshSession, session]);

  return {
    session,
    isLoading,
    error,
    createNewSession,
    validateSession,
    updateActivity,
    associateCustomer,
    extendSessionDuration,
    endSession,
    refreshSession,
  };
};