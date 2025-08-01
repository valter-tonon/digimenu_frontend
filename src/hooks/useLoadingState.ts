import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  [key: string]: boolean;
}

export interface LoadingStateManager {
  loading: LoadingState;
  isLoading: (key?: string) => boolean;
  setLoading: (key: string, state: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  clearAll: () => void;
  withLoading: <T>(key: string, asyncFn: () => Promise<T>) => Promise<T>;
}

/**
 * Hook for managing loading states across different contexts
 * Provides methods to track loading states for multiple operations
 */
export function useLoadingState(initialState: LoadingState = {}): LoadingStateManager {
  const [loading, setLoadingState] = useState<LoadingState>(initialState);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const isLoading = useCallback((key?: string): boolean => {
    if (!key) {
      return Object.values(loading).some(state => state);
    }
    return loading[key] || false;
  }, [loading]);

  const setLoading = useCallback((key: string, state: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: state
    }));

    // Clear any existing timeout for this key
    const existingTimeout = timeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsRef.current.delete(key);
    }
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const clearAll = useCallback(() => {
    setLoadingState({});
    
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  const withLoading = useCallback(async <T>(
    key: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      startLoading(key);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  return {
    loading,
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    clearAll,
    withLoading
  };
}

/**
 * Hook for managing loading state with automatic timeout
 */
export function useLoadingStateWithTimeout(
  initialState: LoadingState = {},
  defaultTimeout: number = 30000
): LoadingStateManager & {
  setLoadingWithTimeout: (key: string, state: boolean, timeout?: number) => void;
} {
  const manager = useLoadingState(initialState);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const setLoadingWithTimeout = useCallback((
    key: string, 
    state: boolean, 
    timeout: number = defaultTimeout
  ) => {
    manager.setLoading(key, state);

    if (state && timeout > 0) {
      // Set timeout to automatically stop loading
      const timeoutId = setTimeout(() => {
        manager.stopLoading(key);
        timeoutsRef.current.delete(key);
        console.warn(`Loading timeout for key "${key}" after ${timeout}ms`);
      }, timeout);

      timeoutsRef.current.set(key, timeoutId);
    } else {
      // Clear existing timeout
      const existingTimeout = timeoutsRef.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutsRef.current.delete(key);
      }
    }
  }, [manager, defaultTimeout]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return {
    ...manager,
    setLoadingWithTimeout
  };
}

/**
 * Hook for managing loading state with progress tracking
 */
export function useLoadingStateWithProgress(
  initialState: LoadingState = {}
): LoadingStateManager & {
  progress: { [key: string]: number };
  setProgress: (key: string, progress: number) => void;
  incrementProgress: (key: string, increment: number) => void;
  resetProgress: (key: string) => void;
} {
  const manager = useLoadingState(initialState);
  const [progress, setProgressState] = useState<{ [key: string]: number }>({});

  const setProgress = useCallback((key: string, progressValue: number) => {
    const normalizedProgress = Math.min(Math.max(progressValue, 0), 100);
    setProgressState(prev => ({
      ...prev,
      [key]: normalizedProgress
    }));

    // Automatically stop loading when progress reaches 100%
    if (normalizedProgress >= 100) {
      manager.stopLoading(key);
    }
  }, [manager]);

  const incrementProgress = useCallback((key: string, increment: number) => {
    setProgressState(prev => {
      const currentProgress = prev[key] || 0;
      const newProgress = Math.min(currentProgress + increment, 100);
      
      // Automatically stop loading when progress reaches 100%
      if (newProgress >= 100) {
        manager.stopLoading(key);
      }
      
      return {
        ...prev,
        [key]: newProgress
      };
    });
  }, [manager]);

  const resetProgress = useCallback((key: string) => {
    setProgressState(prev => ({
      ...prev,
      [key]: 0
    }));
  }, []);

  return {
    ...manager,
    progress,
    setProgress,
    incrementProgress,
    resetProgress
  };
}

/**
 * Common loading keys for consistent usage across the app
 */
export const LoadingKeys = {
  // API Operations
  FETCH_MENU: 'fetch_menu',
  FETCH_PRODUCTS: 'fetch_products',
  FETCH_CATEGORIES: 'fetch_categories',
  FETCH_STORE_STATUS: 'fetch_store_status',
  
  // Cart Operations
  ADD_TO_CART: 'add_to_cart',
  UPDATE_CART: 'update_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CLEAR_CART: 'clear_cart',
  
  // Checkout Operations
  VALIDATE_ADDRESS: 'validate_address',
  PROCESS_PAYMENT: 'process_payment',
  CREATE_ORDER: 'create_order',
  CONFIRM_ORDER: 'confirm_order',
  
  // User Operations
  LOGIN: 'login',
  REGISTER: 'register',
  UPDATE_PROFILE: 'update_profile',
  FETCH_ADDRESSES: 'fetch_addresses',
  SAVE_ADDRESS: 'save_address',
  
  // Image Operations
  UPLOAD_IMAGE: 'upload_image',
  LOAD_IMAGE: 'load_image',
  
  // Form Operations
  SUBMIT_FORM: 'submit_form',
  VALIDATE_FORM: 'validate_form',
  
  // Page Operations
  PAGE_LOAD: 'page_load',
  COMPONENT_LOAD: 'component_load',
  
  // Search Operations
  SEARCH: 'search',
  FILTER: 'filter',
  
  // Notification Operations
  SEND_NOTIFICATION: 'send_notification',
  
  // Generic Operations
  SAVE: 'save',
  DELETE: 'delete',
  UPDATE: 'update',
  REFRESH: 'refresh'
} as const;

export type LoadingKey = typeof LoadingKeys[keyof typeof LoadingKeys];

export default useLoadingState;