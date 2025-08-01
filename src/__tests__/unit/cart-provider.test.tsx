import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CartProvider, useCart, useCartValidation, useCartSummary } from '@/infrastructure/context/CartContext';
import { useCartStore } from '@/store/cart-store';

// Mock the cart store
vi.mock('@/store/cart-store', () => ({
  useCartStore: vi.fn()
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
let consoleWarnSpy: any;

// Mock cart store implementation
const mockCartStore = {
  items: [],
  storeId: null,
  tableId: null,
  deliveryMode: false,
  lastUpdated: Date.now(),
  totalItems: vi.fn(() => 0),
  totalPrice: vi.fn(() => 0),
  itemsCount: vi.fn(() => 0),
  isExpired: vi.fn(() => false),
  setContext: vi.fn(),
  setDeliveryMode: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  syncCart: vi.fn(),
  syncWithSession: vi.fn()
};

// Test component that uses the cart context
const TestComponent = () => {
  const {
    items,
    totalItems,
    totalPrice,
    itemsCount,
    storeId,
    tableId,
    deliveryMode,
    isExpired,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setContext,
    setDeliveryMode,
    validateMinimumOrder,
    validateCartContext,
    applyDiscount,
    calculateDeliveryFee,
    getCartSummary,
    syncAcrossTabs,
    isOnline,
    lastSyncTime,
    isLoading,
    isSyncing,
    error
  } = useCart();

  return (
    <div>
      <span data-testid="items-count">{items.length}</span>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="total-price">{totalPrice}</span>
      <span data-testid="items-count-method">{itemsCount}</span>
      <span data-testid="store-id">{storeId || 'No Store'}</span>
      <span data-testid="table-id">{tableId || 'No Table'}</span>
      <span data-testid="delivery-mode">{deliveryMode ? 'Delivery' : 'Pickup'}</span>
      <span data-testid="is-expired">{isExpired ? 'Expired' : 'Valid'}</span>
      <span data-testid="is-online">{isOnline ? 'Online' : 'Offline'}</span>
      <span data-testid="last-sync">{lastSyncTime ? lastSyncTime.toISOString() : 'Never'}</span>
      <span data-testid="is-loading">{isLoading ? 'Loading' : 'Not Loading'}</span>
      <span data-testid="is-syncing">{isSyncing ? 'Syncing' : 'Not Syncing'}</span>
      <span data-testid="error">{error || 'No Error'}</span>
      <span data-testid="validate-minimum">{validateMinimumOrder() ? 'Valid' : 'Invalid'}</span>
      <span data-testid="validate-context">{validateCartContext() ? 'Valid' : 'Invalid'}</span>
      <span data-testid="delivery-fee">{calculateDeliveryFee()}</span>
      
      <button data-testid="add-item" onClick={() => addItem({
        productId: 1,
        identify: 'test-product',
        name: 'Test Product',
        price: 10,
        quantity: 1
      })}>
        Add Item
      </button>
      
      <button data-testid="remove-item" onClick={() => removeItem(1)}>
        Remove Item
      </button>
      
      <button data-testid="clear-cart" onClick={clearCart}>
        Clear Cart
      </button>
      
      <button data-testid="set-context" onClick={() => setContext('store-1', 'table-1')}>
        Set Context
      </button>
      
      <button data-testid="set-delivery" onClick={() => setDeliveryMode(true)}>
        Set Delivery
      </button>
      
      <button data-testid="apply-discount" onClick={() => applyDiscount('TEST10')}>
        Apply Discount
      </button>
      
      <button data-testid="sync-tabs" onClick={syncAcrossTabs}>
        Sync Tabs
      </button>
    </div>
  );
};

// Test component for validation hook
const ValidationTestComponent = () => {
  const { validateMinimumOrder, validateCartContext, isValid, errors } = useCartValidation();
  
  return (
    <div>
      <span data-testid="validate-minimum-hook">{validateMinimumOrder() ? 'Valid' : 'Invalid'}</span>
      <span data-testid="validate-context-hook">{validateCartContext() ? 'Valid' : 'Invalid'}</span>
      <span data-testid="is-valid">{isValid ? 'Valid' : 'Invalid'}</span>
      <span data-testid="errors-count">{errors.length}</span>
    </div>
  );
};

// Test component for summary hook
const SummaryTestComponent = () => {
  const { summary, applyDiscount, calculateDeliveryFee, isLoading } = useCartSummary();
  
  return (
    <div>
      <span data-testid="summary-subtotal">{summary.subtotal}</span>
      <span data-testid="summary-delivery-fee">{summary.deliveryFee}</span>
      <span data-testid="summary-discount">{summary.discount}</span>
      <span data-testid="summary-total">{summary.total}</span>
      <span data-testid="summary-item-count">{summary.itemCount}</span>
      <span data-testid="summary-delivery-time">{summary.estimatedDeliveryTime}</span>
      <span data-testid="summary-loading">{isLoading ? 'Loading' : 'Not Loading'}</span>
      
      <button data-testid="apply-discount-summary" onClick={() => applyDiscount('TEST10')}>
        Apply Discount
      </button>
    </div>
  );
};

describe('CartProvider', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    consoleSpy.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Setup cart store mock
    (useCartStore as any).mockReturnValue(mockCartStore);
    
    // Reset all mock functions
    Object.values(mockCartStore).forEach(fn => {
      if (typeof fn === 'function') {
        fn.mockClear();
      }
    });

    // Restore and recreate console.warn spy
    if (consoleWarnSpy) {
      consoleWarnSpy.mockRestore();
    }
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Default Values', () => {
    it('should provide default values when used without provider', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
      expect(screen.getByTestId('total-items')).toHaveTextContent('0');
      expect(screen.getByTestId('total-price')).toHaveTextContent('0');
      expect(screen.getByTestId('store-id')).toHaveTextContent('No Store');
      expect(screen.getByTestId('table-id')).toHaveTextContent('No Table');
      expect(screen.getByTestId('delivery-mode')).toHaveTextContent('Pickup');
      expect(screen.getByTestId('is-expired')).toHaveTextContent('Valid');
      expect(screen.getByTestId('is-online')).toHaveTextContent('Online');
      expect(screen.getByTestId('last-sync')).toHaveTextContent('Never');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('is-syncing')).toHaveTextContent('Not Syncing');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'useCart must be used within a CartProvider. Using default values.'
      );
    });

    it('should work correctly when wrapped in provider', () => {
      render(
        <CartProvider storeId="test-store" tableId="test-table">
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
      expect(screen.getByTestId('total-items')).toHaveTextContent('0');
      expect(screen.getByTestId('is-online')).toHaveTextContent('Online');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cart Actions', () => {
    it('should add items to cart', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const addButton = screen.getByTestId('add-item');
      fireEvent.click(addButton);

      expect(mockCartStore.addItem).toHaveBeenCalledWith({
        productId: 1,
        identify: 'test-product',
        name: 'Test Product',
        price: 10,
        quantity: 1
      });
    });

    it('should remove items from cart', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const removeButton = screen.getByTestId('remove-item');
      fireEvent.click(removeButton);

      expect(mockCartStore.removeItem).toHaveBeenCalledWith(1);
    });

    it('should clear cart', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const clearButton = screen.getByTestId('clear-cart');
      fireEvent.click(clearButton);

      expect(mockCartStore.clearCart).toHaveBeenCalled();
    });

    it('should set context', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const setContextButton = screen.getByTestId('set-context');
      fireEvent.click(setContextButton);

      expect(mockCartStore.setContext).toHaveBeenCalledWith('store-1', 'table-1');
    });

    it('should set delivery mode', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const setDeliveryButton = screen.getByTestId('set-delivery');
      fireEvent.click(setDeliveryButton);

      expect(mockCartStore.setDeliveryMode).toHaveBeenCalledWith(true);
    });
  });

  describe('Validation Methods', () => {
    it('should validate minimum order', () => {
      mockCartStore.totalPrice.mockReturnValue(25);
      
      render(
        <CartProvider minimumOrderValue={20}>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('validate-minimum')).toHaveTextContent('Valid');
    });

    it('should invalidate minimum order when below threshold', () => {
      mockCartStore.totalPrice.mockReturnValue(15);
      
      render(
        <CartProvider minimumOrderValue={20}>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('validate-minimum')).toHaveTextContent('Invalid');
    });

    it('should validate cart context', () => {
      mockCartStore.storeId = 'test-store';
      mockCartStore.items = [{ id: 1, name: 'Test' }];
      
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('validate-context')).toHaveTextContent('Valid');
    });

    it('should invalidate cart context when missing store or items', () => {
      mockCartStore.storeId = null;
      mockCartStore.items = [];
      
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('validate-context')).toHaveTextContent('Invalid');
    });
  });

  describe('Enhanced Features', () => {
    it('should apply discount successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ discount: 5 })
      });

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const applyDiscountButton = screen.getByTestId('apply-discount');
      fireEvent.click(applyDiscountButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/discounts/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: 'TEST10',
            storeId: mockCartStore.storeId,
            items: mockCartStore.items,
            total: mockCartStore.totalPrice()
          }),
        });
      });
    });

    it('should handle discount application failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Invalid discount code'));

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const applyDiscountButton = screen.getByTestId('apply-discount');
      fireEvent.click(applyDiscountButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid discount code');
      });
    });

    it('should calculate delivery fee correctly', () => {
      mockCartStore.deliveryMode = true;
      mockCartStore.totalPrice.mockReturnValue(30);
      
      render(
        <CartProvider deliveryFee={5}>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('delivery-fee')).toHaveTextContent('5');
    });

    it('should provide free delivery for orders above threshold', () => {
      mockCartStore.deliveryMode = true;
      mockCartStore.totalPrice.mockReturnValue(60);
      
      render(
        <CartProvider deliveryFee={5}>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('delivery-fee')).toHaveTextContent('0');
    });

    it('should not charge delivery fee for pickup orders', () => {
      mockCartStore.deliveryMode = false;
      mockCartStore.totalPrice.mockReturnValue(30);
      
      render(
        <CartProvider deliveryFee={5}>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('delivery-fee')).toHaveTextContent('0');
    });
  });

  describe('Cross-tab Synchronization', () => {
    it('should sync across tabs when storage changes', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      // Simulate storage event
      const storageEvent = new StorageEvent('storage', {
        key: 'digimenu-cart',
        newValue: JSON.stringify({ items: [] })
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(mockCartStore.syncCart).toHaveBeenCalled();
    });

    it('should handle manual sync', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const syncButton = screen.getByTestId('sync-tabs');
      fireEvent.click(syncButton);

      expect(mockCartStore.syncCart).toHaveBeenCalled();
    });
  });

  describe('Online/Offline Handling', () => {
    it('should handle offline event', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      // Initially should be online
      expect(screen.getByTestId('is-online')).toHaveTextContent('Online');

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      await waitFor(() => {
        expect(screen.getByTestId('is-online')).toHaveTextContent('Offline');
        expect(screen.getByTestId('error')).toHaveTextContent('Sem conexão com a internet');
      });
    });

    it('should handle online event and sync', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      // Simulate coming back online
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      await waitFor(() => {
        expect(screen.getByTestId('is-online')).toHaveTextContent('Online');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      });

      expect(mockCartStore.syncCart).toHaveBeenCalled();
    });
  });

  describe('Validation Hook', () => {
    it('should provide validation methods', () => {
      mockCartStore.storeId = 'test-store';
      mockCartStore.items = [{ id: 1, name: 'Test' }];
      mockCartStore.totalPrice.mockReturnValue(25);
      
      render(
        <CartProvider minimumOrderValue={20}>
          <ValidationTestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('validate-minimum-hook')).toHaveTextContent('Valid');
      expect(screen.getByTestId('validate-context-hook')).toHaveTextContent('Valid');
      expect(screen.getByTestId('is-valid')).toHaveTextContent('Valid');
      expect(screen.getByTestId('errors-count')).toHaveTextContent('0');
    });
  });

  describe('Summary Hook', () => {
    it('should provide cart summary', () => {
      mockCartStore.totalPrice.mockReturnValue(30);
      mockCartStore.totalItems.mockReturnValue(2);
      mockCartStore.deliveryMode = true;
      
      render(
        <CartProvider deliveryFee={5}>
          <SummaryTestComponent />
        </CartProvider>
      );

      expect(screen.getByTestId('summary-subtotal')).toHaveTextContent('30');
      expect(screen.getByTestId('summary-delivery-fee')).toHaveTextContent('5');
      expect(screen.getByTestId('summary-discount')).toHaveTextContent('0');
      expect(screen.getByTestId('summary-total')).toHaveTextContent('35');
      expect(screen.getByTestId('summary-item-count')).toHaveTextContent('2');
      expect(screen.getByTestId('summary-delivery-time')).toHaveTextContent('45');
    });
  });

  describe('Initialization', () => {
    it('should initialize cart context when provided', () => {
      render(
        <CartProvider storeId="test-store" tableId="test-table">
          <TestComponent />
        </CartProvider>
      );

      expect(mockCartStore.setContext).toHaveBeenCalledWith('test-store', 'test-table');
    });

    it('should not initialize if store already has same context', () => {
      mockCartStore.storeId = 'test-store';
      
      render(
        <CartProvider storeId="test-store" tableId="test-table">
          <TestComponent />
        </CartProvider>
      );

      expect(mockCartStore.setContext).not.toHaveBeenCalled();
    });
  });

  describe('Auto-sync', () => {
    it('should auto-sync cart periodically when online and has items', () => {
      mockCartStore.items = [{ id: 1, name: 'Test' }];
      
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      // Fast-forward time to trigger auto-sync
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(mockCartStore.syncWithSession).toHaveBeenCalled();
    });

    it('should not auto-sync when offline', () => {
      mockCartStore.items = [{ id: 1, name: 'Test' }];
      
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(mockCartStore.syncWithSession).not.toHaveBeenCalled();
    });
  });
});