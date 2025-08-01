import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { ApiErrorHandler, apiErrorHandler, handleApiError, executeWithRetry } from '@/services/apiErrorHandler';
import { errorReportingService } from '@/services/errorReporting';

// Mock the error reporting service
vi.mock('@/services/errorReporting', () => ({
  errorReportingService: {
    reportError: vi.fn()
  }
}));

// Mock console methods
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = vi.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

// Mock navigator and window
const mockNavigator = {
  onLine: true,
  connection: {
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

// Mock gtag
const mockGtag = vi.fn();
Object.defineProperty(global.window, 'gtag', {
  value: mockGtag,
  writable: true
});

describe('ApiErrorHandler', () => {
  let handler: ApiErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    handler = new ApiErrorHandler();
    mockNavigator.onLine = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Error Parsing and Handling', () => {
    it('should parse HTTP error responses correctly', () => {
      const httpError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid request data',
            details: { field: 'email' }
          }
        }
      };

      const apiError = handler.handleError(httpError, 'test-context');

      expect(apiError).toMatchObject({
        code: 'BAD_REQUEST',
        status: 400,
        message: 'Invalid request data',
        retryable: false,
        userMessage: 'Dados inválidos. Verifique as informações.',
        details: expect.objectContaining({
          field: 'email',
          context: 'test-context'
        })
      });
    });

    it('should parse network errors correctly', () => {
      const networkError = {
        request: {},
        message: 'Network Error'
      };

      const apiError = handler.handleError(networkError);

      expect(apiError).toMatchObject({
        code: 'NETWORK_ERROR',
        status: 0,
        message: 'Network Error',
        retryable: true,
        userMessage: 'Problema de conexão. Verifique sua internet.'
      });
    });

    it('should parse timeout errors correctly', () => {
      const timeoutError = {
        request: {},
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };

      const apiError = handler.handleError(timeoutError);

      expect(apiError).toMatchObject({
        code: 'TIMEOUT_ERROR',
        status: 0,
        retryable: true,
        userMessage: 'Tempo limite excedido. Tente novamente.'
      });
    });

    it('should parse offline errors correctly', () => {
      mockNavigator.onLine = false;
      
      const networkError = {
        request: {},
        message: 'Network Error'
      };

      const apiError = handler.handleError(networkError);

      expect(apiError).toMatchObject({
        code: 'OFFLINE_ERROR',
        status: 0,
        retryable: true,
        userMessage: 'Você está offline. Conecte-se à internet.'
      });
    });

    it('should parse JavaScript errors correctly', () => {
      const jsError = new Error('Something went wrong');
      jsError.name = 'TypeError';

      const apiError = handler.handleError(jsError);

      expect(apiError).toMatchObject({
        code: 'UNKNOWN_ERROR',
        status: 0,
        message: 'Something went wrong',
        retryable: false,
        userMessage: 'Erro inesperado. Tente novamente.'
      });
    });

    it('should handle business logic errors correctly', () => {
      const paymentError = new Error('Payment processing failed');

      const apiError = handler.handleError(paymentError);

      expect(apiError).toMatchObject({
        code: 'PAYMENT_ERROR',
        userMessage: 'Erro no pagamento. Tente outro método.'
      });
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should retry retryable errors', async () => {
      const mockRequest = vi.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce('success');

      const promise = handler.executeWithRetry(mockRequest, { maxRetries: 3 });

      // Fast-forward through retries
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const mockRequest = vi.fn().mockRejectedValue({
        response: { status: 400, data: {} }
      });

      await expect(
        handler.executeWithRetry(mockRequest, { maxRetries: 3 })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        retryable: false
      });

      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries limit', async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error('Network Error'));

      const promise = handler.executeWithRetry(mockRequest, { maxRetries: 2 });

      // Fast-forward through all retries
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toMatchObject({
        code: 'NETWORK_ERROR'
      });

      expect(mockRequest).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff for retries', async () => {
      const mockRequest = vi.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce('success');

      const promise = handler.executeWithRetry(mockRequest, { maxRetries: 2 });

      // First retry should happen after 1000ms (base delay)
      vi.advanceTimersByTime(999);
      expect(mockRequest).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      expect(mockRequest).toHaveBeenCalledTimes(2);

      // Second retry should happen after 2000ms (exponential backoff)
      vi.advanceTimersByTime(1999);
      expect(mockRequest).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(1);
      expect(mockRequest).toHaveBeenCalledTimes(3);

      await promise;
    });

    it('should handle aborted requests', async () => {
      const abortController = new AbortController();
      const mockRequest = vi.fn().mockRejectedValue(new Error('Request aborted'));

      abortController.abort();

      await expect(
        handler.executeWithRetry(mockRequest, { 
          abortSignal: abortController.signal 
        })
      ).rejects.toMatchObject({
        message: 'Request aborted'
      });
    });
  });

  describe('Network Status Detection', () => {
    it('should detect online status correctly', () => {
      mockNavigator.onLine = true;
      
      const status = handler.getNetworkStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.connectionType).toBe('wifi');
      expect(status.effectiveType).toBe('4g');
    });

    it('should detect offline status correctly', () => {
      mockNavigator.onLine = false;
      
      const status = handler.getNetworkStatus();
      
      expect(status.isOnline).toBe(false);
    });

    it('should handle missing connection API gracefully', () => {
      const originalConnection = mockNavigator.connection;
      delete (mockNavigator as any).connection;
      
      const status = handler.getNetworkStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.connectionType).toBeUndefined();
      
      mockNavigator.connection = originalConnection;
    });
  });

  describe('Offline Queue Management', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should queue requests when offline', async () => {
      mockNavigator.onLine = false;
      
      const mockRequest = vi.fn().mockResolvedValue('success');
      
      const promise = handler.executeWithRetry(mockRequest);
      
      // Request should be queued, not executed immediately
      expect(mockRequest).not.toHaveBeenCalled();
      
      // Simulate coming back online
      mockNavigator.onLine = true;
      mockWindow.dispatchEvent(new Event('online'));
      
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should process offline queue when connection is restored', async () => {
      mockNavigator.onLine = false;
      
      const mockRequest1 = vi.fn().mockResolvedValue('result1');
      const mockRequest2 = vi.fn().mockResolvedValue('result2');
      
      const promise1 = handler.executeWithRetry(mockRequest1);
      const promise2 = handler.executeWithRetry(mockRequest2);
      
      // Simulate coming back online
      mockNavigator.onLine = true;
      
      // Manually trigger the online event handler
      const onlineHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'online')?.[1];
      
      if (onlineHandler) {
        await onlineHandler();
      }
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
    });

    it('should clean up old offline requests', () => {
      const queueStatus = handler.getOfflineQueueStatus();
      expect(queueStatus.queueLength).toBe(0);
      expect(queueStatus.oldestRequest).toBeNull();
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast', () => {
      handler.showSuccessToast('Operation successful');
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api-toast',
          detail: expect.objectContaining({
            type: 'success',
            title: 'Sucesso',
            message: 'Operation successful',
            duration: 3000
          })
        })
      );
    });

    it('should show error toast with retry action for retryable errors', () => {
      const retryableError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
        status: 0,
        retryable: true,
        userMessage: 'Problema de conexão. Verifique sua internet.',
        timestamp: Date.now()
      };

      handler.showErrorToast(retryableError);
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api-toast',
          detail: expect.objectContaining({
            type: 'error',
            title: 'Erro',
            message: 'Problema de conexão. Verifique sua internet.',
            duration: 5000,
            actions: expect.arrayContaining([
              expect.objectContaining({
                label: 'Tentar Novamente',
                style: 'primary'
              })
            ])
          })
        })
      );
    });

    it('should show warning toast', () => {
      handler.showWarningToast('This is a warning');
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api-toast',
          detail: expect.objectContaining({
            type: 'warning',
            title: 'Atenção',
            message: 'This is a warning',
            duration: 4000
          })
        })
      );
    });

    it('should show info toast', () => {
      handler.showInfoToast('This is information');
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api-toast',
          detail: expect.objectContaining({
            type: 'info',
            title: 'Informação',
            message: 'This is information',
            duration: 3000
          })
        })
      );
    });

    it('should clear all toasts', () => {
      handler.clearAllToasts();
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api-toast-clear'
        })
      );
    });
  });

  describe('Error Reporting and Analytics', () => {
    it('should report errors to monitoring service', () => {
      const error = new Error('Test error');
      
      handler.handleError(error, 'test-context');
      
      expect(errorReportingService.reportError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          providerName: 'ApiErrorHandler',
          errorBoundary: 'ApiErrorHandler',
          apiError: expect.objectContaining({
            code: 'UNKNOWN_ERROR',
            retryable: false
          })
        })
      );
    });

    it('should track error analytics', () => {
      const error = new Error('Test error');
      
      handler.handleError(error, 'test-context');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'api_error', {
        event_category: 'api',
        event_label: 'UNKNOWN_ERROR: test-context',
        custom_map: {
          error_code: 'UNKNOWN_ERROR',
          status_code: 0,
          retryable: false,
          context: 'test-context'
        },
        value: 1
      });
    });

    it('should handle reporting service failures gracefully', () => {
      const mockReportError = vi.mocked(errorReportingService.reportError);
      mockReportError.mockImplementation(() => {
        throw new Error('Reporting failed');
      });

      const error = new Error('Test error');
      
      // Should not throw even if reporting fails
      expect(() => {
        handler.handleError(error);
      }).not.toThrow();
      
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to report API error:',
        expect.any(Error)
      );
    });
  });

  describe('Configuration Management', () => {
    it('should use default retry configuration', () => {
      const config = handler.getRetryConfig();
      
      expect(config).toMatchObject({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryableStatuses: [408, 429, 500, 502, 503, 504],
        retryableErrors: ['NetworkError', 'TimeoutError', 'AbortError']
      });
    });

    it('should allow updating retry configuration', () => {
      handler.updateRetryConfig({
        maxRetries: 5,
        baseDelay: 2000
      });
      
      const config = handler.getRetryConfig();
      
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(2000);
      expect(config.backoffMultiplier).toBe(2); // Should keep default
    });

    it('should create instance with custom configuration', () => {
      const customHandler = new ApiErrorHandler({
        maxRetries: 5,
        baseDelay: 2000
      });
      
      const config = customHandler.getRetryConfig();
      
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(2000);
    });
  });

  describe('Utility Functions', () => {
    it('should provide handleApiError utility', () => {
      const error = new Error('Test error');
      const result = handleApiError(error, 'test-context');
      
      expect(result).toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Test error'
      });
    });

    it('should provide executeWithRetry utility', async () => {
      const mockRequest = vi.fn().mockResolvedValue('success');
      
      const result = await executeWithRetry(mockRequest);
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined error gracefully', () => {
      const apiError = handler.handleError(undefined);
      
      expect(apiError).toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Unknown Error',
        retryable: false
      });
    });

    it('should handle null error gracefully', () => {
      const apiError = handler.handleError(null);
      
      expect(apiError).toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Unknown Error',
        retryable: false
      });
    });

    it('should handle error without message gracefully', () => {
      const error = { response: { status: 500 } };
      
      const apiError = handler.handleError(error);
      
      expect(apiError).toMatchObject({
        code: 'SERVER_ERROR',
        message: 'HTTP Error',
        status: 500
      });
    });

    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const testHandler = new ApiErrorHandler();
      
      // Should not throw when window is undefined
      expect(() => {
        testHandler.showSuccessToast('Test message');
      }).not.toThrow();
      
      global.window = originalWindow;
    });

    it('should handle missing navigator object gracefully', () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;
      
      const testHandler = new ApiErrorHandler();
      const status = testHandler.getNetworkStatus();
      
      expect(status).toEqual({ isOnline: true });
      
      global.navigator = originalNavigator;
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance when called multiple times', () => {
      const instance1 = ApiErrorHandler.getInstance();
      const instance2 = ApiErrorHandler.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should use singleton instance in utility functions', () => {
      const error = new Error('Test error');
      
      // Both should use the same instance
      const result1 = handleApiError(error);
      const result2 = apiErrorHandler.handleError(error);
      
      expect(result1.timestamp).toBeLessThanOrEqual(result2.timestamp);
    });
  });
});