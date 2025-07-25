import { useEffect, useCallback } from 'react';
import { useNotificationStore, requestNotificationPermission, sendPushNotification } from '@/store/notification-store';

export function useNotifications(storeId?: string, tableId?: string) {
  const {
    notifications,
    unreadCount,
    isConnected,
    soundEnabled,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    connect,
    disconnect,
    toggleSound,
  } = useNotificationStore();

  // Conectar ao WebSocket quando o hook for usado
  useEffect(() => {
    if (storeId) {
      connect(storeId, tableId);
    }

    return () => {
      disconnect();
    };
  }, [storeId, tableId, connect, disconnect]);

  // Função para adicionar notificação manualmente
  const showNotification = useCallback((
    title: string,
    message: string,
    type: 'order_status' | 'stock_update' | 'promotion' | 'waiter_call' | 'general' = 'general',
    priority: 'low' | 'medium' | 'high' = 'medium',
    data?: Record<string, unknown>
  ) => {
    addNotification({
      type,
      title,
      message,
      data,
      priority,
    });
  }, [addNotification]);

  // Função para mostrar notificação de pedido
  const showOrderNotification = useCallback((
    orderId: string,
    status: string,
    message?: string
  ) => {
    showNotification(
      `Pedido #${orderId} atualizado`,
      message || `Seu pedido foi atualizado para: ${status}`,
      'order_status',
      'high',
      { order_id: orderId, status }
    );
  }, [showNotification]);

  // Função para mostrar notificação de estoque
  const showStockNotification = useCallback((
    productName: string,
    inStock: boolean
  ) => {
    showNotification(
      'Atualização de Estoque',
      `${productName} está ${inStock ? 'disponível' : 'indisponível'}`,
      'stock_update',
      'medium',
      { product_name: productName, in_stock: inStock }
    );
  }, [showNotification]);

  // Função para mostrar notificação de promoção
  const showPromotionNotification = useCallback((
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) => {
    showNotification(
      title,
      message,
      'promotion',
      'medium',
      data
    );
  }, [showNotification]);

  // Função para mostrar notificação de chamada do garçom
  const showWaiterCallNotification = useCallback((
    message: string,
    data?: Record<string, unknown>
  ) => {
    showNotification(
      'Resposta do Garçom',
      message,
      'waiter_call',
      'high',
      data
    );
  }, [showNotification]);

  // Função para solicitar permissão de notificações
  const requestPermission = useCallback(async () => {
    return await requestNotificationPermission();
  }, []);

  // Função para enviar notificação push
  const sendPush = useCallback((title: string, options?: NotificationOptions) => {
    sendPushNotification(title, options);
  }, []);

  return {
    // Estado
    notifications,
    unreadCount,
    isConnected,
    soundEnabled,
    
    // Ações básicas
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleSound,
    
    // Ações específicas
    showNotification,
    showOrderNotification,
    showStockNotification,
    showPromotionNotification,
    showWaiterCallNotification,
    
    // Notificações push
    requestPermission,
    sendPush,
  };
} 