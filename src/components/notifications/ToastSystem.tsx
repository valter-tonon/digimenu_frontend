'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
  timestamp: number;
}

interface ToastSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  defaultDuration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, isRemoving }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<number>(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const getToastStyles = () => {
    const baseStyles = `
      transform transition-all duration-300 ease-in-out
      bg-white border rounded-lg shadow-lg p-4 mb-3 max-w-sm w-full
      pointer-events-auto relative overflow-hidden
    `;
    
    const visibilityStyles = isRemoving 
      ? "translate-x-full opacity-0 scale-95" 
      : "translate-x-0 opacity-100 scale-100";
    
    const typeStyles = {
      success: "border-green-200 bg-green-50",
      error: "border-red-200 bg-red-50",
      warning: "border-yellow-200 bg-yellow-50",
      info: "border-blue-200 bg-blue-50"
    };

    return `${baseStyles} ${visibilityStyles} ${typeStyles[toast.type]}`;
  };

  const getIconForType = () => {
    const iconStyles = "h-5 w-5 flex-shrink-0";
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconStyles} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${iconStyles} text-red-600`} />;
      case 'warning':
        return <AlertTriangle className={`${iconStyles} text-yellow-600`} />;
      case 'info':
        return <Info className={`${iconStyles} text-blue-600`} />;
      default:
        return <Bell className={`${iconStyles} text-gray-600`} />;
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleRemove = useCallback(() => {
    onRemove(toast.id);
  }, [toast.id, onRemove]);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (toast.persistent || !toast.duration) return;
    
    setIsPaused(false);
    const remainingTime = (toast.duration * progressRef.current) / 100;
    
    if (remainingTime > 0) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.max(0, 100 - (elapsed / remainingTime) * 100);
        
        progressRef.current = newProgress;
        setProgress(newProgress);
        
        if (newProgress <= 0) {
          handleRemove();
        }
      }, 50);
    }
  }, [toast.duration, toast.persistent, handleRemove]);

  // Initialize timer
  useEffect(() => {
    if (!toast.persistent && toast.duration) {
      resumeTimer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [toast.duration, toast.persistent, resumeTimer]);

  return (
    <div 
      className={getToastStyles()}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role="alert"
      aria-live="polite"
    >
      {/* Progress bar */}
      {!toast.persistent && toast.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className={`h-full transition-all duration-75 ease-linear ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {getIconForType()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {toast.title}
            </h4>
            
            <button
              onClick={handleRemove}
              className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 leading-relaxed break-words">
            {toast.message}
          </p>
          
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    handleRemove();
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    action.style === 'primary'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {new Date(toast.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            
            {isPaused && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Pausado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToastSystem: React.FC<ToastSystemProps> = ({ 
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [removingToasts, setRemovingToasts] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((toastData: Omit<Toast, 'id' | 'timestamp'>) => {
    const newToast: Toast = {
      ...toastData,
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      duration: toastData.duration ?? defaultDuration
    };
    
    setToasts(prevToasts => {
      // Remove oldest toast if we exceed maxToasts
      const updatedToasts = prevToasts.length >= maxToasts 
        ? prevToasts.slice(1)
        : prevToasts;
      
      // Add new toast
      return [...updatedToasts, newToast];
    });

    return newToast.id;
  }, [maxToasts, defaultDuration]);

  const removeToast = useCallback((id: string) => {
    setRemovingToasts(prev => new Set(prev).add(id));
    
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
      setRemovingToasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  }, []);

  const clearAllToasts = useCallback(() => {
    // Mark all toasts as removing
    setRemovingToasts(new Set(toasts.map(toast => toast.id)));
    
    // Clear all after animation
    setTimeout(() => {
      setToasts([]);
      setRemovingToasts(new Set());
    }, 300);
  }, [toasts]);

  const getPositionStyles = () => {
    const baseStyles = "fixed z-50 pointer-events-none";
    
    switch (position) {
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'top-center':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseStyles} bottom-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseStyles} top-4 right-4`;
    }
  };

  // Expose methods globally for external usage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAddToast = (event: CustomEvent<Omit<Toast, 'id' | 'timestamp'>>) => {
      addToast(event.detail);
    };

    const handleRemoveToast = (event: CustomEvent<{ id: string }>) => {
      removeToast(event.detail.id);
    };

    const handleClearToasts = () => {
      clearAllToasts();
    };

    // Listen for toast events
    window.addEventListener('toast-add', handleAddToast as EventListener);
    window.addEventListener('toast-remove', handleRemoveToast as EventListener);
    window.addEventListener('toast-clear', handleClearToasts);

    // Expose methods to window for external access
    (window as any).toastSystem = {
      addToast,
      removeToast,
      clearAllToasts,
      success: (title: string, message: string, options?: Partial<Toast>) => 
        addToast({ type: 'success', title, message, ...options }),
      error: (title: string, message: string, options?: Partial<Toast>) => 
        addToast({ type: 'error', title, message, ...options }),
      warning: (title: string, message: string, options?: Partial<Toast>) => 
        addToast({ type: 'warning', title, message, ...options }),
      info: (title: string, message: string, options?: Partial<Toast>) => 
        addToast({ type: 'info', title, message, ...options })
    };

    return () => {
      window.removeEventListener('toast-add', handleAddToast as EventListener);
      window.removeEventListener('toast-remove', handleRemoveToast as EventListener);
      window.removeEventListener('toast-clear', handleClearToasts);
      delete (window as any).toastSystem;
    };
  }, [addToast, removeToast, clearAllToasts]);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  const toastContainer = (
    <div className={getPositionStyles()}>
      <div className="pointer-events-auto">
        {toasts.length > 1 && (
          <div className="mb-2 flex justify-end">
            <button
              onClick={clearAllToasts}
              className="text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm hover:shadow transition-all"
            >
              Limpar todas ({toasts.length})
            </button>
          </div>
        )}
        
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
            isRemoving={removingToasts.has(toast.id)}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(toastContainer, document.body);
};

export default ToastSystem;