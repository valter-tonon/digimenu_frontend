'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  X, 
  Clock, 
  MapPin, 
  Users, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Phone,
  CreditCard,
  FileText,
  Truck
} from 'lucide-react';
import { OrderStatusTracker } from './OrderStatusTracker';
import { OrderActions } from './OrderActions';

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

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onRepeatOrder?: (orderId: number) => void;
  onRateOrder?: (orderId: number) => void;
  onContactSupport?: (orderId: number) => void;
}

const getStatusInfo = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        label: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        bgColor: 'bg-yellow-50 border-yellow-200',
        description: 'Seu pedido foi recebido e está aguardando confirmação.'
      };
    case 'confirmed':
      return {
        label: 'Confirmado',
        color: 'bg-blue-100 text-blue-800',
        icon: AlertCircle,
        bgColor: 'bg-blue-50 border-blue-200',
        description: 'Seu pedido foi confirmado e está sendo preparado.'
      };
    case 'preparing':
      return {
        label: 'Preparando',
        color: 'bg-orange-100 text-orange-800',
        icon: Package,
        bgColor: 'bg-orange-50 border-orange-200',
        description: 'Seu pedido está sendo preparado na cozinha.'
      };
    case 'ready':
      return {
        label: 'Pronto',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        bgColor: 'bg-green-50 border-green-200',
        description: 'Seu pedido está pronto para entrega ou retirada.'
      };
    case 'delivered':
      return {
        label: 'Entregue',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        bgColor: 'bg-green-50 border-green-200',
        description: 'Seu pedido foi entregue com sucesso.'
      };
    case 'cancelled':
      return {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        bgColor: 'bg-red-50 border-red-200',
        description: 'Seu pedido foi cancelado.'
      };
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-800',
        icon: Clock,
        bgColor: 'bg-gray-50 border-gray-200',
        description: 'Status do pedido não identificado.'
      };
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

const formatAddress = (address: any): string => {
  const parts = [
    address.street,
    address.number,
    address.complement,
    address.neighborhood,
    address.city,
    address.state,
    address.zip_code
  ].filter(Boolean);
  
  return parts.join(', ');
};

export function OrderDetails({ 
  order, 
  onClose, 
  onRepeatOrder, 
  onRateOrder, 
  onContactSupport 
}: OrderDetailsProps) {
  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const subtotal = order.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const additionalsTotal = item.additionals?.reduce((addSum, add) => addSum + add.price, 0) || 0;
    return sum + itemTotal + additionalsTotal;
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Pedido #{order.order_number}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status do Pedido */}
      <div className="p-6 border-b border-gray-200">
        <div className={`p-4 rounded-lg border ${statusInfo.bgColor}`}>
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon className="w-5 h-5" />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-600">{statusInfo.description}</p>
        </div>
      </div>

      {/* Informações do Cliente/Entrega */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Pedido</h3>
        
        <div className="space-y-4">
          {/* Tipo de Pedido */}
          <div className="flex items-center gap-3">
            {order.delivery_address ? (
              <>
                <MapPin className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-800">Entrega</p>
                  <p className="text-sm text-gray-600">{formatAddress(order.delivery_address)}</p>
                </div>
              </>
            ) : (
              <>
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-800">Mesa {order.table_number}</p>
                  <p className="text-sm text-gray-600">Pedido para consumo no local</p>
                </div>
              </>
            )}
          </div>

          {/* Cliente */}
          {order.customer && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-800">{order.customer.name}</p>
                <p className="text-sm text-gray-600">{order.customer.phone}</p>
              </div>
            </div>
          )}

          {/* Método de Pagamento */}
          {order.payment_method && (
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-800">Pagamento</p>
                <p className="text-sm text-gray-600">{order.payment_method}</p>
              </div>
            </div>
          )}

          {/* Tempo Estimado */}
          {order.estimated_delivery_time && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-800">Tempo Estimado</p>
                <p className="text-sm text-gray-600">{order.estimated_delivery_time}</p>
              </div>
            </div>
          )}

          {/* Observações */}
          {order.notes && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Observações</p>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Itens do Pedido */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Itens do Pedido</h3>
        
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                  <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                </div>
                <span className="font-semibold text-gray-800">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
              
              {/* Adicionais */}
              {item.additionals && item.additionals.length > 0 && (
                <div className="mt-2 pl-4 border-l-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Adicionais:</p>
                  {item.additionals.map((additional) => (
                    <div key={additional.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">+ {additional.name}</span>
                      <span className="text-gray-600">{formatPrice(additional.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-800">{formatPrice(subtotal)}</span>
          </div>
          
          {order.total !== subtotal && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxa de entrega:</span>
              <span className="text-gray-800">{formatPrice(order.total - subtotal)}</span>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-gray-800">Total:</span>
              <span className="text-green-600">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rastreador de Status */}
      <div className="mt-6">
        <OrderStatusTracker 
          order={order}
          onStatusUpdate={(orderId, newStatus) => {
            console.log('Status atualizado:', orderId, newStatus);
          }}
        />
      </div>

      {/* Ações do Pedido */}
      <div className="mt-6">
        <OrderActions 
          orderId={order.id}
          orderNumber={order.order_number}
          status={order.status}
          onRepeatOrder={onRepeatOrder}
          onRateOrder={onRateOrder}
          onContactSupport={onContactSupport}
        />
      </div>
    </div>
  );
} 