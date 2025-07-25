/**
 * Hook para gerenciar configurações da loja
 * 
 * Gerencia configurações de cadastro rápido, autenticação,
 * segurança e notificações da loja.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  StoreSettings, 
  StoreSettingsUpdate, 
  DEFAULT_STORE_SETTINGS,
  validateStoreSettings,
  SettingsValidationResult
} from '../types/store-settings';

export interface UseStoreSettingsReturn {
  settings: StoreSettings | null;
  isLoading: boolean;
  error: string | null;
  validation: SettingsValidationResult | null;
  
  // Actions
  loadSettings: (storeId: string) => Promise<void>;
  updateSettings: (updates: StoreSettingsUpdate) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  validateCurrentSettings: () => SettingsValidationResult;
  
  // Getters específicos
  canOrderAsGuest: () => boolean;
  isQuickRegistrationEnabled: () => boolean;
  getSessionTimeout: (type: 'table' | 'delivery') => number;
  getRateLimit: (type: keyof StoreSettings['security']['rateLimits']) => number;
}

export const useStoreSettings = (storeId?: string): UseStoreSettingsReturn => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<SettingsValidationResult | null>(null);

  /**
   * Carrega configurações da loja
   */
  const loadSettings = useCallback(async (targetStoreId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Em produção, fazer chamada para API
      // const response = await fetch(`/api/stores/${targetStoreId}/settings`);
      // if (!response.ok) throw new Error('Erro ao carregar configurações');
      // const data = await response.json();

      // Mock para desenvolvimento
      const mockSettings: StoreSettings = {
        id: `settings_${targetStoreId}`,
        storeId: targetStoreId,
        ...DEFAULT_STORE_SETTINGS,
        updatedAt: new Date()
      };

      setSettings(mockSettings);
      
      // Valida configurações carregadas
      const validationResult = validateStoreSettings(mockSettings);
      setValidation(validationResult);

      console.log('Configurações da loja carregadas:', mockSettings);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualiza configurações da loja
   */
  const updateSettings = useCallback(async (updates: StoreSettingsUpdate): Promise<boolean> => {
    if (!settings) {
      setError('Nenhuma configuração carregada');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mescla atualizações com configurações existentes
      const updatedSettings: StoreSettings = {
        ...settings,
        ...updates,
        quickRegistration: {
          ...settings.quickRegistration,
          ...updates.quickRegistration
        },
        authentication: {
          ...settings.authentication,
          ...updates.authentication
        },
        security: {
          ...settings.security,
          ...updates.security,
          rateLimits: {
            ...settings.security.rateLimits,
            ...updates.security?.rateLimits
          }
        },
        notifications: {
          ...settings.notifications,
          ...updates.notifications,
          notificationChannels: {
            ...settings.notifications.notificationChannels,
            ...updates.notifications?.notificationChannels
          }
        },
        updatedAt: new Date()
      };

      // Valida antes de salvar
      const validationResult = validateStoreSettings(updatedSettings);
      if (!validationResult.isValid) {
        setError(`Configurações inválidas: ${validationResult.errors.join(', ')}`);
        setValidation(validationResult);
        return false;
      }

      // Em produção, fazer chamada para API
      // const response = await fetch(`/api/stores/${settings.storeId}/settings`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updatedSettings)
      // });
      // if (!response.ok) throw new Error('Erro ao salvar configurações');

      // Mock para desenvolvimento
      setSettings(updatedSettings);
      setValidation(validationResult);

      console.log('Configurações atualizadas:', updatedSettings);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      setError(errorMessage);
      console.error('Erro ao atualizar configurações:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  /**
   * Reseta configurações para padrões
   */
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    if (!settings) {
      setError('Nenhuma configuração carregada');
      return false;
    }

    const defaultSettings: StoreSettings = {
      id: settings.id,
      storeId: settings.storeId,
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: new Date()
    };

    return updateSettings(defaultSettings);
  }, [settings, updateSettings]);

  /**
   * Valida configurações atuais
   */
  const validateCurrentSettings = useCallback((): SettingsValidationResult => {
    if (!settings) {
      return {
        isValid: false,
        errors: ['Nenhuma configuração carregada'],
        warnings: []
      };
    }

    const result = validateStoreSettings(settings);
    setValidation(result);
    return result;
  }, [settings]);

  /**
   * Verifica se pode fazer pedidos como visitante
   */
  const canOrderAsGuest = useCallback((): boolean => {
    if (!settings) return false;
    
    return settings.authentication.allowGuestOrders && 
           !settings.authentication.requireAuthForCheckout;
  }, [settings]);

  /**
   * Verifica se cadastro rápido está habilitado
   */
  const isQuickRegistrationEnabled = useCallback((): boolean => {
    if (!settings) return false;
    
    return settings.quickRegistration.enabled;
  }, [settings]);

  /**
   * Obtém timeout de sessão por tipo
   */
  const getSessionTimeout = useCallback((type: 'table' | 'delivery'): number => {
    if (!settings) return type === 'table' ? 240 : 120; // Padrões
    
    return settings.authentication.sessionTimeoutMinutes[type];
  }, [settings]);

  /**
   * Obtém limite de rate limiting por tipo
   */
  const getRateLimit = useCallback((type: keyof StoreSettings['security']['rateLimits']): number => {
    if (!settings) {
      const defaults = DEFAULT_STORE_SETTINGS.security.rateLimits;
      return defaults[type];
    }
    
    return settings.security.rateLimits[type];
  }, [settings]);

  // Carrega configurações automaticamente se storeId for fornecido
  useEffect(() => {
    if (storeId && !settings) {
      loadSettings(storeId);
    }
  }, [storeId, settings, loadSettings]);

  return {
    settings,
    isLoading,
    error,
    validation,
    
    // Actions
    loadSettings,
    updateSettings,
    resetToDefaults,
    validateCurrentSettings,
    
    // Getters
    canOrderAsGuest,
    isQuickRegistrationEnabled,
    getSessionTimeout,
    getRateLimit
  };
};

/**
 * Hook para configurações específicas de cadastro rápido
 */
export const useQuickRegistrationSettings = (storeId?: string) => {
  const { settings, updateSettings, isLoading, error } = useStoreSettings(storeId);

  const updateQuickRegistration = useCallback(async (updates: Partial<StoreSettings['quickRegistration']>) => {
    return updateSettings({ quickRegistration: updates });
  }, [updateSettings]);

  const toggleQuickRegistration = useCallback(async (enabled: boolean) => {
    return updateQuickRegistration({ enabled });
  }, [updateQuickRegistration]);

  const setRequiredFields = useCallback(async (fields: {
    requirePhone?: boolean;
    requireName?: boolean;
    requireEmail?: boolean;
  }) => {
    return updateQuickRegistration(fields);
  }, [updateQuickRegistration]);

  return {
    settings: settings?.quickRegistration || null,
    isLoading,
    error,
    updateQuickRegistration,
    toggleQuickRegistration,
    setRequiredFields,
    isEnabled: settings?.quickRegistration.enabled || false
  };
};

/**
 * Hook para configurações de autenticação
 */
export const useAuthenticationSettings = (storeId?: string) => {
  const { settings, updateSettings, isLoading, error } = useStoreSettings(storeId);

  const updateAuthentication = useCallback(async (updates: Partial<StoreSettings['authentication']>) => {
    return updateSettings({ authentication: updates });
  }, [updateSettings]);

  const toggleGuestOrders = useCallback(async (allow: boolean) => {
    return updateAuthentication({ allowGuestOrders: allow });
  }, [updateAuthentication]);

  const setSessionTimeouts = useCallback(async (timeouts: {
    table?: number;
    delivery?: number;
  }) => {
    const current = settings?.authentication.sessionTimeoutMinutes || { table: 240, delivery: 120 };
    return updateAuthentication({
      sessionTimeoutMinutes: {
        ...current,
        ...timeouts
      }
    });
  }, [updateAuthentication, settings]);

  return {
    settings: settings?.authentication || null,
    isLoading,
    error,
    updateAuthentication,
    toggleGuestOrders,
    setSessionTimeouts,
    canOrderAsGuest: settings?.authentication.allowGuestOrders && !settings?.authentication.requireAuthForCheckout
  };
};