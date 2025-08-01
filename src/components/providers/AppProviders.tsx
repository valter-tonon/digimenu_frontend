'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { StoreStatusProvider } from '@/infrastructure/context/StoreStatusContext';
import { MenuProvider } from '@/infrastructure/context/MenuContext';
import { CartProvider } from '@/infrastructure/context/CartContext';

import { ToastProvider } from '@/components/providers/ToastProvider';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';
import { ProviderErrorBoundary } from '@/components/error-boundaries/ProviderErrorBoundary';
import { GlobalErrorBoundary } from '@/components/error-boundaries/GlobalErrorBoundary';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { UIStateProvider } from '@/infrastructure/context/UIStateContext';

interface AppProvidersProps {
  children: ReactNode;
  // Store context props
  storeId?: string;
  tableId?: string;
  isStoreOpen?: boolean;
  initialStore?: any;
  // UI props
  initialTheme?: 'light' | 'dark' | 'auto';
  performanceMode?: 'high' | 'balanced' | 'low';

  // Cart props
  minimumOrderValue?: number;
  deliveryFee?: number;
}

/**
 * AppProviders component that integrates all context providers with proper hierarchy
 * and error boundaries. This ensures consistent provider availability across the app.
 */
export function AppProviders({
  children,
  storeId,
  tableId,
  isStoreOpen,
  initialStore,
  initialTheme = 'auto',
  performanceMode = 'balanced',

  minimumOrderValue = 0,
  deliveryFee = 0,
}: AppProvidersProps) {
  return (
    <GlobalErrorBoundary>
      {/* Performance monitoring should be at the top level */}
      <PerformanceProvider>
          <AuthProvider>
            {/* Theme provider */}
            <ProviderErrorBoundary
              providerName="ThemeProvider"
              enableMonitoring={true}
              maxRetries={3}
            >
              <ThemeProvider initialTheme={initialTheme}>
                    {/* UI State provider - manages animations, modals, loading states */}
                    <ProviderErrorBoundary
                      providerName="UIStateProvider"
                      enableMonitoring={true}
                      maxRetries={3}
                    >
                      <UIStateProvider
                        initialTheme={initialTheme}
                        performanceMode={performanceMode}
                      >
                        {/* Store status provider - manages store state */}
                        <ProviderErrorBoundary
                          providerName="StoreStatusProvider"
                          enableMonitoring={true}
                          maxRetries={5}
                          enableAutoRetry={true}
                        >
                          <StoreStatusProvider
                            storeId={storeId}
                            isStoreOpen={isStoreOpen}
                            initialStore={initialStore}
                          >
                            {/* Cart provider - depends on store status */}
                            <ProviderErrorBoundary
                              providerName="CartProvider"
                              enableMonitoring={true}
                              maxRetries={3}
                            >
                              <CartProvider
                                storeId={storeId}
                                tableId={tableId}
                                minimumOrderValue={minimumOrderValue}
                                deliveryFee={deliveryFee}
                              >
                                {/* Menu provider - depends on cart */}
                                <ProviderErrorBoundary
                                  providerName="MenuProvider"
                                  enableMonitoring={true}
                                  maxRetries={3}
                                >
                                  <MenuProvider
                                    initialStoreSlug={storeId}
                                    initialTableId={tableId}
                                  >
                                    {/* Toast provider - should be near the top for global access */}
                                    <ProviderErrorBoundary
                                      providerName="ToastProvider"
                                      enableMonitoring={false}
                                      maxRetries={1}
                                    >
                                      <ToastProvider>
                                        {children}
                                      </ToastProvider>
                                    </ProviderErrorBoundary>
                                  </MenuProvider>
                                </ProviderErrorBoundary>
                              </CartProvider>
                            </ProviderErrorBoundary>
                          </StoreStatusProvider>
                        </ProviderErrorBoundary>
                      </UIStateProvider>
                    </ProviderErrorBoundary>
                  </ThemeProvider>
                </ProviderErrorBoundary>
          </AuthProvider>
      </PerformanceProvider>
    </GlobalErrorBoundary>
  );
}

/**
 * Hook to validate that all required providers are available
 * This can be used in components to ensure proper provider setup
 */
export function useProviderValidation() {
  const [validationResults, setValidationResults] = React.useState<{
    [key: string]: boolean;
  }>({});

  React.useEffect(() => {
    const validateProviders = async () => {
      const results: { [key: string]: boolean } = {};

      try {
        // Validate each provider by attempting to use their hooks
        const { useAuth } = await import('@/hooks/use-auth');
        const { useStoreStatus } = await import('@/infrastructure/context/StoreStatusContext');
        const { useCart } = await import('@/infrastructure/context/CartContext');
        const { useUIState } = await import('@/infrastructure/context/UIStateContext');
        const { useLayout } = await import('@/infrastructure/context/LayoutContext');
        const { useMenu } = await import('@/infrastructure/context/MenuContext');

        // Test each hook
        try {
          useAuth();
          results.auth = true;
        } catch {
          results.auth = false;
        }

        try {
          useStoreStatus();
          results.storeStatus = true;
        } catch {
          results.storeStatus = false;
        }

        try {
          useCart();
          results.cart = true;
        } catch {
          results.cart = false;
        }

        try {
          useUIState();
          results.uiState = true;
        } catch {
          results.uiState = false;
        }



        try {
          useMenu();
          results.menu = true;
        } catch {
          results.menu = false;
        }

        setValidationResults(results);
      } catch (error) {
        console.error('Provider validation failed:', error);
      }
    };

    validateProviders();
  }, []);

  return {
    validationResults,
    allProvidersValid: Object.values(validationResults).every(Boolean),
    invalidProviders: Object.entries(validationResults)
      .filter(([_, isValid]) => !isValid)
      .map(([name]) => name)
  };
}

/**
 * Development component to display provider status
 * Only rendered in development mode
 */
export function ProviderDebugInfo() {
  const { validationResults, allProvidersValid, invalidProviders } = useProviderValidation();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs z-50">
      <div className="font-bold mb-2">Provider Status</div>
      <div className="space-y-1">
        {Object.entries(validationResults).map(([name, isValid]) => (
          <div key={name} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isValid ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className={isValid ? 'text-green-300' : 'text-red-300'}>
              {name}
            </span>
          </div>
        ))}
      </div>
      {!allProvidersValid && (
        <div className="mt-2 text-red-300 text-xs">
          Invalid: {invalidProviders.join(', ')}
        </div>
      )}
    </div>
  );
}
