/**
 * Hook para sincronização do carrinho com sistema de autenticação
 * 
 * Gerencia a sincronização do carrinho com sessões contextuais,
 * fingerprint e estado de autenticação.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useCartStore } from '../store/cart-store';

export const useCartSync = () => {
  const auth = useAuth();
  const cartStore = useCartStore();
  const lastSyncRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Sincroniza carrinho com sessão atual
   */
  const syncCartWithSession = useCallback(async () => {
    if (!auth.session || auth.isLoading) return;

    try {
      // Atualiza contexto do carrinho com dados da sessão
      cartStore.setContext(
        auth.session.storeId,
        auth.session.context.tableId
      );

      // Define modo de entrega baseado no contexto da sessão
      cartStore.setDeliveryMode(auth.session.context.type === 'delivery');

      // Define TTL do carrinho baseado no tipo de sessão
      const ttlHours = auth.session.context.type === 'table' ? 4 : 2;
      cartStore.setCartTTL(ttlHours);

      // Atualiza atividade da sessão se há itens no carrinho
      if (cartStore.totalItems() > 0) {
        await auth.updateActivity();
      }

      lastSyncRef.current = Date.now();
      
    } catch (error) {
      console.error('Erro ao sincronizar carrinho com sessão:', error);
    }
  }, [auth, cartStore]);

  /**
   * Limpa carrinho quando sessão expira
   */
  const handleSessionExpiry = useCallback(() => {
    if (!auth.session && cartStore.totalItems() > 0) {
      console.log('Sessão expirada, limpando carrinho');
      cartStore.clearCart();
    }
  }, [auth.session, cartStore]);

  /**
   * Associa carrinho ao cliente quando faz login
   */
  const handleCustomerLogin = useCallback(async () => {
    if (auth.isAuthenticated && auth.customer && cartStore.totalItems() > 0) {
      try {
        // Atualiza atividade para manter sessão ativa
        await auth.updateActivity();
        
        // Em produção, sincronizar carrinho com backend
        console.log('Cliente logado, carrinho associado:', auth.customer.uuid);
        
      } catch (error) {
        console.error('Erro ao associar carrinho ao cliente:', error);
      }
    }
  }, [auth.isAuthenticated, auth.customer, cartStore, auth.updateActivity]);

  /**
   * Inicia sincronização automática
   */
  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Sincroniza a cada 30 segundos se há atividade
    syncIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncRef.current;
      
      // Só sincroniza se houve atividade recente (últimos 5 minutos)
      if (timeSinceLastSync < 5 * 60 * 1000 && cartStore.totalItems() > 0) {
        syncCartWithSession();
      }
    }, 30 * 1000);
  }, [syncCartWithSession, cartStore]);

  /**
   * Para sincronização automática
   */
  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Efeito para sincronização inicial
  useEffect(() => {
    if (auth.session && !auth.isLoading) {
      syncCartWithSession();
      startAutoSync();
    } else {
      stopAutoSync();
    }

    return () => stopAutoSync();
  }, [auth.session, auth.isLoading, syncCartWithSession, startAutoSync, stopAutoSync]);

  // Efeito para lidar com expiração de sessão
  useEffect(() => {
    handleSessionExpiry();
  }, [handleSessionExpiry]);

  // Efeito para lidar com login de cliente
  useEffect(() => {
    handleCustomerLogin();
  }, [handleCustomerLogin]);

  // Efeito para atualizar atividade quando carrinho muda
  useEffect(() => {
    const updateActivityOnCartChange = async () => {
      if (auth.session && cartStore.totalItems() > 0) {
        try {
          await auth.updateActivity();
        } catch (error) {
          console.error('Erro ao atualizar atividade:', error);
        }
      }
    };

    updateActivityOnCartChange();
  }, [cartStore.items, auth.session, auth.updateActivity]);

  return {
    syncCartWithSession,
    isCartSynced: !!auth.session && cartStore.storeId === auth.session.storeId,
    lastSync: lastSyncRef.current,
    
    // Métodos utilitários
    clearCartOnLogout: () => {
      cartStore.clearCart();
      stopAutoSync();
    },
    
    validateCartContext: () => {
      if (!auth.session) return false;
      
      return (
        cartStore.storeId === auth.session.storeId &&
        cartStore.tableId === auth.session.context.tableId
      );
    }
  };
};

/**
 * Hook para rastreamento de carrinho com fingerprint
 */
export const useCartTracking = () => {
  const auth = useAuth();
  const cartStore = useCartStore();

  const trackCartAction = useCallback((action: 'add' | 'remove' | 'update' | 'clear', itemId?: number) => {
    if (!auth.fingerprint) return;

    // Em produção, enviar dados para analytics/auditoria
    const trackingData = {
      fingerprint: auth.fingerprint,
      sessionId: auth.session?.id,
      customerId: auth.customer?.uuid,
      action,
      itemId,
      cartTotal: cartStore.totalPrice(),
      itemCount: cartStore.totalItems(),
      timestamp: new Date().toISOString()
    };

    console.log('Cart tracking:', trackingData);
    
    // Aqui seria enviado para serviço de analytics
  }, [auth.fingerprint, auth.session, auth.customer, cartStore]);

  return { trackCartAction };
};