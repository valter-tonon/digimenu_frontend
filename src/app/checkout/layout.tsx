'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { useCheckoutSession } from '@/services/checkoutSession';
import { useAppContext } from '@/hooks/useAppContext';
import { RateLimitMonitor } from '@/components/debug/RateLimitMonitor';

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  const router = useRouter();
  const { data: contextData } = useAppContext();
  const { session, progressPercentage } = useCheckoutSession(contextData?.storeId);

  const handleBackToMenu = () => {
    router.push('/menu');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação - seguindo padrão do menu */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Botões de navegação */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleBackToMenu}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
                aria-label="Voltar ao Menu"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>

            {/* Título */}
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Finalizar Pedido
            </h1>

            {/* Espaço para balanceamento */}
            <div className="w-20"></div>
          </div>

          {/* Barra de progresso */}
          {session && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progresso</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {children}
      </main>

      {/* Footer com informações da loja - seguindo padrão do menu */}
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <img
              src="/logo-digimenu.svg"
              alt="DigiMenu"
              className="h-6 w-auto"
            />
          </div>
          <p className="text-sm text-gray-400">
            {contextData?.storeName || 'Restaurante'} - Cardápio Digital
          </p>
        </div>
      </footer>

      {/* Rate Limit Monitor - Only in development */}
      <RateLimitMonitor />
    </div>
  );
}
