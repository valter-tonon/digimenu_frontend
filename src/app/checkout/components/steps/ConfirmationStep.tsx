'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutState } from '@/services/checkoutStateMachine';
import { createOrder, createCustomerAddress } from '@/services/api';
import { sendOrderConfirmation } from '@/services/orderNotificationService';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, MapPin, CreditCard, User, ShoppingCart } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);

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
      if (!state.selectedAddress) {
        throw new Error('Endereço não selecionado');
      }
      if (!state.paymentMethod) {
        throw new Error('Método de pagamento não selecionado');
      }
      if (cartItems.length === 0) {
        throw new Error('Carrinho vazio');
      }

      // Preparar dados do pedido
      const orderData = {
        token_company: state.storeId,
        products: cartItems.map(item => ({
          identify: item.identify,
          quantity: item.quantity,
          notes: item.notes,
          additionals: item.additionals?.map(add => ({
            id: add.id,
            quantity: add.quantity
          }))
        })),
        type: 'delivery',
        delivery_address: {
          street: state.selectedAddress.street,
          number: state.selectedAddress.number,
          complement: state.selectedAddress.complement,
          district: state.selectedAddress.neighborhood,
          city: state.selectedAddress.city,
          zipcode: state.selectedAddress.zipCode,
          reference: state.selectedAddress.reference
        },
        payment_method: state.paymentMethod,
        comment: state.orderNotes || ''
      };

      console.log('📤 Enviando pedido:', orderData);

      // Criar o pedido
      const orderResponse = await createOrder(orderData);
      const orderId = orderResponse.data?.identify;

      if (!orderId) {
        throw new Error('Erro ao obter ID do pedido');
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

      {/* Address Information */}
      {state.selectedAddress && (
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
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">R$ 35,00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frete:</span>
            <span className="font-medium">Calculado na entrega</span>
          </div>
          <div className="border-t border-amber-200 pt-2 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-amber-600">R$ 35,00</span>
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
