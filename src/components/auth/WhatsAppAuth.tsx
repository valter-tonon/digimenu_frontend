/**
 * Componente de autenticação via WhatsApp
 * 
 * Formulário para solicitar magic link via WhatsApp
 * com validação de telefone e feedback visual.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWhatsAppAuth } from '@/hooks/use-whatsapp-auth';
import { useAppContext } from '@/hooks/useAppContext';

interface WhatsAppAuthProps {
  storeId: string;
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const WhatsAppAuth: React.FC<WhatsAppAuthProps> = ({
  storeId,
  onSuccess,
  onError,
  className = ''
}) => {
  const [phone, setPhone] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const { state, requestMagicLink, reset } = useWhatsAppAuth();
  const { data: appContext } = useAppContext();

  // Gera fingerprint simples (em produção, usar biblioteca mais robusta)
  const generateFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 2, 2);
    
    return btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL()
    })).substring(0, 32);
  };

  /**
   * Submete formulário para solicitar magic link
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await requestMagicLink(phone, storeId);

      if (state.isSuccess) {
        // Inicia countdown se há expiração
        if (state.expiresAt) {
          const now = new Date();
          const minutes = Math.max(0, Math.floor((state.expiresAt.getTime() - now.getTime()) / 60000));
          if (minutes > 0) {
            startCountdown(minutes);
          }
        }
        onSuccess?.(storeId);
      }
    } catch (error) {
      onError?.(state.error || 'Erro ao solicitar acesso via WhatsApp');
    }
  };

  /**
   * Inicia countdown para expiração do token
   */
  const startCountdown = (expiresInMinutes: number) => {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    const updateCountdown = () => {
      const now = new Date();
      const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      
      setCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        reset();
        setCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup após o tempo de expiração
    setTimeout(() => {
      clearInterval(interval);
      setCountdown(null);
    }, expiresInMinutes * 60 * 1000);
  };

  /**
   * Formata telefone durante digitação
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
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

    setPhone(value);
  };

  /**
   * Reseta formulário para nova tentativa
   */
  const resetForm = () => {
    setPhone('');
    setCountdown(null);
    reset();
  };

  /**
   * Formata tempo restante
   */
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso via WhatsApp
          </h2>
          <p className="text-gray-600 text-sm">
            Digite seu WhatsApp para receber o link de acesso
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!state.isSuccess ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Número do WhatsApp
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={state.isLoading}
                />
              </div>

              {state.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{state.error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={state.isLoading || phone.length < 14}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {state.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar link via WhatsApp'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Você receberá uma mensagem com o link de acesso que expira em 15 minutos
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Link enviado!
              </h3>

              <p className="text-gray-600 mb-4">
                Verifique seu WhatsApp e clique no link para acessar o cardápio
              </p>

              {countdown !== null && countdown > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⏰ Link expira em: <strong>{formatTimeRemaining(countdown)}</strong>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={resetForm}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Solicitar novo link
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Componente simplificado para uso em modais
 */
export const WhatsAppAuthModal: React.FC<WhatsAppAuthProps & {
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose, ...props }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <WhatsAppAuth {...props} />
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para usar WhatsApp Auth programaticamente
 */
export const useWhatsAppAuthModal = (storeId: string) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    isSuccess: boolean;
    error: string | null;
  }>({
    isLoading: false,
    isSuccess: false,
    error: null
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSuccess = (sessionId: string) => {
    setAuthState(prev => ({ ...prev, isSuccess: true, error: null }));
    // Pode redirecionar ou executar callback
  };

  const handleError = (error: string) => {
    setAuthState(prev => ({ ...prev, error, isSuccess: false }));
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
    authState,
    WhatsAppAuthModal: (props: any) => (
      <WhatsAppAuthModal
        {...props}
        storeId={storeId}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    )
  };
};

/**
 * Função auxiliar para obter IP do cliente
 */
async function getClientIP(): Promise<string> {
  try {
    // Em produção, usar serviço real
    return '127.0.0.1';
  } catch {
    return 'unknown';
  }
}

export default WhatsAppAuth;