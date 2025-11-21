'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Loader2, RefreshCw, ChevronRight, Clock } from 'lucide-react';
import { getMyOrders, repeatOrder } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  identify: string;
  total: number;
  formatted_total: string;
  status: string;
  status_description: string;
  status_color: string;
  formatted_date: string;
  formatted_time: string;
  items: OrderItem[];
  can_repeat: boolean;
}

export default function OrdersHistoryPage() {
  const params = useParams() as Record<string, string | string[]> | null;
  const { isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRepeat, setLoadingRepeat] = useState<string | null>(null);

  const storeId = (params?.storeId as string) || '';
  const tableId = (params?.tableId as string) || '';

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      const response = await getMyOrders(token);
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Não foi possível carregar o histórico de pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatOrder = async (orderId: string) => {
    setLoadingRepeat(orderId);
    try {
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      await repeatOrder(token, orderId);
      toast.success('Pedido repetido com sucesso!');
      // Redirecionar para o carrinho ou exibir confirmação
    } catch (error) {
      console.error('Erro ao repetir pedido:', error);
      toast.error('Não foi possível repetir este pedido');
    } finally {
      setLoadingRepeat(null);
    }
  };

  const getStatusBadgeClass = (color: string) => {
    const baseClass = 'py-1 px-2 rounded-full text-xs font-medium';
    
    switch (color) {
      case 'yellow':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'blue':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'green':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'purple':
        return `${baseClass} bg-purple-100 text-purple-800`;
      case 'red':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP', { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Histórico de Pedidos</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="mb-4">Você precisa estar logado para ver seu histórico de pedidos.</p>
          <button 
            className="bg-primary text-white py-2 px-4 rounded-md"
            onClick={() => window.location.href = `/${storeId}/${tableId}/login`}
          >
            Fazer Login
          </button>
        </div>
        <div className="h-16"></div>
        <BottomNavigation storeId={storeId} tableId={tableId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Histórico de Pedidos</h1>
        <button 
          className="flex items-center text-primary"
          onClick={fetchOrders}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 mr-1" />
          )}
          <span>Atualizar</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>Você ainda não fez nenhum pedido.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.identify} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">Pedido #{order.identify}</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDate(order.formatted_date)} • {order.formatted_time}</span>
                    </div>
                  </div>
                  <span className={getStatusBadgeClass(order.status_color)}>
                    {order.status_description}
                  </span>
                </div>
                <p className="font-bold text-lg mt-2">{order.formatted_total}</p>
              </div>
              
              <div className="p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Itens do pedido</h4>
                <ul className="space-y-2">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                          {item.quantity}
                        </span>
                        <span>{item.product_name}</span>
                      </div>
                      <span className="text-gray-600">
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </li>
                  ))}
                  {order.items.length > 3 && (
                    <li className="text-primary text-sm">
                      + {order.items.length - 3} outros itens
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="p-4 border-t flex justify-between items-center">
                <button
                  className="text-primary font-medium flex items-center"
                  onClick={() => window.location.href = `/${storeId}/${tableId}/orders/${order.identify}`}
                >
                  <span>Detalhes</span>
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
                
                {order.can_repeat && (
                  <button
                    className="bg-primary text-white py-2 px-4 rounded-md flex items-center"
                    onClick={() => handleRepeatOrder(order.identify)}
                    disabled={loadingRepeat === order.identify}
                  >
                    {loadingRepeat === order.identify ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    <span>Repetir Pedido</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="h-16"></div>
      <BottomNavigation storeId={storeId} tableId={tableId} />
    </div>
  );
} 