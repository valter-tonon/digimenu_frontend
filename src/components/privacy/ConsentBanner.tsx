/**
 * Banner de consentimento de privacidade
 * 
 * Componente para solicitar consentimento do usuário para
 * coleta de dados, fingerprinting e uso de cookies.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auditLogger } from '@/services/auditLogger';

export interface ConsentData {
  fingerprinting: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: Date;
  version: string;
}

interface ConsentBannerProps {
  onConsentGiven?: (consent: ConsentData) => void;
  onOptOut?: () => void;
  className?: string;
}

const CONSENT_VERSION = '1.0';
const CONSENT_STORAGE_KEY = 'privacy_consent';

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  onConsentGiven,
  onOptOut,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [customConsent, setCustomConsent] = useState({
    fingerprinting: true,
    analytics: true,
    marketing: false,
    functional: true
  });

  /**
   * Verifica se precisa mostrar o banner
   */
  useEffect(() => {
    const checkConsentStatus = () => {
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        
        if (!stored) {
          // Não há consentimento, mostra banner
          setIsVisible(true);
          return;
        }

        const consent = JSON.parse(stored);
        
        // Verifica se a versão mudou
        if (consent.version !== CONSENT_VERSION) {
          setIsVisible(true);
          return;
        }

        // Verifica se o consentimento expirou (1 ano)
        const consentDate = new Date(consent.timestamp);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (consentDate < oneYearAgo) {
          setIsVisible(true);
          return;
        }

        // Consentimento válido existe
        setIsVisible(false);

      } catch (error) {
        console.error('Erro ao verificar consentimento:', error);
        setIsVisible(true);
      }
    };

    // Delay para não interferir com carregamento inicial
    setTimeout(checkConsentStatus, 1000);
  }, []);

  /**
   * Aceita todos os cookies
   */
  const acceptAll = async () => {
    const consent: ConsentData = {
      fingerprinting: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date(),
      version: CONSENT_VERSION
    };

    await saveConsent(consent);
  };

  /**
   * Aceita apenas essenciais
   */
  const acceptEssential = async () => {
    const consent: ConsentData = {
      fingerprinting: false,
      analytics: false,
      marketing: false,
      functional: true,
      timestamp: new Date(),
      version: CONSENT_VERSION
    };

    await saveConsent(consent);
  };

  /**
   * Aceita configuração personalizada
   */
  const acceptCustom = async () => {
    const consent: ConsentData = {
      ...customConsent,
      timestamp: new Date(),
      version: CONSENT_VERSION
    };

    await saveConsent(consent);
  };

  /**
   * Rejeita tudo (opt-out)
   */
  const rejectAll = async () => {
    try {
      // Remove dados existentes
      await clearAllData();

      // Registra opt-out
      const fingerprint = await getCurrentFingerprint();
      const ip = await getClientIP();

      await auditLogger.logPrivacyOptOut(fingerprint, ip);

      // Salva preferência de opt-out
      const optOutData = {
        optedOut: true,
        timestamp: new Date(),
        version: CONSENT_VERSION
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(optOutData));

      setIsVisible(false);
      onOptOut?.();

    } catch (error) {
      console.error('Erro ao processar opt-out:', error);
    }
  };

  /**
   * Salva consentimento
   */
  const saveConsent = async (consent: ConsentData) => {
    try {
      // Salva no localStorage
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));

      // Registra evento de auditoria
      const fingerprint = await getCurrentFingerprint();
      const ip = await getClientIP();

      await auditLogger.logPrivacyConsent(
        fingerprint, 
        ip, 
        Object.entries(consent)
          .filter(([key, value]) => key !== 'timestamp' && key !== 'version' && value)
          .map(([key]) => key)
          .join(', ')
      );

      setIsVisible(false);
      onConsentGiven?.(consent);

      console.log('Consentimento salvo:', consent);

    } catch (error) {
      console.error('Erro ao salvar consentimento:', error);
    }
  };

  /**
   * Limpa todos os dados do usuário
   */
  const clearAllData = async () => {
    try {
      // Lista de chaves para remover
      const keysToRemove = [
        'fingerprint_',
        'session_',
        'rate_limit_',
        'audit_logs',
        'suspicious_activities',
        'activity_patterns',
        'blocked_ips',
        'digimenu-cart'
      ];

      // Remove dados do localStorage
      Object.keys(localStorage).forEach(key => {
        if (keysToRemove.some(prefix => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      });

      console.log('Dados do usuário limpos');

    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4 ${className}`}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                🍪 Sua Privacidade é Importante
              </h2>
              <p className="text-gray-600 text-sm">
                Usamos tecnologias para melhorar sua experiência e garantir a segurança do sistema.
              </p>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Para oferecer a melhor experiência possível e manter a segurança do sistema, 
              coletamos algumas informações sobre seu dispositivo e navegação. Você pode 
              escolher quais dados deseja compartilhar conosco.
            </p>

            {/* Botão para mostrar detalhes */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
            >
              {showDetails ? '▼' : '▶'} Ver detalhes sobre os dados coletados
            </button>

            {/* Detalhes expandidos */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
                    {/* Fingerprinting */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="fingerprinting"
                        checked={customConsent.fingerprinting}
                        onChange={(e) => setCustomConsent(prev => ({
                          ...prev,
                          fingerprinting: e.target.checked
                        }))}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="fingerprinting" className="font-medium text-gray-900">
                          Identificação do Dispositivo (Fingerprinting)
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Coletamos informações técnicas do seu dispositivo (resolução de tela, 
                          navegador, fuso horário) para criar uma identificação única. Isso nos 
                          ajuda a detectar atividades suspeitas e manter a segurança do sistema.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Dados coletados:</strong> User Agent, resolução de tela, 
                          fuso horário, idioma, características do canvas e WebGL.
                        </p>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="analytics"
                        checked={customConsent.analytics}
                        onChange={(e) => setCustomConsent(prev => ({
                          ...prev,
                          analytics: e.target.checked
                        }))}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="analytics" className="font-medium text-gray-900">
                          Análise de Uso
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Coletamos dados sobre como você usa o sistema para melhorar 
                          a experiência e identificar problemas.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Dados coletados:</strong> Páginas visitadas, tempo de sessão, 
                          interações com elementos da interface.
                        </p>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="marketing"
                        checked={customConsent.marketing}
                        onChange={(e) => setCustomConsent(prev => ({
                          ...prev,
                          marketing: e.target.checked
                        }))}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="marketing" className="font-medium text-gray-900">
                          Marketing e Personalização
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Usamos seus dados para personalizar ofertas e comunicações.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Dados coletados:</strong> Preferências de produtos, 
                          histórico de pedidos, interações com promoções.
                        </p>
                      </div>
                    </div>

                    {/* Funcional */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="functional"
                        checked={customConsent.functional}
                        onChange={(e) => setCustomConsent(prev => ({
                          ...prev,
                          functional: e.target.checked
                        }))}
                        disabled
                        className="mt-1 h-4 w-4 text-gray-400 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="functional" className="font-medium text-gray-500">
                          Cookies Funcionais (Obrigatórios)
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Necessários para o funcionamento básico do sistema, como 
                          manter sua sessão ativa e lembrar suas preferências.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Dados coletados:</strong> ID da sessão, preferências de idioma, 
                          dados do carrinho de compras.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={acceptAll}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Aceitar Todos
            </button>

            <button
              onClick={acceptCustom}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Salvar Preferências
            </button>

            <button
              onClick={acceptEssential}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Apenas Essenciais
            </button>

            <button
              onClick={rejectAll}
              className="flex-1 bg-red-100 text-red-700 py-3 px-4 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Rejeitar Tudo
            </button>
          </div>

          {/* Links adicionais */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-700">
                Política de Privacidade
              </a>
              <a href="/cookie-policy" className="hover:text-gray-700">
                Política de Cookies
              </a>
              <a href="/terms" className="hover:text-gray-700">
                Termos de Uso
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Você pode alterar suas preferências a qualquer momento nas configurações.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Hook para gerenciar consentimento
 */
export const usePrivacyConsent = () => {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [hasOptedOut, setHasOptedOut] = useState(false);

  useEffect(() => {
    loadConsent();
  }, []);

  const loadConsent = () => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        if (data.optedOut) {
          setHasOptedOut(true);
        } else {
          setConsent({
            ...data,
            timestamp: new Date(data.timestamp)
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar consentimento:', error);
    }
  };

  const updateConsent = (newConsent: Partial<ConsentData>) => {
    if (!consent) return;

    const updated = {
      ...consent,
      ...newConsent,
      timestamp: new Date(),
      version: CONSENT_VERSION
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    setConsent(updated);
  };

  const revokeConsent = async () => {
    try {
      // Limpa dados
      await clearAllUserData();
      
      // Salva opt-out
      const optOutData = {
        optedOut: true,
        timestamp: new Date(),
        version: CONSENT_VERSION
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(optOutData));
      setConsent(null);
      setHasOptedOut(true);

    } catch (error) {
      console.error('Erro ao revogar consentimento:', error);
    }
  };

  const canUseFingerprinting = () => {
    return consent?.fingerprinting === true && !hasOptedOut;
  };

  const canUseAnalytics = () => {
    return consent?.analytics === true && !hasOptedOut;
  };

  const canUseMarketing = () => {
    return consent?.marketing === true && !hasOptedOut;
  };

  return {
    consent,
    hasOptedOut,
    updateConsent,
    revokeConsent,
    canUseFingerprinting,
    canUseAnalytics,
    canUseMarketing,
    isConsentRequired: !consent && !hasOptedOut
  };
};

/**
 * Funções auxiliares
 */
async function getCurrentFingerprint(): Promise<string> {
  try {
    const { fingerprintService } = await import('@/services/fingerprint');
    const result = await fingerprintService.generateFingerprint();
    return result.hash;
  } catch {
    return 'unknown';
  }
}

async function getClientIP(): Promise<string> {
  try {
    // Em produção, usar serviço real
    return '127.0.0.1';
  } catch {
    return 'unknown';
  }
}

async function clearAllUserData(): Promise<void> {
  const keysToRemove = [
    'fingerprint_',
    'session_',
    'rate_limit_',
    'audit_logs',
    'suspicious_activities',
    'activity_patterns',
    'blocked_ips',
    'digimenu-cart'
  ];

  Object.keys(localStorage).forEach(key => {
    if (keysToRemove.some(prefix => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  });
}

export default ConsentBanner;