import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StoreStatusProvider, useStoreStatus } from '@/infrastructure/context/StoreStatusContext';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
let consoleWarnSpy: any;

// Test component that uses the store status context
const TestComponent = () => {
  const {
    store,
    isOpen,
    deliveryZones,
    minimumOrder,
    deliveryFee,
    estimatedDeliveryTime,
    loading,
    error,
    refreshStoreStatus,
    isOffline,
    lastUpdated,
    retryCount,
    maxRetries
  } = useStoreStatus();

  return (
    <div>
      <span data-testid="store-id">{store?.id || 'No Store'}</span>
      <span data-testid="store-name">{store?.name || 'No Name'}</span>
      <span data-testid="is-open">{isOpen ? 'Open' : 'Closed'}</span>
      <span data-testid="delivery-zones">{deliveryZones.length}</span>
      <span data-testid="minimum-order">{minimumOrder}</span>
      <span data-testid="delivery-fee">{deliveryFee}</span>
      <span data-testid="estimated-time">{estimatedDeliveryTime}</span>
      <span data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</span>
      <span data-testid="error">{error || 'No Error'}</span>
      <span data-testid="is-offline">{isOffline ? 'Offline' : 'Online'}</span>
      <span data-testid="last-updated">{lastUpdated ? lastUpdated.toISOString() : 'Never'}</span>
      <span data-testid="retry-count">{retryCount}</span>
      <span data-testid="max-retries">{maxRetries}</span>
      <button data-testid="refresh" onClick={refreshStoreStatus}>
        Refresh
      </button>
    </div>
  );
};

describe('StoreStatusProvider', () => {
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

    // Restore and recreate console.warn spy for this test suite
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

      expect(screen.getByTestId('store-id')).toHaveTextContent('No Store');
      expect(screen.getByTestId('is-open')).toHaveTextContent('Open');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      expect(screen.getByTestId('is-offline')).toHaveTextContent('Online');
      expect(screen.getByTestId('last-updated')).toHaveTextContent('Never');
      expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
      expect(screen.getByTestId('max-retries')).toHaveTextContent('3');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'useStoreStatus must be used within a StoreStatusProvider. Using default values.'
      );
    });

    it('should use fallback values when no storeId provided', () => {
      render(
        <StoreStatusProvider isStoreOpen={false}>
          <TestComponent />
        </StoreStatusProvider>
      );

      expect(screen.getByTestId('is-open')).toHaveTextContent('Closed');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    it('should fetch store status successfully', async () => {
      const mockStoreData = {
        store: {
          id: 'test-store',
          name: 'Test Store',
          slug: 'test-store',
          isOpen: true,
          openingHours: {
            is_open: true,
            current_status: 'Aberto'
          }
        },
        deliveryZones: [
          {
            id: 'zone-1',
            name: 'Zone 1',
            deliveryFee: 5.0,
            minimumOrder: 20.0,
            estimatedTime: 30
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoreData
      });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Wait for API call to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      }, { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledWith('/api/stores/test-store/status', {
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(screen.getByTestId('store-id')).toHaveTextContent('test-store');
      expect(screen.getByTestId('store-name')).toHaveTextContent('Test Store');
      expect(screen.getByTestId('is-open')).toHaveTextContent('Open');
      expect(screen.getByTestId('delivery-zones')).toHaveTextContent('1');
      expect(screen.getByTestId('minimum-order')).toHaveTextContent('20');
      expect(screen.getByTestId('delivery-fee')).toHaveTextContent('5');
      expect(screen.getByTestId('estimated-time')).toHaveTextContent('30');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={false}>
          <TestComponent />
        </StoreStatusProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      }, { timeout: 5000 });

      expect(screen.getByTestId('error')).toHaveTextContent('Network Error');
      expect(screen.getByTestId('store-id')).toHaveTextContent('test-store');
      expect(screen.getByTestId('store-name')).toHaveTextContent('Loja');
      expect(screen.getByTestId('is-open')).toHaveTextContent('Closed');
      expect(consoleSpy).toHaveBeenCalledWith('Store status fetch error:', expect.any(Error));
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('HTTP 404: Not Found');
      });

      expect(screen.getByTestId('store-id')).toHaveTextContent('test-store');
      expect(screen.getByTestId('is-open')).toHaveTextContent('Open'); // Fallback value
    });
  });

  describe('Retry Logic', () => {
    it('should auto-retry on error with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            store: { id: 'test-store', name: 'Test Store', isOpen: true },
            deliveryZones: []
          })
        });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network Error');
      });

      // First retry after 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // Second retry after 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
        expect(screen.getByTestId('store-name')).toHaveTextContent('Test Store');
      });
    });

    it('should stop retrying after 3 attempts', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent Error'));

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Persistent Error');
      });

      // Advance through all retry attempts
      act(() => {
        vi.advanceTimersByTime(1000); // First retry
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      act(() => {
        vi.advanceTimersByTime(2000); // Second retry
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });

      act(() => {
        vi.advanceTimersByTime(4000); // Third retry
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(4);
      });

      // Manual refresh should show max retries message
      const refreshButton = screen.getByTestId('refresh');
      act(() => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Muitas tentativas falharam. Tente recarregar a página.');
      });

      // Should not make more API calls
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should reset retry count on successful fetch', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            store: { id: 'test-store', name: 'Test Store', isOpen: true },
            deliveryZones: []
          })
        })
        .mockRejectedValueOnce(new Error('Another Error'));

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Wait for initial error and retry
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network Error');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
        expect(screen.getByTestId('store-name')).toHaveTextContent('Test Store');
      });

      // Manual refresh should work (retry count was reset)
      const refreshButton = screen.getByTestId('refresh');
      act(() => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Another Error');
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Manual Refresh', () => {
    it('should allow manual refresh', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          store: { id: 'test-store', name: 'Updated Store', isOpen: true },
          deliveryZones: []
        })
      });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('store-name')).toHaveTextContent('Updated Store');
      });

      // Clear mock and set new response
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          store: { id: 'test-store', name: 'Refreshed Store', isOpen: false },
          deliveryZones: []
        })
      });

      const refreshButton = screen.getByTestId('refresh');
      act(() => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('store-name')).toHaveTextContent('Refreshed Store');
        expect(screen.getByTestId('is-open')).toHaveTextContent('Closed');
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Initial Store Data', () => {
    it('should use initial store data when provided', () => {
      const initialStore = {
        id: 'initial-store',
        name: 'Initial Store',
        slug: 'initial-store',
        isOpen: true,
        openingHours: {
          is_open: true,
          current_status: 'Aberto'
        }
      };

      render(
        <StoreStatusProvider initialStore={initialStore}>
          <TestComponent />
        </StoreStatusProvider>
      );

      expect(screen.getByTestId('store-id')).toHaveTextContent('initial-store');
      expect(screen.getByTestId('store-name')).toHaveTextContent('Initial Store');
      expect(screen.getByTestId('is-open')).toHaveTextContent('Open');
    });
  });

  describe('Enhanced Features', () => {
    it('should update lastUpdated timestamp on successful fetch', async () => {
      const mockStoreData = {
        store: { id: 'test-store', name: 'Test Store', isOpen: true },
        deliveryZones: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoreData
      });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Initially should be 'Never'
      expect(screen.getByTestId('last-updated')).toHaveTextContent('Never');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Should have a timestamp after successful fetch
      expect(screen.getByTestId('last-updated')).not.toHaveTextContent('Never');
      expect(screen.getByTestId('last-updated').textContent).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle network errors and set offline status', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Erro de conexão. Verifique sua internet.');
        expect(screen.getByTestId('is-offline')).toHaveTextContent('Offline');
      });
    });

    it('should handle timeout errors', async () => {
      // Mock AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Tempo limite da requisição excedido');
      });
    });

    it('should track retry count correctly', async () => {
      mockFetch.mockRejectedValue(new Error('Network Error'));

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Initial retry count should be 0
      expect(screen.getByTestId('retry-count')).toHaveTextContent('0');

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network Error');
      });

      // First retry
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('retry-count')).toHaveTextContent('1');
      });

      // Second retry
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('retry-count')).toHaveTextContent('2');
      });

      // Third retry
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('retry-count')).toHaveTextContent('3');
      });
    });

    it('should reset offline status on successful fetch after network error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            store: { id: 'test-store', name: 'Test Store', isOpen: true },
            deliveryZones: []
          })
        });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Wait for network error
      await waitFor(() => {
        expect(screen.getByTestId('is-offline')).toHaveTextContent('Offline');
      });

      // Retry should succeed and reset offline status
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-offline')).toHaveTextContent('Online');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      });
    });

    it('should include proper headers in API requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          store: { id: 'test-store', name: 'Test Store', isOpen: true },
          deliveryZones: []
        })
      });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/stores/test-store/status', {
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Online/Offline Event Handling', () => {
    beforeEach(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });

    it('should handle offline event', async () => {
      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Initially should be online
      expect(screen.getByTestId('is-offline')).toHaveTextContent('Online');

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      await waitFor(() => {
        expect(screen.getByTestId('is-offline')).toHaveTextContent('Offline');
        expect(screen.getByTestId('error')).toHaveTextContent('Sem conexão com a internet');
      });
    });

    it('should retry fetch when coming back online after connection error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            store: { id: 'test-store', name: 'Test Store', isOpen: true },
            deliveryZones: []
          })
        });

      render(
        <StoreStatusProvider storeId="test-store" isStoreOpen={true}>
          <TestComponent />
        </StoreStatusProvider>
      );

      // Wait for connection error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Erro de conexão. Verifique sua internet.');
      });

      // Simulate coming back online
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      await waitFor(() => {
        expect(screen.getByTestId('is-offline')).toHaveTextContent('Online');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});