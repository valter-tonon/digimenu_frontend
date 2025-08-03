'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckoutSession } from '@/services/checkoutSession';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { PaymentMethodSelection } from '@/components/checkout/PaymentMethodSelection';
import { toast } from 'react-hot-toast';
import { Loader2, CreditCard, Smartphone, Banknote, Receipt } from 'lucide-react';

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext();
  const { items: cartItems, totalPrice, deliveryMode } = useCartStore();
  const { session, updateSession, setCurrentStep } = useCheckoutSession(contextData?.storeId);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [paymentData, setPaymentData] = useState<any>({});
  const [changeAmount, setChangeAmount] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Verificar se tem dados do cliente
    if (!session.customerData?.name) {
      if (session.isGuest) {
        router.push('/checkout/customer-data');
      } else {
        router.push('/checkout/authentication');
      }
      return;
    }

    setLoading(false);
  }, [contextLoading, contextValid, cartItems.length, router]);

  // Atualizar step atual em useEffect separado
  useEffect(() => {
    if (!loading && session && session.currentStep !== 'payment') {
      setCurrentStep('payment');
    }
  }, [loading, session?.currentStep, setCurrentStep]);

  const validatePayment = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPayment) {
      newErrors.payment = 'Selecione uma forma de pagamento';
    }

    // Validar dados específicos do cartão
    if ((selectedPayment === 'credit' || selectedPayment === 'debit') && paymentData) {
      if (!paymentData.number || paymentData.number.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Número do cartão inválido';
      }
      if (!paymentData.name || paymentData.name.trim().length < 2) {
        newErrors.cardName = 'Nome no cartão é obrigatório';
      }
      if (!paymentData.expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentData.expiry)) {
        newErrors.cardExpiry = 'Data de validade inválida';
      }
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        newErrors.cardCvv = 'CVV inválido';
      }
    }

    // Validar troco para dinheiro
    if (selectedPayment === 'money' && changeAmount) {
      const changeValue = parseFloat(changeAmount);
      const total = totalPrice();
      if (changeValue <= total) {
        newErrors.change = 'Valor para troco deve ser maior que o total do pedido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validatePayment()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);

    try {
      // Atualizar sessão com dados de pagamento
      const paymentInfo = {
        method: selectedPayment,
        data: paymentData,
        changeAmount: selectedPayment === 'money' ? parseFloat(changeAmount) || 0 : 0,
        orderNotes: orderNotes.trim()
      };

      const updatedSession = updateSession({
        currentStep: 'confirmation',
        formData: {
          ...session?.formData,
          paymentMethod: selectedPayment,
          changeAmount: paymentInfo.changeAmount,
          orderNotes: paymentInfo.orderNotes
        }
      });

      if (updatedSession) {
        toast.success('Dados de pagamento salvos!');
        router.push('/checkout/confirmation');
      } else {
        throw new Error('Erro ao salvar dados de pagamento');
      }
    } catch (error: any) {
      console.error('Erro ao salvar dados de pagamento:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
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

  return (
    <div className="space-y-6">
      {/* Título da etapa */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
          <CreditCard className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Forma de Pagamento</h2>
        <p className="text-gray-600">Como você gostaria de pagar seu pedido?</p>
      </div>

      {/* Resumo do pedido */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</p>
                <p className="text-xs sm:text-sm text-gray-600">Qtd: {item.quantity}</p>
              </div>
              <p className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
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
            <div className="flex justify-between items-center font-semibold text-base sm:text-lg">
              <span>Total:</span>
              <span className="text-amber-600">
                {formatPrice(totalPrice() + (deliveryMode ? 5 : 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seleção de método de pagamento */}
      <div className="bg-white rounded-lg shadow-sm border">
        <PaymentMethodSelection
          selectedMethod={selectedPayment}
          onMethodSelect={setSelectedPayment}
          onPaymentDataChange={setPaymentData}
          changeAmount={changeAmount}
          onChangeAmountChange={setChangeAmount}
          className="p-6"
        />
        
        {errors.payment && (
          <p className="text-red-600 text-sm mt-2 px-6">{errors.payment}</p>
        )}
        
        {/* Erros específicos do cartão */}
        {(errors.cardNumber || errors.cardName || errors.cardExpiry || errors.cardCvv) && (
          <div className="px-6 pb-4">
            {errors.cardNumber && <p className="text-red-600 text-sm">{errors.cardNumber}</p>}
            {errors.cardName && <p className="text-red-600 text-sm">{errors.cardName}</p>}
            {errors.cardExpiry && <p className="text-red-600 text-sm">{errors.cardExpiry}</p>}
            {errors.cardCvv && <p className="text-red-600 text-sm">{errors.cardCvv}</p>}
          </div>
        )}
        
        {errors.change && (
          <p className="text-red-600 text-sm mt-2 px-6 pb-4">{errors.change}</p>
        )}
      </div>

      {/* Observações do pedido */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          rows={3}
          placeholder="Alguma observação sobre o pedido? (opcional)"
          disabled={submitting}
        />
        <p className="text-xs text-gray-500 mt-2">
          Ex: Sem cebola, ponto da carne, retirar ingrediente, etc.
        </p>
      </div>

      {/* Botão de continuar */}
      <div className="sticky bottom-0 bg-gray-50 p-4 -mx-4">
        <button
          onClick={handleContinue}
          disabled={submitting || !selectedPayment}
          className="w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          Revisar Pedido - {formatPrice(totalPrice() + (deliveryMode ? 5 : 0))}
        </button>
      </div>
    </div>
  );
}