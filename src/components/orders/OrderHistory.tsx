'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, Users, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface OrderHistoryProps {
  orders: Order[];
  selectedOrderId?: number;
  onOrderClick: (order: Order) => void;
}

const getStatusInfo = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        label: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        bgColor: 'bg-yellow-50 border-yellow-200'
      };
    case 'confirmed':
      return {
        label: 'Confirmado',
        color: 'bg-blue-100 text-blue-800',
        icon: AlertCircle,
        bgColor: 'bg-blue-50 border-blue-200'
      };
    case 'preparing':
      return {
        label: 'Preparando',
        color: 'bg-orange-100 text-orange-800',
        icon: Package,
        bgColor: 'bg-orange-50 border-orange-200'
      };
    case 'ready':
      return {
        label: 'Pronto',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        bgColor: 'bg-green-50 border-green-200'
      };
    case 'delivered':
      return {
        label: 'Entregue',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        bgColor: 'bg-green-50 border-green-200'
      };
    case 'cancelled':
      return {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        bgColor: 'bg-red-50 border-red-200'
      };
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-800',
        icon: Clock,
        bgColor: 'bg-gray-50 border-gray-200'
      };
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

export function OrderHistory({ orders, selectedOrderId, onOrderClick }: OrderHistoryProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status.toLowerCase() === filter.toLowerCase();
  });

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Prontos' },
    { value: 'delivered', label: 'Entregues' },
    { value: 'cancelled', label: 'Cancelados' }
  ];

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Nenhum pedido encontrado</h2>
        <p className="text-gray-600">Você ainda não fez nenhum pedido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Histórico de Pedidos</h1>
            <p className="text-gray-600 mt-1">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const statusInfo = getStatusInfo(order.status);
          const StatusIcon = statusInfo.icon;
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const isSelected = selectedOrderId === order.id;

          return (
            <div
              key={order.id}
              onClick={() => onOrderClick(order)}
              className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                  ? 'border-amber-500 bg-amber-50' 
                  : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="p-6">
                {/* Header do Pedido */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Pedido #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </div>
                </div>

                {/* Informações do Pedido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-semibold text-green-600">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Tipo de Pedido */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  {order.delivery_address ? (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Entrega</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Mesa {order.table_number}</span>
                    </>
                  )}
                </div>

                {/* Itens do Pedido (Preview) */}
                <div className="space-y-1">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="text-gray-600">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  
                  {order.items.length > 2 && (
                    <div className="text-sm text-gray-500 italic">
                      +{order.items.length - 2} mais item{order.items.length - 2 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Tempo Estimado de Entrega */}
                {order.estimated_delivery_time && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Entrega estimada: {order.estimated_delivery_time}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensagem quando não há pedidos filtrados */}
      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Nenhum pedido encontrado</h2>
          <p className="text-gray-600">Não há pedidos com o status selecionado.</p>
        </div>
      )}
    </div>
  );
} 