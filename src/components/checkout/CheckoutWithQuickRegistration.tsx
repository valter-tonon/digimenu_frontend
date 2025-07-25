/**
 * Componente de checkout com cadastro rápido
 * 
 * Integra checkout com sistema de cadastro rápido,
 * permitindo que usuários visitantes se cadastrem
 * durante o processo de finalização do pedido.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useCartStore } from '@/store/cart-store';
import { quickRegistrationService, QuickRegistrationData } from '@/services/quickRegistration';
import { WhatsAppAuth } from '../auth/WhatsAppAuth';

interface CheckoutWithQuickRegistrationProps {
  onSuccess?: (customerId: string) => void;
  onError?: (error: string) => void;
  onSkip?: () => void;
  className?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  acceptTerms: boolean;
}

interface FormState {
  data: FormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  showWhatsAppAuth: boolean;
}

export const CheckoutWithQuickRegistration: React.FC<CheckoutWithQuickRegistrationProps> = ({
  onSuccess,
  onError,
  onSkip,
  className = ''
}) => {
  const auth = useAuth();
  const cartStore = useCartStore();
  const { settings, isLoading: settingsLoading } = useStoreSettings(cartStore.storeId || undefined);

  const [state, setState] = useState<FormState>({
    data: {
      name: '',
      phone: '',
      email: '',
      acceptTerms: false
    },
    errors: {},
    isSubmitting: false,
    showWhatsAppAuth: false
  });

  // Se usuário já está autenticado, não mostra o formulário
  if (auth.isAuthenticated && auth.customer) {
    return null;
  }

  // Se configurações não permitem cadastro rápido, não mostra
  if (!settingsLoading && (!settings?.quickRegistration.enabled || !auth.canOrderAsGuest)) {
    return null;
  }

  /**
   * Submete formulário de cadastro rápido
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.session || !auth.fingerprint || !cartStore.storeId) {
      onError?.('Sessão inválida. Recarregue a página.');
      return;
    }

    // Valida formulário
    const validation = validateForm();
    if (!validation.isValid) {
      setState(prev => ({ ...prev, errors: validation.errors }));
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

    try {
      const registrationData: QuickRegistrationData = {
        name: state.data.name.trim(),
        phone: state.data.phone,
        email: state.data.email.trim() || undefined,
        acceptTerms: state.data.acceptTerms,
        storeId: cartStore.storeId,
        sessionId: auth.session.id,
        fingerprint: auth.fingerprint
      };

      const result = await quickRegistrationService.registerQuickCustomer(registrationData);

      if (result.success && result.customerId) {
        // Associa cliente à sessão de auth
        await auth.associateCustomer(result.customerId);
        
        onSuccess?.(result.customerId);
        
        console.log('Cadastro rápido realizado:', {
          customerId: result.customerId,
          message: result.message
        });
      } else {
        const errorMessage = result.message || 'Erro no cadastro';
        setState(prev => ({ 
          ...prev, 
          errors: { general: errorMessage }
        }));
        onError?.(errorMessage);
      }

    } catch (error) {
      const errorMessage = 'Erro interno no cadastro';
      setState(prev => ({ 
        ...prev, 
        errors: { general: errorMessage }
      }));
      onError?.(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  /**
   * Valida dados do formulário
   */
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Valida nome
    if (!state.data.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (state.data.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Valida telefone
    if (!state.data.phone) {
      errors.phone = 'Telefone é obrigatório';
    } else {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
      if (!phoneRegex.test(state.data.phone)) {
        errors.phone = 'Formato de telefone inválido';
      }
    }

    // Valida email se obrigatório
    if (settings?.quickRegistration.requireEmail && !state.data.email) {
      errors.email = 'Email é obrigatório';
    } else if (state.data.email && !isValidEmail(state.data.email)) {
      errors.email = 'Email inválido';
    }

    // Valida termos
    if (!state.data.acceptTerms) {
      errors.acceptTerms = 'É necessário aceitar os termos';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  /**
   * Formata telefone durante digitação
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    // Formata: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (value.length >= 11) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 10) {
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 6) {
      value = value.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else if (value.length >= 2) {
      value = value.replace(/(\d{2})(\d+)/, '($1) $2');
    }

    setState(prev => ({
      ...prev,
      data: { ...prev.data, phone: value },
      errors: { ...prev.errors, phone: '' }
    }));
  };

  /**
   * Atualiza campo do formulário
   */
  const updateField = (field: keyof FormData, value: string | boolean) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  /**
   * Mostra autenticação via WhatsApp
   */
  const showWhatsAppAuth = () => {
    setState(prev => ({ ...prev, showWhatsAppAuth: true }));
  };

  /**
   * Esconde autenticação via WhatsApp
   */
  const hideWhatsAppAuth = () => {
    setState(prev => ({ ...prev, showWhatsAppAuth: false }));
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Finalizar Pedido
          </h2>
          <p className="text-gray-600 text-sm">
            Preencha seus dados para continuar com o pedido
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!state.showWhatsAppAuth ? (
            <motion.form
              key="registration-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Nome */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  id="name"
                  value={state.data.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    state.errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Seu nome completo"
                  disabled={state.isSubmitting}
                />
                {state.errors.name && (
                  <p className="text-sm text-red-600 mt-1">{state.errors.name}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={state.data.phone}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    state.errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                  disabled={state.isSubmitting}
                />
                {state.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{state.errors.phone}</p>
                )}
              </div>

              {/* Email (opcional ou obrigatório baseado nas configurações) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email {settings?.quickRegistration.requireEmail ? '*' : '(opcional)'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={state.data.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    state.errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                  disabled={state.isSubmitting}
                />
                {state.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{state.errors.email}</p>
                )}
              </div>

              {/* Termos */}
              {settings?.quickRegistration.showTermsCheckbox && (
                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={state.data.acceptTerms}
                      onChange={(e) => updateField('acceptTerms', e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={state.isSubmitting}
                    />
                    <span className="text-sm text-gray-700">
                      {settings.quickRegistration.termsText || 'Aceito os termos de uso'}
                      {settings.quickRegistration.privacyPolicyUrl && (
                        <>
                          {' '}
                          <a 
                            href={settings.quickRegistration.privacyPolicyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            e política de privacidade
                          </a>
                        </>
                      )}
                    </span>
                  </label>
                  {state.errors.acceptTerms && (
                    <p className="text-sm text-red-600 mt-1">{state.errors.acceptTerms}</p>
                  )}
                </div>
              )}

              {/* Erro geral */}
              {state.errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{state.errors.general}</p>
                </div>
              )}

              {/* Botões */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={state.isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
                >
                  {state.isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cadastrando...
                    </>
                  ) : (
                    'Continuar com o pedido'
                  )}
                </button>

                {/* Opção WhatsApp */}
                {settings?.quickRegistration.allowWhatsAppAuth && (
                  <button
                    type="button"
                    onClick={showWhatsAppAuth}
                    disabled={state.isSubmitting}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Entrar via WhatsApp
                  </button>
                )}

                {/* Botão pular (se permitido) */}
                {onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    disabled={state.isSubmitting}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 transition-colors"
                  >
                    Continuar sem cadastro
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Seus dados serão usados apenas para este pedido e comunicações relacionadas
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="whatsapp-auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <WhatsAppAuth
                storeId={cartStore.storeId!}
                onSuccess={(sessionId) => {
                  hideWhatsAppAuth();
                  onSuccess?.(sessionId);
                }}
                onError={(error) => {
                  onError?.(error);
                }}
                showUI={true}
              />
              
              <button
                onClick={hideWhatsAppAuth}
                className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Voltar ao formulário
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default CheckoutWithQuickRegistration;