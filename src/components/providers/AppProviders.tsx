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
                      isStoreOpen={isStoreOpen ?? true}
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
                                <ToastProvider />
                                {children}
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


