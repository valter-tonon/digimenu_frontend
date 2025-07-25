'use client';

import { useState } from 'react';
import { X, Check, Trash2, Volume2, VolumeX, Settings } from 'lucide-react';
import { useNotificationStore, requestNotificationPermission, sendPushNotification } from '@/store/notification-store';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface NotificationCenterProps {
  onClose: () => void;
  hasPermission: boolean;
}

export function NotificationCenter({ onClose, hasPermission }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    soundEnabled, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll, 
    toggleSound 
  } = useNotificationStore();
  
  const [showSettings, setShowSettings] = useState(false);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRemoveNotification = (id: string) => {
    removeNotification(id);
  };

  const handleClearAll = () => {
    clearAll();
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      // Enviar notificação de teste
      sendPushNotification('Notificações ativadas!', {
        body: 'Você receberá notificações sobre seus pedidos e novidades.',
        tag: 'permission-granted',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'stock_update':
        return (
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        );
      case 'promotion':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      case 'waiter_call':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-amber-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className="w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configurações */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Som de notificação</span>
              <button
                onClick={toggleSound}
                className={`p-1 rounded transition-colors ${
                  soundEnabled ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
            
            {!hasPermission && (
              <button
                onClick={handleRequestPermission}
                className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Ativar notificações push
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de notificações */}
      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            aria-label="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Remover notificação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(notification.timestamp, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Marcar todas como lidas
            </button>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Limpar todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 