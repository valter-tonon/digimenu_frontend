'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/infrastructure/api/apiClient';

interface TableActionsProps {
  storeId: string;
  tableId: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  product_name: string;
  total_price: string;
}

interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | string;
  items: OrderItem[];
  total_price: string;
}

interface OrderStatusResponse {
  orders: Order[];
}

export function TableActions({ storeId, tableId }: TableActionsProps) {
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse | null>(null);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);
  const [isCheckingOrders, setIsCheckingOrders] = useState(true);

  // Verificar se existem pedidos ativos ao carregar o componente
  useEffect(() => {
    const checkForActiveOrders = async () => {
      try {
        setIsCheckingOrders(true);
        const response = await apiClient.get<OrderStatusResponse>(`/orders/status`, {
          params: {
            store_id: storeId,
            table_id: tableId,
          }
        });
        
        const hasOrders = response && 
                          response.orders && 
                          response.orders.length > 0 && 
                          response.orders.some(order => 
                            order.status !== 'delivered' && order.status !== 'cancelled'
                          );
        
        setHasActiveOrders(hasOrders);
        setOrderStatus(response);
      } catch (error) {
        console.error('Erro ao verificar pedidos ativos:', error);
        setHasActiveOrders(false);
      } finally {
        setIsCheckingOrders(false);
      }
    };

    checkForActiveOrders();
  }, [storeId, tableId]);

  // Função para verificar o status do pedido
  const checkOrderStatus = async () => {
    if (isLoadingStatus) return;
    
    setIsLoadingStatus(true);
    try {
      console.log('Verificando status para:', { storeId, tableId });
      const response = await apiClient.get<OrderStatusResponse>(`/orders/status`, {
        params: {
          store_id: storeId,
          table_id: tableId,
        }
      });
      
      setOrderStatus(response);
      setShowOrderStatus(true);
      
      // Atualizar o estado de pedidos ativos
      const hasOrders = response && 
                        response.orders && 
                        response.orders.length > 0 && 
                        response.orders.some(order => 
                          order.status !== 'delivered' && order.status !== 'cancelled'
                        );
      
      setHasActiveOrders(hasOrders);
    } catch (error) {
      console.error('Erro ao verificar status do pedido:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Função para fechar o modal de status
  const closeStatusModal = () => {
    setShowOrderStatus(false);
  };

  return (
            <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-floating-cart">
      {/* Botão de verificar status do pedido - só aparece se houver pedidos ativos */}
      {(hasActiveOrders || isCheckingOrders) && (
        <button
          onClick={checkOrderStatus}
          disabled={isLoadingStatus || isCheckingOrders}
          className="p-3 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
        >
          {isLoadingStatus || isCheckingOrders ? (
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
        </button>
      )}

      {/* Modal de status do pedido */}
      {showOrderStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Status do Pedido</h2>
            
            {orderStatus && orderStatus.orders && orderStatus.orders.length > 0 ? (
              <div className="space-y-4">
                {orderStatus.orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Pedido #{order.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Pendente' :
                         order.status === 'preparing' ? 'Preparando' :
                         order.status === 'ready' ? 'Pronto' :
                         order.status === 'delivered' ? 'Entregue' :
                         order.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {order.items && order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span>R$ {parseFloat(item.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>R$ {parseFloat(order.total_price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Nenhum pedido encontrado para esta mesa.</p>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 