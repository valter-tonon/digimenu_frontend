'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCheckoutSession } from '@/services/checkoutSession';
import { useAppContext } from '@/hooks/useAppContext';
import { useCartStore } from '@/store/cart-store';
import { AuthenticationDecision } from '@/components/checkout/AuthenticationDecision';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function CheckoutAuthenticationPage() {
  const router = useRouter();
  const { isAuthenticated, customer } = useAuth();
  const { data: contextData, isValid: contextValid, isLoading: contextLoading } = useAppContext();
  const { items: cartItems } = useCartStore();
  const { session, setCustomerAuthentication, getNextStepAfterAuthentication } = useCheckoutSession(contextData?.storeId);
  const [loading, setLoading] = useState(true);

  // Verificações iniciais - FIXED: Dependências otimizadas para evitar loops infinitos
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

    // Se usuário já está autenticado, pular para próxima etapa
    if (isAuthenticated && customer?.id) {
      const nextStep = getNextStepAfterAuthentication(true, false);
      setCustomerAuthentication(customer, false, 'existing_account');
      
      if (nextStep === 'address') {
        router.push('/checkout/address');
      } else {
        router.push('/checkout/customer-data');
      }
      return;
    }

    setLoading(false);
  }, [contextLoading, contextValid, cartItems.length, isAuthenticated, customer?.id]); // Removido router das dependências

  const handleAuthenticationComplete = (customerData: any, isGuest: boolean) => {
    const method = isGuest ? 'guest' : (customerData.id ? 'existing_account' : 'new_account');
    setCustomerAuthentication(customerData, isGuest, method);

    const nextStep = getNextStepAfterAuthentication(!isGuest, isGuest);
    
    if (nextStep === 'customer_data') {
      router.push('/checkout/customer-data');
    } else if (nextStep === 'address') {
      router.push('/checkout/address');
    } else {
      // Fallback
      router.push('/checkout/customer-data');
    }
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

  if (!contextValid) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Sessão inválida</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do carrinho */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</p>
                <p className="text-xs sm:text-sm text-gray-600">Qtd: {item.quantity}</p>
              </div>
              <p className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.price * item.quantity)}
              </p>
            </div>
          ))}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center font-semibold text-base sm:text-lg">
              <span>Total:</span>
              <span className="text-amber-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(cartItems.reduce((total, item) => total + (item.price * item.quantity), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de decisão de autenticação */}
      <div className="bg-white rounded-lg shadow-sm border" data-testid="authentication-section">
        <AuthenticationDecision
          storeId={contextData?.storeId || ''}
          allowGuestCheckout={true}
          onAuthenticationComplete={handleAuthenticationComplete}
          showSessionInfo={true}
        />
      </div>
    </div>
  );
}