'use client';

import { useEffect } from 'react';
import { useNotificationStore, sendPushNotification } from '@/store/notification-store';
import { AppNotification } from '@/services/websocket';
import toast from 'react-hot-toast';
import { Bell, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

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
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '300px',
        maxWidth: '400px',
      },
    };

    const toastContent = (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getToastIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
            <button
              onClick={() => toast.dismiss(toastId)}
              className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {new Date(notification.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  // Marcar como lida
                  useNotificationStore.getState().markAsRead(notification.id);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Marcar como lida
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    // Mostrar toast
    toast(toastContent, toastOptions);

    // Enviar notificação push se for alta prioridade
    if (notification.priority === 'high') {
      sendPushNotification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `notification-${notification.id}`,
        requireInteraction: true,
      });
    }
  };

  const getToastIcon = (type: string) => {
    const baseClasses = 'w-6 h-6';
    
    switch (type) {
      case 'order_status':
        return <CheckCircle className={`${baseClasses} text-blue-600`} />;
      case 'stock_update':
        return <AlertCircle className={`${baseClasses} text-amber-600`} />;
      case 'promotion':
        return <Bell className={`${baseClasses} text-green-600`} />;
      case 'waiter_call':
        return <AlertCircle className={`${baseClasses} text-purple-600`} />;
      default:
        return <Info className={`${baseClasses} text-gray-600`} />;
    }
  };

  const getToastBackground = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#fef2f2'; // bg-red-50
      case 'medium':
        return '#fffbeb'; // bg-amber-50
      case 'low':
        return '#f0fdf4'; // bg-green-50
      default:
        return '#f9fafb'; // bg-gray-50
    }
  };

  const getToastBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#fecaca'; // border-red-200
      case 'medium':
        return '#fed7aa'; // border-amber-200
      case 'low':
        return '#bbf7d0'; // border-green-200
      default:
        return '#e5e7eb'; // border-gray-200
    }
  };

  return null; // Este componente não renderiza nada, apenas gerencia toasts
} 