/**
 * Hook para integração com MercadoPago SDK
 * Gerencia inicialização, tokenização de cartão e pagamentos PIX
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Tipos do MercadoPago SDK
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoConfig {
  publicKey: string;
  sandbox?: boolean;
  locale?: string;
}

interface CardFormData {
  token: string;
  paymentMethodId: string;
  issuerId: string;
  installments: number;
  amount: number;
  cardholderEmail: string;
  identificationNumber: string;
  identificationType: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon?: string;
  supports_installments?: boolean;
  max_installments?: number;
}

interface InstallmentOption {
  installments: number;
  installment_amount: number;
  total_amount: number;
  interest_rate: number;
  label: string;
}

interface UseMercadoPagoReturn {
  // Estado
  isLoaded: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Métodos
  initialize: (config: MercadoPagoConfig) => Promise<void>;
  createCardForm: (formId: string, callbacks: CardFormCallbacks) => Promise<void>;
  processCardPayment: (orderId: string, paymentData: Partial<CardFormData>) => Promise<PaymentResult>;
  generatePixPayment: (orderId: string, customerData?: CustomerData) => Promise<PixPaymentResult>;
  cleanup: () => void;
}

interface CardFormCallbacks {
  onFormMounted?: (error?: any) => void;
  onSubmit?: (event: Event, formData: CardFormData) => void;
  onFetching?: (resource: string) => void;
  onError?: (error: any) => void;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
  errorCode?: string;
}

interface PixPaymentResult {
  success: boolean;
  paymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  expiresAt?: string;
  error?: string;
}

interface CustomerData {
  email?: string;
  document?: string;
  name?: string;
}

export const useMercadoPago = (): UseMercadoPagoReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mpInstance = useRef<any>(null);
  const cardForm = useRef<any>(null);
  const configRef = useRef<MercadoPagoConfig | null>(null);

  /**
   * Carrega o SDK do MercadoPago
   */
  const loadSDK = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Se já está carregado, resolve imediatamente
      if (window.MercadoPago) {
        setIsLoaded(true);
        resolve();
        return;
      }

      // Se já existe um script sendo carregado, aguarda
      const existingScript = document.getElementById('mercadopago-sdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setIsLoaded(true);
          resolve();
        });
        existingScript.addEventListener('error', () => {
          setError('Falha ao carregar SDK do MercadoPago');
          reject(new Error('Failed to load MercadoPago SDK'));
        });
        return;
      }

      // Cria e adiciona o script
      const script = document.createElement('script');
      script.id = 'mercadopago-sdk';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      
      script.onload = () => {
        setIsLoaded(true);
        resolve();
      };
      
      script.onerror = () => {
        setError('Falha ao carregar SDK do MercadoPago');
        reject(new Error('Failed to load MercadoPago SDK'));
      };

      document.head.appendChild(script);
    });
  }, []);

  /**
   * Inicializa o MercadoPago com a configuração fornecida
   */
  const initialize = useCallback(async (config: MercadoPagoConfig): Promise<void> => {
    try {
      setError(null);
      
      // Carrega o SDK se necessário
      if (!isLoaded) {
        await loadSDK();
      }

      // Inicializa a instância do MercadoPago
      mpInstance.current = new window.MercadoPago(config.publicKey, {
        locale: config.locale || 'pt-BR'
      });

      configRef.current = config;
      setIsInitialized(true);
      
      console.log('MercadoPago SDK initialized successfully');
    } catch (err) {
      const errorMessage = 'Falha ao inicializar MercadoPago';
      setError(errorMessage);
      console.error('MercadoPago initialization error:', err);
      throw new Error(errorMessage);
    }
  }, [isLoaded, loadSDK]);

  /**
   * Cria formulário de cartão de crédito
   */
  const createCardForm = useCallback(async (
    formId: string, 
    callbacks: CardFormCallbacks
  ): Promise<void> => {
    if (!isInitialized || !mpInstance.current) {
      throw new Error('MercadoPago não foi inicializado');
    }

    try {
      // Limpa formulário anterior se existir
      if (cardForm.current) {
        cardForm.current = null;
      }

      const defaultCallbacks = {
        onFormMounted: (error?: any) => {
          if (error) {
            console.warn('Card form mounted with error:', error);
            callbacks.onError?.(error);
          } else {
            console.log('Card form mounted successfully');
            callbacks.onFormMounted?.();
          }
        },
        onSubmit: (event: Event) => {
          event.preventDefault();
          
          if (cardForm.current) {
            const formData = cardForm.current.getCardFormData();
            callbacks.onSubmit?.(event, formData);
          }
        },
        onFetching: (resource: string) => {
          console.log('Fetching resource:', resource);
          callbacks.onFetching?.(resource);
        }
      };

      cardForm.current = mpInstance.current.cardForm({
        amount: '0', // Será atualizado dinamicamente
        iframe: true,
        form: {
          id: formId,
          cardNumber: {
            id: "form-checkout__cardNumber",
            placeholder: "Número do cartão",
          },
          expirationDate: {
            id: "form-checkout__expirationDate",
            placeholder: "MM/YY",
          },
          securityCode: {
            id: "form-checkout__securityCode",
            placeholder: "Código de segurança",
          },
          cardholderName: {
            id: "form-checkout__cardholderName",
            placeholder: "Titular do cartão",
          },
          issuer: {
            id: "form-checkout__issuer",
            placeholder: "Banco emissor",
          },
          installments: {
            id: "form-checkout__installments",
            placeholder: "Parcelas",
          },
          identificationType: {
            id: "form-checkout__identificationType",
            placeholder: "Tipo de documento",
          },
          identificationNumber: {
            id: "form-checkout__identificationNumber",
            placeholder: "Número do documento",
          },
          cardholderEmail: {
            id: "form-checkout__cardholderEmail",
            placeholder: "E-mail",
          },
        },
        callbacks: defaultCallbacks,
      });

      console.log('Card form created successfully');
    } catch (err) {
      const errorMessage = 'Falha ao criar formulário de cartão';
      setError(errorMessage);
      console.error('Card form creation error:', err);
      throw new Error(errorMessage);
    }
  }, [isInitialized]);

  /**
   * Processa pagamento com cartão de crédito
   */
  const processCardPayment = useCallback(async (
    orderId: string,
    paymentData: Partial<CardFormData>
  ): Promise<PaymentResult> => {
    try {
      const response = await fetch('/api/payments/mercadopago/credit-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          order_id: orderId,
          card_token: paymentData.token,
          payment_method_id: paymentData.paymentMethodId,
          issuer_id: paymentData.issuerId,
          installments: paymentData.installments,
          amount: paymentData.amount,
          email: paymentData.cardholderEmail,
          document: paymentData.identificationNumber,
          document_type: paymentData.identificationType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          paymentId: result.payment_id,
          status: result.status,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Erro no processamento do pagamento',
          errorCode: result.error_code,
        };
      }
    } catch (err) {
      console.error('Credit card payment error:', err);
      return {
        success: false,
        error: 'Erro de conexão. Tente novamente.',
      };
    }
  }, []);

  /**
   * Gera pagamento PIX
   */
  const generatePixPayment = useCallback(async (
    orderId: string,
    customerData: CustomerData = {}
  ): Promise<PixPaymentResult> => {
    try {
      const response = await fetch('/api/payments/mercadopago/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          order_id: orderId,
          email: customerData.email,
          document: customerData.document,
          name: customerData.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          paymentId: result.payment_id,
          qrCode: result.qr_code,
          qrCodeBase64: result.qr_code_base64,
          ticketUrl: result.ticket_url,
          expiresAt: result.expires_at,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Erro ao gerar pagamento PIX',
        };
      }
    } catch (err) {
      console.error('PIX payment error:', err);
      return {
        success: false,
        error: 'Erro de conexão. Tente novamente.',
      };
    }
  }, []);

  /**
   * Limpa recursos
   */
  const cleanup = useCallback(() => {
    if (cardForm.current) {
      cardForm.current = null;
    }
    mpInstance.current = null;
    configRef.current = null;
    setIsInitialized(false);
    setError(null);
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isLoaded,
    isInitialized,
    error,
    initialize,
    createCardForm,
    processCardPayment,
    generatePixPayment,
    cleanup,
  };
};

export default useMercadoPago;