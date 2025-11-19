'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/store/cart-store';
import { CheckoutWhatsAppAuth } from '@/components/checkout/CheckoutWhatsAppAuth';
import { useAppContext } from '@/hooks/useAppContext';
import { CheckoutState, AuthenticationMethod } from '@/services/checkoutStateMachine';

interface AuthenticationStepProps {
  state: CheckoutState;
  onNextStep: () => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
  onSetAuthentication: (user: any, isGuest: boolean, method: AuthenticationMethod) => void;
  onSetJWT: (jwt: string) => void;
  onMarkStepComplete: (step: 'authentication') => void;
}

/**
 * Step de autenticação do checkout
 *
 * Responsabilidades:
 * - Exibir formulário de autenticação WhatsApp
 * - Validar cartão e contexto
 * - Mostrar resumo do pedido
 * - Chamar callbacks para atualizar estado global
 * - Avançar para próximo step após autenticação bem-sucedida
 */
export default function AuthenticationStep({
  state,
  onNextStep,
  onSetLoading,
  onSetError,
  onSetAuthentication,
  onSetJWT,
  onMarkStepComplete,
}: AuthenticationStepProps) {
  const { login: loginUser } = useAuth();
  const { items: cartItems } = useCartStore();
  const { data: contextData } = useAppContext();

  // Callback para quando autenticação é completa
  const handleAuthenticationComplete = useCallback(
    (token: string, user: any) => {
      console.log('✅ Autenticação completa', { user: user?.name });

      // Atualizar estado global
      const method = user?.id ? 'existing_account' : 'new_account';
      onSetJWT(token);
      onSetAuthentication(user, false, method);
      loginUser(token);

      // Marcar step como completo
      onMarkStepComplete('authentication');

      // Avançar para próximo step
      onNextStep();
    },
    [onSetJWT, onSetAuthentication, loginUser, onMarkStepComplete, onNextStep]
  );

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Calcular total
  const total = cartItems.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const additionalsTotal = item.additionals?.reduce(
      (addSum, add) => addSum + add.price * add.quantity,
      0
    ) || 0;
    return sum + itemTotal + additionalsTotal;
  }, 0);

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
                {item.additionals && item.additionals.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {item.additionals.map((add) => add.name).join(', ')}
                  </div>
                )}
              </div>
              <p className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
                {formatPrice(item.price * item.quantity + (item.additionals?.reduce((sum, add) => sum + (add.price * add.quantity), 0) || 0))}
              </p>
            </div>
          ))}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center font-semibold text-base sm:text-lg">
              <span>Total:</span>
              <span className="text-amber-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de autenticação WhatsApp */}
      <div data-testid="authentication-section">
        <CheckoutWhatsAppAuth
          storeId={contextData?.storeId || ''}
          onAuthSuccess={handleAuthenticationComplete}
        />
      </div>
    </div>
  );
}
