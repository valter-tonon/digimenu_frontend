'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const params = useParams();
  const { isAuthenticated, customer } = useAuth();
  const { userId, source, initializeTracking, associateWithOrder } = useUserTracking();
  const [submitting, setSubmitting] = useState(false);
  
  const storeId = params.storeId as string;
  
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
    setContext(storeId);
    setDeliveryMode(true);
    
    // Se não estiver autenticado, redireciona para login
    if (!isAuthenticated) {
      router.push(`/${storeId}/login?redirect=checkout`);
      return;
    }

    // Preenche endereço se o cliente já tem um cadastrado
    if (customer?.addresses && customer.addresses.length > 0) {
      const address = customer.addresses[0];
      setDeliveryAddress({
        street: address.address || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.district || '',
        city: address.city || '',
        zipCode: address.zipcode || ''
      });
    }
  }, [storeId, setContext, setDeliveryMode, isAuthenticated, customer, router]);

  // Formatação de preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleSubmitOrder = async () => {
    // Validações
    if (items.length === 0) {
      toast.error('Adicione itens ao carrinho para fazer um pedido');
      return;
    }

    if (!isStoreOpen) {
      toast.error('Restaurante fechado. Não é possível finalizar pedidos no momento.');
      return;
    }

    if (!customerData.name || !customerData.phone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    if (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood) {
      toast.error('Preencha o endereço de entrega');
      return;
    }

    if (!selectedPayment) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    if (selectedPayment === 'money' && !changeAmount) {
      toast.error('Informe o valor para troco');
      return;
    }

    setSubmitting(true);
    
    try {
      const orderData = {
        token_company: storeId,
        products: items.map(item => ({
          identify: item.identify,
          quantity: item.quantity,
          notes: item.notes,
          additionals: item.additionals?.map(add => ({
            id: add.id,
            quantity: add.quantity
          }))
        })),
        comment: orderNotes,
        type: 'delivery',
        customer_id: customer?.id,
        delivery_address: deliveryAddress,
        payment_method: selectedPayment,
        change_amount: selectedPayment === 'money' ? parseFloat(changeAmount) : undefined,
        // Dados de rastreamento do usuário
        user_tracking: {
          user_id: userId,
          source: source,
          device_id: userId // Usando userId como deviceId por simplicidade
        }
      };
      
      const response = await createOrder(orderData);
      
      // Associar pedido ao histórico do usuário
      if (response.data?.identify) {
        associateWithOrder(response.data.identify);
      }
      
      toast.success('Pedido realizado com sucesso!');
      clearCart();
      
      // Redirecionar para página de sucesso
      router.push(`/${storeId}/orders/${response.data.identify}`);
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast.error('Não foi possível realizar o pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Redirecionando para login...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
      </div>

      {/* Resumo do Pedido */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h2 className="font-semibold mb-3">Resumo do Pedido</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
          <span>Total ({totalItems()} itens)</span>
          <span>{formatPrice(totalPrice())}</span>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h2 className="font-semibold mb-3">Dados do Cliente</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={customerData.name}
              onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              value={customerData.phone}
              onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={customerData.email}
              onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Endereço de Entrega */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-center mb-3">
          <MapPin className="w-5 h-5 text-primary mr-2" />
          <h2 className="font-semibold">Endereço de Entrega</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rua *
              </label>
              <input
                type="text"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                value={deliveryAddress.number}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complemento
            </label>
            <input
              type="text"
              value={deliveryAddress.complement}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, complement: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Apartamento, bloco, etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                value={deliveryAddress.neighborhood}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={deliveryAddress.zipCode}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="00000-000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={deliveryAddress.city}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Forma de Pagamento */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h2 className="font-semibold mb-3">Forma de Pagamento</h2>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedPayment === method.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={method.id}
                checked={selectedPayment === method.id}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center">
                {method.icon}
                <span className="ml-3">{method.name}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Campo para troco quando dinheiro for selecionado */}
        {selectedPayment === 'money' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Troco para quanto? *
            </label>
            <input
              type="number"
              step="0.01"
              value={changeAmount}
              onChange={(e) => setChangeAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0,00"
              required
            />
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h2 className="font-semibold mb-3">Observações do Pedido</h2>
        <textarea
          rows={3}
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Alguma observação especial para o seu pedido?"
        />
      </div>

      {/* Botão de Finalização */}
      <div className="bg-white rounded-lg shadow p-4">
        <button
          onClick={handleSubmitOrder}
          disabled={submitting || !isStoreOpen}
          className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-colors ${
            isStoreOpen 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            isStoreOpen ? `Finalizar Pedido • ${formatPrice(totalPrice())}` : 'Restaurante Fechado'
          )}
        </button>
      </div>

      <div className="h-6"></div>
    </div>
  );
}

