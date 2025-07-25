'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Package, Gift, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationDemoProps {
  storeId?: string;
  tableId?: string;
}

export function NotificationDemo({ storeId, tableId }: NotificationDemoProps) {
  const {
    showNotification,
    showOrderNotification,
    showStockNotification,
    showPromotionNotification,
    showWaiterCallNotification,
    requestPermission,
    sendPush,
    isConnected,
    unreadCount,
  } = useNotifications(storeId, tableId);

  const [isOpen, setIsOpen] = useState(false);

  const handleTestNotification = (type: string) => {
    switch (type) {
      case 'order':
        showOrderNotification('12345', 'Em preparação', 'Seu pedido está sendo preparado!');
        break;
      case 'stock':
        showStockNotification('Hambúrguer Clássico', false);
        break;
      case 'promotion':
        showPromotionNotification(
          'Promoção Especial!',
          '20% de desconto em todos os hambúrgueres hoje!',
          { discount: 20, category: 'hamburgers' }
        );
        break;
      case 'waiter':
        showWaiterCallNotification('O garçom está a caminho da sua mesa!');
        break;
      case 'general':
        showNotification(
          'Bem-vindo!',
          'Obrigado por usar nosso sistema de pedidos.',
          'general',
          'low'
        );
        break;
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      sendPush('Permissão concedida!', {
        body: 'Você receberá notificações sobre seus pedidos.',
        icon: '/favicon.ico',
      });
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Testar notificações"
      >
        <Bell className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Teste de Notificações</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-gray-600">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
          {unreadCount > 0 && (
            <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {unreadCount} não lidas
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTestNotification('order')}
            className="flex items-center gap-2 p-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Pedido
          </button>
          
          <button
            onClick={() => handleTestNotification('stock')}
            className="flex items-center gap-2 p-2 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
          >
            <Package className="w-4 h-4" />
            Estoque
          </button>
          
          <button
            onClick={() => handleTestNotification('promotion')}
            className="flex items-center gap-2 p-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          >
            <Gift className="w-4 h-4" />
            Promoção
          </button>
          
          <button
            onClick={() => handleTestNotification('waiter')}
            className="flex items-center gap-2 p-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Garçom
          </button>
        </div>

        <button
          onClick={() => handleTestNotification('general')}
          className="w-full p-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Notificação Geral
        </button>

        <button
          onClick={handleRequestPermission}
          className="w-full p-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Ativar Notificações Push
        </button>
      </div>
    </div>
  );
} 