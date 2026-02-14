'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock, MapPin, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OrderDetails {
  identify: string;
  total: number;
  status: string;
  date: string;
  type: string;
  customer_name?: string;
  payment_method?: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular busca de detalhes do pedido
    // Em produção, isso viria de uma API
    setOrder({
      identify: orderId,
      total: 35,
      status: 'pendente',
      date: new Date().toLocaleDateString('pt-BR'),
      type: 'delivery',
      payment_method: 'pix',
      items: [
        {
          product_name: 'Batata Frita Média',
          quantity: 1,
          price: 35
        }
      ]
    });
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!order) {
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
          <div className={`border-2 rounded-lg p-4 mb-4 ${getStatusColor(order.status)}`}>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-bold text-gray-900">{getStatusLabel(order.status)}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-600 mb-2">Itens</p>
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="text-gray-900 font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900">R$ {item.price.toFixed(2)}</p>
                </div>
              ))}
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
              <span className="text-gray-900">
                {order.type === 'delivery' ? '🚗 Delivery' : order.type === 'takeout' ? '🏪 Retirada' : '🍽️ Mesa'}
              </span>
            </div>

            {order.payment_method && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Pagamento:</span>
                <span className="text-gray-900 capitalize">{order.payment_method}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Data:</span>
              <span className="text-gray-900">{order.date}</span>
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
