/**
 * Controles de privacidade
 * 
 * Componente para gerenciar preferências de privacidade,
 * permitir opt-out e visualizar dados coletados.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivacyConsent, ConsentData } from './ConsentBanner';
import { auditLogger } from '@/services/auditLogger';

interface PrivacyControlsProps {
  onConsentUpdated?: (consent: ConsentData) => void;
  onOptOut?: () => void;
  className?: string;
}

interface DataSummary {
  sessions: number;
  auditEvents: number;
  fingerprints: number;
  cartItems: number;
  lastActivity: Date | null;
  dataSize: string;
}

export const PrivacyControls: React.FC<PrivacyControlsProps> = ({
  onConsentUpdated,
  onOptOut,
  className = ''
}) => {
  const {
    consent,
    hasOptedOut,
    updateConsent,
    revokeConsent,
    canUseFingerprinting,
    canUseAnalytics,
    canUseMarketing
  } = usePrivacyConsent();

  const [activeTab, setActiveTab] = useState<'preferences' | 'data' | 'export'>('preferences');
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmOptOut, setShowConfirmOptOut] = useState(false);

  /**
   * Carrega resumo dos dados
   */
  useEffect(() => {
    loadDataSummary();
  }, []);

  const loadDataSummary = async () => {
    try {
      setIsLoading(true);

      // Conta dados armazenados
      const sessions = countStorageItems('session_');
      const auditEvents = await countAuditEvents();
      const fingerprints = countStorageItems('fingerprint_');
      const cartItems = getCartItemsCount();
      const lastActivity = getLastActivity();
      const dataSize = calculateDataSize();

      setDataSummary({
        sessions,
        auditEvents,
        fingerprints,
        cartItems,
        lastActivity,
        dataSize
      });

    } catch (error) {
      console.error('Erro ao carregar resumo de dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza preferência específica
   */
  const handlePreferenceChange = async (
    preference: keyof ConsentData,
    value: boolean
  ) => {
    if (!consent) return;

    const updated = { [preference]: value };
    updateConsent(updated);
    onConsentUpdated?.({ ...consent, ...updated });

    // Log da mudança
    await auditLogger.logConfigurationChanged(
      `privacy_${preference}`,
      consent[preference],
      value
    );
  };

  /**
   * Confirma opt-out
   */
  const handleOptOut = async () => {
    try {
      setIsLoading(true);
      await revokeConsent();
      setShowConfirmOptOut(false);
      onOptOut?.();
    } catch (error) {
      console.error('Erro ao fazer opt-out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exporta dados do usuário
   */
  const exportUserData = async () => {
    try {
      setIsLoading(true);

      const userData = await collectUserData();
      const dataBlob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log da exportação
      await auditLogger.logEvent('data_export', 'Usuário exportou seus dados', {
        dataSize: JSON.stringify(userData).length,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpa dados específicos
   */
  const clearSpecificData = async (dataType: string) => {
    try {
      setIsLoading(true);

      switch (dataType) {
        case 'sessions':
          clearStorageItems('session_');
          break;
        case 'cart':
          localStorage.removeItem('digimenu-cart');
          break;
        case 'fingerprints':
          clearStorageItems('fingerprint_');
          break;
        case 'audit':
          localStorage.removeItem('audit_logs');
          break;
      }

      await loadDataSummary();

      // Log da limpeza
      await auditLogger.logEvent('data_cleanup', `Usuário limpou dados: ${dataType}`, {
        dataType,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasOptedOut) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              Opt-out Ativo
            </h3>
            <p className="text-green-700">
              Você optou por não compartilhar dados. Seus dados foram removidos do sistema.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">O que isso significa:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Não coletamos fingerprint do seu dispositivo</li>
            <li>• Não armazenamos dados de navegação</li>
            <li>• Não criamos perfil de uso</li>
            <li>• Apenas dados essenciais para funcionamento são mantidos</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Controles de Privacidade
        </h2>
        <p className="text-gray-600">
          Gerencie suas preferências de privacidade e visualize os dados coletados.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'preferences', label: 'Preferências' },
            { id: 'data', label: 'Meus Dados' },
            { id: 'export', label: 'Exportar/Limpar' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'preferences' && (
              <PreferencesTab
                consent={consent}
                onPreferenceChange={handlePreferenceChange}
                onOptOut={() => setShowConfirmOptOut(true)}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'data' && (
              <DataTab
                dataSummary={dataSummary}
                isLoading={isLoading}
                onRefresh={loadDataSummary}
              />
            )}

            {activeTab === 'export' && (
              <ExportTab
                onExport={exportUserData}
                onClearData={clearSpecificData}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal de confirmação de opt-out */}
      <AnimatePresence>
        {showConfirmOptOut && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmar Opt-out
                  </h3>
                  <p className="text-gray-600">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Ao confirmar, todos os seus dados serão removidos permanentemente:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Fingerprint do dispositivo</li>
                  <li>• Histórico de sessões</li>
                  <li>• Dados de navegação</li>
                  <li>• Carrinho de compras</li>
                  <li>• Logs de atividade</li>
                </ul>
                <p className="text-sm text-red-600">
                  <strong>Atenção:</strong> Você precisará aceitar novamente os termos 
                  para usar o sistema no futuro.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmOptOut(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleOptOut}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                >
                  {isLoading ? 'Processando...' : 'Confirmar Opt-out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Tab de preferências
 */
const PreferencesTab: React.FC<{
  consent: ConsentData | null;
  onPreferenceChange: (preference: keyof ConsentData, value: boolean) => void;
  onOptOut: () => void;
  isLoading: boolean;
}> = ({ consent, onPreferenceChange, onOptOut, isLoading }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Suas Preferências de Privacidade
      </h3>
      <p className="text-gray-600 mb-6">
        Controle quais dados você deseja compartilhar conosco. Você pode alterar 
        essas configurações a qualquer momento.
      </p>
    </div>

    {consent && (
      <div className="space-y-4">
        {/* Fingerprinting */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Identificação do Dispositivo</h4>
            <p className="text-sm text-gray-600 mt-1">
              Permite identificar seu dispositivo para segurança e prevenção de fraudes.
            </p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={consent.fingerprinting}
              onChange={(e) => onPreferenceChange('fingerprinting', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>
        </div>

        {/* Analytics */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Análise de Uso</h4>
            <p className="text-sm text-gray-600 mt-1">
              Nos ajuda a melhorar o sistema analisando como você o utiliza.
            </p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) => onPreferenceChange('analytics', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>
        </div>

        {/* Marketing */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Marketing e Personalização</h4>
            <p className="text-sm text-gray-600 mt-1">
              Permite personalizar ofertas e comunicações baseadas em suas preferências.
            </p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(e) => onPreferenceChange('marketing', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>
        </div>

        {/* Funcional (sempre ativo) */}
        <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Cookies Funcionais</h4>
            <p className="text-sm text-gray-600 mt-1">
              Necessários para o funcionamento básico do sistema. Não podem ser desabilitados.
            </p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="h-4 w-4 text-gray-400 border-gray-300 rounded"
            />
          </label>
        </div>
      </div>
    )}

    {/* Zona de perigo */}
    <div className="border-t border-gray-200 pt-6">
      <h4 className="text-lg font-semibold text-red-900 mb-2">Zona de Perigo</h4>
      <p className="text-gray-600 mb-4">
        Ações irreversíveis que afetam todos os seus dados.
      </p>
      
      <button
        onClick={onOptOut}
        disabled={isLoading}
        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
      >
        Opt-out Completo (Remover Todos os Dados)
      </button>
    </div>
  </div>
);

/**
 * Tab de dados
 */
const DataTab: React.FC<{
  dataSummary: DataSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
}> = ({ dataSummary, isLoading, onRefresh }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-900">
        Resumo dos Seus Dados
      </h3>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isLoading ? 'Carregando...' : 'Atualizar'}
      </button>
    </div>

    {dataSummary && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Sessões Ativas</h4>
          <p className="text-2xl font-bold text-blue-600">{dataSummary.sessions}</p>
          <p className="text-sm text-gray-500">Sessões armazenadas</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Eventos de Auditoria</h4>
          <p className="text-2xl font-bold text-green-600">{dataSummary.auditEvents}</p>
          <p className="text-sm text-gray-500">Registros de atividade</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Fingerprints</h4>
          <p className="text-2xl font-bold text-purple-600">{dataSummary.fingerprints}</p>
          <p className="text-sm text-gray-500">Identificações do dispositivo</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Itens no Carrinho</h4>
          <p className="text-2xl font-bold text-orange-600">{dataSummary.cartItems}</p>
          <p className="text-sm text-gray-500">Produtos salvos</p>
        </div>

        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Informações Adicionais</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Última Atividade:</span>
              <p className="font-medium">
                {dataSummary.lastActivity 
                  ? dataSummary.lastActivity.toLocaleString()
                  : 'Nunca'
                }
              </p>
            </div>
            <div>
              <span className="text-gray-500">Tamanho dos Dados:</span>
              <p className="font-medium">{dataSummary.dataSize}</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

/**
 * Tab de exportação
 */
const ExportTab: React.FC<{
  onExport: () => void;
  onClearData: (dataType: string) => void;
  isLoading: boolean;
}> = ({ onExport, onClearData, isLoading }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Exportar e Limpar Dados
      </h3>
      <p className="text-gray-600">
        Baixe uma cópia dos seus dados ou remova categorias específicas.
      </p>
    </div>

    {/* Exportar dados */}
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Exportar Todos os Dados</h4>
      <p className="text-sm text-gray-600 mb-4">
        Baixe um arquivo JSON com todos os dados que temos sobre você.
      </p>
      <button
        onClick={onExport}
        disabled={isLoading}
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isLoading ? 'Exportando...' : 'Baixar Meus Dados'}
      </button>
    </div>

    {/* Limpar dados específicos */}
    <div className="bg-yellow-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Limpar Dados Específicos</h4>
      <p className="text-sm text-gray-600 mb-4">
        Remova categorias específicas de dados. Esta ação não pode ser desfeita.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onClearData('sessions')}
          disabled={isLoading}
          className="bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 text-sm"
        >
          Limpar Sessões
        </button>
        <button
          onClick={() => onClearData('cart')}
          disabled={isLoading}
          className="bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 text-sm"
        >
          Limpar Carrinho
        </button>
        <button
          onClick={() => onClearData('fingerprints')}
          disabled={isLoading}
          className="bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 text-sm"
        >
          Limpar Fingerprints
        </button>
        <button
          onClick={() => onClearData('audit')}
          disabled={isLoading}
          className="bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 text-sm"
        >
          Limpar Logs
        </button>
      </div>
    </div>
  </div>
);

/**
 * Funções auxiliares
 */
function countStorageItems(prefix: string): number {
  return Object.keys(localStorage).filter(key => key.startsWith(prefix)).length;
}

async function countAuditEvents(): Promise<number> {
  try {
    const { events } = await auditLogger.queryEvents({ limit: 10000 });
    return events.length;
  } catch {
    return 0;
  }
}

function getCartItemsCount(): number {
  try {
    const cart = localStorage.getItem('digimenu-cart');
    if (cart) {
      const parsed = JSON.parse(cart);
      return parsed.state?.items?.length || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

function getLastActivity(): Date | null {
  try {
    const keys = Object.keys(localStorage);
    let lastActivity: Date | null = null;

    keys.forEach(key => {
      if (key.startsWith('session_') || key.startsWith('audit_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const timestamp = new Date(parsed.lastActivity || parsed.timestamp);
            if (!lastActivity || timestamp > lastActivity) {
              lastActivity = timestamp;
            }
          }
        } catch {
          // Ignora erros de parsing
        }
      }
    });

    return lastActivity;
  } catch {
    return null;
  }
}

function calculateDataSize(): string {
  try {
    let totalSize = 0;
    
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key) || '';
      totalSize += key.length + value.length;
    });

    // Converte para KB/MB
    if (totalSize < 1024) {
      return `${totalSize} bytes`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch {
    return 'Desconhecido';
  }
}

function clearStorageItems(prefix: string): void {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  });
}

async function collectUserData(): Promise<any> {
  const userData: any = {
    exportDate: new Date().toISOString(),
    consent: null,
    sessions: [],
    auditEvents: [],
    fingerprints: [],
    cart: null,
    summary: {
      totalDataPoints: 0,
      categories: []
    }
  };

  try {
    // Consentimento
    const consent = localStorage.getItem('privacy_consent');
    if (consent) {
      userData.consent = JSON.parse(consent);
    }

    // Sessões
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('session_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            userData.sessions.push(JSON.parse(data));
          }
        } catch {
          // Ignora erros
        }
      }
    });

    // Eventos de auditoria
    const { events } = await auditLogger.queryEvents({ limit: 1000 });
    userData.auditEvents = events;

    // Fingerprints
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('fingerprint_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            userData.fingerprints.push(JSON.parse(data));
          }
        } catch {
          // Ignora erros
        }
      }
    });

    // Carrinho
    const cart = localStorage.getItem('digimenu-cart');
    if (cart) {
      userData.cart = JSON.parse(cart);
    }

    // Resumo
    userData.summary.totalDataPoints = 
      userData.sessions.length + 
      userData.auditEvents.length + 
      userData.fingerprints.length + 
      (userData.cart ? 1 : 0);

    userData.summary.categories = [
      { name: 'Sessões', count: userData.sessions.length },
      { name: 'Eventos de Auditoria', count: userData.auditEvents.length },
      { name: 'Fingerprints', count: userData.fingerprints.length },
      { name: 'Carrinho', count: userData.cart ? 1 : 0 }
    ];

  } catch (error) {
    console.error('Erro ao coletar dados do usuário:', error);
  }

  return userData;
}

export default PrivacyControls;