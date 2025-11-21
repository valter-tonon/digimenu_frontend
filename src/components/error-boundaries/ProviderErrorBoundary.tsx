'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorReportingService } from '@/services/errorReporting';

interface ProviderErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  lastErrorTime: number;
}

interface ProviderErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  enableAutoRetry?: boolean;
  providerName?: string;
  enableMonitoring?: boolean;
}

export class ProviderErrorBoundary extends Component<
  ProviderErrorBoundaryProps,
  ProviderErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private errorReportingService: ErrorReportingService;

  constructor(props: ProviderErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: 0
    };
    this.errorReportingService = new ErrorReportingService(props.enableMonitoring);
  }

  static getDerivedStateFromError(error: Error): Partial<ProviderErrorBoundaryState> {
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { providerName = 'Unknown', maxRetries = 3, enableAutoRetry = true } = this.props;
    
    this.setState({ errorInfo });
    
    // Enhanced error logging with context
    const errorContext = {
      providerName,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      retryCount: this.state.retryCount,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      errorBoundary: 'ProviderErrorBoundary'
    };

    // Log to console with enhanced context
    console.group(`🚨 Provider Error: ${providerName}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', errorContext);
    console.groupEnd();
    
    // Report to monitoring service (with error handling)
    try {
      this.errorReportingService.reportError(error, errorContext);
    } catch (reportingError) {
      console.warn('Error reporting service failed:', reportingError);
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error for analytics with enhanced data
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'provider_error', {
        event_category: 'error',
        event_label: `${providerName}: ${error.message}`,
        custom_map: {
          provider_name: providerName,
          retry_count: this.state.retryCount,
          error_type: error.name
        },
        value: 1
      });
    }

    // Auto-retry logic with exponential backoff
    if (enableAutoRetry && this.state.retryCount < maxRetries) {
      this.scheduleAutoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private scheduleAutoRetry = () => {
    const { retryDelay = 1000 } = this.props;
    const backoffDelay = retryDelay * Math.pow(2, this.state.retryCount);
    
    this.setState({ isRetrying: true });
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry(true);
    }, backoffDelay);
  };

  private handleRetry = (isAutoRetry = false) => {
    const { maxRetries = 3, providerName = 'Unknown' } = this.props;
    
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    // Track retry attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'provider_retry', {
        event_category: 'error_recovery',
        event_label: `${providerName}: ${isAutoRetry ? 'auto' : 'manual'}`,
        custom_map: {
          provider_name: providerName,
          retry_count: this.state.retryCount + 1,
          retry_type: isAutoRetry ? 'auto' : 'manual'
        },
        value: 1
      });
    }

    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    } else {
      // Max retries reached
      this.setState({ isRetrying: false });
      console.warn(`Max retries (${maxRetries}) reached for provider: ${providerName}`);
    }
  };

  render() {
    if (this.state.hasError) {
      const { maxRetries = 3, providerName = 'Unknown' } = this.props;
      const { retryCount, isRetrying, error } = this.state;
      const canRetry = retryCount < maxRetries;
      const isMaxRetriesReached = retryCount >= maxRetries;

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                {isRetrying ? (
                  <svg className="animate-spin h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                )}
              </div>
            </div>
            
            {/* Error Title */}
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {isRetrying ? 'Tentando novamente...' : 'Algo deu errado'}
            </h2>
            
            {/* Error Description */}
            <div className="text-sm text-gray-600 mb-4">
              {isRetrying ? (
                <p>Tentando reconectar o {providerName}...</p>
              ) : isMaxRetriesReached ? (
                <div>
                  <p className="mb-2">
                    Não foi possível recuperar o {providerName} após {maxRetries} tentativas.
                  </p>
                  <p>Tente recarregar a página ou entre em contato com o suporte.</p>
                </div>
              ) : (
                <div>
                  <p className="mb-2">
                    Ocorreu um erro no {providerName}.
                  </p>
                  <p>
                    {canRetry && `Tentativa ${retryCount + 1} de ${maxRetries + 1}.`}
                  </p>
                </div>
              )}
            </div>

            {/* Retry Progress */}
            {(canRetry || isRetrying) && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((retryCount) / maxRetries) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isRetrying ? 'Reconectando...' : `${retryCount}/${maxRetries} tentativas`}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {canRetry && !isRetrying && (
                <button
                  onClick={() => this.handleRetry(false)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isRetrying}
                >
                  Tentar Novamente
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                disabled={isRetrying}
              >
                Recarregar Página
              </button>
            </div>

            {/* Support Contact */}
            {isMaxRetriesReached && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  Se o problema persistir, entre em contato com o suporte técnico.
                </p>
              </div>
            )}
            
            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                  <div className="mb-2">
                    <strong>Provider:</strong> {providerName}
                  </div>
                  <div className="mb-2">
                    <strong>Error:</strong> {error.name}: {error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Retry Count:</strong> {retryCount}
                  </div>
                  <div className="mb-2">
                    <strong>Timestamp:</strong> {new Date(this.state.lastErrorTime).toLocaleString()}
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600">Stack Trace</summary>
                    <pre className="mt-1 text-xs whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-gray-600">Component Stack</summary>
                      <pre className="mt-1 text-xs whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar error boundary programaticamente
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};