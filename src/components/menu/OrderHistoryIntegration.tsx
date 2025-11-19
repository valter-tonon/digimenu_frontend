'use client';

import { useState, useEffect } from 'react';
import { useMenuAuth } from '@/infrastructure/hooks/useMenuAuth';

interface OrderHistoryItem {
  id: number;
  uuid: string;
  identify: string;
  total: number;
  discount: number;
  final_total: number;
  status: string;
  type: string;
  payment_method: string;
  estimated_delivery_time?: string;
  created_at: string;
  tracking_code?: string;
}

interface OrderHistoryIntegrationProps {
  onReorder?: (items: any[]) => void;
}

export default function OrderHistoryIntegration({
  onReorder,
}: OrderHistoryIntegrationProps) {
  const { getAuthToken } = useMenuAuth();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('completed');

  useEffect(() => {
    fetchOrderHistory();
  }, [filter]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError('Não autenticado');
        return;
      }

      const statusParam = filter === 'all' ? '' : `&status=${filter}`;
      const response = await fetch(
        `/api/v1/orders-v2/history?per_page=10${statusParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar histórico');
      }

      const data = await response.json();
      setOrders(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (orderId: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Sessão expirada');
        return;
      }

      const response = await fetch(`/api/v1/orders-v2/${orderId}/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_method: 'pending' }),
      });

      if (!response.ok) {
        throw new Error('Erro ao repetir pedido');
      }

      const data = await response.json();
      alert(`✅ Pedido repetido! ID: ${data.data.identify}`);

      // Callback para adicionar itens ao carrinho se houver handler
      if (onReorder) {
        onReorder(data.data.items);
      }

      // Refresh history
      fetchOrderHistory();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao repetir pedido');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'finalizado': { color: 'bg-green-100 text-green-800', label: '✅ Finalizado' },
      'entregue': { color: 'bg-green-100 text-green-800', label: '📦 Entregue' },
      'cancelado': { color: 'bg-red-100 text-red-800', label: '❌ Cancelado' },
      'pendente': { color: 'bg-yellow-100 text-yellow-800', label: '⏳ Pendente' },
      'em_preparo': { color: 'bg-blue-100 text-blue-800', label: '👨‍🍳 Preparando' },
      'pronto': { color: 'bg-purple-100 text-purple-800', label: '🎉 Pronto' },
    };

    const config = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>{config.label}</span>;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'delivery': '🚗 Entrega',
      'takeout': '🛍️ Retirada',
      'table': '🍽️ Mesa',
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              filter === f
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Em Andamento' : 'Concluídos'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">📭 Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-lg">Pedido #{order.identify}</p>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>{getTypeLabel(order.type)}</span>
                    <span>💳 {order.payment_method}</span>
                    {order.discount > 0 && (
                      <span className="text-green-600">-R$ {order.discount.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    R$ {order.final_total.toFixed(2)}
                  </p>
                  {order.discount > 0 && (
                    <p className="text-xs text-gray-500 line-through">
                      R$ {order.total.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => window.location.href = `/orders/${order.uuid}`}
                  className="flex-1 px-4 py-2 text-sm text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  👁️ Ver Detalhes
                </button>
                <button
                  onClick={() => handleReorder(order.id)}
                  className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  🔄 Repetir Pedido
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
