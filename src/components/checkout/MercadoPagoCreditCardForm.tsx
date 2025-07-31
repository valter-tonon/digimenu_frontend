/**
 * Componente do formulário de cartão de crédito do MercadoPago
 * Utiliza o SDK do MercadoPago para tokenização segura
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMercadoPago } from '@/hooks/useMercadoPago';

interface MercadoPagoCreditCardFormProps {
  amount: number;
  installmentOptions: Array<{
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
  onSubmit: (paymentData: any) => void;
  onBack: () => void;
  isProcessing: boolean;
}

interface FormState {
  email: string;
  document: string;
  documentType: string;
  selectedInstallments: number;
  errors: Record<string, string>;
  isFormReady: boolean;
}

export const MercadoPagoCreditCardForm: React.FC<MercadoPagoCreditCardFormProps> = ({
  amount,
  installmentOptions,
  customer,
  onSubmit,
  onBack,
  isProcessing
}) => {
  const mercadoPago = useMercadoPago();
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, setFormState] = useState<FormState>({
    email: customer?.email || '',
    document: customer?.document || '',
    documentType: 'CPF',
    selectedInstallments: 1,
    errors: {},
    isFormReady: false
  });

  // Inicializa o formulário de cartão quando o componente monta
  useEffect(() => {
    const initializeCardForm = async () => {
      if (!mercadoPago.isInitialized) return;

      try {
        await mercadoPago.createCardForm('card-form', {
          onFormMounted: (error) => {
            if (error) {
              console.error('Card form mount error:', error);
              setFormState(prev => ({
                ...prev,
                errors: { general: 'Erro ao carregar formulário de cartão' }
              }));
            } else {
              setFormState(prev => ({ ...prev, isFormReady: true }));
            }
          },
          onSubmit: (event, formData) => {
            event.preventDefault();
            handleFormSubmit(formData);
          },
          onError: (error) => {
            console.error('Card form error:', error);
            setFormState(prev => ({
              ...prev,
              errors: { general: 'Erro no formulário de cartão' }
            }));
          }
        });
      } catch (error) {
        console.error('Failed to initialize card form:', error);
        setFormState(prev => ({
          ...prev,
          errors: { general: 'Falha ao inicializar formulário de cartão' }
        }));
      }
    };

    initializeCardForm();
  }, [mercadoPago.isInitialized]);

  /**
   * Processa submissão do formulário
   */
  const handleFormSubmit = (cardFormData: any) => {
    // Valida campos adicionais
    const validation = validateForm();
    if (!validation.isValid) {
      setFormState(prev => ({ ...prev, errors: validation.errors }));
      return;
    }

    // Combina dados do cartão com dados adicionais
    const paymentData = {
      ...cardFormData,
      email: formState.email,
      document: formState.document,
      document_type: formState.documentType,
      installments: formState.selectedInstallments,
      amount: amount
    };

    onSubmit(paymentData);
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

    // Valida documento
    if (!formState.document) {
      errors.document = 'Documento é obrigatório';
    } else if (formState.documentType === 'CPF' && !isValidCPF(formState.document)) {
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
  const updateField = (field: keyof FormState, value: string | number) => {
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
    
    if (formState.documentType === 'CPF') {
      if (value.length > 11) value = value.substring(0, 11);
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    updateField('document', value);
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
        <h3 className="text-lg font-medium text-gray-900">Cartão de Crédito</h3>
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

      {/* Formulário */}
      <form ref={formRef} id="card-form" className="space-y-4">
        {/* Campos do cartão (renderizados pelo SDK) */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do cartão
            </label>
            <div id="form-checkout__cardNumber" className="mp-field"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimento
              </label>
              <div id="form-checkout__expirationDate" className="mp-field"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <div id="form-checkout__securityCode" className="mp-field"></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome no cartão
            </label>
            <div id="form-checkout__cardholderName" className="mp-field"></div>
          </div>
        </div>

        {/* Campos adicionais */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formState.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formState.errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="seu@email.com"
              disabled={isProcessing}
            />
            {formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">{formState.errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                id="documentType"
                value={formState.documentType}
                onChange={(e) => updateField('documentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                Documento
              </label>
              <input
                type="text"
                id="document"
                value={formState.document}
                onChange={handleDocumentChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formState.errors.document ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={formState.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                disabled={isProcessing}
              />
              {formState.errors.document && (
                <p className="text-sm text-red-600 mt-1">{formState.errors.document}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parcelas */}
        {installmentOptions.length > 1 && (
          <div>
            <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">
              Parcelas
            </label>
            <select
              id="installments"
              value={formState.selectedInstallments}
              onChange={(e) => updateField('selectedInstallments', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            >
              {installmentOptions.map((option) => (
                <option key={option.installments} value={option.installments}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campos ocultos do SDK */}
        <div style={{ display: 'none' }}>
          <div id="form-checkout__issuer"></div>
          <div id="form-checkout__installments"></div>
          <div id="form-checkout__identificationType"></div>
          <div id="form-checkout__identificationNumber"></div>
          <div id="form-checkout__cardholderEmail"></div>
        </div>

        {/* Erro geral */}
        {formState.errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{formState.errors.general}</p>
          </div>
        )}

        {/* Botão de pagamento */}
        <button
          type="submit"
          disabled={!formState.isFormReady || isProcessing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processando...
            </>
          ) : (
            `Pagar ${formatCurrency(amount)}`
          )}
        </button>
      </form>

      {/* Informações de segurança */}
      <div className="text-center">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Seus dados estão protegidos com criptografia SSL
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

export default MercadoPagoCreditCardForm;