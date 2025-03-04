'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryName?: string;
  observation?: string;
  additionals?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface MenuContextType {
  tableId: string | null;
  storeSlug: string | null;
  isCartOpen: boolean;
  cartItems: CartItem[];
  setTableId: (tableId: string | null) => void;
  setStoreSlug: (storeSlug: string | null) => void;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  formatPrice: (price: number) => string;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Função para formatar preço
  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  // Função para adicionar item ao carrinho
  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      // Verificar se o item já existe no carrinho
      const existingItemIndex = prevItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Se já existe, aumenta a quantidade
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += item.quantity;
        return updatedItems;
      } else {
        // Se não existe, adiciona novo item
        return [...prevItems, item];
      }
    });
  };

  // Função para remover item do carrinho
  const removeFromCart = async (itemId: string): Promise<void> => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    return Promise.resolve();
  };

  // Função para atualizar quantidade de um item
  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Função para limpar o carrinho
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <MenuContext.Provider
      value={{
        tableId,
        storeSlug,
        isCartOpen,
        cartItems,
        setTableId,
        setStoreSlug,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        formatPrice
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