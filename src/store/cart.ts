import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Additional } from '@/lib/mock-data';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  additionals?: Additional[];
  observations?: string;
  totalPrice: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, additionals?: Additional[], observations?: string) => void;
  updateQuantity: (id: string, quantity: number, additionals?: Additional[], observations?: string) => void;
  clearCart: () => void;
}

// Mover a função getItemKey para fora para reutilização
const getItemKey = (cartItem: CartItem) => {
  const additionalsKey = cartItem.additionals 
    ? cartItem.additionals.map(a => a.id).sort().join(',')
    : '';
  return `${cartItem.id}-${additionalsKey}-${cartItem.observations || ''}`;
};

const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const newItemKey = getItemKey(item);
          const existingItem = state.items.find(i => getItemKey(i) === newItemKey);

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                getItemKey(i) === newItemKey
                  ? { 
                      ...i, 
                      quantity: i.quantity + item.quantity,
                      totalPrice: (i.quantity + item.quantity) * (i.price + (i.additionals?.reduce((sum, add) => sum + add.price, 0) || 0))
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (id, additionals, observations) =>
        set((state) => ({
          items: state.items.filter((i) => 
            getItemKey(i) !== getItemKey({ id, additionals, observations } as CartItem)
          ),
        })),
      updateQuantity: (id, quantity, additionals, observations) =>
        set((state) => ({
          items: state.items.map((i) =>
            getItemKey(i) === getItemKey({ id, additionals, observations } as CartItem)
              ? { 
                  ...i, 
                  quantity,
                  totalPrice: quantity * (i.price + (i.additionals?.reduce((sum, add) => sum + add.price, 0) || 0))
                } 
              : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
      skipHydration: true,
    }
  )
);

if (typeof window !== 'undefined') {
  useCartStore.persist.rehydrate();
}

export { useCartStore }; 