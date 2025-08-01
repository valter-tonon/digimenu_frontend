'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface CheckoutNavigationProps {
  currentStep: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  forwardLabel?: string;
  backLabel?: string;
  isLoading?: boolean;
  className?: string;
}

const stepRoutes: Record<string, string> = {
  authentication: '/checkout/authentication',
  customer_data: '/checkout/customer-data',
  address: '/checkout/address',
  payment: '/checkout/payment',
  confirmation: '/checkout/confirmation'
};

const stepOrder = ['authentication', 'customer_data', 'address', 'payment', 'confirmation'];

export function CheckoutNavigation({
  currentStep,
  canGoBack = true,
  canGoForward = false,
  onBack,
  onForward,
  forwardLabel = 'Continuar',
  backLabel = 'Voltar',
  isLoading = false,
  className = ''
}: CheckoutNavigationProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (canGoBack) {
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex > 0) {
        const previousStep = stepOrder[currentIndex - 1];
        router.push(stepRoutes[previousStep]);
      } else {
        router.push('/menu');
      }
    }
  };

  const handleForward = () => {
    if (onForward) {
      onForward();
    } else if (canGoForward) {
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex < stepOrder.length - 1) {
        const nextStep = stepOrder[currentIndex + 1];
        router.push(stepRoutes[nextStep]);
      }
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Botão Voltar */}
      {canGoBack && (
        <button
          onClick={handleBack}
          disabled={isLoading}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </button>
      )}

      {/* Espaçador se não houver botão voltar */}
      {!canGoBack && <div></div>}

      {/* Botão Avançar */}
      {canGoForward && (
        <button
          onClick={handleForward}
          disabled={isLoading}
          className="flex items-center px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processando...
            </>
          ) : (
            <>
              {forwardLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      )}
    </div>
  );
}