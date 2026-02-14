'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { useCheckoutStore } from '@/store/checkout-store';
import { useAppContext } from '@/hooks/useAppContext';
import { orderService } from '@/services/orderService';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import OrderSummary from '@/components/checkout/OrderSummary';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

/**
 * Checkout para Mesa (1 página única, sem autenticação)
 * - Pagamento
 * - Resumo do pedido
 * - Confirmação
 */
export default function CheckoutTablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);
  const { data: contextData } = useAppContext();
  const checkoutStore = useCheckoutStore();

  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!checkoutStore.storeId && contextData?.storeId) {
      checkoutStore.setContext(contextData.storeId, contextData.tableId);
      checkoutStore.setOrderType('table');
    }
  }, [contextData?.storeId, contextData?.tableId, checkoutStore]);

  const handlePaymentSelect = useCallback((method: string) => {
    setPaymentMethod(method);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!paymentMethod) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    if (!contextData?.storeId || !contextData?.tableId) {
      toast.error('Dados incompletos');
      return;
    }

    setSubmitting(true);

    try {
      console.log('📦 Criando pedido de mesa...');
      const response = await orderService.createTableOrder(
        contextData.storeId,
        contextData.tableId,
        cartItems,
        paymentMethod
      );

      const orderId = response?.identify || response?.data?.identify;
      if (!orderId) {
        throw new Error('Resposta inválida do servidor');
      }

      console.log('✅ Pedido criado:', orderId);
      clearCart();
      toast.success('Pedido confirmado com sucesso!');

      // Redirecionar para página de sucesso
      setTimeout(() => {
        router.push(`/order-success/${orderId}`);
      }, 1500);
    } catch (error: any) {
      console.error('❌ Erro ao criar pedido:', error);
      const message = error?.response?.data?.message || error?.message || 'Erro ao criar pedido';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [paymentMethod, contextData?.storeId, contextData?.tableId, cartItems, clearCart, router]);

  // Validate cart (after all hooks)
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Carrinho Vazio</h1>
          <p className="text-gray-600 mb-4">Adicione itens ao carrinho antes de finalizar</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    );
  }

  // Validate store and table context
  if (!contextData?.storeId || !contextData?.tableId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600 mb-4">Contexto da loja ou mesa não encontrado</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 space-y-6">
          {/* Forma de Pagamento */}
          <PaymentMethodSelector
            selected={paymentMethod}
            onSelect={handlePaymentSelect}
            disabled={submitting}
          />

          {/* Resumo do Pedido */}
          <OrderSummary
            items={cartItems}
            paymentMethod={paymentMethod}
            orderType="table"
            showCustomerInfo={false}
            showAddressInfo={false}
            showPaymentInfo={true}
          />

          {/* Botões de Ação */}
          <div className="flex gap-4 border-t pt-6">
            <button
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || !paymentMethod}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Processando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-sm text-gray-600">
          <p>Pedido para consumo no local</p>
        </div>
      </div>
    </div>
  );
}
