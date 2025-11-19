'use client';

/**
 * Exemplo de integração do WhatsAppCodeAuth no fluxo de checkout
 *
 * Este componente pode ser usado na página de autenticação do checkout
 * para oferecer autenticação via WhatsApp com código de 6 dígitos.
 */

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WhatsAppCodeAuth } from './WhatsAppCodeAuth';
import { useAuth } from '@/hooks/useAuth';

export const CheckoutAuthWithCode: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticate } = useAuth();

  const storeId = searchParams?.get('store_id') || 'default';

  const handleAuthSuccess = async (token: string, user: any) => {
    try {
      // Autenticar no contexto da aplicação
      if (authenticate) {
        await authenticate(token, user);
      }

      console.log('Usuário autenticado com sucesso:', user);

      // Redirecionar para próxima etapa do checkout
      // ou para a página anterior
      setTimeout(() => {
        router.push('/checkout');
      }, 1000);
    } catch (error) {
      console.error('Erro ao processar autenticação:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Autentique-se
            </h1>
            <p className="text-gray-600">
              para continuar com seu pedido
            </p>
          </div>

          <WhatsAppCodeAuth
            storeId={storeId}
            redirectTo="/checkout/customer-data"
            onAuthSuccess={handleAuthSuccess}
          />

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4">
              Ou continue como visitante
            </p>
            <button
              onClick={() => router.push('/checkout/customer-data')}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continuar sem autenticar
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
          <p>🔒 Sua comunicação é segura</p>
          <p>✅ Código de 6 dígitos válido por 15 minutos</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutAuthWithCode;
