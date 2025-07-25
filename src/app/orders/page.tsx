'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { OrderHistory } from '@/components/orders/OrderHistory';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StoreHeader } from '@/components/menu/StoreHeader';
import { api } from '@/services/api';

interface Order {
  id: number;
  uuid: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer?: {
    id: number;
    name: string;
    phone: string;
  };
  delivery_address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  table_number?: number;
  estimated_delivery_time?: string;
  payment_method?: string;
  notes?: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  additionals?: {
    id: number;
    name: string;
    price: number;
  }[];
}

export default function OrdersPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any>(null);

  // Carregar dados da loja
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const response = await api.get(`/api/v1/tenants/${storeId}`);
        setStoreData(response.data);
      } catch (err) {
        console.error('Erro ao carregar dados da loja:', err);
      }
    };

    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  // Carregar histórico de pedidos
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tentar carregar pedidos do cliente (se autenticado)
        let response;
        try {
          response = await api.get(`/api/v1/orders/history`);
        } catch (err: any) {
          // Se não conseguir carregar pedidos do cliente, tentar pedidos da mesa
          if (params.tableId) {
            response = await api.get(`/api/v1/orders/table/${params.tableId}/history`);
          } else {
            throw err;
          }
        }
        
        setOrders(response.data.data || []);
      } catch (err: any) {
        console.error('Erro ao carregar histórico de pedidos:', err);
        setError(err.response?.data?.message || 'Erro ao carregar histórico de pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [storeId, params.tableId]);

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!storeId) return;

    const ws = new WebSocket(`ws://localhost:6001/orders/${storeId}`);
    
    ws.onopen = () => {
      console.log('WebSocket conectado para atualizações de pedidos');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'order_updated') {
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === data.order.id ? { ...order, ...data.order } : order
            )
          );
          
          // Atualizar pedido selecionado se for o mesmo
          if (selectedOrder && selectedOrder.id === data.order.id) {
            setSelectedOrder(prev => prev ? { ...prev, ...data.order } : null);
          }
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WebSocket:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };

    return () => {
      ws.close();
    };
  }, [storeId, selectedOrder]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
  };

  const handleRepeatOrder = async (orderId: number) => {
    try {
      // Buscar detalhes do pedido para repetir
      const orderToRepeat = orders.find(order => order.id === orderId);
      if (orderToRepeat) {
        // Redirecionar para o menu com os itens do pedido
        const items = orderToRepeat.items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          additionals: item.additionals || []
        }));
        
        // Salvar no localStorage para carregar no menu
        localStorage.setItem('repeatOrder', JSON.stringify(items));
        window.location.href = `/${storeId}`;
      }
    } catch (error) {
      console.error('Erro ao repetir pedido:', error);
    }
  };

  const handleRateOrder = (orderId: number) => {
    // Implementar modal de avaliação
    console.log('Avaliando pedido:', orderId);
  };

  const handleContactSupport = (orderId: number) => {
    // Implementar contato com suporte
    console.log('Contatando suporte para pedido:', orderId);
  };

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    // Atualizar pedido selecionado se for o mesmo
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">❌</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar histórico</h1>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <StoreHeader 
            storeName={storeData?.name || storeId}
            storeLogo={storeData?.logo}
            subtitle="Histórico de Pedidos"
          />
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Pedidos */}
          <div className="lg:col-span-2">
            <OrderHistory 
              orders={orders}
              selectedOrderId={selectedOrder?.id}
              onOrderClick={handleOrderClick}
            />
          </div>

          {/* Detalhes do Pedido */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <OrderDetails 
                order={selectedOrder}
                onClose={handleCloseOrderDetails}
                onRepeatOrder={handleRepeatOrder}
                onRateOrder={handleRateOrder}
                onContactSupport={handleContactSupport}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <p>Selecione um pedido para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </main>


    </div>
  );
} 