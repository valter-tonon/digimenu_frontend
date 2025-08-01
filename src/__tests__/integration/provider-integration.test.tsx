/**
 * Integration tests for complete provider setup
 * Tests that all providers are properly integrated and working together
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AppProviders } from '@/components/providers/AppProviders';
import { useAuth } from '@/hooks/use-auth';
import { useStoreStatus } from '@/infrastructure/context/StoreStatusContext';
import { useCart } from '@/infrastructure/context/CartContext';
import { useUIState } from '@/infrastructure/context/UIStateContext';
import { useLayout } from '@/infrastructure/context/LayoutContext';
import { useMenu } from '@/infrastructure/context/MenuContext';
import { useTheme } from '@/components/providers/ThemeProvider';

// Test component that uses all providers
function TestComponent() {
  const auth = useAuth();
  const storeStatus = useStoreStatus();
  const cart = useCart();
  const uiState = useUIState();
  const layout = useLayout();
  const menu = useMenu();
  const theme = useTheme();

  return (
    <div data-testid="test-component">
      <div data-testid="auth-status">{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="store-status">{storeStatus.isOpen ? 'open' : 'closed'}</div>
      <div data-testid="cart-items">{cart.items.length}</div>
      <div data-testid="ui-step">{uiState.currentStep}</div>
      <div data-testid="layout-id">{layout.currentLayout.id}</div>
      <div data-testid="menu-store">{menu.storeSlug || 'no-store'}</div>
      <div data-testid="theme-name">{theme.resolvedTheme}</div>
      
      <button 
        data-testid="add-to-cart"
        onClick={() => cart.addItem({
          productId: 1,
          name: 'Test Product',
          price: 10.99,
          quantity: 1
        })}
      >
        Add to Cart
      </button>
      
      <button 
        data-testid="next-step"
        onClick={() => uiState.nextStep()}
      >
        Next Step
      </button>
      
      <button 
        data-testid="toggle-theme"
        onClick={() => theme.toggleTheme()}
      >
        Toggle Theme
      </button>
    </div>
  );
}

describe('Provider Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render all providers without errors', async () => {
    render(
      <AppProviders
        storeId="test-store"
        tableId="table-1"
        isStoreOpen={true}
      >
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Verify all providers are working
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('store-status')).toHaveTextContent('open');
    expect(screen.getByTestId('cart-items')).toHaveTextContent('0');
    expect(screen.getByTestId('ui-step')).toHaveTextContent('menu');
    expect(screen.getByTestId('menu-store')).toHaveTextContent('test-store');
    expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
  });

  it('should handle cart operations correctly', async () => {
    render(
      <AppProviders
        storeId="test-store"
        tableId="table-1"
      >
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Initially no items
    expect(screen.getByTestId('cart-items')).toHaveTextContent('0');

    // Add item to cart
    fireEvent.click(screen.getByTestId('add-to-cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1');
    });
  });

  it('should handle UI state transitions correctly', async () => {
    render(
      <AppProviders>
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Initially on menu step
    expect(screen.getByTestId('ui-step')).toHaveTextContent('menu');

    // Move to next step
    fireEvent.click(screen.getByTestId('next-step'));

    await waitFor(() => {
      expect(screen.getByTestId('ui-step')).toHaveTextContent('cart');
    });
  });

  it('should handle theme changes correctly', async () => {
    render(
      <AppProviders initialTheme="light">
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Initially light theme
    expect(screen.getByTestId('theme-name')).toHaveTextContent('light');

    // Toggle theme
    fireEvent.click(screen.getByTestId('toggle-theme'));

    await waitFor(() => {
      expect(screen.getByTestId('theme-name')).toHaveTextContent('dark');
    });
  });

  it('should persist cart data across re-renders', async () => {
    const { rerender } = render(
      <AppProviders
        storeId="test-store"
        tableId="table-1"
      >
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Add item to cart
    fireEvent.click(screen.getByTestId('add-to-cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1');
    });

    // Re-render component
    rerender(
      <AppProviders
        storeId="test-store"
        tableId="table-1"
      >
        <TestComponent />
      </AppProviders>
    );

    // Cart should still have the item
    await waitFor(() => {
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1');
    });
  });

  it('should handle provider errors gracefully', async () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Component that throws an error in one provider
    function ErrorComponent() {
      const cart = useCart();
      
      // Simulate an error
      if (cart.items.length === 0) {
        throw new Error('Test error');
      }
      
      return <div>No error</div>;
    }

    render(
      <AppProviders>
        <ErrorComponent />
      </AppProviders>
    );

    // Should render error boundary fallback
    await waitFor(() => {
      expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should validate all providers are available', async () => {
    let validationResults: any = {};

    function ValidationComponent() {
      const auth = useAuth();
      const storeStatus = useStoreStatus();
      const cart = useCart();
      const uiState = useUIState();
      const layout = useLayout();
      const menu = useMenu();
      const theme = useTheme();

      validationResults = {
        auth: !!auth,
        storeStatus: !!storeStatus,
        cart: !!cart,
        uiState: !!uiState,
        layout: !!layout,
        menu: !!menu,
        theme: !!theme
      };

      return <div data-testid="validation-complete">Validation Complete</div>;
    }

    render(
      <AppProviders>
        <ValidationComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('validation-complete')).toBeInTheDocument();
    });

    // All providers should be available
    expect(validationResults.auth).toBe(true);
    expect(validationResults.storeStatus).toBe(true);
    expect(validationResults.cart).toBe(true);
    expect(validationResults.uiState).toBe(true);
    expect(validationResults.layout).toBe(true);
    expect(validationResults.menu).toBe(true);
    expect(validationResults.theme).toBe(true);
  });

  it('should handle offline scenarios', async () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(
      <AppProviders
        storeId="test-store"
        isStoreOpen={true}
      >
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Should still render with fallback values
    expect(screen.getByTestId('store-status')).toHaveTextContent('open');
  });

  it('should apply theme CSS variables correctly', async () => {
    render(
      <AppProviders initialTheme="dark">
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Check that theme CSS variables are applied
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBeTruthy();
    expect(root.style.getPropertyValue('--color-background')).toBeTruthy();
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('should handle store context changes', async () => {
    const { rerender } = render(
      <AppProviders
        storeId="store-1"
        tableId="table-1"
      >
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('menu-store')).toHaveTextContent('store-1');
    });

    // Change store context
    rerender(
      <AppProviders
        storeId="store-2"
        tableId="table-2"
      >
        <TestComponent />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId('menu-store')).toHaveTextContent('store-2');
    });
  });
});