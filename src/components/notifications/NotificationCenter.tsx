'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellOff, Volume2, VolumeX, Check, Trash2, Filter } from 'lucide-react';
import { useNotificationStore, requestNotificationPermission } from '@/store/notification-store';
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
    toggleSound,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotificationStore();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        // Feedback visual de sucesso
        setTimeout(() => {
          setIsRequestingPermission(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setIsRequestingPermission(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return '📦';
      case 'stock_update':
        return '📊';
      case 'promotion':
        return '🎉';
      case 'waiter_call':
        return '🛎️';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      role="dialog"
      aria-label="Central de notificações"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-gray-800">Notificações</h3>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full min-w-[20px] h-5"
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de som */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSound}
            className="p-1 text-gray-500 hover:text-amber-600 transition-colors"
            aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </motion.button>

          {/* Botão de fechar */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            aria-label="Fechar central de notificações"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-1">
            {(['all', 'unread', 'read'] as const).map((filterType) => (
              <motion.button
                key={filterType}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                  filter === filterType
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filterType === 'all' ? 'Todas' : filterType === 'unread' ? 'Não lidas' : 'Lidas'}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Permissão de notificações */}
      {!hasPermission && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 border-b border-blue-100"
        >
          <div className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">Ativar notificações push</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="ml-auto px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isRequestingPermission ? 'Ativando...' : 'Ativar'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Lista de notificações */}
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center text-gray-500"
            >
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {filter === 'all'
                  ? 'Nenhuma notificação ainda'
                  : filter === 'unread'
                    ? 'Todas as notificações foram lidas'
                    : 'Nenhuma notificação lida'
                }
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                className={`p-3 border-l-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  getPriorityColor(notification.priority)
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            aria-label="Marcar como lida"
                          >
                            <Check className="h-3 w-3" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Remover notificação"
                        >
                          <Trash2 className="h-3 w-3" />
                        </motion.button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>

                      {notification.priority === 'high' && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                          Importante
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </span>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Marcar todas como lidas
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                Limpar todas
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 