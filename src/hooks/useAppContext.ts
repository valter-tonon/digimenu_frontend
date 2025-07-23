'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type AppContextData = {
  storeId: string | null;
  tableId: string | null;
  isDelivery: boolean;
  storeName?: string;
  storeData?: any;
  tableData?: any;
};

export type ValidationError = 
  | 'RESTAURANT_NOT_FOUND'
  | 'TABLE_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'INVALID_LINK';

export type AppContextState = {
  data: AppContextData;
  isLoading: boolean;
  error: ValidationError | null;
  isValid: boolean;
};

// Função para validar loja via API (mockada por enquanto)
const validateStore = async (storeId: string): Promise<{ valid: boolean; error?: ValidationError; data?: any }> => {
  try {
    // TODO: Implementar chamada real à API
    // const response = await fetch(`/api/stores/${storeId}`);
    // if (!response.ok) {
    //   return { valid: false, error: 'RESTAURANT_NOT_FOUND' };
    // }
    // const data = await response.json();
    
    // Por enquanto, simular validação
    if (storeId && storeId.length >= 10) {
      return { valid: true, data: { name: `Restaurante ${storeId.slice(-4)}` } };
    }
    return { valid: false, error: 'RESTAURANT_NOT_FOUND' };
  } catch (error) {
    console.error('Erro ao validar loja:', error);
    return { valid: false, error: 'RESTAURANT_NOT_FOUND' };
  }
};

// Função para validar mesa via API (mockada por enquanto)
const validateTable = async (storeId: string, tableId: string): Promise<{ valid: boolean; error?: ValidationError; data?: any }> => {
  try {
    // TODO: Implementar chamada real à API
    // const response = await fetch(`/api/stores/${storeId}/tables/${tableId}`);
    // if (!response.ok) {
    //   return { valid: false, error: 'TABLE_NOT_FOUND' };
    // }
    // const data = await response.json();
    
    // Por enquanto, simular validação
    if (storeId && tableId && tableId.length >= 10) {
      return { valid: true, data: { number: `Mesa ${tableId.slice(-4)}` } };
    }
    return { valid: false, error: 'TABLE_NOT_FOUND' };
  } catch (error) {
    console.error('Erro ao validar mesa:', error);
    return { valid: false, error: 'TABLE_NOT_FOUND' };
  }
};

export function useAppContext(): AppContextState & {
  initializeFromParams: (params: { store?: string; table?: string; isDelivery?: string }) => Promise<void>;
  clearContext: () => void;
  updateContext: (updates: Partial<AppContextData>) => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState<AppContextState>({
    data: {
      storeId: null,
      tableId: null,
      isDelivery: false,
    },
    isLoading: true,
    error: null,
    isValid: false,
  });

  // Função para salvar no localStorage
  const saveToStorage = useCallback((data: AppContextData) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Salvar dados persistentes no localStorage
      if (data.storeId) {
        localStorage.setItem('digimenu_store_id', data.storeId);
      }
      if (data.storeName) {
        localStorage.setItem('digimenu_store_name', data.storeName);
      }
      if (data.storeData) {
        localStorage.setItem('digimenu_store_data', JSON.stringify(data.storeData));
      }
      
      // Salvar dados temporários no sessionStorage
      if (data.tableId) {
        sessionStorage.setItem('digimenu_table_id', data.tableId);
      }
      if (data.tableData) {
        sessionStorage.setItem('digimenu_table_data', JSON.stringify(data.tableData));
      }
      sessionStorage.setItem('digimenu_is_delivery', data.isDelivery.toString());
    } catch (error) {
      console.error('Erro ao salvar no storage:', error);
    }
  }, []);

  // Função para carregar do storage
  const loadFromStorage = useCallback((): AppContextData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const storeId = localStorage.getItem('digimenu_store_id');
      const storeName = localStorage.getItem('digimenu_store_name');
      const storeDataStr = localStorage.getItem('digimenu_store_data');
      const tableId = sessionStorage.getItem('digimenu_table_id');
      const tableDataStr = sessionStorage.getItem('digimenu_table_data');
      const isDeliveryStr = sessionStorage.getItem('digimenu_is_delivery');
      
      if (!storeId) return null;
      
      return {
        storeId,
        tableId,
        isDelivery: isDeliveryStr === 'true',
        storeName: storeName || undefined,
        storeData: storeDataStr ? JSON.parse(storeDataStr) : undefined,
        tableData: tableDataStr ? JSON.parse(tableDataStr) : undefined,
      };
    } catch (error) {
      console.error('Erro ao carregar do storage:', error);
      return null;
    }
  }, []);

  // Função para limpar contexto
  const clearContext = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('digimenu_store_id');
      localStorage.removeItem('digimenu_store_name');
      localStorage.removeItem('digimenu_store_data');
      sessionStorage.removeItem('digimenu_table_id');
      sessionStorage.removeItem('digimenu_table_data');
      sessionStorage.removeItem('digimenu_is_delivery');
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
    
    setState({
      data: {
        storeId: null,
        tableId: null,
        isDelivery: false,
      },
      isLoading: false,
      error: null,
      isValid: false,
    });
  }, []);

  // Função para atualizar contexto
  const updateContext = useCallback((updates: Partial<AppContextData>) => {
    setState(prev => {
      const newData = { ...prev.data, ...updates };
      saveToStorage(newData);
      return {
        ...prev,
        data: newData,
      };
    });
  }, [saveToStorage]);

  // Função para inicializar a partir dos parâmetros da URL
  const initializeFromParams = useCallback(async (params: { store?: string; table?: string; isDelivery?: string }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { store, table, isDelivery } = params;
    
    // Se há parâmetros na URL, validar e salvar, depois limpar a URL
    if (store || table || isDelivery) {
      if (!store) {
        setState({
          data: { storeId: null, tableId: null, isDelivery: false },
          isLoading: false,
          error: 'INVALID_LINK',
          isValid: false,
        });
        router.push('/404-invalid');
        return;
      }

      try {
        // Validar loja
        const storeValidation = await validateStore(store);
        if (!storeValidation.valid) {
          setState({
            data: { storeId: null, tableId: null, isDelivery: false },
            isLoading: false,
            error: storeValidation.error || 'RESTAURANT_NOT_FOUND',
            isValid: false,
          });
          router.push('/404-restaurant');
          return;
        }

        // Se tem mesa, validar mesa
        if (table) {
          const tableValidation = await validateTable(store, table);
          if (!tableValidation.valid) {
            setState({
              data: { storeId: store, tableId: null, isDelivery: false },
              isLoading: false,
              error: tableValidation.error || 'TABLE_NOT_FOUND',
              isValid: false,
            });
            router.push('/404-table');
            return;
          }

          // Contexto válido com mesa
          const contextData: AppContextData = {
            storeId: store,
            tableId: table,
            isDelivery: false,
            storeName: storeValidation.data?.name,
            storeData: storeValidation.data,
            tableData: tableValidation.data,
          };

          saveToStorage(contextData);
          setState({
            data: contextData,
            isLoading: false,
            error: null,
            isValid: true,
          });
        } else {
          // Contexto válido para delivery
          const contextData: AppContextData = {
            storeId: store,
            tableId: null,
            isDelivery: isDelivery === 'true',
            storeName: storeValidation.data?.name,
            storeData: storeValidation.data,
          };

          saveToStorage(contextData);
          setState({
            data: contextData,
            isLoading: false,
            error: null,
            isValid: true,
          });
        }
        
        // Limpar parâmetros da URL para ter uma URL limpa
        console.log('useAppContext - Redirecionando para URL limpa: /menu');
        router.replace('/menu');
        
      } catch (error) {
        console.error('Erro na validação:', error);
        setState({
          data: { storeId: null, tableId: null, isDelivery: false },
          isLoading: false,
          error: 'INVALID_LINK',
          isValid: false,
        });
        router.push('/404-invalid');
      }
      return;
    }
    
    // Se não há parâmetros na URL, tentar carregar do storage
    const storedData = loadFromStorage();
    if (storedData && storedData.storeId) {
      console.log('useAppContext - Carregando dados do storage:', storedData);
      setState({
        data: storedData,
        isLoading: false,
        error: null,
        isValid: true,
      });
    } else {
      // Se não há dados no storage e não há parâmetros, redirecionar para 404-invalid
      console.log('useAppContext - Nenhum dado encontrado, redirecionando para 404-invalid');
      setState({
        data: { storeId: null, tableId: null, isDelivery: false },
        isLoading: false,
        error: 'INVALID_LINK',
        isValid: false,
      });
      router.push('/404-invalid');
    }
  }, [router, saveToStorage, loadFromStorage]);

  // Efeito para inicializar a partir do storage ou URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar se há parâmetros na URL
    const store = searchParams?.get('store');
    const table = searchParams?.get('table');
    const isDelivery = searchParams?.get('isDelivery');

    console.log('useAppContext - useEffect - Parâmetros da URL:', { store, table, isDelivery });
    console.log('useAppContext - useEffect - searchParams.toString():', searchParams?.toString());

    // Se há parâmetros na URL, sempre processar (mesmo que haja dados no storage)
    if (store || table || isDelivery) {
      console.log('useAppContext - useEffect - Processando parâmetros da URL');
      initializeFromParams({ store: store || undefined, table: table || undefined, isDelivery: isDelivery || undefined });
      return;
    }

    // Se não há parâmetros na URL, tentar carregar do storage
    const storedData = loadFromStorage();
    if (storedData && storedData.storeId) {
      console.log('useAppContext - useEffect - Carregando dados do storage:', storedData);
      setState({
        data: storedData,
        isLoading: false,
        error: null,
        isValid: true,
      });
    } else {
      console.log('useAppContext - useEffect - Nenhum dado encontrado');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [searchParams, loadFromStorage, initializeFromParams]);

  return {
    ...state,
    initializeFromParams,
    clearContext,
    updateContext,
  };
} 