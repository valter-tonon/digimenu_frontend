/**
 * Componente principal do checkout MercadoPago
 * Integra pagamentos com cartão de crédito e PIX
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MercadoPagoCreditCardForm } from './MercadoPagoCreditCardForm';
import { MercadoPagoPixPayment } from './MercadoPagoPixPayment';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface MercadoPagoCheckoutProps {
  orderId: string;
  amount: number;
  config: {
    publicKey: string;
    sandbox?: boolean;
    paymentMethods: {
      pix?: boolean;
      creditCard?: boolean;
    };
    installments?: Array<{
      installments: number;
      installment_amount: number;
      total_amount: number;
      interest_rate: number;
      label: string;
    }>;
    customer?: {
      email?: string;
      name?: string;
      document?: string;
    };
  };
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

type PaymentMethod = 'credit_card' | 'pix';

interface PaymentState {
  selectedMethod: PaymentMethod | null;
  isProcessing: boolean;
  error: string | null;
  success: boolean;
}

export const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({
  orderId,
  amount,
  config,
  onSuccess,
  onError,
  onCancel,
  className = ''
}) => {
  const mercadoPago = useMercadoPago();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    selectedMethod: null,
    isProcessing: false,
    error: null,
    success: false
  });

  // Inicializa MercadoPago SDK
  useEffect(() => {
    const initializeMercadoPago = async () => {
      try {
        await mercadoPago.initialize({
          publicKey: config.publicKey,
          sandbox: config.sandbox,
          locale: 'pt-BR'
        });
      } catch (error) {
        console.error('Failed to initialize MercadoPago:', error);
        setPaymentState(prev => ({
          ...prev,
          error: 'Falha ao inicializar sistema de pagamento'
        }));
        onError?.('Falha ao inicializar sistema de pagamento');
      }
    };

    initializeMercadoPago();
  }, [config.publicKey, config.sandbox, mercadoPago, onError]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      mercadoPago.cleanup();
    };
  }, [mercadoPago]);

  /**
   * Seleciona método de pagamento
   */
  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: method,
      error: null
    }));
  };

  /**
   * Volta para seleção de método
   */
  const goBackToMethodSelection = () => {
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: null,
      error: null,
      isProcessing: false
    }));
  };

  /**
   * Processa pagamento com cartão
   */
  const handleCreditCardPayment = async (paymentData: any) => {
    setPaymentState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await mercadoPago.processCardPayment(orderId, paymentData);

      if (result.success) {
        setPaymentState(prev => ({ ...prev, success: true, isProcessing: false }));
        onSuccess?.(result);
      } else {
        setPaymentState(prev => ({
          ...prev,
          error: result.error || 'Erro no processamento do pagamento',
          isProcessing: false
        }));
        onError?.(result.error || 'Erro no processamento do pagamento');
      }
    } catch (error) {
      const errorMessage = 'Erro interno no processamento do pagamento';
      setPaymentState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false
      }));
      onError?.(errorMessage);
    }
  };

  /**
   * Processa pagamento PIX
   */
  const handlePixPayment = async () => {
    setPaymentState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await mercadoPago.generatePixPayment(orderId, config.customer);

      if (result.success) {
        setPaymentState(prev => ({ ...prev, isProcessing: false }));
        onSuccess?.(result);
      } else {
        setPaymentState(prev => ({
          ...prev,
          error: result.error || 'Erro ao gerar pagamento PIX',
          isProcessing: false
        }));
        onError?.(result.error || 'Erro ao gerar pagamento PIX');
      }
    } catch (error) {
      const errorMessage = 'Erro interno ao gerar PIX';
      setPaymentState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false
      }));
      onError?.(errorMessage);
    }
  };

  /**
   * Formata valor monetário
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Loading inicial
  if (!mercadoPago.isInitialized && !mercadoPago.error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Carregando sistema de pagamento...</span>
      </div>
    );
  }

  // Erro na inicialização
  if (mercadoPago.error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">Erro no sistema de pagamento</p>
          </div>
          <p className="text-red-700 text-sm mt-1">{mercadoPago.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pagamento</h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Total: {formatCurrency(amount)}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!paymentState.selectedMethod ? (
              // Seleção de método de pagamento
              <motion.div
                key="method-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Escolha a forma de pagamento
                </h3>

                {/* PIX */}
                {config.paymentMethods.pix && (
                  <button
                    onClick={() => selectPaymentMethod('pix')}
                    disabled={paymentState.isProcessing}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">PIX</h4>
                        <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Cartão de Crédito */}
                {config.paymentMethods.creditCard && (
                  <button
                    onClick={() => selectPaymentMethod('credit_card')}
                    disabled={paymentState.isProcessing}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Cartão de Crédito</h4>
                        <p className="text-sm text-gray-600">
                          {config.installments && config.installments.length > 1 
                            ? `Até ${Math.max(...config.installments.map(i => i.installments))}x sem juros`
                            : 'À vista ou parcelado'
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </motion.div>
            ) : paymentState.selectedMethod === 'credit_card' ? (
              // Formulário de cartão de crédito
              <motion.div
                key="credit-card-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MercadoPagoCreditCardForm
                  amount={amount}
                  installmentOptions={config.installments || []}
                  customer={config.customer}
                  onSubmit={handleCreditCardPayment}
                  onBack={goBackToMethodSelection}
                  isProcessing={paymentState.isProcessing}
                />
              </motion.div>
            ) : (
              // Pagamento PIX
              <motion.div
                key="pix-payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MercadoPagoPixPayment
                  amount={amount}
                  customer={config.customer}
                  onGenerate={handlePixPayment}
                  onBack={goBackToMethodSelection}
                  isProcessing={paymentState.isProcessing}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Erro */}
          {paymentState.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 text-sm">{paymentState.error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Pagamento seguro via MercadoPago
          </div>
        </div>
      </div>
    </div>
  );
};

export default MercadoPagoCheckout;