'use client';

import { createContext, useContext, ReactNode } from 'react';

interface StoreStatusContextType {
  isStoreOpen: boolean;
}

const StoreStatusContext = createContext<StoreStatusContextType | undefined>(undefined);

export function StoreStatusProvider({ 
  children, 
  isStoreOpen 
}: { 
  children: ReactNode;
  isStoreOpen: boolean;
}) {
  return (
    <StoreStatusContext.Provider value={{ isStoreOpen }}>
      {children}
    </StoreStatusContext.Provider>
  );
}

export function useStoreStatus() {
  const context = useContext(StoreStatusContext);
  if (context === undefined) {
    throw new Error('useStoreStatus must be used within a StoreStatusProvider');
  }
  return context;
} 