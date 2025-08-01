'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ToastNotification from './ToastNotification';
import { ToastNotification as ToastType } from '@/services/apiErrorHandler';

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ 
  position = 'top-right',
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((event: CustomEvent<ToastType>) => {
    const newToast = event.detail;
    
    setToasts(prevToasts => {
      // Remove oldest toast if we exceed maxToasts
      const updatedToasts = prevToasts.length >= maxToasts 
        ? prevToasts.slice(1)
        : prevToasts;
      
      // Add new toast
      return [...updatedToasts, newToast];
    });
  }, [maxToasts]);

  const removeToast = useCallback((event: CustomEvent<{ id: string }>) => {
    const { id } = event.detail;
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const handleRemoveToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for toast events
    window.addEventListener('api-toast', addToast as EventListener);
    window.addEventListener('api-toast-remove', removeToast as EventListener);
    window.addEventListener('api-toast-clear', clearAllToasts);

    return () => {
      window.removeEventListener('api-toast', addToast as EventListener);
      window.removeEventListener('api-toast-remove', removeToast as EventListener);
      window.removeEventListener('api-toast-clear', clearAllToasts);
    };
  }, [addToast, removeToast, clearAllToasts]);

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

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  const toastContainer = (
    <div className={getPositionStyles()}>
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onRemove={handleRemoveToast}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(toastContainer, document.body);
};

export default ToastContainer;