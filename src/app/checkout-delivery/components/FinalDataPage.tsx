'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { useCheckoutStore, Address } from '@/store/checkout-store';
import { orderService } from '@/services/orderService';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import AddressForm from '@/components/checkout/AddressForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { whatsappAuthService } from '@/services/whatsappAuth';
import {
  getCustomerAddresses,
  findCustomerByPhone,
  type CustomerAddress,
} from '@/services/customerService';

interface FinalDataPageProps {
  onBack: () => void;
}

/**
 * Página 2 do checkout de delivery: Dados finais
 * - Toggle delivery/retirada
 * - Endereço (condicional para delivery)
 * - Forma de pagamento
 * - Resumo do pedido
 * - Confirmação
 */
export default function FinalDataPage({ onBack }: FinalDataPageProps) {
  const router = useRouter();
  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);

  const checkoutStore = useCheckoutStore();
  const {
    storeId,
    customer,
    selectedAddress,
    paymentMethod,
    setOrderType,
    setAddress,
    setPaymentMethod
  } = checkoutStore;

  const [isDelivery, setIsDelivery] = useState(true); // true = delivery, false = takeout
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<(Address & { label?: string; is_default?: boolean })[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Buscar endereços salvos do cliente via customerService
  useEffect(() => {
    const fetchCustomerAddresses = async () => {
      setLoadingAddresses(true);
      try {
        // Resolver customer ID pelo telefone
        const storedAuth = whatsappAuthService.getStoredAuth();
        const phone = customer?.phone || storedAuth?.user?.phone;
        const tenantId = storedAuth?.user?.tenant_id;

        if (!phone) {
          setLoadingAddresses(false);
          return;
        }

        const customerResult = await findCustomerByPhone(phone, tenantId);
        if (!customerResult.success || !customerResult.data?.id) {
          setLoadingAddresses(false);
          return;
        }

        const customerId = customerResult.data.id;

        // Buscar endereços
        const addressResult = await getCustomerAddresses(customerId);
        if (addressResult.success && addressResult.data && addressResult.data.length > 0) {
          const formattedAddresses = addressResult.data.map((addr: CustomerAddress) => ({
            id: addr.id,
            street: addr.street,
            number: addr.number,
            complement: addr.complement || '',
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zip_code,
            label: addr.label,
            is_default: addr.is_default,
          }));
          setAddresses(formattedAddresses);

          // Auto-selecionar endereço padrão (is_default) ou primeiro endereço
          if (!selectedAddress) {
            const defaultAddr = formattedAddresses.find((a: any) => a.is_default) || formattedAddresses[0];
            if (defaultAddr) {
              setAddress(defaultAddr);
              console.log('📍 Endereço padrão auto-selecionado:', defaultAddr.label || defaultAddr.street);
            }
          }

          console.log('📍 Endereços do cliente carregados:', formattedAddresses.length);
        }
      } catch (error) {
        console.error('Erro ao buscar endereços:', error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchCustomerAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.phone]);

  const handleOrderTypeChange = useCallback((delivery: boolean) => {
    setIsDelivery(delivery);
    // Update store
    setOrderType(delivery ? 'delivery' : 'takeout');
  }, [setOrderType]);

  const handleAddressSelect = useCallback((address: Address) => {
    setAddress(address);
  }, [setAddress]);

  const handlePaymentSelect = useCallback((method: string) => {
    setPaymentMethod(method);
  }, [setPaymentMethod]);

  const validateForm = useCallback((): boolean => {
    if (!paymentMethod) {
      toast.error('Selecione uma forma de pagamento');
      return false;
    }

    if (isDelivery && !selectedAddress) {
      toast.error('Selecione um endereço de entrega');
      return false;
    }

    return true;
  }, [isDelivery, selectedAddress, paymentMethod]);

  const handleConfirm = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!storeId || !customer || !paymentMethod) {
      toast.error('Dados incompletos');
      return;
    }

    setSubmitting(true);

    try {
      let response;

      if (isDelivery) {
        if (!selectedAddress) throw new Error('Endereço não selecionado');

        console.log('📦 Criando pedido de delivery...');
        response = await orderService.createDeliveryOrder(
          storeId,
          customer,
          selectedAddress,
          cartItems,
          paymentMethod
        );
      } else {
        console.log('📦 Criando pedido de retirada...');
        response = await orderService.createTakeoutOrder(
          storeId,
          customer,
          cartItems,
          paymentMethod
        );
      }

      const orderId = response?.identify || response?.data?.identify || response?.data?.data?.identify;
      if (!orderId) {
        console.error('❌ Resposta sem identify:', response);
        throw new Error('Resposta inválida do servidor');
      }

      console.log('✅ Pedido criado:', orderId);
      clearCart();
      toast.success(`Pedido #${orderId} confirmado com sucesso!`, {
        duration: 3000,
      });

      // Redirecionar para página de sucesso
      setTimeout(() => {
        router.push(`/order-success/${orderId}`);
      }, 1000);
    } catch (error: any) {
      console.error('❌ Erro ao criar pedido:', error);
      const message = error?.response?.data?.message || error?.message || 'Erro ao criar pedido';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    validateForm,
    storeId,
    customer,
    paymentMethod,
    isDelivery,
    selectedAddress,
    cartItems,
    clearCart,
    router
  ]);

  // Ensure customer is set (after all hooks)
  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 font-medium">Dados de autenticação não encontrados</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tipo de Entrega */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h3 className="font-semibold text-gray-900 mb-4">Tipo de Entrega</h3>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="delivery_type"
              checked={isDelivery}
              onChange={() => handleOrderTypeChange(true)}
              disabled={submitting}
              className="w-4 h-4 text-amber-500"
            />
            <span className="ml-2 text-gray-900">Entregar em casa</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="delivery_type"
              checked={!isDelivery}
              onChange={() => handleOrderTypeChange(false)}
              disabled={submitting}
              className="w-4 h-4 text-amber-500"
            />
            <span className="ml-2 text-gray-900">Retirar no local</span>
          </label>
        </div>
      </div>

      {/* Endereço (apenas para delivery) */}
      {isDelivery && (
        <AddressForm
          addresses={addresses}
          selected={selectedAddress}
          onSelect={handleAddressSelect}
          disabled={submitting || loadingAddresses}
        />
      )}

      {/* Forma de Pagamento */}
      <PaymentMethodSelector
        selected={paymentMethod}
        onSelect={handlePaymentSelect}
        disabled={submitting}
      />

      {/* Resumo do Pedido */}
      <OrderSummary
        items={cartItems}
        customer={customer}
        address={isDelivery ? selectedAddress : undefined}
        paymentMethod={paymentMethod}
        orderType={isDelivery ? 'delivery' : 'takeout'}
        showCustomerInfo={true}
        showAddressInfo={isDelivery}
        showPaymentInfo={true}
      />

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting || !paymentMethod || (isDelivery && !selectedAddress)}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Processando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}
