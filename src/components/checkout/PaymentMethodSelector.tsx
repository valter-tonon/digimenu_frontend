'use client';

import { useCallback } from 'react';
import { CreditCard, Banknote, QrCode, CheckCircle } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    id: 'credit_card',
    name: 'Cartão de Crédito',
    description: 'Pague com seu cartão de crédito',
    icon: CreditCard,
  },
  {
    id: 'debit_card',
    name: 'Cartão de Débito',
    description: 'Pague com seu cartão de débito',
    icon: CreditCard,
  },
  {
    id: 'pix',
    name: 'PIX',
    description: 'Pague com PIX instantaneamente',
    icon: QrCode,
  },
  {
    id: 'cash',
    name: 'Dinheiro',
    description: 'Pague na entrega com dinheiro',
    icon: Banknote,
  },
];

interface PaymentMethodSelectorProps {
  selected: string | null;
  onSelect: (method: string) => void;
  disabled?: boolean;
}

/**
 * Componente reutilizável para seleção de forma de pagamento
 * Exibe opções de pagamento e permite seleção
 */
export default function PaymentMethodSelector({
  selected,
  onSelect,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const handleSelect = useCallback(
    (methodId: string) => {
      if (!disabled) {
        onSelect(methodId);
      }
    },
    [disabled, onSelect]
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Forma de Pagamento</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;

          return (
            <button
              key={method.id}
              onClick={() => handleSelect(method.id)}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-600' : 'text-gray-400'}`} />
                    <h4 className="font-semibold text-gray-900">{method.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle className="w-6 h-6 text-amber-600 flex-shrink-0 ml-2" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
