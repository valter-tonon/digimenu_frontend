'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

interface OpeningHours {
  opens_at: string;
  closes_at: string;
  is_open: boolean;
}

interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
}

interface Store {
  id?: string;
  name?: string;
  logo?: string;
  isOpen?: boolean;
  openingHours?: OpeningHours;
}

interface StoreStatusContextType {
  // Novo formato simplificado
  isStoreOpen: boolean;
  storeId?: string;
  openingHours?: OpeningHours;
  setStoreStatus: (isOpen: boolean) => void;
  refreshStatus: () => void;
  
  // Compatibilidade com testes e componentes existentes
  store: Store | null;
  isOpen: boolean;
  deliveryZones: DeliveryZone[];
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  loading: boolean;
  error: string | null;
  refreshStoreStatus: () => Promise<void>;
  isOffline: boolean;
  lastUpdated: Date | null;
  retryCount: number;
  maxRetries: number;
}

// Valores padrão para quando não há provider
const defaultContextValue: StoreStatusContextType = {
  // Formato simplificado
  isStoreOpen: true,
  setStoreStatus: () => {},
  refreshStatus: () => {},
  
  // Compatibilidade
  store: null,
  isOpen: true,
  deliveryZones: [],
  minimumOrder: 0,
  deliveryFee: 0,
  estimatedDeliveryTime: '',
  loading: false,
  error: null,
  refreshStoreStatus: async () => {},
  isOffline: false,
  lastUpdated: null,
  retryCount: 0,
  maxRetries: 3,
};

const StoreStatusContext = createContext<StoreStatusContextType>(defaultContextValue);

interface StoreStatusProviderProps {
  children: ReactNode;
  isStoreOpen?: boolean;
  storeId?: string;
  openingHours?: OpeningHours;
  initialStore?: {
    id?: string;
    name?: string;
    isOpen?: boolean;
    openingHours?: OpeningHours;
  };
  // Props adicionais para compatibilidade
  minimumOrderValue?: number;
  deliveryFee?: number;
  estimatedDeliveryTime?: string;
}

export function StoreStatusProvider({ 
  children, 
  isStoreOpen: initialIsOpen = true,
  storeId,
  openingHours,
  initialStore,
  minimumOrderValue = 0,
  deliveryFee: initialDeliveryFee = 0,
  estimatedDeliveryTime: initialEstimatedTime = '',
}: StoreStatusProviderProps) {
  // Estados principais
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(
    initialStore?.isOpen ?? initialIsOpen
  );
  const [currentOpeningHours, setCurrentOpeningHours] = useState<OpeningHours | undefined>(
    initialStore?.openingHours ?? openingHours
  );
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(
    initialStore?.id ?? storeId
  );
  
  // Estados de compatibilidade
  const [store, setStore] = useState<Store | null>(
    initialStore ? {
      id: initialStore.id,
      name: initialStore.name,
      isOpen: initialStore.isOpen ?? initialIsOpen,
      openingHours: initialStore.openingHours ?? openingHours,
    } : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const maxRetries = 3;

  // Atualizar estado quando as props mudarem
  useEffect(() => {
    if (initialStore?.isOpen !== undefined) {
      setIsStoreOpen(initialStore.isOpen);
    } else if (initialIsOpen !== undefined) {
      setIsStoreOpen(initialIsOpen);
    }
  }, [initialIsOpen, initialStore?.isOpen]);

  useEffect(() => {
    if (initialStore?.openingHours) {
      setCurrentOpeningHours(initialStore.openingHours);
    } else if (openingHours) {
      setCurrentOpeningHours(openingHours);
    }
  }, [openingHours, initialStore?.openingHours]);

  // Detectar estado offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const setStoreStatus = useCallback((isOpen: boolean) => {
    setIsStoreOpen(isOpen);
    setStore(prev => prev ? { ...prev, isOpen } : null);
  }, []);

  const refreshStatus = useCallback(() => {
    console.log('Refreshing store status...');
    setLastUpdated(new Date());
  }, []);

  const refreshStoreStatus = useCallback(async () => {
    if (isOffline) {
      setError('Você está offline. Verifique sua conexão.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Em uma implementação real, buscaria dados da API
      await new Promise(resolve => setTimeout(resolve, 100));
      setLastUpdated(new Date());
      setRetryCount(0);
    } catch (err) {
      setError('Erro ao atualizar status da loja');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  const value: StoreStatusContextType = {
    // Formato simplificado
    isStoreOpen,
    storeId: currentStoreId,
    openingHours: currentOpeningHours,
    setStoreStatus,
    refreshStatus,
    
    // Compatibilidade
    store,
    isOpen: isStoreOpen,
    deliveryZones: [],
    minimumOrder: minimumOrderValue,
    deliveryFee: initialDeliveryFee,
    estimatedDeliveryTime: initialEstimatedTime,
    loading,
    error,
    refreshStoreStatus,
    isOffline,
    lastUpdated,
    retryCount,
    maxRetries,
  };

  return (
    <StoreStatusContext.Provider value={value}>
      {children}
    </StoreStatusContext.Provider>
  );
}

export function useStoreStatus(): StoreStatusContextType {
  const context = useContext(StoreStatusContext);
  
  // Verificar se estamos usando valores padrão (sem provider)
  if (context === defaultContextValue) {
    console.warn(
      'useStoreStatus must be used within a StoreStatusProvider. Using default values.'
    );
  }
  
  return context;
} 