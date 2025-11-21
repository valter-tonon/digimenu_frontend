'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorReportingService } from '@/services/errorReporting';

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableReporting?: boolean;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  private errorReportingService: ErrorReportingService;

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
    this.errorReportingService = new ErrorReportingService(props.enableReporting);
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    const errorId = `global-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    const errorId = this.state.errorId || 'unknown';
    
    // Enhanced error context for global errors
    const errorContext = {
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : 'Unknown',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : null,
      localStorage: this.getLocalStorageSnapshot(),
      sessionStorage: this.getSessionStorageSnapshot(),
      errorStack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      errorBoundary: 'GlobalErrorBoundary',
      buildInfo: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      }
    };

    // Enhanced console logging
    console.group(`🚨 GLOBAL ERROR: ${errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', errorContext);
    console.groupEnd();
    
    // Report to monitoring service
    try {
      this.errorReportingService.reportError(error, errorContext);
    } catch (reportingError) {
      console.warn('Error reporting service failed:', reportingError);
    }
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Track critical error for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'global_error', {
        event_category: 'error',
        event_label: `${error.name}: ${error.message}`,
        custom_map: {
          error_id: errorId,
          error_type: error.name,
          error_stack: error.stack?.substring(0, 500) // Truncate for analytics
        },
        value: 1
      });
    }

    // Send error to external monitoring if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          errorBoundary: {
            name: 'GlobalErrorBoundary',
            errorId,
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  private getLocalStorageSnapshot(): Record<string, any> {
    try {
      if (typeof window === 'undefined') return {};
      
      const snapshot: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          // Only include non-sensitive data
          if (!key.includes('token') && !key.includes('password') && !key.includes('secret')) {
            snapshot[key] = localStorage.getItem(key);
          }
        }
      }
      return snapshot;
    } catch {
      return {};
    }
  }

  private getSessionStorageSnapshot(): Record<string, any> {
    try {
      if (typeof window === 'undefined') return {};
      
      const snapshot: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          // Only include non-sensitive data
          if (!key.includes('token') && !key.includes('password') && !key.includes('secret')) {
            snapshot[key] = sessionStorage.getItem(key);
          }
        }
      }
      return snapshot;
    } catch {
      return {};
    }
  }

  private handleReload = () => {
    // Clear any potentially corrupted state
    try {
      if (typeof window !== 'undefined') {
        // Clear session storage but keep localStorage for user preferences
        sessionStorage.clear();
        
        // Track recovery attempt
        if ((window as any).gtag) {
          (window as any).gtag('event', 'error_recovery_reload', {
            event_category: 'error_recovery',
            event_label: this.state.errorId || 'unknown',
            value: 1
          });
        }
      }
    } catch (error) {
      console.warn('Failed to clear storage during recovery:', error);
    }
    
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      if (typeof window !== 'undefined') {
        // Track recovery attempt
        if ((window as any).gtag) {
          (window as any).gtag('event', 'error_recovery_home', {
            event_category: 'error_recovery',
            event_label: this.state.errorId || 'unknown',
            value: 1
          });
        }
        
        window.location.href = '/';
      }
    } catch (error) {
      console.warn('Failed to navigate home during recovery:', error);
      this.handleReload();
    }
  };

  private handleReportIssue = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.name || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error: ${error?.message || 'Unknown error occurred'}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:

`);
    
    const mailtoUrl = `mailto:support@digimenu.com?subject=${subject}&body=${body}`;
    
    try {
      window.open(mailtoUrl, '_blank');
      
      // Track issue report
      if ((window as any).gtag) {
        (window as any).gtag('event', 'error_report_issue', {
          event_category: 'error_recovery',
          event_label: errorId || 'unknown',
          value: 1
        });
      }
    } catch (error) {
      console.warn('Failed to open email client:', error);
      // Fallback: copy error info to clipboard
      navigator.clipboard?.writeText(`Error ID: ${errorId}\nError: ${this.state.error?.message}`);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
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
              </div>
            </div>
            
            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Algo deu errado
            </h1>
            
            {/* Error Description */}
            <div className="text-gray-600 mb-6 space-y-2">
              <p>
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada automaticamente.
              </p>
              <p className="text-sm">
                ID do erro: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{errorId}</code>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Ir para Início
              </button>
              
              <button
                onClick={this.handleReportIssue}
                className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Reportar Problema
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-sm text-gray-500">
              <p>
                Se o problema persistir, entre em contato com nosso suporte em{' '}
                <a 
                  href="mailto:support@digimenu.com" 
                  className="text-blue-600 hover:underline"
                >
                  support@digimenu.com
                </a>
              </p>
            </div>
            
            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.name}: {error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Error ID:</strong> {errorId}
                  </div>
                  <div className="mb-2">
                    <strong>Timestamp:</strong> {new Date().toLocaleString()}
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

// Hook for programmatic error reporting
export const useGlobalErrorHandler = () => {
  const reportError = React.useCallback((error: Error, context?: any) => {
    // Report error to global error boundary
    console.error('Manual error report:', error, context);
    
    // Track manual error report
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'manual_error_report', {
        event_category: 'error',
        event_label: error.message,
        value: 1
      });
    }
    
    // Report to external services
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: context
      });
    }
  }, []);

  return { reportError };
};