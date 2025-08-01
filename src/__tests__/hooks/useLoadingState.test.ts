import { renderHook, act } from '@testing-library/react';
import { 
  useLoadingState, 
  useLoadingStateWithTimeout, 
  useLoadingStateWithProgress,
  LoadingKeys 
} from '@/hooks/useLoadingState';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('useLoadingState', () => {
  it('should initialize with empty loading state', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.loading).toEqual({});
    expect(result.current.isLoading()).toBe(false);
  });

  it('should initialize with provided initial state', () => {
    const initialState = { test: true };
    const { result } = renderHook(() => useLoadingState(initialState));
    
    expect(result.current.loading).toEqual(initialState);
    expect(result.current.isLoading()).toBe(true);
    expect(result.current.isLoading('test')).toBe(true);
  });

  it('should set loading state for specific key', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.setLoading('test', true);
    });
    
    expect(result.current.loading.test).toBe(true);
    expect(result.current.isLoading('test')).toBe(true);
    expect(result.current.isLoading()).toBe(true);
  });

  it('should start and stop loading', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.startLoading('test');
    });
    
    expect(result.current.isLoading('test')).toBe(true);
    
    act(() => {
      result.current.stopLoading('test');
    });
    
    expect(result.current.isLoading('test')).toBe(false);
  });

  it('should clear all loading states', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.setLoading('test1', true);
      result.current.setLoading('test2', true);
    });
    
    expect(result.current.isLoading()).toBe(true);
    
    act(() => {
      result.current.clearAll();
    });
    
    expect(result.current.loading).toEqual({});
    expect(result.current.isLoading()).toBe(false);
  });

  it('should handle withLoading wrapper', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockAsyncFn = vi.fn().mockResolvedValue('success');
    
    let promise: Promise<string>;
    
    act(() => {
      promise = result.current.withLoading('test', mockAsyncFn);
    });
    
    // Should be loading during execution
    expect(result.current.isLoading('test')).toBe(true);
    
    const resultValue = await promise!;
    
    // Should stop loading after completion
    expect(result.current.isLoading('test')).toBe(false);
    expect(resultValue).toBe('success');
    expect(mockAsyncFn).toHaveBeenCalled();
  });

  it('should handle withLoading wrapper with error', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockAsyncFn = vi.fn().mockRejectedValue(new Error('test error'));
    
    let promise: Promise<string>;
    
    act(() => {
      promise = result.current.withLoading('test', mockAsyncFn);
    });
    
    // Should be loading during execution
    expect(result.current.isLoading('test')).toBe(true);
    
    await expect(promise!).rejects.toThrow('test error');
    
    // Should stop loading even after error
    expect(result.current.isLoading('test')).toBe(false);
  });

  it('should check if any loading state is active', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.isLoading()).toBe(false);
    
    act(() => {
      result.current.setLoading('test1', true);
    });
    
    expect(result.current.isLoading()).toBe(true);
    
    act(() => {
      result.current.setLoading('test2', true);
    });
    
    expect(result.current.isLoading()).toBe(true);
    
    act(() => {
      result.current.setLoading('test1', false);
    });
    
    expect(result.current.isLoading()).toBe(true); // test2 still loading
    
    act(() => {
      result.current.setLoading('test2', false);
    });
    
    expect(result.current.isLoading()).toBe(false);
  });
});

describe('useLoadingStateWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should automatically stop loading after timeout', () => {
    const { result } = renderHook(() => useLoadingStateWithTimeout({}, 1000));
    
    act(() => {
      result.current.setLoadingWithTimeout('test', true, 1000);
    });
    
    expect(result.current.isLoading('test')).toBe(true);
    
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    
    expect(result.current.isLoading('test')).toBe(false);
  });

  it('should use default timeout when not specified', () => {
    const { result } = renderHook(() => useLoadingStateWithTimeout({}, 500));
    
    act(() => {
      result.current.setLoadingWithTimeout('test', true);
    });
    
    expect(result.current.isLoading('test')).toBe(true);
    
    act(() => {
      vi.advanceTimersByTime(600);
    });
    
    expect(result.current.isLoading('test')).toBe(false);
  });

  it('should clear timeout when manually stopped', () => {
    const { result } = renderHook(() => useLoadingStateWithTimeout({}, 1000));
    
    act(() => {
      result.current.setLoadingWithTimeout('test', true, 1000);
    });
    
    expect(result.current.isLoading('test')).toBe(true);
    
    act(() => {
      result.current.setLoadingWithTimeout('test', false);
    });
    
    expect(result.current.isLoading('test')).toBe(false);
    
    // Advance time to ensure timeout doesn't fire
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    
    expect(result.current.isLoading('test')).toBe(false);
  });
});

describe('useLoadingStateWithProgress', () => {
  it('should track progress for loading states', () => {
    const { result } = renderHook(() => useLoadingStateWithProgress());
    
    act(() => {
      result.current.startLoading('test');
      result.current.setProgress('test', 50);
    });
    
    expect(result.current.progress.test).toBe(50);
    expect(result.current.isLoading('test')).toBe(true);
  });

  it('should automatically stop loading when progress reaches 100%', () => {
    const { result } = renderHook(() => useLoadingStateWithProgress());
    
    act(() => {
      result.current.startLoading('test');
      result.current.setProgress('test', 100);
    });
    
    expect(result.current.progress.test).toBe(100);
    expect(result.current.isLoading('test')).toBe(false);
  });

  it('should increment progress correctly', () => {
    const { result } = renderHook(() => useLoadingStateWithProgress());
    
    act(() => {
      result.current.startLoading('test');
      result.current.setProgress('test', 30);
    });
    
    expect(result.current.progress.test).toBe(30);
    
    act(() => {
      result.current.incrementProgress('test', 20);
    });
    
    expect(result.current.progress.test).toBe(50);
    expect(result.current.isLoading('test')).toBe(true);
  });

  it('should automatically stop loading when incrementing to 100%', () => {
    const { result } = renderHook(() => useLoadingStateWithProgress());
    
    act(() => {
      result.current.startLoading('test');
      result.current.setProgress('test', 90);
    });
    
    expect(result.current.isLoading('test')).toBe(true);
    
    act(() => {
      result.current.incrementProgress('test', 15); // Should cap at 100
    });
    
    expect(result.current.progress.test).toBe(100);
    expect(result.current.isLoading('test')).toBe(false);
  });

  it('should reset progress', () => {
    const { result } = renderHook(() => useLoadingStateWithProgress());
    
    act(() => {
      result.current.setProgress('test', 75);
    });
    
    expect(result.current.progress.test).toBe(75);
    
    act(() => {
      result.current.resetProgress('test');
    });
    
    expect(result.current.progress.test).toBe(0);
  });

  it('should normalize progress values', () => {
    const { result } = renderHook(() => useLoadingStateWithProgress());
    
    act(() => {
      result.current.setProgress('test', 150); // Should cap at 100
    });
    
    expect(result.current.progress.test).toBe(100);
    
    act(() => {
      result.current.setProgress('test2', -10); // Should floor at 0
    });
    
    expect(result.current.progress.test2).toBe(0);
  });
});

describe('LoadingKeys', () => {
  it('should provide consistent loading keys', () => {
    expect(LoadingKeys.FETCH_MENU).toBe('fetch_menu');
    expect(LoadingKeys.ADD_TO_CART).toBe('add_to_cart');
    expect(LoadingKeys.PROCESS_PAYMENT).toBe('process_payment');
    expect(LoadingKeys.LOGIN).toBe('login');
    expect(LoadingKeys.PAGE_LOAD).toBe('page_load');
  });

  it('should have all expected keys', () => {
    const expectedKeys = [
      'FETCH_MENU',
      'FETCH_PRODUCTS',
      'FETCH_CATEGORIES',
      'FETCH_STORE_STATUS',
      'ADD_TO_CART',
      'UPDATE_CART',
      'REMOVE_FROM_CART',
      'CLEAR_CART',
      'VALIDATE_ADDRESS',
      'PROCESS_PAYMENT',
      'CREATE_ORDER',
      'CONFIRM_ORDER',
      'LOGIN',
      'REGISTER',
      'UPDATE_PROFILE',
      'FETCH_ADDRESSES',
      'SAVE_ADDRESS',
      'UPLOAD_IMAGE',
      'LOAD_IMAGE',
      'SUBMIT_FORM',
      'VALIDATE_FORM',
      'PAGE_LOAD',
      'COMPONENT_LOAD',
      'SEARCH',
      'FILTER',
      'SEND_NOTIFICATION',
      'SAVE',
      'DELETE',
      'UPDATE',
      'REFRESH'
    ];

    expectedKeys.forEach(key => {
      expect(LoadingKeys).toHaveProperty(key);
    });
  });
});