'use client';

import { useState, useEffect } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBadgeProps {
  storeId?: string;
  tableId?: string;
}

export function NotificationBadge({ storeId, tableId }: NotificationBadgeProps) {
  const { unreadCount, isConnected, connect, disconnect } = useNotificationStore();
  const [showCenter, setShowCenter] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Conectar ao WebSocket quando o componente montar
    if (storeId) {
      connect(storeId, tableId);
    }

    // Verificar permissão de notificações
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }

    // Limpar conexão quando o componente desmontar
    return () => {
      disconnect();
    };
  }, [storeId, tableId, connect, disconnect]);

  const handleClick = () => {
    setShowCenter(!showCenter);
  };

  const getConnectionIcon = () => {
    if (isConnected) {
      return <Wifi className="w-3 h-3 text-green-500" />;
    }
    return <WifiOff className="w-3 h-3 text-red-500" />;
  };

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={handleClick}
        className="relative p-2 text-gray-600 hover:text-amber-500 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-6 w-6" />
        
        {/* Badge de notificações não lidas */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Indicador de conexão */}
        <div className="absolute bottom-0 right-0">
          {getConnectionIcon()}
        </div>
      </button>

      {/* Central de notificações */}
      {showCenter && (
        <div className="absolute right-0 mt-2 z-50">
          <NotificationCenter 
            onClose={() => setShowCenter(false)}
            hasPermission={hasPermission}
          />
        </div>
      )}
    </div>
  );
} 