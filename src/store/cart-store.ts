import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ProductAdditional {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: number;
  productId: number;
  identify: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
  additionals?: ProductAdditional[];
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  tableId: string | null;
  deliveryMode: boolean;
  lastUpdated: number;
  expiresAt: number | null;
}

interface CartStore extends CartState {
  // Getters
  totalItems: () => number;
  totalPrice: () => number;
  itemsCount: () => number;
  isExpired: () => boolean;
  
  // Setters
  setContext: (storeId: string, tableId?: string) => void;
  setDeliveryMode: (isDelivery: boolean) => void;
  setCartTTL: (hours: number) => void;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateItem: (id: number, updates: Partial<Omit<CartItem, 'id'>>) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  syncCart: () => void;
}

// Helper para calcular o preço de um item (incluindo adicionais)
const calculateItemPrice = (item: CartItem): number => {
  const basePrice = item.price * item.quantity;
  
  if (!item.additionals || item.additionals.length === 0) {
    return basePrice;
  }
  
  const additionalsPrice = item.additionals.reduce(
    (sum, additional) => sum + (additional.price * additional.quantity),
    0
  );
  
  return basePrice + additionalsPrice;
};

// Tempo padrão de expiração do carrinho (24 horas em milissegundos)
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

// Storage personalizado com suporte a TTL
const createPersistentStorage = () => {
  return {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined') return null;
      
      try {
        const storedValue = localStorage.getItem(name);
        if (!storedValue) return null;
        
        const { state, expiresAt } = JSON.parse(storedValue);
        
        // Verifica se o carrinho expirou
        if (expiresAt && Date.now() > expiresAt) {
          localStorage.removeItem(name);
          return null;
        }
        
        return JSON.stringify(state);
      } catch (error) {
        console.error('Erro ao recuperar carrinho:', error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined') return;
      
      try {
        const state = JSON.parse(value);
        const expiresAt = state.expiresAt || (Date.now() + DEFAULT_TTL);
        
        localStorage.setItem(
          name,
          JSON.stringify({
            state,
            expiresAt
          })
        );
      } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
      }
    },
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(name);
    }
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      tableId: null,
      deliveryMode: false,
      lastUpdated: Date.now(),
      expiresAt: Date.now() + DEFAULT_TTL,
      
      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      totalPrice: () => {
        return get().items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      },
      
      itemsCount: () => {
        return get().items.length;
      },
      
      isExpired: () => {
        const { expiresAt } = get();
        return expiresAt !== null && Date.now() > expiresAt;
      },
      
      setContext: (storeId, tableId) => {
        set({ 
          storeId, 
          tableId,
          lastUpdated: Date.now()
        });
      },
      
      setDeliveryMode: (isDelivery) => {
        set({ 
          deliveryMode: isDelivery,
          lastUpdated: Date.now()
        });
      },
      
      setCartTTL: (hours) => {
        const expiresAt = Date.now() + (hours * 60 * 60 * 1000);
        set({ expiresAt });
      },
      
      addItem: (item) => {
        const items = get().items;
        // Verifica se o item já existe no carrinho (mesmo produto e mesmas observações)
        const existingItemIndex = items.findIndex(
          (i) => 
            i.identify === item.identify && 
            i.notes === item.notes &&
            JSON.stringify(i.additionals) === JSON.stringify(item.additionals)
        );
        
        if (existingItemIndex >= 0) {
          // Se o item já existe, incrementa a quantidade
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += item.quantity;
          set({ 
            items: updatedItems,
            lastUpdated: Date.now()
          });
        } else {
          // Se o item não existe, adiciona ao carrinho
          const newItem = {
            ...item,
            id: Date.now() // Gera um ID único baseado no timestamp
          };
          set({ 
            items: [...items, newItem],
            lastUpdated: Date.now()
          });
        }
      },
      
      updateItem: (id, updates) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
          lastUpdated: Date.now()
        });
      },
      
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
          lastUpdated: Date.now()
        });
      },
      
      clearCart: () => {
        set({ 
          items: [],
          lastUpdated: Date.now()
        });
      },
      
      syncCart: () => {
        // Verifica se o carrinho expirou
        if (get().isExpired()) {
          set({ 
            items: [],
            lastUpdated: Date.now()
          });
        }
        // Não atualiza o timestamp se não for necessário para evitar re-renderizações
      }
    }),
    {
      name: 'digimenu-cart', // nome da chave no localStorage
      storage: createJSONStorage(() => createPersistentStorage()),
      // Só persiste os dados importantes
      partialize: (state) => ({
        items: state.items,
        storeId: state.storeId,
        tableId: state.tableId,
        deliveryMode: state.deliveryMode,
        lastUpdated: state.lastUpdated,
        expiresAt: state.expiresAt
      })
    }
  )
); 