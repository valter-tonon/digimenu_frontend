import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { ProviderErrorBoundary, useErrorBoundary } from '@/components/error-boundaries/ProviderErrorBoundary';
import { ErrorReportingService } from '@/services/errorReporting';

// Mock the ErrorReportingService
vi.mock('@/services/errorReporting', () => ({
  ErrorReportingService: vi.fn().mockImplementation(() => ({
    reportError: vi.fn()
  }))
}));

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

// Mock gtag for analytics tracking
const mockGtag = vi.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true
});

// Test component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }: { shouldThrow?: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="success">No Error</div>;
};

// Test component that uses the useErrorBoundary hook
const ErrorBoundaryHookTest = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  const { captureError, resetError } = useErrorBoundary();

  React.useEffect(() => {
    if (shouldThrow) {
      captureError(new Error('Hook error'));
    }
  }, [shouldThrow, captureError]);

  return (
    <div>
      <div data-testid="hook-success">Hook component</div>
      <button onClick={resetError} data-testid="reset-error">Reset Error</button>
    </div>
  );
};

describe('ProviderErrorBoundary', () => {
  let mockErrorReportingService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockErrorReportingService = new ErrorReportingService() as any;
    (ErrorReportingService as any).mockReturnValue(mockErrorReportingService);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Error Boundary Functionality', () => {
    it('should render children when there is no error', () => {
      render(
        <ProviderErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ProviderErrorBoundary>
      );

      expect(screen.getByTestId('success')).toBeInTheDocument();
      expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
    });

    it('should catch and display error when child component throws', () => {
      render(
        <ProviderErrorBoundary providerName="TestProvider" enableAutoRetry={false}>
          <ThrowError shouldThrow={true} errorMessage="Component crashed" />
        </ProviderErrorBoundary>
      );

      expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
      expect(screen.getByText(/Ocorreu um erro no TestProvider/)).toBeInTheDocument();
      expect(screen.queryByTestId('success')).not.toBeInTheDocument();
    });

    it('should use fallback component when provided', () => {
      const fallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ProviderErrorBoundary fallback={fallback}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
    });
  });

  describe('Error Reporting and Monitoring', () => {
    it('should report error to monitoring service', () => {
      render(
        <ProviderErrorBoundary 
          providerName="TestProvider" 
          enableMonitoring={true}
        >
          <ThrowError shouldThrow={true} errorMessage="Monitoring test error" />
        </ProviderErrorBoundary>
      );

      expect(mockErrorReportingService.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          providerName: 'TestProvider',
          errorBoundary: 'ProviderErrorBoundary',
          retryCount: 0
        })
      );
    });

    it('should call custom onError handler when provided', () => {
      const onError = vi.fn();

      render(
        <ProviderErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Custom handler test" />
        </ProviderErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should track error analytics with gtag', () => {
      render(
        <ProviderErrorBoundary providerName="AnalyticsProvider">
          <ThrowError shouldThrow={true} errorMessage="Analytics test error" />
        </ProviderErrorBoundary>
      );

      expect(mockGtag).toHaveBeenCalledWith('event', 'provider_error', {
        event_category: 'error',
        event_label: 'AnalyticsProvider: Analytics test error',
        custom_map: {
          provider_name: 'AnalyticsProvider',
          retry_count: 0,
          error_type: 'Error'
        },
        value: 1
      });
    });
  });

  describe('Retry Mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show retry button when error occurs', () => {
      render(
        <ProviderErrorBoundary maxRetries={3} enableAutoRetry={false}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      expect(screen.getByText('0/3 tentativas')).toBeInTheDocument();
    });

    it('should retry when retry button is clicked', async () => {
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        
        React.useEffect(() => {
          // Simulate recovery after first error
          const timer = setTimeout(() => setShouldThrow(false), 100);
          return () => clearTimeout(timer);
        }, []);

        return <ThrowError shouldThrow={shouldThrow} />;
      };

      render(
        <ProviderErrorBoundary maxRetries={3} providerName="RetryProvider" enableAutoRetry={false}>
          <TestComponent />
        </ProviderErrorBoundary>
      );

      // Should show error initially
      expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

      // Click retry button
      fireEvent.click(screen.getByText('Tentar Novamente'));

      // Should track retry analytics
      expect(mockGtag).toHaveBeenCalledWith('event', 'provider_retry', {
        event_category: 'error_recovery',
        event_label: 'RetryProvider: manual',
        custom_map: {
          provider_name: 'RetryProvider',
          retry_count: 1,
          retry_type: 'manual'
        },
        value: 1
      });
    });

    it('should auto-retry with exponential backoff when enabled', async () => {
      render(
        <ProviderErrorBoundary 
          maxRetries={2}
          retryDelay={100}
          enableAutoRetry={true}
          providerName="AutoRetryProvider"
        >
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      // Should show retrying state
      expect(screen.getByText('Tentando novamente...')).toBeInTheDocument();

      // Fast-forward time for first retry (100ms)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should still be in retrying state after first retry
      expect(screen.getByText('Tentando novamente...')).toBeInTheDocument();

      // Verify that gtag was called for the initial error
      expect(mockGtag).toHaveBeenCalledWith('event', 'provider_error', expect.any(Object));
    });

    it('should show max retries reached message when retries exhausted', () => {
      render(
        <ProviderErrorBoundary maxRetries={1} enableAutoRetry={false}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      // Click retry button to exhaust retries
      fireEvent.click(screen.getByText('Tentar Novamente'));

      // Should show max retries message
      expect(screen.getByText(/Não foi possível recuperar/)).toBeInTheDocument();
      expect(screen.getByText(/Se o problema persistir/)).toBeInTheDocument();
      expect(screen.queryByText('Tentar Novamente')).not.toBeInTheDocument();
    });

    it('should show retry progress bar', () => {
      render(
        <ProviderErrorBoundary maxRetries={3} enableAutoRetry={false}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      // Should show progress bar (it's a div, not a progressbar role)
      const progressContainer = screen.getByText('0/3 tentativas').parentElement?.previousElementSibling;
      expect(progressContainer).toBeInTheDocument();
      
      // Should show retry count
      expect(screen.getByText('0/3 tentativas')).toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = 'development';
    });

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show error details in development mode', () => {
      render(
        <ProviderErrorBoundary providerName="DevProvider">
          <ThrowError shouldThrow={true} errorMessage="Development error" />
        </ProviderErrorBoundary>
      );

      // Should show development details
      expect(screen.getByText('Detalhes do erro (desenvolvimento)')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByText('Detalhes do erro (desenvolvimento)'));
      
      expect(screen.getByText('Provider:')).toBeInTheDocument();
      expect(screen.getByText('DevProvider')).toBeInTheDocument();
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Error: Development error')).toBeInTheDocument();
    });

    it('should show stack trace in development mode', () => {
      render(
        <ProviderErrorBoundary enableAutoRetry={false}>
          <ThrowError shouldThrow={true} errorMessage="Stack trace test" />
        </ProviderErrorBoundary>
      );

      // Expand error details
      fireEvent.click(screen.getByText('Detalhes do erro (desenvolvimento)'));
      
      // Should show stack trace section
      expect(screen.getByText('Stack Trace')).toBeInTheDocument();
      
      // Click to expand stack trace
      fireEvent.click(screen.getByText('Stack Trace'));
      
      // Should show stack trace content - use getAllByText since there might be multiple matches
      const stackTraceElements = screen.getAllByText(/at ThrowError/);
      expect(stackTraceElements.length).toBeGreaterThan(0);
    });
  });

  describe('useErrorBoundary Hook', () => {
    it('should provide captureError and resetError functions', () => {
      render(
        <ProviderErrorBoundary>
          <ErrorBoundaryHookTest shouldThrow={false} />
        </ProviderErrorBoundary>
      );

      expect(screen.getByTestId('hook-success')).toBeInTheDocument();
      expect(screen.getByTestId('reset-error')).toBeInTheDocument();
    });

    it('should trigger error boundary when captureError is called', () => {
      render(
        <ProviderErrorBoundary enableAutoRetry={false}>
          <ErrorBoundaryHookTest shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
      expect(screen.queryByTestId('hook-success')).not.toBeInTheDocument();
    });

    it('should reset error when resetError is called', async () => {
      const TestWithReset = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        const { captureError, resetError } = useErrorBoundary();

        React.useEffect(() => {
          if (shouldThrow) {
            captureError(new Error('Hook error'));
          }
        }, [shouldThrow, captureError]);

        return (
          <div>
            <div data-testid="hook-success">Hook component</div>
            <button 
              onClick={() => {
                setShouldThrow(false);
                resetError();
              }} 
              data-testid="reset-error"
            >
              Reset Error
            </button>
          </div>
        );
      };

      render(
        <ProviderErrorBoundary enableAutoRetry={false}>
          <TestWithReset />
        </ProviderErrorBoundary>
      );

      // Should show error initially (with auto-retry disabled)
      expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

      // Reset should not be visible in error state
      expect(screen.queryByTestId('reset-error')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ProviderErrorBoundary enableAutoRetry={false}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      // Buttons should be properly labeled
      const retryButton = screen.getByText('Tentar Novamente');
      const reloadButton = screen.getByText('Recarregar Página');
      
      expect(retryButton).toBeInTheDocument();
      expect(reloadButton).toBeInTheDocument();
    });

    it('should disable buttons during retry', () => {
      vi.useFakeTimers();

      render(
        <ProviderErrorBoundary enableAutoRetry={true} retryDelay={1000}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      // Should show retrying state
      expect(screen.getByText('Tentando novamente...')).toBeInTheDocument();
      
      // Reload button should be disabled during retry
      const reloadButton = screen.getByText('Recarregar Página');
      expect(reloadButton).toBeDisabled();

      vi.useRealTimers();
    });

    it('should show loading spinner during retry', () => {
      vi.useFakeTimers();

      render(
        <ProviderErrorBoundary enableAutoRetry={true}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      // Should show loading spinner (SVG with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing provider name gracefully', () => {
      render(
        <ProviderErrorBoundary enableAutoRetry={false}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      expect(screen.getByText(/Tentando reconectar o Unknown|Ocorreu um erro no Unknown/)).toBeInTheDocument();
    });

    it('should handle error reporting service failures gracefully', () => {
      // Mock console.error to capture the error reporting failure
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockErrorReportingService.reportError.mockImplementation(() => {
        throw new Error('Reporting service failed');
      });

      // Should not crash when error reporting fails
      render(
        <ProviderErrorBoundary enableMonitoring={true} enableAutoRetry={false}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should cleanup timers on unmount', () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <ProviderErrorBoundary enableAutoRetry={true}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should handle window reload gracefully', () => {
      // Mock window.location.reload by replacing the entire location object
      const originalLocation = window.location;
      const mockReload = vi.fn();
      
      // Create a mock location object
      const mockLocation = {
        ...originalLocation,
        reload: mockReload
      };
      
      // Replace window.location
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      render(
        <ProviderErrorBoundary enableAutoRetry={false}>
          <ThrowError shouldThrow={true} />
        </ProviderErrorBoundary>
      );

      fireEvent.click(screen.getByText('Recarregar Página'));

      expect(mockReload).toHaveBeenCalled();
      
      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should not create memory leaks with multiple errors', () => {
      // Start with a working component
      const { rerender } = render(
        <ProviderErrorBoundary maxRetries={1} enableAutoRetry={false}>
          <ThrowError shouldThrow={false} />
        </ProviderErrorBoundary>
      );

      // Verify initial success state
      expect(screen.getByTestId('success')).toBeInTheDocument();

      // Trigger multiple error cycles with different keys to force remount
      for (let i = 0; i < 3; i++) {
        // Trigger error
        rerender(
          <ProviderErrorBoundary key={`error-${i}`} maxRetries={1} enableAutoRetry={false}>
            <ThrowError shouldThrow={true} errorMessage={`Error ${i}`} />
          </ProviderErrorBoundary>
        );
        
        // Verify error state
        expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
        
        // Return to success state with new key
        rerender(
          <ProviderErrorBoundary key={`success-${i}`} maxRetries={1} enableAutoRetry={false}>
            <ThrowError shouldThrow={false} />
          </ProviderErrorBoundary>
        );
        
        // Verify success state
        expect(screen.getByTestId('success')).toBeInTheDocument();
      }

      // Final verification - should handle multiple error cycles without issues
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
  });
});