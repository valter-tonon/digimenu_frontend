'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MobileNavigation } from '@/components/ui/MobileNavigation';
import { ResponsiveContainer } from '@/components/ui/ResponsiveGrid';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  showMobileNav?: boolean;
  storeName?: string;
  storeId?: string;
  tableId?: string;
  cartItemsCount?: number;
  isAuthenticated?: boolean;
  onCartClick?: () => void;
  onSearchClick?: () => void;
}

/**
 * Main responsive layout wrapper with mobile navigation and proper spacing
 */
export function ResponsiveLayout({
  children,
  className,
  showMobileNav = true,
  storeName,
  storeId,
  tableId,
  cartItemsCount = 0,
  isAuthenticated = false,
  onCartClick,
  onSearchClick
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      {showMobileNav && isMobile && (
        <MobileNavigation
          cartItemsCount={cartItemsCount}
          onCartClick={onCartClick}
          onSearchClick={onSearchClick}
          storeName={storeName}
          storeId={storeId}
          tableId={tableId}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        'w-full',
        showMobileNav && isMobile && 'pt-14 pb-16', // Space for mobile nav
        className
      )}>
        {children}
      </main>
    </div>
  );
}

/**
 * Page wrapper with responsive container and proper spacing
 */
interface ResponsivePageProps {
  children: React.ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function ResponsivePage({
  children,
  className,
  containerSize = 'lg',
  padding = 'md',
  title,
  subtitle,
  showBackButton = false,
  onBackClick
}: ResponsivePageProps) {
  return (
    <ResponsiveContainer size={containerSize} padding={padding} className={className}>
      {/* Page Header */}
      {(title || showBackButton) && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            {showBackButton && (
              <button
                onClick={onBackClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Voltar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {title && (
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      {children}
    </ResponsiveContainer>
  );
}

/**
 * Card layout for responsive content sections
 */
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveCard({
  children,
  className,
  title,
  subtitle,
  padding = 'md',
  shadow = 'sm'
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200',
      shadowClasses[shadow],
      paddingClasses[padding],
      className
    )}>
      {/* Card Header */}
      {(title || subtitle) && (
        <div className="mb-4 sm:mb-6">
          {title && (
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Card Content */}
      {children}
    </div>
  );
}

/**
 * Responsive section with proper spacing
 */
interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveSection({
  children,
  className,
  spacing = 'md'
}: ResponsiveSectionProps) {
  const spacingClasses = {
    sm: 'mb-4 sm:mb-6',
    md: 'mb-6 sm:mb-8',
    lg: 'mb-8 sm:mb-12',
    xl: 'mb-12 sm:mb-16'
  };

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
}

/**
 * Responsive form wrapper with proper spacing and validation display
 */
interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  title?: string;
  subtitle?: string;
  errors?: Record<string, string>;
}

export function ResponsiveForm({
  children,
  className,
  onSubmit,
  title,
  subtitle,
  errors
}: ResponsiveFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Form Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Global Form Errors */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Erro no formulário
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>• {message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      {children}
    </form>
  );
}

/**
 * Responsive input field with proper labeling and error display
 */
interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export function ResponsiveInput({
  label,
  error,
  helper,
  required,
  className,
  ...props
}: ResponsiveInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        className={cn(
          'w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
          'text-sm sm:text-base',
          'touch-manipulation min-h-[44px]',
          error && 'border-red-300 focus:ring-red-500',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}

/**
 * Responsive textarea with proper labeling and error display
 */
interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export function ResponsiveTextarea({
  label,
  error,
  helper,
  required,
  className,
  ...props
}: ResponsiveTextareaProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        className={cn(
          'w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
          'text-sm sm:text-base',
          'touch-manipulation min-h-[88px]',
          error && 'border-red-300 focus:ring-red-500',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}