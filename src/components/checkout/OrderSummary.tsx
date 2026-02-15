'use client';

import { useMemo } from 'react';
import { ShoppingCart, User, MapPin, CreditCard, Utensils } from 'lucide-react';
import { CartItem } from '@/store/cart-store';
import { CustomerData, Address } from '@/store/checkout-store';

interface OrderSummaryProps {
  items: CartItem[];
  customer?: CustomerData | null;
  address?: Address | null;
  paymentMethod?: string | null;
  orderType?: 'delivery' | 'takeout' | 'table';
  showCustomerInfo?: boolean;
  showAddressInfo?: boolean;
  showPaymentInfo?: boolean;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  cash: 'Dinheiro',
};

/**
 * Componente reutilizável para exibir resumo do pedido
 */
export default function OrderSummary({
  items,
  customer,
  address,
  paymentMethod,
  orderType,
  showCustomerInfo = true,
  showAddressInfo = true,
  showPaymentInfo = true,
}: OrderSummaryProps) {
  const cartTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const additionalsPrice = item.additionals?.reduce(
        (sum, add) => sum + ((Number(add.price) || 0) * (add.quantity || 1)),
        0
      ) || 0;
      return total + (itemPrice + additionalsPrice) * item.quantity;
    }, 0);
  }, [items]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {/* Customer Information */}
      {showCustomerInfo && customer && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Dados Pessoais</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nome:</span>
              <span className="font-medium text-gray-900">{customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone:</span>
              <span className="font-medium text-gray-900">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex justify-between">
                <span className="text-gray-600">E-mail:</span>
                <span className="font-medium text-gray-900">{customer.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Information */}
      {showAddressInfo && address && orderType !== 'table' && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">
              {orderType === 'delivery' ? 'Endereço de Entrega' : 'Local de Retirada'}
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-900">
              {address.street}, {address.number}
              {address.complement && ` - ${address.complement}`}
            </p>
            <p className="text-gray-600">
              {address.neighborhood}, {address.city}
              {address.state && ` - ${address.state}`}
            </p>
            <p className="text-gray-600">{address.zip_code}</p>
          </div>
        </div>
      )}

      {/* Payment Information */}
      {showPaymentInfo && paymentMethod && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Forma de Pagamento</h3>
          </div>
          <p className="text-gray-900 font-medium">
            {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
          </p>
        </div>
      )}

      {/* Order Type Info for Table */}
      {orderType === 'table' && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Utensils className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Tipo de Pedido</h3>
          </div>
          <p className="text-gray-900 font-medium">Consumo no Local</p>
        </div>
      )}

      {/* Items Summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Resumo do Pedido</h3>
        </div>

        {/* List of items */}
        <div className="space-y-3 mb-4">
          {items.map((item, index) => {
            const additionalsPrice = item.additionals?.reduce(
              (sum, add) => sum + ((Number(add.price) || 0) * (add.quantity || 1)),
              0
            ) || 0;
            const itemTotal = ((item.price || 0) + additionalsPrice) * item.quantity;

            return (
              <div key={item.identify || index}>
                <div className="flex justify-between text-sm">
                  <div className="text-gray-700">
                    {item.quantity}x {item.name}
                  </div>
                  <span className="font-semibold text-gray-900">{formatPrice(itemTotal)}</span>
                </div>
                {item.additionals && item.additionals.length > 0 && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {item.additionals.map((add, addIdx) => (
                      <div key={addIdx} className="flex justify-between text-xs text-gray-600">
                        <span>+ {add.quantity > 1 ? `${add.quantity}x ` : ''}{add.name}</span>
                        <span className="text-gray-700">{formatPrice(Number(add.price) * (add.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <p className="ml-6 mt-0.5 text-xs text-gray-500 italic">Obs: {item.notes}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-amber-200 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-900">{formatPrice(cartTotal)}</span>
          </div>
          <div className="border-t border-amber-200 pt-2 flex justify-between font-semibold">
            <span>Total:</span>
            <span className="text-amber-600 text-lg">{formatPrice(cartTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
