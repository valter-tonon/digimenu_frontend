'use client';

import { CheckCircle, Circle } from 'lucide-react';

interface CheckoutStep {
  id: string;
  name: string;
  description: string;
}

interface CheckoutProgressProps {
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

const steps: CheckoutStep[] = [
  {
    id: 'authentication',
    name: 'Identificação',
    description: 'Login ou dados'
  },
  {
    id: 'customer_data',
    name: 'Seus Dados',
    description: 'Informações pessoais'
  },
  {
    id: 'address',
    name: 'Endereço',
    description: 'Local de entrega'
  },
  {
    id: 'payment',
    name: 'Pagamento',
    description: 'Forma de pagamento'
  },
  {
    id: 'confirmation',
    name: 'Confirmação',
    description: 'Revisar pedido'
  }
];

export function CheckoutProgress({ currentStep, completedSteps, className = '' }: CheckoutProgressProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const isStepCompleted = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  const isStepCurrent = (stepId: string) => {
    return stepId === currentStep;
  };

  const isStepAccessible = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    return stepIndex <= currentIndex;
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div className={`${className}`}>
      {/* Barra de progresso visual */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progresso</span>
          <span>{Math.round(getProgressPercentage())}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Steps detalhados (apenas em telas maiores) */}
      <div className="hidden md:block">
        <nav aria-label="Progresso do checkout">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIndex) => {
              const isCompleted = isStepCompleted(step.id);
              const isCurrent = isStepCurrent(step.id);
              const isAccessible = isStepAccessible(stepIndex);

              return (
                <li key={step.id} className="flex-1">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          isCompleted
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : isCurrent
                            ? 'border-amber-500 text-amber-500 bg-white'
                            : isAccessible
                            ? 'border-gray-300 text-gray-500 bg-white'
                            : 'border-gray-200 text-gray-300 bg-gray-50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="ml-3 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isCurrent
                              ? 'text-amber-600'
                              : isCompleted
                              ? 'text-gray-900'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    
                    {/* Linha conectora */}
                    {stepIndex < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-4 ${
                          isCompleted ? 'bg-amber-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Versão mobile simplificada */}
      <div className="md:hidden">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            {steps.find(step => step.id === currentStep)?.name}
          </p>
          <p className="text-xs text-gray-500">
            Etapa {getCurrentStepIndex() + 1} de {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
}