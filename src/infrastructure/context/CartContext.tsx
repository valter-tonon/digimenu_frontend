'use client';

import { createContext, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { useCartStore, CartItem, ProductAdditional } from '@/store/cart-store';
import { ProviderErrorBoundary } from '@/components/error-boundaries/ProviderErrorBoundary';

interface CartContextType {
  // Cart state
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  itemsCount: number;
  storeId: string | null;
  tableId: string | null;
  deliveryMode: boolean;
  lastUpdated: number;
  isExpired: boolean;
  
  // Cart actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateItem: (id: number, updates: Partial<Omit<CartItem, 'id'>>) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  
  // Context management
  setContext: (storeId: string, tableId?: string) => void;
  setDeliveryMode: (isDelivery: boolean) => void;
  
  // Validation methods
  validateMinimumOrder: () => boolean;
  validateStockAvailability: () => Promise<boolean>;
  validateCartContext: () => boolean;
  
  // Enhanced features
  applyDiscount: (code: string) => Promise<boolean>;
  calculateDeliveryFee: () => number;
  getCartSummary: () => CartSummary;
  
  // Cross-tab synchronization
  syncAcrossTabs: () => void;
  isOnline: boolean;
  lastSyncTime: Date | null;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}

interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
  estimatedDeliveryTime: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Default fallback values
const DEFAULT_VALUES: CartContextType = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  itemsCount: 0,
  storeId: null,
  tableId: null,
  deliveryMode: false,
  lastUpdated: Date.now(),
  isExpired: false,
  addItem: () => {},
  updateItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  setContext: () => {},
  setDeliveryMode: () => {},
  validateMinimumOrder: () => true,
  validateStockAvailability: async () => true,
  validateCartContext: () => true,
  applyDiscount: async () => false,
  calculateDeliveryFee: () => 0,
  getCartSummary: () => ({
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    itemCount: 0,
    estimatedDeliveryTime: 30
  }),
  syncAcrossTabs: () => {},
  isOnline: true,
  lastSyncTime: null,
  isLoading: false,
  isSyncing: false,
  error: null
};

interface CartProviderProps {
  children: ReactNode;
  minimumOrderValue?: number;
  deliveryFee?: number;
  storeId?: string;
  tableId?: string;
}

function CartProviderInner({ 
  children, 
  minimumOrderValue = 0,
  deliveryFee = 0,
  storeId,
  tableId
}: CartProviderProps) {
  const cartStore = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [discount, setDiscount] = useState(0);

  // Initialize cart context if provided
  useEffect(() => {
    if (storeId && (!cartStore.storeId || cartStore.storeId !== storeId)) {
      cartStore.setContext(storeId, tableId);
    }
  }, [storeId, tableId, cartStore]);

  // Cross-tab synchronization using storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'digimenu-cart' && e.newValue) {
        try {
          setIsSyncing(true);
          // The zustand persist middleware will automatically sync the state
          cartStore.syncCart();
          setLastSyncTime(new Date());
        } catch (error) {
          console.error('Error syncing cart across tabs:', error);
          setError('Erro ao sincronizar carrinho entre abas');
        } finally {
          setIsSyncing(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [cartStore]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      // Sync cart when coming back online
      syncAcrossTabs();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError('Sem conexão com a internet');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Set initial online status
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Auto-sync cart periodically
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (isOnline && cartStore.items.length > 0) {
        cartStore.syncWithSession();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [isOnline, cartStore]);

  // Validation methods
  const validateMinimumOrder = useCallback((): boolean => {
    const total = cartStore.totalPrice();
    return total >= minimumOrderValue;
  }, [cartStore, minimumOrderValue]);

  const validateStockAvailability = useCallback(async (): Promise<boolean> => {
    if (!cartStore.items.length) return true;
    
    try {
      setIsLoading(true);
      
      // Check stock for each item
      const stockChecks = cartStore.items.map(async (item) => {
        const response = await fetch(`/api/products/${item.productId}/stock`);
        if (!response.ok) return false;
        
        const { available } = await response.json();
        return available >= item.quantity;
      });

      const results = await Promise.all(stockChecks);
      return results.every(Boolean);
    } catch (error) {
      console.error('Error validating stock:', error);
      setError('Erro ao validar estoque dos produtos');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cartStore.items]);

  const validateCartContext = useCallback((): boolean => {
    return !!(cartStore.storeId && cartStore.items.length > 0);
  }, [cartStore.storeId, cartStore.items.length]);

  // Enhanced features
  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    if (!code.trim()) return false;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          storeId: cartStore.storeId,
          items: cartStore.items,
          total: cartStore.totalPrice()
        }),
      });

      if (!response.ok) {
        throw new Error('Código de desconto inválido');
      }

      const { discount: discountValue } = await response.json();
      setDiscount(discountValue);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao aplicar desconto';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cartStore]);

  const calculateDeliveryFee = useCallback((): number => {
    if (!cartStore.deliveryMode) return 0;
    
    const total = cartStore.totalPrice();
    
    // Free delivery for orders above a certain amount
    if (total >= 50) return 0;
    
    return deliveryFee;
  }, [cartStore.deliveryMode, cartStore, deliveryFee]);

  const getCartSummary = useCallback((): CartSummary => {
    const subtotal = cartStore.totalPrice();
    const calculatedDeliveryFee = calculateDeliveryFee();
    const total = subtotal + calculatedDeliveryFee - discount;

    return {
      subtotal,
      deliveryFee: calculatedDeliveryFee,
      discount,
      total: Math.max(0, total),
      itemCount: cartStore.totalItems(),
      estimatedDeliveryTime: cartStore.deliveryMode ? 45 : 20
    };
  }, [cartStore, calculateDeliveryFee, discount]);

  const syncAcrossTabs = useCallback(() => {
    if (!isOnline) return;
    
    try {
      setIsSyncing(true);
      cartStore.syncCart();
      setLastSyncTime(new Date());
      setError(null);
    } catch (error) {
      console.error('Error syncing cart:', error);
      setError('Erro ao sincronizar carrinho');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, cartStore]);

  // Enhanced cart actions with validation
  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    try {
      cartStore.addItem(item);
      setError(null);
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'add_to_cart', {
          event_category: 'ecommerce',
          event_label: item.name,
          value: item.price * item.quantity
        });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      setError('Erro ao adicionar item ao carrinho');
    }
  }, [cartStore]);

  const updateItem = useCallback((id: number, updates: Partial<Omit<CartItem, 'id'>>) => {
    try {
      cartStore.updateItem(id, updates);
      setError(null);
    } catch (error) {
      console.error('Error updating cart item:', error);
      setError('Erro ao atualizar item do carrinho');
    }
  }, [cartStore]);

  const removeItem = useCallback((id: number) => {
    try {
      const item = cartStore.items.find(i => i.id === id);
      cartStore.removeItem(id);
      setError(null);
      
      // Track analytics
      if (item && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'remove_from_cart', {
          event_category: 'ecommerce',
          event_label: item.name,
          value: item.price * item.quantity
        });
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      setError('Erro ao remover item do carrinho');
    }
  }, [cartStore]);

  const clearCart = useCallback(() => {
    try {
      cartStore.clearCart();
      setDiscount(0);
      setError(null);
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'clear_cart', {
          event_category: 'ecommerce'
        });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Erro ao limpar carrinho');
    }
  }, [cartStore]);

  const contextValue: CartContextType = {
    // Cart state
    items: cartStore.items,
    totalItems: cartStore.totalItems(),
    totalPrice: cartStore.totalPrice(),
    itemsCount: cartStore.itemsCount(),
    storeId: cartStore.storeId,
    tableId: cartStore.tableId,
    deliveryMode: cartStore.deliveryMode,
    lastUpdated: cartStore.lastUpdated,
    isExpired: cartStore.isExpired(),
    
    // Cart actions
    addItem,
    updateItem,
    removeItem,
    clearCart,
    
    // Context management
    setContext: cartStore.setContext,
    setDeliveryMode: cartStore.setDeliveryMode,
    
    // Validation methods
    validateMinimumOrder,
    validateStockAvailability,
    validateCartContext,
    
    // Enhanced features
    applyDiscount,
    calculateDeliveryFee,
    getCartSummary,
    
    // Cross-tab synchronization
    syncAcrossTabs,
    isOnline,
    lastSyncTime,
    
    // Loading states
    isLoading,
    isSyncing,
    error
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function CartProvider(props: CartProviderProps) {
  return (
    <ProviderErrorBoundary
      fallback={
        <CartContext.Provider value={DEFAULT_VALUES}>
          {props.children}
        </CartContext.Provider>
      }
      onError={(error) => {
        console.error('CartProvider Error:', error);
      }}
    >
      <CartProviderInner {...props} />
    </ProviderErrorBoundary>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    // Instead of throwing, return safe defaults with warning
    console.warn('useCart must be used within a CartProvider. Using default values.');
    return DEFAULT_VALUES;
  }
  
  return context;
}

// Hook for cart validation
export function useCartValidation() {
  const cart = useCart();
  
  return {
    validateMinimumOrder: cart.validateMinimumOrder,
    validateStockAvailability: cart.validateStockAvailability,
    validateCartContext: cart.validateCartContext,
    isValid: cart.validateCartContext() && cart.validateMinimumOrder(),
    errors: cart.error ? [cart.error] : []
  };
}

// Hook for cart summary
export function useCartSummary() {
  const cart = useCart();
  
  return {
    summary: cart.getCartSummary(),
    applyDiscount: cart.applyDiscount,
    calculateDeliveryFee: cart.calculateDeliveryFee,
    isLoading: cart.isLoading
  };
}