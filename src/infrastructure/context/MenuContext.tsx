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
  productId?: number;
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
    }
  }, [store, storeSlug, tableId]);
  
  // Este useEffect configura o TTL e listeners apenas uma vez
  useEffect(() => {
    // Configurar o TTL padrão do carrinho (24 horas) apenas uma vez
    store.setCartTTL(24);
    
    // Adicionar listener para sincronizar o carrinho quando a página é recarregada
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && storeSlug) {
        store.syncCart();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Executar apenas uma vez

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
      productId: item.productId || 0, // Usar productId se disponível, senão 0
      identify: item.id, // item.id já contém o UUID do produto
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.observation,
      additionals: item.additionals?.map(add => {
        // Tentar converter ID para número, senão usar um valor único baseado no nome
        const additionalId = typeof add.id === 'string' 
          ? (parseInt(add.id) || add.name.charCodeAt(0) * 1000 + Math.random() * 1000) 
          : add.id;
        return {
          id: Math.floor(additionalId),
          name: add.name,
          price: add.price,
          quantity: 1
        };
      })
    });
  };

  // Função auxiliar para encontrar item no store
  const findStoreItem = (itemId: string) => {
    return store.items.find(item => 
      item.id.toString() === itemId || 
      item.identify === itemId ||
      item.productId?.toString() === itemId
    );
  };

  // Função para remover item do carrinho
  const removeFromCart = async (itemId: string): Promise<void> => {
    // Remover apenas do store zustand
    const storeItem = findStoreItem(itemId);
    if (storeItem) {
      store.removeItem(storeItem.id);
    } else {
      console.warn(`Item não encontrado no carrinho: ${itemId}`);
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
    const storeItem = findStoreItem(itemId);
    if (storeItem) {
      store.updateItem(storeItem.id, { quantity });
    } else {
      console.warn(`Item não encontrado para atualização: ${itemId}`);
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