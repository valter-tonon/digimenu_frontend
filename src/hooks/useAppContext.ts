'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

// Função para validar mesa via API
const validateTable = async (storeId: string, tableId: string): Promise<{ valid: boolean; error?: ValidationError; data?: any }> => {
  try {
    // Buscar dados da mesa via API
    const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${baseURL}/tables/${tableId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Erro ao buscar mesa:', response.status, response.statusText);
      // Fallback para validação básica
      if (storeId && tableId && tableId.length >= 10) {
        return { valid: true, data: { identifier: `Mesa ${tableId.slice(-4)}` } };
      }
      return { valid: false, error: 'TABLE_NOT_FOUND' };
    }
    
    const tableData = await response.json();
    
    if (tableData.data && tableData.data.identifier) {
      return { 
        valid: true, 
        data: { 
          identifier: tableData.data.identifier,
          description: tableData.data.description,
          status: tableData.data.status
        } 
      };
    }
    
    // Fallback se não conseguir obter o identifier
    return { valid: true, data: { identifier: `Mesa ${tableId.slice(-4)}` } };
  } catch (error) {
    console.error('Erro ao validar mesa:', error);
    // Fallback para validação básica
    if (storeId && tableId && tableId.length >= 10) {
      return { valid: true, data: { identifier: `Mesa ${tableId.slice(-4)}` } };
    }
    return { valid: false, error: 'TABLE_NOT_FOUND' };
  }
};

export function useAppContext(searchParams?: URLSearchParams): AppContextState & {
  initializeFromParams: (params: { store?: string; table?: string; isDelivery?: string }) => Promise<void>;
  clearContext: () => void;
  updateContext: (updates: Partial<AppContextData>) => void;
} {
  const router = useRouter();
  
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
      
      // Salvar dados de sessão no sessionStorage
      if (data.tableId) {
        sessionStorage.setItem('digimenu_table_id', data.tableId);
      }
      sessionStorage.setItem('digimenu_is_delivery', data.isDelivery.toString());
      
      console.log('useAppContext - Dados salvos no storage:', data);
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
      const tableId = sessionStorage.getItem('digimenu_table_id');
      const isDelivery = sessionStorage.getItem('digimenu_is_delivery') === 'true';
      
      if (storeId) {
        const data: AppContextData = {
          storeId,
          tableId,
          isDelivery,
          storeName: storeName || undefined,
        };
        
        console.log('useAppContext - Carregando dados do storage:', data);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao carregar do storage:', error);
      return null;
    }
  }, []);

  // Função para limpar o contexto
  const clearContext = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('digimenu_store_id');
      localStorage.removeItem('digimenu_store_name');
      sessionStorage.removeItem('digimenu_table_id');
      sessionStorage.removeItem('digimenu_is_delivery');
      
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
      
      console.log('useAppContext - Contexto limpo');
    } catch (error) {
      console.error('Erro ao limpar contexto:', error);
    }
  }, []);

  // Função para inicializar a partir de parâmetros da URL
  const initializeFromParams = useCallback(async (params: { store?: string; table?: string; isDelivery?: string }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { store, table, isDelivery } = params;
    
    // Se temos parâmetros da URL, processar eles
    if (store || table || isDelivery) {
      if (!store) {
        console.log('useAppContext - Store não fornecida, redirecionando para /404-invalid');
        router.push('/404-invalid');
        return;
      }
      
      try {
        // Validar loja
        const storeValidation = await validateStore(store);
        if (!storeValidation.valid) {
          console.log('useAppContext - Loja inválida, redirecionando para /404-restaurant');
          router.push('/404-restaurant');
          return;
        }
        
        // Se temos mesa, validar ela
        if (table) {
          const tableValidation = await validateTable(store, table);
          if (!tableValidation.valid) {
            console.log('useAppContext - Mesa inválida, redirecionando para /404-table');
            router.push('/404-table');
            return;
          }
          
          // Salvar contexto para mesa
          const contextData: AppContextData = {
            storeId: store,
            tableId: table,
            isDelivery: false,
            storeName: storeValidation.data?.name,
            tableData: tableValidation.data,
          };
          
          saveToStorage(contextData);
          setState({
            data: contextData,
            isLoading: false,
            error: null,
            isValid: true,
          });
          
          console.log('useAppContext - Redirecionando para URL limpa: /menu');
          router.replace('/menu');
        } else {
          // Salvar contexto para delivery
          const contextData: AppContextData = {
            storeId: store,
            tableId: null,
            isDelivery: isDelivery === 'true',
            storeName: storeValidation.data?.name,
          };
          
          saveToStorage(contextData);
          setState({
            data: contextData,
            isLoading: false,
            error: null,
            isValid: true,
          });
          
          console.log('useAppContext - Redirecionando para URL limpa: /menu');
          router.replace('/menu');
        }
      } catch (error) {
        console.error('useAppContext - Erro ao processar parâmetros:', error);
        router.push('/404-invalid');
        return;
      }
      return;
    }
    
    // Se não temos parâmetros, tentar carregar do storage
    const storedData = loadFromStorage();
    if (storedData && storedData.storeId) {
      setState({
        data: storedData,
        isLoading: false,
        error: null,
        isValid: true,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [router, saveToStorage, loadFromStorage]);

  // Função para atualizar o contexto
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

  // Efeito principal para processar parâmetros da URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (searchParams) {
      const store = searchParams.get('store');
      const table = searchParams.get('table');
      const isDelivery = searchParams.get('isDelivery');

      console.log('useAppContext - useEffect - Parâmetros da URL:', { store, table, isDelivery });
      console.log('useAppContext - useEffect - searchParams.toString():', searchParams.toString());

      if (store || table || isDelivery) {
        console.log('useAppContext - useEffect - Processando parâmetros da URL');
        initializeFromParams({ store: store || undefined, table: table || undefined, isDelivery: isDelivery || undefined });
        return;
      }
    }

    // Se não temos parâmetros da URL, tentar carregar do storage
    const storedData = loadFromStorage();
    if (storedData && storedData.storeId) {
      setState({
        data: storedData,
        isLoading: false,
        error: null,
        isValid: true,
      });
    } else {
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