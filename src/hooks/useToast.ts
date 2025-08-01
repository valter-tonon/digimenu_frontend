import { useCallback } from 'react';
import { Toast } from '@/components/notifications/ToastSystem';

export interface UseToastOptions {
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

export interface ToastMethods {
  success: (title: string, message: string, options?: UseToastOptions) => string;
  error: (title: string, message: string, options?: UseToastOptions) => string;
  warning: (title: string, message: string, options?: UseToastOptions) => string;
  info: (title: string, message: string, options?: UseToastOptions) => string;
  custom: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * Hook for managing toast notifications
 * Provides methods to show different types of toasts with queue management
 */
export function useToast(): ToastMethods {
  const addToast = useCallback((toastData: Omit<Toast, 'id' | 'timestamp'>): string => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast-add', { detail: toastData });
      window.dispatchEvent(event);
      
      // Return a generated ID for tracking
      return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return '';
  }, []);

  const removeToast = useCallback((id: string) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast-remove', { detail: { id } });
      window.dispatchEvent(event);
    }
  }, []);

  const clearAllToasts = useCallback(() => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast-clear');
      window.dispatchEvent(event);
    }
  }, []);

  const success = useCallback((title: string, message: string, options?: UseToastOptions): string => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: options?.duration,
      persistent: options?.persistent,
      actions: options?.actions
    });
  }, [addToast]);

  const error = useCallback((title: string, message: string, options?: UseToastOptions): string => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: options?.duration ?? 8000, // Longer duration for errors
      persistent: options?.persistent,
      actions: options?.actions
    });
  }, [addToast]);

  const warning = useCallback((title: string, message: string, options?: UseToastOptions): string => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: options?.duration ?? 6000,
      persistent: options?.persistent,
      actions: options?.actions
    });
  }, [addToast]);

  const info = useCallback((title: string, message: string, options?: UseToastOptions): string => {
    return addToast({
      type: 'info',
      title,
      message,
      duration: options?.duration,
      persistent: options?.persistent,
      actions: options?.actions
    });
  }, [addToast]);

  const custom = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>): string => {
    return addToast(toast);
  }, [addToast]);

  return {
    success,
    error,
    warning,
    info,
    custom,
    remove: removeToast,
    clear: clearAllToasts
  };
}

// Utility functions for direct usage without hook
export const toast = {
  success: (title: string, message: string, options?: UseToastOptions) => {
    if (typeof window !== 'undefined' && (window as any).toastSystem) {
      return (window as any).toastSystem.success(title, message, options);
    }
  },
  error: (title: string, message: string, options?: UseToastOptions) => {
    if (typeof window !== 'undefined' && (window as any).toastSystem) {
      return (window as any).toastSystem.error(title, message, options);
    }
  },
  warning: (title: string, message: string, options?: UseToastOptions) => {
    if (typeof window !== 'undefined' && (window as any).toastSystem) {
      return (window as any).toastSystem.warning(title, message, options);
    }
  },
  info: (title: string, message: string, options?: UseToastOptions) => {
    if (typeof window !== 'undefined' && (window as any).toastSystem) {
      return (window as any).toastSystem.info(title, message, options);
    }
  },
  remove: (id: string) => {
    if (typeof window !== 'undefined' && (window as any).toastSystem) {
      return (window as any).toastSystem.removeToast(id);
    }
  },
  clear: () => {
    if (typeof window !== 'undefined' && (window as any).toastSystem) {
      return (window as any).toastSystem.clearAllToasts();
    }
  }
};

export default useToast;