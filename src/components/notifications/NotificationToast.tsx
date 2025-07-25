'use client';

import { useEffect } from 'react';
import { useNotificationStore, sendPushNotification } from '@/store/notification-store';
import { AppNotification } from '@/services/websocket';
import toast from 'react-hot-toast';
import { Bell, CheckCircle, AlertCircle, Info, XCircle, Star } from 'lucide-react';

export function NotificationToast() {
  const { notifications } = useNotificationStore();

  useEffect(() => {
    // Observar mudanças nas notificações para mostrar toasts
    const lastNotification = notifications[0];
    if (lastNotification && !lastNotification.read) {
      showToast(lastNotification);
    }
  }, [notifications]);

  const showToast = (notification: AppNotification) => {
    const toastId = `notification-${notification.id}`;
    
    // Verificar se o toast já foi mostrado
    if (toast.isActive(toastId)) {
      return;
    }

    const toastOptions = {
      id: toastId,
      duration: notification.priority === 'high' ? 8000 : 5000,
      position: 'top-right' as const,
      style: {
        background: getToastBackground(notification.priority),
        color: '#1f2937',
        border: `1px solid ${getToastBorder(notification.priority)}`,
        borderRadius: '12px',
        padding: '16px 20px',
        minWidth: '320px',
        maxWidth: '450px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(10px)',
        borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
      },
    };

    const toastContent = (
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBackground(notification.priority)}`}>
            {getToastIcon(notification.type)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {notification.title}
            </h4>
            <button
              onClick={() => toast.dismiss(toastId)}
              className="flex-shrink-0 ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {new Date(notification.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              
              {notification.priority === 'high' && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <Star className="w-3 h-3 fill-current" />
                  Importante
                </span>
              )}
            </div>
            
            <button
              onClick={() => {
                toast.dismiss(toastId);
                // Marcar como lida
                useNotificationStore.getState().markAsRead(notification.id);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium hover:underline"
            >
              Marcar como lida
            </button>
          </div>
        </div>
      </div>
    );

    // Mostrar toast com animação personalizada
    toast(toastContent, toastOptions);

    // Enviar notificação push se for alta prioridade
    if (notification.priority === 'high') {
      sendPushNotification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `notification-${notification.id}`,
        requireInteraction: true,
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
          notificationId: notification.id,
          type: notification.type,
          priority: notification.priority,
        },
      });
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'stock_update':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'promotion':
        return <Star className="w-5 h-5 text-green-600" />;
      case 'waiter_call':
        return <Bell className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getToastBackground = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)';
      case 'medium':
        return 'linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%)';
      case 'low':
        return 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)';
      default:
        return 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)';
    }
  };

  const getToastBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#fca5a5';
      case 'medium':
        return '#fbbf24';
      case 'low':
        return '#93c5fd';
      default:
        return '#d1d5db';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getIconBackground = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100';
      case 'medium':
        return 'bg-amber-100';
      case 'low':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return null; // Este componente não renderiza nada visualmente
} 