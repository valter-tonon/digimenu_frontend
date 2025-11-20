'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { getOrder, repeatOrder } from '@/services/api';
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
  comment: string;
  formatted_date: string;
  formatted_time: string;
  items: OrderItem[];
  can_repeat: boolean;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRepeat, setLoadingRepeat] = useState(false);

  const storeId = params?.storeId as string;
  const tableId = params?.tableId as string;
  const orderId = params?.orderId as string;

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await getOrder(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      toast.error('Não foi possível carregar os detalhes do pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatOrder = async () => {
    setLoadingRepeat(true);
    try {
      if (!token) {
        throw new Error('Token não encontrado');
        return;
      }

      await repeatOrder(token, orderId);
      toast.success('Pedido repetido com sucesso!');
      router.push(`/${storeId}/${tableId}/cart`);
    } catch (error) {
      console.error('Erro ao repetir pedido:', error);
      toast.error('Não foi possível repetir este pedido');
    } finally {
      setLoadingRepeat(false);
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
        <h1 className="text-2xl font-bold mb-6">Detalhes do Pedido</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="mb-4">Você precisa estar logado para ver os detalhes do pedido.</p>
          <button
            className="bg-primary text-white py-2 px-4 rounded-md"
            onClick={() => router.push(`/${storeId}/${tableId}/login`)}
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
      <div className="flex items-center mb-6">
        <button
          className="mr-4 p-2"
          onClick={() => router.push(`/${storeId}/${tableId}/orders`)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !order ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>Pedido não encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">Pedido #{order.identify}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{formatDate(order.formatted_date)} • {order.formatted_time}</span>
                  </div>
                </div>
                <span className={getStatusBadgeClass(order.status_color)}>
                  {order.status_description}
                </span>
              </div>
              <p className="font-bold text-xl mt-2">{order.formatted_total}</p>
            </div>

            <div className="p-4">
              <h4 className="font-medium mb-3">Itens do pedido</h4>
              <ul className="space-y-3 divide-y divide-gray-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between pt-2">
                    <div className="flex items-center">
                      <span className="bg-gray-200 text-gray-700 rounded-full w-7 h-7 flex items-center justify-center mr-3">
                        {item.quantity}
                      </span>
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        <div className="text-sm text-gray-500">
                          R$ {item.price.toFixed(2).replace('.', ',')} (unidade)
                        </div>
                      </div>
                    </div>
                    <span className="font-medium">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {order.comment && (
              <div className="p-4 border-t">
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-gray-700">{order.comment}</p>
              </div>
            )}

            <div className="p-4 border-t flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-bold text-xl">{order.formatted_total}</div>
              </div>

              {order.can_repeat && (
                <button
                  className="bg-primary text-white py-2 px-4 rounded-md flex items-center"
                  onClick={handleRepeatOrder}
                  disabled={loadingRepeat}
                >
                  {loadingRepeat ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  <span>Repetir Pedido</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="h-16"></div>
      <BottomNavigation storeId={storeId} tableId={tableId} />
    </div>
  );
} 