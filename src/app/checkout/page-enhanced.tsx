'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useCheckoutSession } from '@/services/checkoutSession';
import { AuthenticationDecision } from '@/components/checkout/AuthenticationDecision';
import { createOrder } from '@/services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, MapPin, CreditCard, Banknote, Smartphone, Receipt, Loader2, User } from 'lucide-react';

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

function EnhancedCheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext(searchParams || undefined);
  const { isAuthenticated, customer } = useAuth();
  const { userId, associateWithOrder } = useUserTracking();
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const storeId = contextData.storeId;
  
  // Checkout session management
  const {
    session,
    setCurrentStep,
    clearSession,
    isValid: sessionValid,
    progressPercentage
  } = useCheckoutSession(storeId);
  
  // Cart store
  const { 
    items, 
    totalPrice, 
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
  const [authenticationCompleted, setAuthenticationCompleted] = useState(false);

  // Configure context when page loads
  useEffect(() => {
    if (contextLoading) return;
    
    if (!contextValid || !storeId) {
      router.push('/404-session');
      return;
    }
    
    setContext(storeId);
    setDeliveryMode(contextData.isDelivery);
    
    // Pre-fill address if customer has saved addresses
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
  }, [contextLoading, contextValid, storeId, contextData.isDelivery, setContext, setDeliveryMode, customer, router]);

  // Handle authentication completion
  const handleAuthenticationComplete = (customerInfo: any, isGuest: boolean) => {
    setCustomerData({
      name: customerInfo?.name || '',
      phone: customerInfo?.phone || '',
      email: customerInfo?.email || ''
    });
    
    setAuthenticationCompleted(true);
    
    // Move to next step based on authentication type
    if (isGuest) {
      setCurrentStep('customer_data');
    } else {
      setCurrentStep('address');
    }
  };

  // Loading state
  if (contextLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
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

  // Validate form before submission
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validate cart
    if (items.length === 0) {
      errors.cart = 'Carrinho vazio';
    }

    // Validate customer data
    if (!customerData.name.trim()) {
      errors.customerName = 'Nome é obrigatório';
    }
    if (!customerData.phone.trim()) {
      errors.customerPhone = 'Telefone é obrigatório';
    }

    // Validate delivery address
    if (contextData.isDelivery) {
      if (!deliveryAddress.street.trim()) {
        errors.deliveryStreet = 'Rua é obrigatória';
      }
      if (!deliveryAddress.number.trim()) {
        errors.deliveryNumber = 'Número é obrigatório';
      }
      if (!deliveryAddress.neighborhood.trim()) {
        errors.deliveryNeighborhood = 'Bairro é obrigatório';
      }
      if (!deliveryAddress.city.trim()) {
        errors.deliveryCity = 'Cidade é obrigatória';
      }
    }

    // Validate payment method
    if (!selectedPayment) {
      errors.payment = 'Selecione uma forma de pagamento';
    }

    return errors;
  };

  const handleSubmitOrder = async () => {
    setValidationErrors({});

    if (!storeId) {
      toast.error('Erro: Loja não identificada');
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        token_company: storeId,
        customer_data: {
          name: customerData.name.trim(),
          phone: customerData.phone.trim(),
          email: customerData.email.trim() || undefined,
          customer_id: session?.customerId || undefined
        },
        products: items.map(item => ({
          identify: item.identify || item.productId,
          quantity: item.quantity,
          additionals: item.additionals?.map(add => add.id) || []
        })),
        comment: orderNotes.trim() || undefined,
        type: contextData.isDelivery ? "delivery" : "local",
        delivery_address: contextData.isDelivery ? {
          street: deliveryAddress.street.trim(),
          number: deliveryAddress.number.trim(),
          complement: deliveryAddress.complement.trim() || undefined,
          neighborhood: deliveryAddress.neighborhood.trim(),
          city: deliveryAddress.city.trim(),
          zip_code: deliveryAddress.zipCode.trim() || undefined
        } : undefined,
        payment_method: selectedPayment,
        change_amount: selectedPayment === 'money' && changeAmount ? parseFloat(changeAmount) : undefined,
        user_tracking: {
          user_id: userId || "anonymous",
          source: "web",
          device_id: "anonymous"
        }
      };

      console.log('Enviando pedido:', orderData);

      const response = await createOrder(orderData);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Erro ao criar pedido');
      }

      const order = response.data.data;

      // Associate tracking if available
      if (userId && order?.id) {
        try {
          await associateWithOrder(order.id.toString());
        } catch (trackingError) {
          console.warn('Erro ao associar tracking:', trackingError);
        }
      }

      // Clear cart and session
      clearCart();
      clearSession();

      toast.success('Pedido realizado com sucesso!');

      // Redirect to success page
      if (order?.uuid) {
        router.push(`/orders/${order.uuid}`);
      } else {
        router.push('/orders');
      }

    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      
      let errorMessage = 'Erro ao finalizar pedido. Tente novamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
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
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          {session && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progresso do Pedido</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Authentication Step */}
          {!authenticationCompleted && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Identificação</h2>
              <AuthenticationDecision
                storeId={storeId}
                onAuthenticationComplete={handleAuthenticationComplete}
                allowGuestCheckout={true}
                showSessionInfo={true}
              />
            </div>
          )}

          {/* Order Summary - Always visible */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(totalPrice())}</span>
              </div>
            </div>
          </div>

          {/* Customer Data - Show after authentication */}
          {authenticationCompleted && (session?.currentStep === 'customer_data' || session?.isGuest) && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Dados do Cliente
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.customerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Seu nome completo"
                  />
                  {validationErrors.customerName && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.customerName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.customerPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {validationErrors.customerPhone && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.customerPhone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  onClick={() => setCurrentStep('address')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Continuar para Endereço
                </button>
              </div>
            </div>
          )}

          {/* Delivery Address - Show after customer data or for authenticated users */}
          {authenticationCompleted && contextData.isDelivery && (session?.currentStep === 'address' || session?.currentStep === 'payment') && (
            <div className={`bg-white rounded-lg shadow-sm border p-6 mb-6 ${
              validationErrors.deliveryStreet || validationErrors.deliveryNumber || 
              validationErrors.deliveryNeighborhood || validationErrors.deliveryCity ? 'border-red-300' : ''
            }`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Endereço de Entrega
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
                  <input
                    type="text"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.deliveryStreet ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nome da rua"
                  />
                  {validationErrors.deliveryStreet && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.deliveryStreet}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                  <input
                    type="text"
                    value={deliveryAddress.number}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, number: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.deliveryNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123"
                  />
                  {validationErrors.deliveryNumber && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.deliveryNumber}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={deliveryAddress.complement}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, complement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apto, bloco, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                  <input
                    type="text"
                    value={deliveryAddress.neighborhood}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.deliveryNeighborhood ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nome do bairro"
                  />
                  {validationErrors.deliveryNeighborhood && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.deliveryNeighborhood}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.deliveryCity ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nome da cidade"
                  />
                  {validationErrors.deliveryCity && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.deliveryCity}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('payment')}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Continuar para Pagamento
              </button>
            </div>
          )}

          {/* Payment Method - Show after address or for pickup orders */}
          {authenticationCompleted && (session?.currentStep === 'payment' || (!contextData.isDelivery && session?.currentStep === 'address')) && (
            <div className={`bg-white rounded-lg shadow-sm border p-6 mb-6 ${validationErrors.payment ? 'border-red-300' : ''}`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Forma de Pagamento</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedPayment(method.id);
                      setValidationErrors(prev => ({ ...prev, payment: '' }));
                    }}
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

              {validationErrors.payment && (
                <p className="text-sm text-red-600 mt-2">{validationErrors.payment}</p>
              )}

              {selectedPayment === 'money' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Troco para quanto? (opcional)
                  </label>
                  <input
                    type="number"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          )}

          {/* Order Notes */}
          {authenticationCompleted && session?.currentStep === 'payment' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Observações (opcional)</h2>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Alguma observação sobre seu pedido?"
              />
            </div>
          )}

          {/* Submit Button */}
          {authenticationCompleted && session?.currentStep === 'payment' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <button
                onClick={handleSubmitOrder}
                disabled={submitting || !selectedPayment}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold transition-colors"
              >
                {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {submitting ? 'Finalizando Pedido...' : `Finalizar Pedido - ${formatPrice(totalPrice())}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EnhancedCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Carregando checkout...</p>
      </div>
    }>
      <EnhancedCheckoutPageContent />
    </Suspense>
  );
}