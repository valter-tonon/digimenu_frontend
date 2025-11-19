'use client';

import { useState, useCallback } from 'react';
import { CheckoutState } from '@/services/checkoutStateMachine';
import { toast } from 'react-hot-toast';
import { CreditCard, Banknote, QrCode, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentStepProps {
  state: CheckoutState;
  onNextStep: () => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
  onSetPaymentMethod: (method: string) => void;
  onMarkStepComplete: (step: 'payment') => void;
}

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

/**
 * Step de seleção de forma de pagamento
 *
 * Responsabilidades:
 * - Exibir opções de pagamento
 * - Permitir selecionar forma de pagamento
 * - Validar seleção
 * - Salvar no estado global
 */
export default function PaymentStep({
  state,
  onNextStep,
  onSetLoading,
  onSetError,
  onSetPaymentMethod,
  onMarkStepComplete,
}: PaymentStepProps) {
  const [selected, setSelected] = useState<string>(state.paymentMethod || '');
  const [submitting, setSubmitting] = useState(false);

  // Handle selection
  const handleSelect = useCallback((methodId: string) => {
    setSelected(methodId);
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!selected) {
      toast.error('Por favor, selecione uma forma de pagamento');
      return;
    }

    setSubmitting(true);
    onSetLoading(true);

    try {
      onSetPaymentMethod(selected);
      onMarkStepComplete('payment');

      console.log('✅ Método de pagamento selecionado:', selected);
      toast.success('Forma de pagamento selecionada!');

      setTimeout(() => {
        onNextStep();
      }, 500);
    } catch (error: any) {
      console.error('❌ Erro ao salvar método de pagamento:', error);
      onSetError(error?.message || 'Erro ao salvar método de pagamento');
      toast.error('Erro ao selecionar forma de pagamento. Tente novamente.');
    } finally {
      setSubmitting(false);
      onSetLoading(false);
    }
  }, [selected, onSetPaymentMethod, onMarkStepComplete, onNextStep, onSetLoading, onSetError]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
          <CreditCard className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Forma de Pagamento</h2>
        <p className="text-gray-600">Escolha como você deseja pagar</p>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;

          return (
            <button
              key={method.id}
              onClick={() => handleSelect(method.id)}
              disabled={submitting}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              } disabled:opacity-50`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-600' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-gray-900">{method.name}</h3>
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

      {/* Order Summary */}
      {state.customerData && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">Resumo do Pedido</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium text-gray-900">{state.customerData.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Telefone:</span>
            <span className="font-medium text-gray-900">{state.customerData.phone}</span>
          </div>
          {state.selectedAddress && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Endereço:</span>
              <span className="font-medium text-gray-900 text-right max-w-xs">
                {state.selectedAddress.street}, {state.selectedAddress.number}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Dica:</strong> O pagamento será processado após a confirmação do seu pedido.
        </p>
      </div>

      {/* Submit Button */}
      <div>
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="w-full bg-amber-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
        >
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
          Próximo: Confirmar Pedido
        </button>
      </div>
    </div>
  );
}
