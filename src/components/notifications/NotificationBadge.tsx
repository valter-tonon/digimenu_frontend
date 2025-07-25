'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';
import { NotificationCenter } from './NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBadgeProps {
  storeId?: string;
  tableId?: string;
}

export function NotificationBadge({ storeId, tableId }: NotificationBadgeProps) {
  const { unreadCount, isConnected, connect, disconnect } = useNotificationStore();
  const [showCenter, setShowCenter] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Detectar cliques fora do dropdown para fechá-lo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCenter(false);
      }
    };

    if (showCenter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCenter]);

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
    <div className="relative" ref={dropdownRef}>
      {/* Botão de notificações */}
      <motion.button
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-2 text-gray-600 hover:text-amber-500 transition-all duration-200 ease-in-out"
        aria-label="Notificações"
      >
        <motion.div
          animate={{
            rotate: isHovered ? [0, -10, 10, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Bell className="h-6 w-6" />
        </motion.div>
        
        {/* Badge de notificações não lidas */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                duration: 0.3
              }}
              className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5 shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Indicador de conexão */}
        <motion.div
          className="absolute bottom-0 right-0"
          animate={{
            scale: isConnected ? [1, 1.2, 1] : 1,
            opacity: isConnected ? 1 : 0.7
          }}
          transition={{
            duration: 2,
            repeat: isConnected ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          {getConnectionIcon()}
        </motion.div>
      </motion.button>

      {/* Central de notificações */}
      <AnimatePresence>
        {showCenter && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="absolute right-0 mt-2 z-50"
          >
            <NotificationCenter
              onClose={() => setShowCenter(false)}
              hasPermission={hasPermission}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 