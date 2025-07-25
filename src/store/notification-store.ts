import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppNotification, websocketService } from '@/services/websocket';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  soundEnabled: boolean;
  
  // Actions
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setConnectionStatus: (isConnected: boolean) => void;
  toggleSound: () => void;
  connect: (storeId?: string, tableId?: string) => void;
  disconnect: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      soundEnabled: true,

      addNotification: (notificationData) => {
        const notification: AppNotification = {
          ...notificationData,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        };

        set((state) => {
          const newNotifications = [notification, ...state.notifications].slice(0, 50); // Limitar a 50 notificações
          const newUnreadCount = newNotifications.filter(n => !n.read).length;
          
          return {
            notifications: newNotifications,
            unreadCount: newUnreadCount,
          };
        });

        // Tocar som se habilitado
        if (get().soundEnabled) {
          playNotificationSound();
        }
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(notification => ({ ...notification, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter(n => n.id !== id);
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length,
          };
        });
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      setConnectionStatus: (isConnected) => {
        set({ isConnected });
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      connect: (storeId, tableId) => {
        // Verificar se estamos no browser antes de conectar
        if (typeof window !== 'undefined') {
          websocketService.connect(storeId, tableId);
        }
        
        // Configurar listeners
        const unsubscribeConnected = websocketService.subscribe('connected', () => {
          get().setConnectionStatus(true);
        });

        const unsubscribeDisconnected = websocketService.subscribe('disconnected', () => {
          get().setConnectionStatus(false);
        });

        const unsubscribeNotification = websocketService.subscribe('notification', (data) => {
          get().addNotification({
            type: data.type || 'general',
            title: data.title || 'Notificação',
            message: data.message || '',
            data: data.data,
            priority: data.priority || 'medium',
          });
        });

        const unsubscribeOrderUpdate = websocketService.subscribe('order_update', (data) => {
          get().addNotification({
            type: 'order_status',
            title: 'Atualização do Pedido',
            message: `Seu pedido #${data.order_id} foi atualizado para: ${data.status}`,
            data,
            priority: 'high',
          });
        });

        const unsubscribeStockUpdate = websocketService.subscribe('stock_update', (data) => {
          get().addNotification({
            type: 'stock_update',
            title: 'Atualização de Estoque',
            message: `${data.product_name} está ${data.in_stock ? 'disponível' : 'indisponível'}`,
            data,
            priority: 'medium',
          });
        });

        const unsubscribePromotion = websocketService.subscribe('promotion', (data) => {
          get().addNotification({
            type: 'promotion',
            title: 'Nova Promoção!',
            message: data.message || 'Confira nossa nova oferta especial!',
            data,
            priority: 'medium',
          });
        });

        const unsubscribeWaiterCall = websocketService.subscribe('waiter_call_response', (data) => {
          get().addNotification({
            type: 'waiter_call',
            title: 'Resposta do Garçom',
            message: data.message || 'O garçom está a caminho!',
            data,
            priority: 'high',
          });
        });

        // Limpar listeners quando desconectar
        return () => {
          unsubscribeConnected();
          unsubscribeDisconnected();
          unsubscribeNotification();
          unsubscribeOrderUpdate();
          unsubscribeStockUpdate();
          unsubscribePromotion();
          unsubscribeWaiterCall();
        };
      },

      disconnect: () => {
        websocketService.disconnect();
        set({ isConnected: false });
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

// Função para tocar som de notificação
function playNotificationSound() {
  try {
    // Verificar se estamos no browser antes de tocar som
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(console.error);
    }
  } catch (error) {
    console.error('Erro ao tocar som de notificação:', error);
  }
}

// Função para solicitar permissão de notificações push
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações push');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Permissão de notificação negada');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return false;
  }
};

// Função para enviar notificação push
export const sendPushNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }
}; 