'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Touch-friendly button with proper sizing and feedback
 */
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  ripple?: boolean;
}

export function TouchButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  ripple = true,
  disabled,
  onClick,
  ...props
}: TouchButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(e);
  };

  const variantClasses = {
    primary: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 shadow-sm',
    outline: 'border-2 border-amber-500 text-amber-500 hover:bg-amber-50 active:bg-amber-100',
    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation select-none', // Touch optimizations
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white bg-opacity-30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Content */}
      <span className={cn('flex items-center justify-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
}

/**
 * Touch-friendly card with proper touch targets and feedback
 */
interface TouchCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function TouchCard({
  children,
  className,
  onClick,
  hoverable = true,
  padding = 'md'
}: TouchCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 transition-all duration-200',
        'touch-manipulation select-none', // Touch optimizations
        onClick && 'cursor-pointer',
        hoverable && 'hover:shadow-md hover:border-gray-300',
        onClick && 'active:scale-[0.98] active:shadow-sm',
        paddingClasses[padding],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Touch-friendly quantity selector
 */
interface TouchQuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function TouchQuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className
}: TouchQuantitySelectorProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <TouchButton
        variant="outline"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className="w-10 h-10 p-0 rounded-full"
        aria-label="Diminuir quantidade"
      >
        <span className="text-lg font-bold">−</span>
      </TouchButton>
      
      <span className="text-lg font-semibold min-w-[2rem] text-center">
        {value}
      </span>
      
      <TouchButton
        variant="outline"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className="w-10 h-10 p-0 rounded-full"
        aria-label="Aumentar quantidade"
      >
        <span className="text-lg font-bold">+</span>
      </TouchButton>
    </div>
  );
}

/**
 * Touch-friendly swipe container for horizontal scrolling
 */
interface TouchSwipeContainerProps {
  children: React.ReactNode;
  className?: string;
  showScrollbar?: boolean;
}

export function TouchSwipeContainer({
  children,
  className,
  showScrollbar = false
}: TouchSwipeContainerProps) {
  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto overscroll-x-contain',
        'touch-pan-x', // Enable horizontal touch scrolling
        !showScrollbar && 'scrollbar-hide',
        'snap-x snap-mandatory', // Snap scrolling
        className
      )}
      style={{
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
        msOverflowStyle: showScrollbar ? 'auto' : 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {children}
    </div>
  );
}

/**
 * Touch-friendly tab selector
 */
interface TouchTabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TouchTabs({
  tabs,
  activeTab,
  onChange,
  className
}: TouchTabsProps) {
  return (
    <div className={cn('flex bg-gray-100 rounded-lg p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            'touch-manipulation select-none min-h-[40px]', // Touch optimizations
            'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
            activeTab === tab.id
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-gray-200 text-gray-600'
              )}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Touch-friendly modal with proper mobile sizing
 */
interface TouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function TouchModal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className
}: TouchModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden',
        sizeClasses[size],
        className
      )}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <TouchButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 rounded-full"
              aria-label="Fechar"
            >
              <span className="text-xl">×</span>
            </TouchButton>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}