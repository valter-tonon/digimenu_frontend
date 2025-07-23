'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { useUserTracking } from '@/hooks/useUserTracking';
import { createOrder } from '@/services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, MapPin, CreditCard, Banknote, Smartphone, Receipt, Loader2 } from 'lucide-react';
import { useStoreStatus } from '@/infrastructure/context/StoreStatusContext';

interface DeliveryAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  zipCode: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'money', name: 'Dinheiro', icon: <Banknote className="w-5 h-5" /> },
  { id: 'credit', name: 'Cartão de Crédito', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'debit', name: 'Cartão de Débito', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'pix', name: 'PIX', icon: <Smartphone className="w-5 h-5" /> },
  { id: 'voucher', name: 'Vale Refeição', icon: <Receipt className="w-5 h-5" /> },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext();
  const { isAuthenticated, customer } = useAuth();
  const { userId, source, initializeTracking, associateWithOrder } = useUserTracking();
  const [submitting, setSubmitting] = useState(false);
  
  const storeId = contextData.storeId;
  
  // Cart store
  const { 
    items, 
    totalPrice, 
    totalItems, 
    clearCart,
    setContext,
    setDeliveryMode
  } = useCartStore();

  // Form states
  const [customerData, setCustomerData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || ''
  });

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    zipCode: ''
  });

  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [changeAmount, setChangeAmount] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const { isStoreOpen } = useStoreStatus();

  // Configura o contexto ao carregar a página
  useEffect(() => {
    // Se o contexto ainda está carregando, aguardar
    if (contextLoading) return;
    
    // Se não tem contexto válido, redirecionar para sessão expirada
    if (!contextValid || !storeId) {
      router.push('/404-session');
      return;
    }
    
    setContext(storeId);
    setDeliveryMode(contextData.isDelivery);
    
    // Removido redirecionamento para login - permitir checkout sem autenticação

    // Preenche endereço se o cliente já tem um cadastrado
    if (customer?.addresses && customer.addresses.length > 0) {
      const address = customer.addresses[0];
      setDeliveryAddress({
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        zipCode: address.zip_code || ''
      });
    }
  }, [contextLoading, contextValid, storeId, contextData.isDelivery, setContext, setDeliveryMode, isAuthenticated, customer, router]);

  // Se o contexto ainda está carregando, mostrar loading
  if (contextLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleSubmitOrder = async () => {
    if (!storeId) {
      toast.error('Erro: Loja não identificada');
      return;
    }

    if (items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (!selectedPayment) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    if (contextData.isDelivery && (!deliveryAddress.street || !deliveryAddress.number)) {
      toast.error('Preencha o endereço de entrega');
      return;
    }

    setSubmitting(true);

    try {
      // Preparar dados do pedido
      const orderData = {
        store_id: storeId,
        customer_id: customer?.id,
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          additionals: item.additionals?.map(add => add.id) || []
        })),
        delivery_address: contextData.isDelivery ? deliveryAddress : null,
        payment_method: selectedPayment,
        change_amount: changeAmount ? parseFloat(changeAmount) : null,
        notes: orderNotes,
        is_delivery: contextData.isDelivery,
        table_id: contextData.tableId
      };

      // Criar pedido
      const order = await createOrder(orderData);

      // Associar tracking
      if (userId) {
        await associateWithOrder(order.id);
      }

      // Limpar carrinho
      clearCart();

      // Redirecionar para sucesso
      router.push('/order-success');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Finalizar Pedido</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Resumo do Pedido */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Qtd: {item.quantity}
                      {item.additionals && item.additionals.length > 0 && (
                        <span className="ml-2">
                          + {item.additionals.map(add => add.name).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Dados do Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Endereço de Entrega (apenas para delivery) */}
          {contextData.isDelivery && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Endereço de Entrega
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da rua"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.number}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.complement}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, complement: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apto 45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.neighborhood}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Centro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="01234-567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Forma de Pagamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`p-4 border rounded-lg flex items-center space-x-3 transition-colors ${
                    selectedPayment === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {method.icon}
                  <span className="font-medium">{method.name}</span>
                </button>
              ))}
            </div>

            {/* Troco (apenas para dinheiro) */}
            {selectedPayment === 'money' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Troco para
                </label>
                <input
                  type="number"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Observações</h2>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Alguma observação sobre o pedido?"
            />
          </div>

          {/* Botão Finalizar */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <button
              onClick={handleSubmitOrder}
              disabled={submitting || !isStoreOpen}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                `Finalizar Pedido - ${formatPrice(totalPrice())}`
              )}
            </button>
            {!isStoreOpen && (
              <p className="text-red-600 text-sm mt-2 text-center">
                O estabelecimento está fechado no momento
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 