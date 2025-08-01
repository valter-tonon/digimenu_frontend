import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderErrorBoundary } from '@/components/error-boundaries/ProviderErrorBoundary';
import { StoreStatusProvider, useStoreStatus } from '@/infrastructure/context/StoreStatusContext';
import { MenuProvider, useMenu } from '@/infrastructure/context/MenuContext';
import { LayoutProvider, useLayout } from '@/infrastructure/context/LayoutContext';

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Component that throws an error
const ErrorComponent = () => {
  throw new Error('Test error');
};

// Component that uses StoreStatus context
const StoreStatusTestComponent = () => {
  const { isOpen, loading, error } = useStoreStatus();
  return (
    <div>
      <span data-testid="store-open">{isOpen ? 'Open' : 'Closed'}</span>
      <span data-testid="store-loading">{loading ? 'Loading' : 'Not Loading'}</span>
      <span data-testid="store-error">{error || 'No Error'}</span>
    </div>
  );
};

// Component that uses Menu context
const MenuTestComponent = () => {
  const { cartItems, tableId, storeSlug } = useMenu();
  return (
    <div>
      <span data-testid="cart-items">{cartItems.length}</span>
      <span data-testid="table-id">{tableId || 'No Table'}</span>
      <span data-testid="store-slug">{storeSlug || 'No Store'}</span>
    </div>
  );
};

// Component that uses Layout context
const LayoutTestComponent = () => {
  const { currentLayout, isLoading } = useLayout();
  return (
    <div>
      <span data-testid="layout-id">{currentLayout.id}</span>
      <span data-testid="layout-loading">{isLoading ? 'Loading' : 'Not Loading'}</span>
    </div>
  );
};

describe('Provider Error Boundaries', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  describe('ProviderErrorBoundary', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ProviderErrorBoundary>
          <ErrorComponent />
        </ProviderErrorBoundary>
      );

      expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      expect(screen.getByText('Recarregar Página')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Provider Error:', expect.any(Error), expect.any(Object));
    });

    it('should use custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ProviderErrorBoundary fallback={customFallback}>
          <ErrorComponent />
        </ProviderErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();

      render(
        <ProviderErrorBoundary onError={onError}>
          <ErrorComponent />
        </ProviderErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
    });

    it('should retry when retry button is clicked', () => {
      const { rerender } = render(
        <ProviderErrorBoundary>
          <ErrorComponent />
        </ProviderErrorBoundary>
      );

      expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

      // Click retry button
      fireEvent.click(screen.getByText('Tentar Novamente'));

      // Rerender with working component
      rerender(
        <ProviderErrorBoundary>
          <div>Working Component</div>
        </ProviderErrorBoundary>
      );

      expect(screen.getByText('Working Component')).toBeInTheDocument();
    });
  });

  describe('StoreStatusProvider with Error Boundaries', () => {
    it('should provide default values when used without provider', () => {
      render(<StoreStatusTestComponent />);

      expect(screen.getByTestId('store-open')).toHaveTextContent('Open');
      expect(screen.getByTestId('store-loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('store-error')).toHaveTextContent('No Error');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'useStoreStatus must be used within a StoreStatusProvider. Using default values.'
      );
    });

    it('should work correctly when wrapped in provider', () => {
      render(
        <StoreStatusProvider isStoreOpen={true} storeId="test-store">
          <StoreStatusTestComponent />
        </StoreStatusProvider>
      );

      expect(screen.getByTestId('store-open')).toHaveTextContent('Open');
      expect(screen.getByTestId('store-loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('store-error')).toHaveTextContent('No Error');
    });

    it('should use fallback values when provider fails', () => {
      // Mock fetch to simulate API failure
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      render(
        <StoreStatusProvider isStoreOpen={false} storeId="test-store">
          <StoreStatusTestComponent />
        </StoreStatusProvider>
      );

      expect(screen.getByTestId('store-open')).toHaveTextContent('Closed');
    });
  });

  describe('MenuProvider with Error Boundaries', () => {
    it('should provide default values when used without provider', () => {
      render(<MenuTestComponent />);

      expect(screen.getByTestId('cart-items')).toHaveTextContent('0');
      expect(screen.getByTestId('table-id')).toHaveTextContent('No Table');
      expect(screen.getByTestId('store-slug')).toHaveTextContent('No Store');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'useMenu deve ser usado dentro de um MenuProvider. Using default values.'
      );
    });

    it('should work correctly when wrapped in provider', () => {
      render(
        <MenuProvider initialTableId="table-1" initialStoreSlug="test-store">
          <MenuTestComponent />
        </MenuProvider>
      );

      expect(screen.getByTestId('cart-items')).toHaveTextContent('0');
      expect(screen.getByTestId('table-id')).toHaveTextContent('table-1');
      expect(screen.getByTestId('store-slug')).toHaveTextContent('test-store');
    });
  });

  describe('LayoutProvider with Error Boundaries', () => {
    it('should provide default values when used without provider', () => {
      render(<LayoutTestComponent />);

      expect(screen.getByTestId('layout-id')).toHaveTextContent('default');
      expect(screen.getByTestId('layout-loading')).toHaveTextContent('Not Loading');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'useLayout deve ser usado dentro de um LayoutProvider. Using default values.'
      );
    });

    it('should work correctly when wrapped in provider', () => {
      render(
        <LayoutProvider initialLayoutId="modern">
          <LayoutTestComponent />
        </LayoutProvider>
      );

      expect(screen.getByTestId('layout-id')).toHaveTextContent('default'); // Will be default initially
      expect(screen.getByTestId('layout-loading')).toHaveTextContent('Loading'); // Will be loading initially
    });
  });

  describe('Nested Providers', () => {
    it('should work correctly when all providers are nested', () => {
      render(
        <StoreStatusProvider isStoreOpen={true} storeId="test-store">
          <MenuProvider initialTableId="table-1" initialStoreSlug="test-store">
            <LayoutProvider initialLayoutId="modern">
              <div>
                <StoreStatusTestComponent />
                <MenuTestComponent />
                <LayoutTestComponent />
              </div>
            </LayoutProvider>
          </MenuProvider>
        </StoreStatusProvider>
      );

      // All components should render without warnings
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      
      // Store status should work
      expect(screen.getByTestId('store-open')).toHaveTextContent('Open');
      
      // Menu should work
      expect(screen.getByTestId('table-id')).toHaveTextContent('table-1');
      
      // Layout should work
      expect(screen.getByTestId('layout-id')).toHaveTextContent('default');
    });
  });
});