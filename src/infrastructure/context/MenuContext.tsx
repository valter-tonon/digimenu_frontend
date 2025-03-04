'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

interface MenuContextType {
  tableId: string | null;
  storeSlug: string | null;
  isCartOpen: boolean;
  setTableId: (tableId: string | null) => void;
  setStoreSlug: (storeSlug: string | null) => void;
  setIsCartOpen: (isOpen: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children, initialTableId, initialStoreSlug }: { 
  children: ReactNode;
  initialTableId?: string | null;
  initialStoreSlug?: string | null;
}) {
  const [tableId, setTableId] = useState<string | null>(initialTableId || null);
  const [storeSlug, setStoreSlug] = useState<string | null>(initialStoreSlug || null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  return (
    <MenuContext.Provider
      value={{
        tableId,
        storeSlug,
        isCartOpen,
        setTableId,
        setStoreSlug,
        setIsCartOpen
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu deve ser usado dentro de um MenuProvider');
  }
  return context;
} 