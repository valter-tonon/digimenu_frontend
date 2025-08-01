'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUIState } from '@/infrastructure/context/UIStateContext';

/**
 * Skip to content link for keyboard navigation
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      Pular para o conteúdo principal
    </a>
  );
}

/**
 * Screen reader only text component
 */
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Focus trap component for modals and dialogs
 */
interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  restoreFocus?: boolean;
}

export function FocusTrap({ children, isActive, restoreFocus = true }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, restoreFocus]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}

/**
 * Announcement component for screen readers
 */
interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

export function Announcement({ message, priority = 'polite', clearAfter = 5000 }: AnnouncementProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}

/**
 * Progress indicator with accessibility features
 */
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  description?: string;
  showPercentage?: boolean;
  className?: string;
}

export function AccessibleProgress({ 
  value, 
  max = 100, 
  label, 
  description,
  showPercentage = true,
  className = '' 
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);
  const progressId = React.useId();
  const descriptionId = React.useId();

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label htmlFor={progressId} className="text-sm font-medium">
            {label}
          </label>
          {showPercentage && (
            <span className="text-sm text-muted" aria-hidden="true">
              {percentage}%
            </span>
          )}
        </div>
      )}
      
      <div
        role="progressbar"
        id={progressId}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {description && (
        <p id={descriptionId} className="text-xs text-muted mt-1">
          {description}
        </p>
      )}
      
      <ScreenReaderOnly>
        Progresso: {percentage}% de {max}
      </ScreenReaderOnly>
    </div>
  );
}

/**
 * Accessible button with enhanced keyboard support
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Carregando...',
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enhanced keyboard support
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buttonRef.current?.click();
    }
  };

  const variantClasses = {
    primary: 'button button-primary',
    secondary: 'button button-secondary',
    outline: 'button button-outline',
    ghost: 'button button-ghost'
  };

  const sizeClasses = {
    sm: 'button-sm',
    md: '',
    lg: 'button-lg'
  };

  return (
    <button
      ref={buttonRef}
      className={`${variantClasses[variant]} ${sizeClasses[size]} focus-ring ${className}`}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      )}
      
      {!isLoading && leftIcon && (
        <span aria-hidden="true">{leftIcon}</span>
      )}
      
      <span>
        {isLoading ? loadingText : children}
      </span>
      
      {!isLoading && rightIcon && (
        <span aria-hidden="true">{rightIcon}</span>
      )}
      
      {isLoading && (
        <ScreenReaderOnly>
          {loadingText}
        </ScreenReaderOnly>
      )}
    </button>
  );
}

/**
 * Accessible form field with enhanced error handling
 */
interface AccessibleFieldProps {
  children: React.ReactNode;
  label: string;
  error?: string;
  help?: string;
  required?: boolean;
  className?: string;
}

export function AccessibleField({
  children,
  label,
  error,
  help,
  required = false,
  className = ''
}: AccessibleFieldProps) {
  const fieldId = React.useId();
  const errorId = React.useId();
  const helpId = React.useId();

  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={fieldId}
        className={`label ${required ? 'label-required' : ''}`}
      >
        {label}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-describedby': [
          error ? errorId : null,
          help ? helpId : null
        ].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required ? 'true' : undefined,
        className: `input ${error ? 'input-error' : ''} ${(children as React.ReactElement).props.className || ''}`
      })}
      
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
      
      {help && (
        <div id={helpId} className="help-text">
          {help}
        </div>
      )}
    </div>
  );
}

/**
 * Accessible modal dialog
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = ''
}: AccessibleModalProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <FocusTrap isActive={isOpen}>
        <div className={`relative bg-background rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 id={titleId} className="text-heading-4">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-md focus-ring"
              aria-label="Fechar modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {description && (
              <p id={descriptionId} className="text-body text-muted mb-4">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

/**
 * Accessible tooltip
 */
interface AccessibleTooltipProps {
  children: React.ReactNode;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function AccessibleTooltip({
  children,
  content,
  placement = 'top',
  delay = 500
}: AccessibleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipId = React.useId();

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      {React.cloneElement(children as React.ReactElement, {
        'aria-describedby': tooltipId,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip
      })}
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${placementClasses[placement]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing accessibility announcements
 */
export function useAccessibilityAnnouncements() {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
  }>>([]);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = Date.now().toString();
    setAnnouncements(prev => [...prev, { id, message, priority }]);

    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const AnnouncementRegion = () => (
    <>
      {announcements.map(({ id, message, priority }) => (
        <Announcement key={id} message={message} priority={priority} />
      ))}
    </>
  );

  return { announce, AnnouncementRegion };
}