import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface CartStore {
  items: CartItem[];
  storeId: string | null;
  tableId: string | null;
  deliveryMode: boolean;
  
  // Getters
  totalItems: () => number;
  totalPrice: () => number;
  itemsCount: () => number;
  
  // Setters
  setContext: (storeId: string, tableId?: string) => void;
  setDeliveryMode: (isDelivery: boolean) => void;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateItem: (id: number, updates: Partial<Omit<CartItem, 'id'>>) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
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

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      tableId: null,
      deliveryMode: false,
      
      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      totalPrice: () => {
        return get().items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      },
      
      itemsCount: () => {
        return get().items.length;
      },
      
      setContext: (storeId, tableId) => {
        set({ storeId, tableId });
      },
      
      setDeliveryMode: (isDelivery) => {
        set({ deliveryMode: isDelivery });
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
          set({ items: updatedItems });
        } else {
          // Se o item não existe, adiciona ao carrinho
          const newItem = {
            ...item,
            id: Date.now() // Gera um ID único baseado no timestamp
          };
          set({ items: [...items, newItem] });
        }
      },
      
      updateItem: (id, updates) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          )
        });
      },
      
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id)
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      }
    }),
    {
      name: 'digimenu-cart', // nome da chave no localStorage
      // Só persiste os dados importantes, não as funções
      partialize: (state) => ({
        items: state.items,
        storeId: state.storeId,
        tableId: state.tableId,
        deliveryMode: state.deliveryMode
      })
    }
  )
); 