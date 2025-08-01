'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckoutSession } from '@/services/checkoutSession';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { useAddressManagement } from '@/hooks/useAddressManagement';
import { createOrder } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, User, MapPin, CreditCard, FileText, Smartphone, Banknote, Receipt } from 'lucide-react';
import Confetti from 'react-confetti';

export default function CheckoutConfirmationPage() {
  const router = useRouter();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext();
  const { items: cartItems, totalPrice, deliveryMode, clearCart } = useCartStore();
  const { session, clearSession } = useCheckoutSession(contextData?.storeId);
  const { selectedAddress } = useAddressManagement();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Verificações iniciais
  useEffect(() => {
    if (contextLoading) return;

    // Verificar se contexto é válido
    if (!contextValid) {
      toast.error('Sessão inválida. Redirecionando...');
      router.push('/');
      return;
    }

    // Verificar se há itens no carrinho
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio. Redirecionando para o menu...');
      router.push('/menu');
      return;
    }

    // Verificar se há sessão de checkout
    if (!session) {
      toast.error('Sessão de checkout não encontrada. Redirecionando...');
      router.push('/checkout/authentication');
      return;
    }

    // Verificar se tem todos os dados necessários
    if (!session.customerData?.name) {
      router.push('/checkout/customer-data');
      return;
    }

    if (!session.formData?.paymentMethod) {
      router.push('/checkout/payment');
      return;
    }

    setLoading(false);
  }, [contextLoading, contextValid, cartItems, session, router]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix':
        return <Smartphone className="w-5 h-5 text-green-600" />;
      case 'credit':
      case 'debit':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'money':
        return <Banknote className="w-5 h-5 text-yellow-600" />;
      case 'voucher':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'credit':
        return 'Cartão de Crédito';
      case 'debit':
        return 'Cartão de Débito';
      case 'money':
        return 'Dinheiro';
      case 'voucher':
        return 'Vale Refeição';
      default:
        return method;
    }
  };

  const handleConfirmOrder = async () => {
    if (!session) return;

    setSubmitting(true);

    try {
      const orderData = {
        customer: session.customerData,
        items: cartItems,
        delivery_address: deliveryMode ? selectedAddress : null,
        payment_method: session.formData?.paymentMethod,
        change_amount: session.formData?.changeAmount || 0,
        notes: session.formData?.orderNotes || '',
        total: totalPrice() + (deliveryMode ? 5 : 0),
        store_id: contextData?.storeId,
        delivery_mode: deliveryMode
      };

      const response = await createOrder(orderData);

      if (response.data?.success) {
        setOrderCreated(true);
        setShowConfetti(true);
        
        // Limpar carrinho e sessão
        clearCart();
        clearSession();
        
        toast.success('Pedido realizado com sucesso!');
        
        // Esconder confetti após 5 segundos
        setTimeout(() => setShowConfetti(false), 5000);
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push(`/orders/${response.data.data.id}`);
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Erro ao criar pedido');
      }
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao finalizar pedido';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (orderCreated) {
    return (
      <div className="text-center py-8">
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Pedido Confirmado!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Seu pedido foi recebido e está sendo preparado.
          <br />
          Você será redirecionado para acompanhar o status.
        </p>
        
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-amber-500" />
          <span className="text-sm text-gray-500">Redirecionando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da etapa */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
          <CheckCircle className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmar Pedido</h2>
        <p className="text-gray-600">Revise os dados do seu pedido antes de finalizar</p>
      </div>

      {/* Dados do cliente */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Dados do Cliente</h3>
        </div>
        
        <div className="space-y-2">
          <p className="text-gray-900 font-medium">{session?.customerData?.name}</p>
          <p className="text-gray-600">{session?.customerData?.phone}</p>
          {session?.customerData?.email && (
            <p className="text-gray-600">{session.customerData.email}</p>
          )}
        </div>
      </div>

      {/* Endereço de entrega */}
      {deliveryMode && selectedAddress && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h3>
          </div>
          
          <div className="space-y-1">
            <p className="text-gray-900">
              {selectedAddress.street}, {selectedAddress.number}
              {selectedAddress.complement && `, ${selectedAddress.complement}`}
            </p>
            <p className="text-gray-600">
              {selectedAddress.neighborhood}, {selectedAddress.city}
            </p>
            {selectedAddress.reference && (
              <p className="text-gray-600 text-sm">
                Referência: {selectedAddress.reference}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Itens do pedido */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h3>
        
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                {item.additionals && item.additionals.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {item.additionals.map((additional, idx) => (
                      <span key={idx}>
                        + {additional.name} ({additional.quantity}x)
                        {idx < item.additionals.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-medium text-gray-900 whitespace-nowrap">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
          
          {/* Taxa de entrega */}
          {deliveryMode && (
            <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3">
              <span>Taxa de entrega</span>
              <span>R$ 5,00</span>
            </div>
          )}
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total:</span>
              <span className="text-amber-600">
                {formatPrice(totalPrice() + (deliveryMode ? 5 : 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Forma de pagamento */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Forma de Pagamento</h3>
        </div>
        
        <div className="flex items-center">
          {getPaymentMethodIcon(session?.formData?.paymentMethod || '')}
          <span className="ml-2 text-gray-900">
            {getPaymentMethodName(session?.formData?.paymentMethod || '')}
          </span>
        </div>
        
        {session?.formData?.paymentMethod === 'money' && session?.formData?.changeAmount && (
          <p className="text-sm text-gray-600 mt-2">
            Troco para: {formatPrice(session.formData.changeAmount)}
          </p>
        )}
      </div>

      {/* Observações */}
      {session?.formData?.orderNotes && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
          </div>
          
          <p className="text-gray-700">{session.formData.orderNotes}</p>
        </div>
      )}

      {/* Botão de confirmar */}
      <div className="sticky bottom-0 bg-gray-50 p-4 -mx-4">
        <button
          onClick={handleConfirmOrder}
          disabled={submitting}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          Confirmar Pedido - {formatPrice(totalPrice() + (deliveryMode ? 5 : 0))}
        </button>
      </div>
    </div>
  );
}