'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { useCheckoutStore } from '@/store/checkout-store';
import { useAppContext } from '@/hooks/useAppContext';
import { toast } from 'react-hot-toast';
import IdentificationPage from './components/IdentificationPage';
import FinalDataPage from './components/FinalDataPage';

type Page = 'identification' | 'final_data';

/**
 * Checkout para Delivery/Retirada (2 páginas)
 * Página 1: Identificação via telefone
 * Página 2: Endereço (condicional), pagamento e confirmação
 */
export default function CheckoutDeliveryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    }>
      <CheckoutDeliveryContent />
    </Suspense>
  );
}

function CheckoutDeliveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cartItems = useCartStore(state => state.items);
  const { data: contextData } = useAppContext();
  const checkoutStore = useCheckoutStore();

  const [currentPage, setCurrentPage] = useState<Page>('identification');
  const [isLoading, setIsLoading] = useState(false);

  // Get storeId from context or URL query parameter
  const effectiveStoreId = contextData?.storeId || searchParams.get('store');

  const handleIdentificationComplete = useCallback(() => {
    setCurrentPage('final_data');
  }, []);

  // Validate that we have store context (after all hooks)
  if (!effectiveStoreId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600 mb-4">Contexto da loja não encontrado</p>
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

  // Validate cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
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

  // Set context if not already set
  if (!checkoutStore.storeId && effectiveStoreId) {
    checkoutStore.setContext(effectiveStoreId);
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

          {/* Progress indicator */}
          <div className="flex gap-4">
            <div
              className={`flex-1 h-2 rounded-full transition-colors ${
                currentPage === 'identification' ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`flex-1 h-2 rounded-full transition-colors ${
                currentPage === 'final_data' ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {currentPage === 'identification' && effectiveStoreId && (
            <IdentificationPage
              storeId={effectiveStoreId}
              onComplete={handleIdentificationComplete}
            />
          )}
          {currentPage === 'final_data' && effectiveStoreId && (
            <FinalDataPage
              storeId={effectiveStoreId}
              onBack={() => setCurrentPage('identification')}
            />
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-sm text-gray-600">
          <p>
            {currentPage === 'identification'
              ? 'Etapa 1 de 2: Autenticação'
              : 'Etapa 2 de 2: Dados finais'}
          </p>
        </div>
      </div>
    </div>
  );
}
