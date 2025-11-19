'use client';

import { CheckoutStep } from '@/services/checkoutStateMachine';

interface CheckoutHeaderProps {
  currentStep: CheckoutStep;
}

const STEP_LABELS: Record<CheckoutStep, { title: string; description: string }> = {
  authentication: {
    title: 'Autenticação',
    description: 'Acesse sua conta via WhatsApp',
  },
  customer_data: {
    title: 'Seus Dados',
    description: 'Informações de contato para o pedido',
  },
  address: {
    title: 'Endereço de Entrega',
    description: 'Onde você gostaria de receber',
  },
  payment: {
    title: 'Pagamento',
    description: 'Escolha a forma de pagamento',
  },
  confirmation: {
    title: 'Confirmação',
    description: 'Revise e confirme seu pedido',
  },
};

const STEP_ORDER: CheckoutStep[] = ['authentication', 'customer_data', 'address', 'payment', 'confirmation'];

/**
 * Header do checkout com título, descrição e progress bar
 */
export default function CheckoutHeader({ currentStep }: CheckoutHeaderProps) {
  const label = STEP_LABELS[currentStep];
  const progress = ((STEP_ORDER.indexOf(currentStep) + 1) / STEP_ORDER.length) * 100;

  return (
    <div className="mb-8">
      {/* Título e descrição */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{label.title}</h1>
        <p className="text-gray-600">{label.description}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progresso</span>
          <span className="text-sm text-gray-600">
            Passo {STEP_ORDER.indexOf(currentStep) + 1} de {STEP_ORDER.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Indicadores de step */}
      <div className="flex justify-between mt-6">
        {STEP_ORDER.map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted = STEP_ORDER.indexOf(currentStep) > index;

          return (
            <div key={step} className="flex flex-col items-center flex-1">
              {/* Círculo do passo */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white ring-2 ring-amber-200'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Linha para próximo passo */}
              {index < STEP_ORDER.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-1 mt-2 ${
                    isCompleted || isActive ? 'bg-amber-500' : 'bg-gray-300'
                  } transition-all`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
