/**
 * Unit Tests for ToastProvider Component
 * Tests toast context management and provider functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/providers/ToastProvider';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Test component to use the toast context
const TestComponent = () => {
  const { 
    toasts, 
    addToast, 
    removeToast, 
    clearAllToasts,
    success,
    error,
    warning,
    info
  } = useToast();

  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      <button onClick={() => addToast({
        type: 'success',
        title: 'Test Toast',
        message: 'Test message'
      })}>
        Add Toast
      </button>
      <button onClick={() => success('Success message')}>
        Add Success
      </button>
      <button onClick={() => error('Error message')}>
        Add Error
      </button>
      <button onClick={() => warning('Warning message')}>
        Add Warning
      </button>
      <button onClick={() => info('Info message')}>
        Add Info
      </button>
      <button onClick={() => removeToast(toasts[0]?.id)}>
        Remove First Toast
      </button>
      <button onClick={clearAllToasts}>
        Clear All
      </button>
      {toasts.map(toast => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          <span>{toast.title}</span>
          <span>{toast.message}</span>
          <span>{toast.type}</span>
        </div>
      ))}
    </div>
  );
};

// Test component that tries to use toast context without provider
const TestComponentWithoutProvider = () => {
  const { addToast } = useToast();
  return <button onClick={() => addToast({ type: 'info', title: 'Test' })}>Test</button>;
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Provider Setup', () => {
    it('should provide toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
      expect(screen.getByText('Add Toast')).toBeInTheDocument();
    });

    it('should throw error when useToast is used without provider', () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useToast must be used within a ToastProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Toast Management', () => {
    it('should add toast correctly', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('success')).toBeInTheDocument();
    });

    it('should generate unique IDs for toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));

      const toasts = screen.getAllByTestId(/toast-/);
      expect(toasts).toHaveLength(2);
      
      const ids = toasts.map(toast => toast.getAttribute('data-testid'));
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('should remove specific toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByText('Remove First Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should clear all toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');

      fireEvent.click(screen.getByText('Clear All'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('Convenience Methods', () => {
    it('should add success toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Success'));

      expect(screen.getByText('Sucesso')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('success')).toBeInTheDocument();
    });

    it('should add error toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Error'));

      expect(screen.getByText('Erro')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('should add warning toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Warning'));

      expect(screen.getByText('Atenção')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('warning')).toBeInTheDocument();
    });

    it('should add info toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Info'));

      expect(screen.getByText('Informação')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('info')).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss Functionality', () => {
    it('should auto-dismiss toast after duration', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Fast-forward time by default duration (5000ms)
      act(() => {
        vi.advanceTimersByTime(5100);
      });

      await waitFor(() => {
        expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
      });
    });

    it('should not auto-dismiss persistent toasts', async () => {
      const TestComponentWithPersistent = () => {
        const { toasts, addToast } = useToast();
        return (
          <div>
            <div data-testid="toast-count">{toasts.length}</div>
            <button onClick={() => addToast({
              type: 'error',
              title: 'Persistent Toast',
              message: 'This will not auto-dismiss',
              persistent: true
            })}>
              Add Persistent Toast
            </button>
          </div>
        );
      };

      render(
        <ToastProvider>
          <TestComponentWithPersistent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Persistent Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Toast should still be there
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    });

    it('should use custom duration', async () => {
      const TestComponentWithCustomDuration = () => {
        const { toasts, addToast } = useToast();
        return (
          <div>
            <div data-testid="toast-count">{toasts.length}</div>
            <button onClick={() => addToast({
              type: 'info',
              title: 'Custom Duration',
              message: 'Custom duration toast',
              duration: 1000
            })}>
              Add Custom Duration Toast
            </button>
          </div>
        );
      };

      render(
        <ToastProvider>
          <TestComponentWithCustomDuration />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Custom Duration Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Fast-forward by custom duration
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      await waitFor(() => {
        expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Toast Limits', () => {
    it('should limit number of toasts', () => {
      render(
        <ToastProvider maxToasts={2}>
          <TestComponent />
        </ToastProvider>
      );

      // Add 3 toasts
      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));

      // Should only have 2 toasts (oldest removed)
      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
    });

    it('should remove oldest toast when limit exceeded', () => {
      const TestComponentWithIds = () => {
        const { toasts, addToast } = useToast();
        return (
          <div>
            <div data-testid="toast-count">{toasts.length}</div>
            <button onClick={() => addToast({
              type: 'info',
              title: `Toast ${Date.now()}`,
              message: 'Test message'
            })}>
              Add Unique Toast
            </button>
            {toasts.map(toast => (
              <div key={toast.id} data-testid={`toast-${toast.id}`}>
                {toast.title}
              </div>
            ))}
          </div>
        );
      };

      render(
        <ToastProvider maxToasts={2}>
          <TestComponentWithIds />
        </ToastProvider>
      );

      // Add first toast
      fireEvent.click(screen.getByText('Add Unique Toast'));
      const firstToastTitle = screen.getAllByTestId(/toast-/)[0].textContent;

      // Add second toast
      fireEvent.click(screen.getByText('Add Unique Toast'));
      
      // Add third toast (should remove first)
      fireEvent.click(screen.getByText('Add Unique Toast'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
      expect(screen.queryByText(firstToastTitle!)).not.toBeInTheDocument();
    });
  });

  describe('Toast Actions', () => {
    it('should handle toast actions', () => {
      const mockAction = vi.fn();
      
      const TestComponentWithActions = () => {
        const { toasts, addToast } = useToast();
        return (
          <div>
            <div data-testid="toast-count">{toasts.length}</div>
            <button onClick={() => addToast({
              type: 'info',
              title: 'Toast with Actions',
              message: 'This toast has actions',
              actions: [
                { label: 'Action 1', action: mockAction, style: 'primary' },
                { label: 'Action 2', action: vi.fn(), style: 'secondary' }
              ]
            })}>
              Add Toast with Actions
            </button>
            {toasts.map(toast => (
              <div key={toast.id} data-testid={`toast-${toast.id}`}>
                {toast.title}
                {toast.actions?.map((action, index) => (
                  <button key={index} onClick={action.action}>
                    {action.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        );
      };

      render(
        <ToastProvider>
          <TestComponentWithActions />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast with Actions'));
      
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Action 1'));
      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid toast data gracefully', () => {
      const TestComponentWithInvalidToast = () => {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast(null as any)}>
            Add Invalid Toast
          </button>
        );
      };

      render(
        <ToastProvider>
          <TestComponentWithInvalidToast />
        </ToastProvider>
      );

      // Should not throw error
      expect(() => {
        fireEvent.click(screen.getByText('Add Invalid Toast'));
      }).not.toThrow();
    });

    it('should handle removal of non-existent toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Should not throw error when removing non-existent toast
      expect(() => {
        fireEvent.click(screen.getByText('Remove First Toast'));
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should clean up timers on unmount', () => {
      const { unmount } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));
      
      // Unmount before timer completes
      unmount();

      // Should not cause memory leaks or errors
      act(() => {
        vi.advanceTimersByTime(10000);
      });
    });

    it('should clean up timers when toast is manually removed', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Remove First Toast'));

      // Timer should be cleaned up, no errors when time advances
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });
});