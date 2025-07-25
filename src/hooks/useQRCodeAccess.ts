/**
 * Hook para processar acesso via QR Code
 * 
 * Processa parâmetros de URL do QR Code e inicializa sessão contextual
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export interface QRCodeAccessData {
  storeId: string;
  tableId?: string;
  isDelivery: boolean;
}

export interface TableStatus {
  id: string;
  isActive: boolean;
  isOccupied: boolean;
  currentSessions: number;
  maxSessions: number;
  storeStatus: 'open' | 'closed' | 'busy';
}

export interface QRCodeAccessState {
  isProcessing: boolean;
  isSuccess: boolean;
  error: string | null;
  accessData: QRCodeAccessData | null;
}

export const useQRCodeAccess = () => {
  const [state, setState] = useState<QRCodeAccessState>({
    isProcessing: false,
    isSuccess: false,
    error: null,
    accessData: null
  });

  const { initializeSession, session } = useAuth();
  const router = useRouter();

  /**
   * Processa acesso via QR Code baseado nos parâmetros da URL
   */
  const processQRCodeAccess = async (searchParams?: URLSearchParams): Promise<void> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Usa parâmetros fornecidos ou da URL atual
      const params = searchParams || new URLSearchParams(window.location.search);
      const accessData = parseQRCodeParams(params);

      if (!accessData) {
        throw new Error('Parâmetros de acesso inválidos');
      }

      setState(prev => ({ ...prev, accessData }));

      // Valida contexto da mesa/loja
      await validateAccess(accessData);

      // Inicializa sessão contextual
      await initializeSession({
        storeId: accessData.storeId,
        tableId: accessData.tableId,
        isDelivery: accessData.isDelivery
      });

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        isSuccess: true 
      }));

      // Limpa parâmetros da URL por segurança
      cleanupURL();

      console.log('Acesso via QR Code processado com sucesso:', accessData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage 
      }));

      console.error('Erro ao processar acesso via QR Code:', error);
      
      // Redireciona para página de erro apropriada
      handleAccessError(errorMessage);
    }
  };

  /**
   * Processa automaticamente na montagem do componente
   */
  const processCurrentURL = async (): Promise<void> => {
    const params = new URLSearchParams(window.location.search);
    
    // Só processa se houver parâmetros de QR Code
    if (params.has('store') || params.has('table')) {
      await processQRCodeAccess(params);
    }
  };

  /**
   * Extrai dados do QR Code dos parâmetros da URL
   */
  const parseQRCodeParams = (params: URLSearchParams): QRCodeAccessData | null => {
    const storeId = params.get('store');
    const tableId = params.get('table');
    const isDelivery = params.get('isDelivery') === 'true';

    if (!storeId) {
      return null;
    }

    return {
      storeId,
      tableId: tableId || undefined,
      isDelivery
    };
  };

  /**
   * Valida se o acesso é permitido
   */
  const validateAccess = async (accessData: QRCodeAccessData): Promise<void> => {
    // Valida loja
    const storeStatus = await validateStore(accessData.storeId);
    if (storeStatus.status === 'closed') {
      throw new Error('Restaurante está fechado no momento');
    }

    // Valida mesa se especificada
    if (accessData.tableId) {
      const tableStatus = await validateTable(accessData.storeId, accessData.tableId);
      
      if (!tableStatus.isActive) {
        throw new Error('Mesa não está disponível');
      }

      if (tableStatus.currentSessions >= tableStatus.maxSessions) {
        throw new Error('Mesa atingiu o limite máximo de usuários');
      }
    }

    // Validações adicionais baseadas no tipo de acesso
    if (accessData.isDelivery) {
      await validateDeliveryAccess(accessData.storeId);
    } else {
      await validateTableAccess(accessData.storeId, accessData.tableId);
    }
  };

  /**
   * Valida status da loja
   */
  const validateStore = async (storeId: string): Promise<{
    id: string;
    status: 'open' | 'closed' | 'busy';
    isOpen: boolean;
  }> => {
    try {
      // Importa dinamicamente para evitar dependência circular
      const { tableValidationService } = await import('../services/tableValidation');
      const storeStatus = await tableValidationService.validateStoreStatus(storeId);
      
      return {
        id: storeId,
        status: storeStatus.status,
        isOpen: storeStatus.isOpen
      };
    } catch (error) {
      throw new Error('Erro ao validar loja');
    }
  };

  /**
   * Valida status da mesa
   */
  const validateTable = async (storeId: string, tableId: string): Promise<TableStatus> => {
    try {
      // Importa dinamicamente para evitar dependência circular
      const { tableValidationService } = await import('../services/tableValidation');
      const validation = await tableValidationService.validateTableAccess(storeId, tableId);
      
      if (!validation.isValid) {
        throw new Error(validation.reason || 'Mesa não disponível');
      }

      return {
        id: tableId,
        isActive: validation.table?.isActive || false,
        isOccupied: validation.table?.isOccupied || false,
        currentSessions: validation.table?.currentSessions || 0,
        maxSessions: validation.table?.maxSessions || 10,
        storeStatus: validation.storeStatus
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao validar mesa');
    }
  };

  /**
   * Valida acesso para delivery
   */
  const validateDeliveryAccess = async (storeId: string): Promise<void> => {
    try {
      // Verifica se a loja aceita delivery
      // const response = await fetch(`/api/stores/${storeId}/delivery-settings`);
      // const settings = await response.json();
      
      // if (!settings.acceptsDelivery) {
      //   throw new Error('Loja não aceita delivery');
      // }

      // Mock para desenvolvimento
      console.log('Validando acesso para delivery:', storeId);
    } catch (error) {
      throw new Error('Delivery não disponível para esta loja');
    }
  };

  /**
   * Valida acesso para mesa
   */
  const validateTableAccess = async (storeId: string, tableId?: string): Promise<void> => {
    if (!tableId) {
      throw new Error('Mesa não especificada para acesso presencial');
    }

    try {
      // Validações específicas para mesa
      console.log('Validando acesso para mesa:', { storeId, tableId });
    } catch (error) {
      throw new Error('Erro ao validar acesso à mesa');
    }
  };

  /**
   * Remove parâmetros da URL após processamento
   */
  const cleanupURL = (): void => {
    try {
      const url = new URL(window.location.href);
      url.search = ''; // Remove todos os parâmetros
      
      // Atualiza URL sem recarregar a página
      window.history.replaceState({}, '', url.pathname);
    } catch (error) {
      console.warn('Erro ao limpar URL:', error);
    }
  };

  /**
   * Trata erros de acesso redirecionando para páginas apropriadas
   */
  const handleAccessError = (errorMessage: string): void => {
    let errorType = 'invalid-access';

    if (errorMessage.includes('fechado')) {
      errorType = 'restaurant-closed';
    } else if (errorMessage.includes('Mesa')) {
      errorType = 'table-unavailable';
    } else if (errorMessage.includes('Loja')) {
      errorType = 'store-not-found';
    }

    // Redireciona após um pequeno delay para mostrar o erro
    setTimeout(() => {
      router.push(`/error?type=${errorType}&message=${encodeURIComponent(errorMessage)}`);
    }, 2000);
  };

  /**
   * Reprocessa acesso (útil para retry)
   */
  const retryAccess = async (): Promise<void> => {
    setState(prev => ({ 
      ...prev, 
      error: null, 
      isSuccess: false 
    }));
    
    await processCurrentURL();
  };

  /**
   * Verifica se há parâmetros de QR Code na URL atual
   */
  const hasQRCodeParams = (): boolean => {
    const params = new URLSearchParams(window.location.search);
    return params.has('store') || params.has('table');
  };

  /**
   * Gera URL de QR Code para teste
   */
  const generateQRCodeURL = (data: QRCodeAccessData): string => {
    const params = new URLSearchParams();
    params.set('store', data.storeId);
    
    if (data.tableId) {
      params.set('table', data.tableId);
    }
    
    if (data.isDelivery) {
      params.set('isDelivery', 'true');
    }

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  return {
    // State
    isProcessing: state.isProcessing,
    isSuccess: state.isSuccess,
    error: state.error,
    accessData: state.accessData,
    hasSession: !!session,

    // Actions
    processQRCodeAccess,
    processCurrentURL,
    retryAccess,
    hasQRCodeParams,
    generateQRCodeURL,

    // Utils
    parseQRCodeParams,
    cleanupURL
  };
};

// Hook para uso automático em páginas
export const useAutoQRCodeAccess = () => {
  const qrAccess = useQRCodeAccess();

  useEffect(() => {
    // Processa automaticamente se houver parâmetros na URL
    if (qrAccess.hasQRCodeParams()) {
      qrAccess.processCurrentURL();
    }
  }, []);

  return qrAccess;
};