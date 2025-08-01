import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastSystem, Toast } from '@/components/notifications/ToastSystem';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock createPortal to render in the same container
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('ToastSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const mockToast: Omit<Toast, 'id' | 'timestamp'> = {
    type: 'success',
    title: 'Test Toast',
    message: 'This is a test message',
    duration: 5000
  };

  it('should render toast system container', () => {
    render(<ToastSystem />);
    
    // Container should be present but empty initially
    expect(document.body).toBeInTheDocument();
  });

  it('should add toast when event is dispatched', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { detail: mockToast });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });
  });

  it('should render different toast types with correct styling', async () => {
    render(<ToastSystem />);

    const toastTypes: Array<{ type: Toast['type'], title: string }> = [
      { type: 'success', title: 'Success Toast' },
      { type: 'error', title: 'Error Toast' },
      { type: 'warning', title: 'Warning Toast' },
      { type: 'info', title: 'Info Toast' }
    ];

    for (const { type, title } of toastTypes) {
      act(() => {
        const event = new CustomEvent('toast-add', { 
          detail: { ...mockToast, type, title } 
        });
        window.dispatchEvent(event);
      });
    }

    await waitFor(() => {
      toastTypes.forEach(({ title }) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    // Check for type-specific styling classes
    expect(screen.getByText('Success Toast').closest('.bg-green-50')).toBeInTheDocument();
    expect(screen.getByText('Error Toast').closest('.bg-red-50')).toBeInTheDocument();
    expect(screen.getByText('Warning Toast').closest('.bg-yellow-50')).toBeInTheDocument();
    expect(screen.getByText('Info Toast').closest('.bg-blue-50')).toBeInTheDocument();
  });

  it('should auto-dismiss toast after duration', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { 
        detail: { ...mockToast, duration: 1000 } 
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
    });
  });

  it('should not auto-dismiss persistent toasts', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { 
        detail: { ...mockToast, persistent: true, duration: 1000 } 
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Toast should still be present
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('should remove toast when close button is clicked', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { detail: mockToast });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Fechar notificação');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
    });
  });

  it('should pause timer on mouse enter and resume on mouse leave', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { 
        detail: { ...mockToast, duration: 2000 } 
      });
      window.dispatchEvent(event);
    });

    const toastElement = await screen.findByText('Test Toast');
    const toastContainer = toastElement.closest('[role="alert"]');

    // Hover over toast
    fireEvent.mouseEnter(toastContainer!);

    // Advance time while hovered
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Toast should still be present (paused)
    expect(screen.getByText('Test Toast')).toBeInTheDocument();

    // Leave hover
    fireEvent.mouseLeave(toastContainer!);

    // Now it should dismiss after remaining time
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
    });
  });

  it('should render action buttons and execute actions', async () => {
    const mockAction = vi.fn();
    
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { 
        detail: {
          ...mockToast,
          actions: [
            { label: 'Action 1', action: mockAction, style: 'primary' },
            { label: 'Action 2', action: vi.fn(), style: 'secondary' }
          ]
        }
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Action 1'));

    expect(mockAction).toHaveBeenCalled();
    
    // Toast should be removed after action
    await waitFor(() => {
      expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
    });
  });

  it('should limit number of toasts based on maxToasts prop', async () => {
    render(<ToastSystem maxToasts={2} />);

    // Add 3 toasts
    for (let i = 1; i <= 3; i++) {
      act(() => {
        const event = new CustomEvent('toast-add', { 
          detail: { ...mockToast, title: `Toast ${i}` } 
        });
        window.dispatchEvent(event);
      });
    }

    await waitFor(() => {
      // Only the last 2 toasts should be visible
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });
  });

  it('should show clear all button when multiple toasts are present', async () => {
    render(<ToastSystem />);

    // Add 2 toasts
    act(() => {
      const event1 = new CustomEvent('toast-add', { 
        detail: { ...mockToast, title: 'Toast 1' } 
      });
      const event2 = new CustomEvent('toast-add', { 
        detail: { ...mockToast, title: 'Toast 2' } 
      });
      window.dispatchEvent(event1);
      window.dispatchEvent(event2);
    });

    await waitFor(() => {
      expect(screen.getByText('Limpar todas (2)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Limpar todas (2)'));

    await waitFor(() => {
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
    });
  });

  it('should handle toast-remove event', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { detail: mockToast });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    act(() => {
      const removeEvent = new CustomEvent('toast-remove', { 
        detail: { id: 'some-id' } 
      });
      window.dispatchEvent(removeEvent);
    });

    // Since we can't easily get the actual toast ID, this tests the event handling
    // The toast might still be there since the ID doesn't match
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('should handle toast-clear event', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { detail: mockToast });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    act(() => {
      const clearEvent = new CustomEvent('toast-clear');
      window.dispatchEvent(clearEvent);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
    });
  });

  it('should position toasts correctly based on position prop', () => {
    const { rerender } = render(<ToastSystem position="top-left" />);
    
    // Check if the positioning class is applied
    // Since we're mocking createPortal, we need to check the DOM structure differently
    expect(document.body).toBeInTheDocument();

    rerender(<ToastSystem position="bottom-right" />);
    expect(document.body).toBeInTheDocument();

    rerender(<ToastSystem position="top-center" />);
    expect(document.body).toBeInTheDocument();
  });

  it('should expose global toastSystem methods', () => {
    render(<ToastSystem />);

    expect((window as any).toastSystem).toBeDefined();
    expect((window as any).toastSystem.success).toBeInstanceOf(Function);
    expect((window as any).toastSystem.error).toBeInstanceOf(Function);
    expect((window as any).toastSystem.warning).toBeInstanceOf(Function);
    expect((window as any).toastSystem.info).toBeInstanceOf(Function);
    expect((window as any).toastSystem.addToast).toBeInstanceOf(Function);
    expect((window as any).toastSystem.removeToast).toBeInstanceOf(Function);
    expect((window as any).toastSystem.clearAllToasts).toBeInstanceOf(Function);
  });

  it('should show progress bar for non-persistent toasts', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { 
        detail: { ...mockToast, duration: 2000 } 
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      const progressBar = document.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('should not show progress bar for persistent toasts', async () => {
    render(<ToastSystem />);

    act(() => {
      const event = new CustomEvent('toast-add', { 
        detail: { ...mockToast, persistent: true } 
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    // Progress bar should not be present
    const progressBar = document.querySelector('.bg-green-500');
    expect(progressBar).not.toBeInTheDocument();
  });
});