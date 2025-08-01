import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from '@/hooks/useToast';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('useToast', () => {
  let mockDispatchEvent: any;

  beforeEach(() => {
    mockDispatchEvent = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    mockDispatchEvent.mockRestore();
  });

  it('should return toast methods', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current).toHaveProperty('success');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('warning');
    expect(result.current).toHaveProperty('info');
    expect(result.current).toHaveProperty('custom');
    expect(result.current).toHaveProperty('remove');
    expect(result.current).toHaveProperty('clear');

    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.warning).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.custom).toBe('function');
    expect(typeof result.current.remove).toBe('function');
    expect(typeof result.current.clear).toBe('function');
  });

  it('should dispatch success toast event', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Success Title', 'Success message');
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-add',
        detail: expect.objectContaining({
          type: 'success',
          title: 'Success Title',
          message: 'Success message'
        })
      })
    );
  });

  it('should dispatch error toast event with longer duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error('Error Title', 'Error message');
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-add',
        detail: expect.objectContaining({
          type: 'error',
          title: 'Error Title',
          message: 'Error message',
          duration: 8000
        })
      })
    );
  });

  it('should dispatch warning toast event with medium duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.warning('Warning Title', 'Warning message');
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-add',
        detail: expect.objectContaining({
          type: 'warning',
          title: 'Warning Title',
          message: 'Warning message',
          duration: 6000
        })
      })
    );
  });

  it('should dispatch info toast event', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info('Info Title', 'Info message');
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-add',
        detail: expect.objectContaining({
          type: 'info',
          title: 'Info Title',
          message: 'Info message'
        })
      })
    );
  });

  it('should handle custom toast with all options', () => {
    const { result } = renderHook(() => useToast());
    const mockAction = vi.fn();

    act(() => {
      result.current.custom({
        type: 'success',
        title: 'Custom Toast',
        message: 'Custom message',
        duration: 10000,
        persistent: true,
        actions: [
          { label: 'Action', action: mockAction, style: 'primary' }
        ]
      });
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-add',
        detail: expect.objectContaining({
          type: 'success',
          title: 'Custom Toast',
          message: 'Custom message',
          duration: 10000,
          persistent: true,
          actions: [
            { label: 'Action', action: mockAction, style: 'primary' }
          ]
        })
      })
    );
  });

  it('should handle toast options correctly', () => {
    const { result } = renderHook(() => useToast());
    const mockAction = vi.fn();

    act(() => {
      result.current.success('Title', 'Message', {
        duration: 3000,
        persistent: true,
        actions: [{ label: 'OK', action: mockAction }]
      });
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-add',
        detail: expect.objectContaining({
          type: 'success',
          title: 'Title',
          message: 'Message',
          duration: 3000,
          persistent: true,
          actions: [{ label: 'OK', action: mockAction }]
        })
      })
    );
  });

  it('should dispatch remove toast event', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.remove('toast-id-123');
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-remove',
        detail: { id: 'toast-id-123' }
      })
    );
  });

  it('should dispatch clear all toasts event', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.clear();
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'toast-clear'
      })
    );
  });

  it('should return toast ID for tracking', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      toastId = result.current.success('Title', 'Message');
    });

    expect(toastId!).toMatch(/^toast-\d+-[a-z0-9]+$/);
  });

  it('should handle missing window object gracefully', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const { result } = renderHook(() => useToast());

    act(() => {
      const toastId = result.current.success('Title', 'Message');
      expect(toastId).toBe('');
    });

    global.window = originalWindow;
  });
});

describe('toast utility functions', () => {
  let mockToastSystem: any;

  beforeEach(() => {
    mockToastSystem = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      removeToast: vi.fn(),
      clearAllToasts: vi.fn()
    };

    (window as any).toastSystem = mockToastSystem;
  });

  afterEach(() => {
    delete (window as any).toastSystem;
  });

  it('should call toastSystem.success', () => {
    toast.success('Title', 'Message', { duration: 3000 });

    expect(mockToastSystem.success).toHaveBeenCalledWith('Title', 'Message', { duration: 3000 });
  });

  it('should call toastSystem.error', () => {
    toast.error('Title', 'Message');

    expect(mockToastSystem.error).toHaveBeenCalledWith('Title', 'Message', undefined);
  });

  it('should call toastSystem.warning', () => {
    toast.warning('Title', 'Message');

    expect(mockToastSystem.warning).toHaveBeenCalledWith('Title', 'Message', undefined);
  });

  it('should call toastSystem.info', () => {
    toast.info('Title', 'Message');

    expect(mockToastSystem.info).toHaveBeenCalledWith('Title', 'Message', undefined);
  });

  it('should call toastSystem.removeToast', () => {
    toast.remove('toast-id');

    expect(mockToastSystem.removeToast).toHaveBeenCalledWith('toast-id');
  });

  it('should call toastSystem.clearAllToasts', () => {
    toast.clear();

    expect(mockToastSystem.clearAllToasts).toHaveBeenCalled();
  });

  it('should handle missing toastSystem gracefully', () => {
    delete (window as any).toastSystem;

    expect(() => {
      toast.success('Title', 'Message');
      toast.error('Title', 'Message');
      toast.warning('Title', 'Message');
      toast.info('Title', 'Message');
      toast.remove('id');
      toast.clear();
    }).not.toThrow();
  });

  it('should handle missing window object gracefully', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    expect(() => {
      toast.success('Title', 'Message');
      toast.error('Title', 'Message');
      toast.warning('Title', 'Message');
      toast.info('Title', 'Message');
      toast.remove('id');
      toast.clear();
    }).not.toThrow();

    global.window = originalWindow;
  });
});