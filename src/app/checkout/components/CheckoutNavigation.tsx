'use client';

import { CheckoutStep } from '@/services/checkoutStateMachine';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface CheckoutNavigationProps {
  canGoBack: boolean;
  canGoForward: boolean;
  currentStep: CheckoutStep;
  onBack: () => void;
  onForward: () => void;
  isLoading?: boolean;
}

/**
 * Componente de navegação entre steps
 * Mostra botões Voltar e Próximo com estados apropriados
 */
export default function CheckoutNavigation({
  canGoBack,
  canGoForward,
  currentStep,
  onBack,
  onForward,
  isLoading = false,
}: CheckoutNavigationProps) {
  const isFirstStep = currentStep === 'authentication';
  const isLastStep = currentStep === 'confirmation';

  return (
    <div className="mt-8 flex gap-4">
      {/* Botão Voltar */}
      <button
        onClick={onBack}
        disabled={!canGoBack || isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
          canGoBack && !isLoading
            ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Voltar para passo anterior"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Voltar</span>
      </button>

      {/* Botão Próximo */}
      <button
        onClick={onForward}
        disabled={!canGoForward || isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
          canGoForward && !isLoading
            ? 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700'
            : 'bg-amber-300 text-white cursor-not-allowed opacity-50'
        }`}
        aria-label={isLastStep ? 'Confirmar e finalizar pedido' : 'Prosseguir para próximo passo'}
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        <span className="hidden sm:inline">{isLastStep ? 'Confirmar Pedido' : 'Próximo'}</span>
        {!isLastStep && !isLoading && <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
  );
}
