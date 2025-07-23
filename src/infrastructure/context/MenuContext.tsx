'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cart-store';

// =================== 1. Teste básico para validar o comportamento ==================
// Este código é apenas para mostrar como testaríamos este componente 
// Remove ou comente esta seção em produção
/*
// Exemplo de como este componente seria testado
function testMenuContext() {
  // Teste 1: Verificar se o contexto é inicializado corretamente
  const { cartItems, addToCart } = useMenu();
  expect(cartItems).toEqual([]);
  
  // Teste 2: Verificar se addToCart funciona
  const testItem = { 
    id: '1',
    name: 'Test Product',
    price: 10.0,
    quantity: 1
  };
  addToCart(testItem);
  
  // O estado deveria ser atualizado e o store também
  const { cartItems: updatedItems } = useMenu();
  expect(updatedItems.length).toBe(1);
  expect(updatedItems[0].name).toBe('Test Product');
  
  // Verificar se o store também foi atualizado
  const storeItems = useCartStore.getState().items;
  expect(storeItems.length).toBe(1);
}
*/
// =================== Fim do teste ===================

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
  
  // Flag para evitar loop infinito
  const isInitialized = useRef(false);
  
  // Referência ao store
  const store = useCartStore();
  
  // Este useEffect inicializa o contexto no store e sincroniza o carrinho
  useEffect(() => {
    if (!isInitialized.current && storeSlug) {
      // Definir o contexto (loja e mesa)
      store.setContext(storeSlug, tableId || undefined);
      
      // Sincronizar o carrinho (verificar TTL e recuperar itens)
      store.syncCart();
      
      isInitialized.current = true;
      console.log('Contexto inicializado e carrinho sincronizado:', { 
        storeSlug, 
        tableId,
        itemCount: store.items.length
      });
    }
  }, [store, storeSlug, tableId]);
  
  // Este useEffect garante que o carrinho seja sincronizado quando a página é recarregada
  useEffect(() => {
    // Sincronizar o carrinho quando o componente é montado
    if (storeSlug) {
      store.syncCart();
    }
    
    // Configurar o TTL padrão do carrinho (24 horas)
    store.setCartTTL(24);
    
    // Adicionar listener para sincronizar o carrinho quando a página é recarregada
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        store.syncCart();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [store, storeSlug]);

  // Função para formatar preço
  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  // Mapeamento dos itens do store para o formato esperado pelo contexto
  const mapStoreItemsToCartItems = (): CartItem[] => {
    return store.items.map(item => ({
      id: item.identify || item.id.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      observation: item.notes,
      additionals: item.additionals?.map(add => ({
        id: add.id.toString(),
        name: add.name,
        price: add.price
      }))
    }));
  };

  // Função para adicionar item ao carrinho
  const addToCart = (item: CartItem) => {
    // Usar apenas o store zustand
    store.addItem({
      productId: parseInt(item.id),
      identify: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.observation,
      additionals: item.additionals?.map(add => ({
        id: parseInt(add.id),
        name: add.name,
        price: add.price,
        quantity: 1
      }))
    });
  };

  // Função para remover item do carrinho
  const removeFromCart = async (itemId: string): Promise<void> => {
    // Remover apenas do store zustand
    const storeItem = store.items.find(item => item.id.toString() === itemId || item.identify === itemId);
    if (storeItem) {
      store.removeItem(storeItem.id);
    }
    
    return Promise.resolve();
  };

  // Função para atualizar quantidade de um item
  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    // Atualizar apenas no store zustand
    const storeItem = store.items.find(item => item.id.toString() === itemId || item.identify === itemId);
    if (storeItem) {
      store.updateItem(storeItem.id, { quantity });
    }
  };

  // Função para limpar o carrinho
  const clearCart = () => {
    store.clearCart();
  };

  return (
    <MenuContext.Provider
      value={{
        tableId,
        storeSlug,
        isCartOpen,
        cartItems: mapStoreItemsToCartItems(),
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