'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutState } from '@/services/checkoutStateMachine';
import { createOrder, createCustomerAddress } from '@/services/api';
import { sendOrderConfirmation } from '@/services/orderNotificationService';
import { useCartStore } from '@/store/cart-store';
import { useAppContext } from '@/hooks/useAppContext';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, MapPin, CreditCard, User, ShoppingCart, Utensils } from 'lucide-react';

interface ConfirmationStepProps {
  state: CheckoutState;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  cash: 'Dinheiro',
};

/**
 * Step de confirmação final do pedido
 *
 * Responsabilidades:
 * - Exibir resumo completo do pedido
 * - Mostrar dados do cliente
 * - Mostrar endereço de entrega
 * - Mostrar método de pagamento
 * - Permitir confirmar ou voltar para editar
 */
export default function ConfirmationStep({
  state,
  onSetLoading,
  onSetError,
}: ConfirmationStepProps) {
  const router = useRouter();
  const { items: cartItems, clearCart } = useCartStore();
  const { data: contextData } = useAppContext();
  const [submitting, setSubmitting] = useState(false);

  // Verificar se é delivery ou pedido de mesa
  const isDelivery = contextData?.isDelivery ?? false;
  const tableId = contextData?.tableId;

  // Calcular total do carrinho dinamicamente
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const additionalsPrice = item.additionals?.reduce(
        (sum, add) => sum + ((Number(add.price) || 0) * (add.quantity || 1)),
        0
      ) || 0;
      return total + (itemPrice + additionalsPrice) * item.quantity;
    }, 0);
  }, [cartItems]);

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Handle order confirmation
  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    onSetLoading(true);

    try {
      // Debug: Log all required data
      console.log('🔍 Validando dados para criação de pedido:', {
        storeId: state.storeId,
        customerData: state.customerData,
        selectedAddress: state.selectedAddress,
        paymentMethod: state.paymentMethod,
        cartItems: cartItems.length
      });

      if (!state.storeId) {
        throw new Error('StoreId não configurado');
      }
      if (!state.customerData) {
        throw new Error('Dados do cliente não preenchidos');
      }
      // Só exigir endereço se for delivery
      if (isDelivery && !state.selectedAddress) {
        throw new Error('Endereço não selecionado');
      }
      if (!state.paymentMethod) {
        throw new Error('Método de pagamento não selecionado');
      }
      if (cartItems.length === 0) {
        throw new Error('Carrinho vazio');
      }

      // Preparar dados do pedido
      const orderData: Record<string, unknown> = {
        token_company: state.storeId,
        customer_id: state.customerId,
        customer: {
          name: state.customerData.name,
          phone: state.customerData.phone,
          email: state.customerData.email
        },
        products: cartItems.map(item => ({
          identify: item.identify,
          quantity: item.quantity,
          notes: item.notes,
          additionals: item.additionals?.map(add => ({
            id: add.id,
            quantity: add.quantity
          }))
        })),
        type: isDelivery ? 'delivery' : 'local',
        payment_method: state.paymentMethod,
        comment: state.orderNotes || ''
      };

      // Adicionar endereço apenas se for delivery
      if (isDelivery && state.selectedAddress) {
        orderData.delivery_address = {
          street: state.selectedAddress.street,
          number: state.selectedAddress.number,
          complement: state.selectedAddress.complement,
          district: state.selectedAddress.neighborhood,
          city: state.selectedAddress.city,
          zipcode: state.selectedAddress.zipCode,
          reference: state.selectedAddress.reference
        };
      }

      // Adicionar tableId se for pedido de mesa
      if (!isDelivery && tableId) {
        orderData.table_id = tableId;
      }

      console.log('📤 Enviando pedido:', orderData);
      console.log('📤 JSON enviado:', JSON.stringify(orderData, null, 2));

      // Criar o pedido
      const orderResponse = await createOrder(orderData);
      console.log('📥 Resposta da API (completa):', orderResponse);
      console.log('📥 Resposta JSON:', JSON.stringify(orderResponse, null, 2));
      console.log('📥 Tipo da resposta:', typeof orderResponse);
      console.log('📥 Properties da resposta:', Object.keys(orderResponse));

      const orderId = orderResponse?.identify || orderResponse?.data?.identify;

      if (!orderId) {
        console.error('❌ Resposta da API inválida:', orderResponse);
        console.error('❌ Esperado campo "identify" em:', orderResponse);
        throw new Error('Erro ao obter ID do pedido - resposta inválida');
      }

      console.log('✅ Pedido criado com ID:', orderId);

      // Salvar endereço do cliente se tiver customerId
      if (state.customerId && !state.selectedAddress.id) {
        try {
          console.log('💾 Salvando endereço do cliente...');
          await createCustomerAddress(state.customerId, {
            address: state.selectedAddress.street,
            number: state.selectedAddress.number,
            complement: state.selectedAddress.complement,
            district: state.selectedAddress.neighborhood,
            city: state.selectedAddress.city,
            zipcode: state.selectedAddress.zipCode,
            reference: state.selectedAddress.reference,
            is_default: !state.selectedAddress.id // Marcar como padrão se for o primeiro
          });
          console.log('✅ Endereço salvo com sucesso');
        } catch (addressError) {
          console.warn('⚠️ Erro ao salvar endereço:', addressError);
          // Não falhar o pedido por erro ao salvar endereço
        }
      }

      // Enviar confirmação via WhatsApp
      const formattedItems = cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      try {
        console.log('📱 Enviando notificação via WhatsApp...');
        await sendOrderConfirmation(
          orderId,
          state.customerData.phone,
          formattedItems,
          state,
          'Restaurante', // TODO: Obter nome real do restaurante
          totalAmount
        );
      } catch (notificationError) {
        console.warn('⚠️ Erro ao enviar notificação:', notificationError);
        // Não falhar o pedido por erro ao enviar notificação
      }

      // Limpar carrinho
      clearCart();

      toast.success('Pedido confirmado com sucesso! Você receberá uma confirmação no WhatsApp.');

      // Redirecionar para página de sucesso do pedido
      setTimeout(() => {
        router.push(`/order-success/${orderId}`);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro ao confirmar pedido:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao confirmar pedido';
      onSetError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setSubmitting(false);
      onSetLoading(false);
    }
  }, [state, cartItems, onSetLoading, onSetError, router, clearCart]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmação do Pedido</h2>
        <p className="text-gray-600">Revise suas informações e confirme o pedido</p>
      </div>

      {/* Customer Information */}
      {state.customerData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Dados Pessoais</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Nome:</span>
              <span className="font-medium text-gray-900">{state.customerData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone:</span>
              <span className="font-medium text-gray-900">{state.customerData.phone}</span>
            </div>
            {state.customerData.email && (
              <div className="flex justify-between">
                <span className="text-gray-600">E-mail:</span>
                <span className="font-medium text-gray-900">{state.customerData.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Information (Delivery) ou Mesa (Local) */}
      {isDelivery && state.selectedAddress ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Endereço de Entrega</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Rua:</span>
              <span className="font-medium text-gray-900">{state.selectedAddress.street}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Número:</span>
              <span className="font-medium text-gray-900">{state.selectedAddress.number}</span>
            </div>
            {state.selectedAddress.complement && (
              <div className="flex justify-between">
                <span className="text-gray-600">Complemento:</span>
                <span className="font-medium text-gray-900">{state.selectedAddress.complement}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Bairro:</span>
              <span className="font-medium text-gray-900">{state.selectedAddress.neighborhood}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cidade:</span>
              <span className="font-medium text-gray-900">{state.selectedAddress.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CEP:</span>
              <span className="font-medium text-gray-900">{state.selectedAddress.zipCode}</span>
            </div>
            {state.selectedAddress.reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Referência:</span>
                <span className="font-medium text-gray-900">{state.selectedAddress.reference}</span>
              </div>
            )}
          </div>
        </div>
      ) : !isDelivery && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Utensils className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Consumo no Local</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium text-gray-900">Pedido para consumo no estabelecimento</span>
            </div>
            {tableId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mesa:</span>
                <span className="font-medium text-gray-900">Mesa identificada</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Information */}
      {state.paymentMethod && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Forma de Pagamento</h3>
          </div>
          <div>
            <span className="text-gray-600">Método:</span>
            <span className="font-medium text-gray-900 ml-2">
              {PAYMENT_METHOD_LABELS[state.paymentMethod] || state.paymentMethod}
            </span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-600" />
          Resumo do Pedido
        </h3>
        
        {/* Lista de itens */}
        <div className="space-y-2 mb-4">
          {cartItems.map((item, index) => (
            <div key={item.identify || index} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.quantity}x {item.name}</span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-amber-200 pt-2 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatPrice(cartTotal)}</span>
          </div>
          {isDelivery && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frete:</span>
              <span className="font-medium">Calculado na entrega</span>
            </div>
          )}
          <div className="border-t border-amber-200 pt-2 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-amber-600">{formatPrice(cartTotal)}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ✅ <strong>Tudo pronto!</strong> Clique em "Confirmar Pedido" para finalizar sua compra.
          Você receberá uma confirmação no WhatsApp.
        </p>
      </div>

      {/* Confirm Button */}
      <div>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
        >
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
          Confirmar Pedido
        </button>
      </div>

      {/* Edit Info */}
      <p className="text-center text-sm text-gray-600">
        Clique em "Voltar" se precisar editar alguma informação
      </p>
    </div>
  );
}
