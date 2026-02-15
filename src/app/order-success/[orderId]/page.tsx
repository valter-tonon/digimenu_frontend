'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface OrderAddon {
  id: number;
  name: string;
  price: string | number;
  quantity: number;
}

interface OrderItem {
  product_name?: string;
  name?: string;
  quantity: number;
  price: number;
  total?: number;
  qty?: number;
  comments?: string;
  notes?: string;
  addons?: OrderAddon[] | string;
}

interface OrderDetails {
  identify: string;
  total: number;
  status: string;
  status_code?: string;
  date: string;
  type: string;
  customer_name?: string;
  payment_method?: string;
  products?: OrderItem[];
  items?: OrderItem[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`);
        if (!response.ok) throw new Error('Pedido não encontrado');
        const data = await response.json();
        const orderData = data.data || data;
        setOrder(orderData);
      } catch (err) {
        console.error('Erro ao buscar pedido:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'bg-yellow-50 border-yellow-200',
      'aceito': 'bg-blue-50 border-blue-200',
      'em_preparo': 'bg-purple-50 border-purple-200',
      'pronto': 'bg-green-50 border-green-200',
      'finalizado': 'bg-green-50 border-green-200',
      'cancelado': 'bg-red-50 border-red-200',
    };
    return statusMap[status] || 'bg-gray-50 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'aceito': 'Aceito',
      'em_preparo': 'Em Preparo',
      'pronto': 'Pronto para Retirada',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado',
    };
    return statusMap[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'delivery': '🚗 Delivery',
      'takeout': '🏪 Retirada',
      'table': '🍽️ Mesa',
    };
    return typeMap[type] || type;
  };

  const getPaymentLabel = (method: string) => {
    const paymentMap: Record<string, string> = {
      'cash': 'Dinheiro',
      'dinheiro': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
    };
    return paymentMap[method] || method;
  };

  const parseAddons = (addons: OrderAddon[] | string | undefined): OrderAddon[] => {
    if (!addons) return [];
    if (typeof addons === 'string') {
      try {
        return JSON.parse(addons);
      } catch {
        return [];
      }
    }
    return addons;
  };

  const getOrderItems = (): OrderItem[] => {
    if (!order) return [];
    // Prefer 'products' (from OrderItemsResource) or fallback to 'items'
    return order.products || order.items || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
          <p className="text-gray-600 mb-6">Desculpe, não conseguimos encontrar informações sobre este pedido.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    );
  }

  const statusKey = order.status_code || order.status;
  const items = getOrderItems();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-4">Seu pedido foi recebido com sucesso</p>
          <p className="text-2xl font-bold text-amber-600">#{order.identify}</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Detalhes do Pedido</h2>

          {/* Status */}
          <div className={`border-2 rounded-lg p-4 mb-4 ${getStatusColor(statusKey)}`}>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-bold text-gray-900">{getStatusLabel(statusKey)}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-600 mb-2">Itens</p>
            <div className="space-y-3">
              {items.map((item, index) => {
                const itemName = item.product_name || item.name || 'Produto';
                const itemQty = item.qty || item.quantity;
                const itemPrice = item.price;
                const addons = parseAddons(item.addons);
                const itemNotes = item.notes || item.comments;

                return (
                  <div key={index} className="pb-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-900 font-medium">{itemName}</p>
                        <p className="text-sm text-gray-600">Qtd: {itemQty}</p>
                      </div>
                      <p className="font-bold text-gray-900">
                        R$ {(itemPrice * itemQty).toFixed(2)}
                      </p>
                    </div>

                    {/* Addons/Adicionais */}
                    {addons.length > 0 && (
                      <div className="mt-1 ml-2">
                        {addons.map((addon, addonIndex) => (
                          <p key={addonIndex} className="text-xs text-gray-500">
                            + {addon.name}
                            {addon.quantity > 1 ? ` (x${addon.quantity})` : ''}
                            {addon.price ? ` R$ ${Number(addon.price).toFixed(2)}` : ''}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {itemNotes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Obs: {itemNotes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
            <p className="font-bold text-gray-900">Total</p>
            <p className="text-2xl font-bold text-amber-600">R$ {order.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informações do Pedido</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Tipo:</span>
              <span className="text-gray-900">{getTypeLabel(order.type)}</span>
            </div>

            {order.payment_method && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Pagamento:</span>
                <span className="text-gray-900">{getPaymentLabel(order.payment_method)}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Data:</span>
              <span className="text-gray-900">
                {new Date(order.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-amber-900 mb-2">Próximos Passos</h3>
          <ul className="text-sm text-amber-900 space-y-1">
            <li>✓ Seu pedido foi recebido e está sendo processado</li>
            <li>✓ Você receberá atualizações por WhatsApp</li>
            <li>✓ Acompanhe o status do seu pedido abaixo</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/my-orders')}
            className="w-full bg-amber-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-600 flex items-center justify-center gap-2"
          >
            Ver Meus Pedidos
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-white border-2 border-amber-500 text-amber-600 px-6 py-3 rounded-lg font-bold hover:bg-amber-50"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
