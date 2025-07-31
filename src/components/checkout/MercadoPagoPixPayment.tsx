/**
 * Componente de pagamento PIX do MercadoPago
 * Gera QR Code e instruções para pagamento via PIX
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MercadoPagoPixPaymentProps {
  amount: number;
  customer?: {
    email?: string;
    name?: string;
    document?: string;
  };
  onGenerate: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

interface PixData {
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: string;
  paymentId: string;
}

interface FormState {
  email: string;
  document: string;
  name: string;
  errors: Record<string, string>;
  pixData: PixData | null;
  showQRCode: boolean;
  timeRemaining: number;
}

export const MercadoPagoPixPayment: React.FC<MercadoPagoPixPaymentProps> = ({
  amount,
  customer,
  onGenerate,
  onBack,
  isProcessing
}) => {
  const [formState, setFormState] = useState<FormState>({
    email: customer?.email || '',
    document: customer?.document || '',
    name: customer?.name || '',
    errors: {},
    pixData: null,
    showQRCode: false,
    timeRemaining: 0
  });

  // Timer para expiração do PIX
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (formState.timeRemaining > 0) {
      interval = setInterval(() => {
        setFormState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [formState.timeRemaining]);

  /**
   * Processa geração do PIX
   */
  const handleGeneratePix = () => {
    // Valida formulário
    const validation = validateForm();
    if (!validation.isValid) {
      setFormState(prev => ({ ...prev, errors: validation.errors }));
      return;
    }

    // Chama função de geração
    onGenerate();
  };

  /**
   * Valida campos do formulário
   */
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Valida email
    if (!formState.email) {
      errors.email = 'Email é obrigatório';
    } else if (!isValidEmail(formState.email)) {
      errors.email = 'Email inválido';
    }

    // Valida nome
    if (!formState.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    // Valida documento (opcional para PIX)
    if (formState.document && !isValidCPF(formState.document)) {
      errors.document = 'CPF inválido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  /**
   * Atualiza campo do formulário
   */
  const updateField = (field: keyof FormState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  /**
   * Formata CPF durante digitação
   */
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    updateField('document', value);
  };

  /**
   * Copia código PIX para clipboard
   */
  const copyPixCode = async () => {
    if (formState.pixData?.qrCode) {
      try {
        await navigator.clipboard.writeText(formState.pixData.qrCode);
        // Aqui você pode adicionar uma notificação de sucesso
        console.log('Código PIX copiado!');
      } catch (error) {
        console.error('Erro ao copiar código PIX:', error);
      }
    }
  };

  /**
   * Formata tempo restante
   */
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Pagamento PIX</h3>
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {!formState.pixData ? (
        // Formulário para gerar PIX
        <div className="space-y-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Pagamento Instantâneo</h4>
            <p className="text-sm text-gray-600">
              Pague {formatCurrency(amount)} via PIX de forma rápida e segura
            </p>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                value={formState.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formState.errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Seu nome completo"
                disabled={isProcessing}
              />
              {formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{formState.errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formState.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formState.errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
                disabled={isProcessing}
              />
              {formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">{formState.errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                CPF (opcional)
              </label>
              <input
                type="text"
                id="document"
                value={formState.document}
                onChange={handleDocumentChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formState.errors.document ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="000.000.000-00"
                disabled={isProcessing}
              />
              {formState.errors.document && (
                <p className="text-sm text-red-600 mt-1">{formState.errors.document}</p>
              )}
            </div>
          </div>

          {/* Botão gerar PIX */}
          <button
            onClick={handleGeneratePix}
            disabled={isProcessing}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando PIX...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Gerar código PIX
              </>
            )}
          </button>
        </div>
      ) : (
        // Exibição do QR Code PIX
        <div className="space-y-6">
          {/* Timer */}
          {formState.timeRemaining > 0 && (
            <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Tempo restante: {formatTimeRemaining(formState.timeRemaining)}
              </p>
            </div>
          )}

          {/* QR Code */}
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
              {formState.pixData.qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${formState.pixData.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500">QR Code não disponível</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Escaneie o código com o app do seu banco
            </p>
          </div>

          {/* Código PIX para copiar */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Ou copie e cole o código PIX:
            </p>
            <div className="flex">
              <input
                type="text"
                value={formState.pixData.qrCode}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyPixCode}
                className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Como pagar:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Abra o app do seu banco</li>
              <li>2. Escolha a opção PIX</li>
              <li>3. Escaneie o QR Code ou cole o código</li>
              <li>4. Confirme o pagamento</li>
            </ol>
          </div>

          {/* Link para comprovante */}
          {formState.pixData.ticketUrl && (
            <div className="text-center">
              <a
                href={formState.pixData.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Ver comprovante do pagamento
              </a>
            </div>
          )}

          {/* Botão para gerar novo PIX */}
          <button
            onClick={() => setFormState(prev => ({ ...prev, pixData: null }))}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Gerar novo código PIX
          </button>
        </div>
      )}

      {/* Informações de segurança */}
      <div className="text-center">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Pagamento seguro via MercadoPago
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida CPF
 */
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

export default MercadoPagoPixPayment;