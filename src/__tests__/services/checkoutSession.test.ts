import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkoutSessionService, useCheckoutSession } from '@/services/checkoutSession';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock
  },
  writable: true
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CheckoutSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('createSession', () => {
    it('should create a new session with correct initial values', () => {
      const storeId = '123';
      const session = checkoutSessionService.createSession(storeId);

      expect(session).toMatchObject({
        storeId,
        isAuthenticated: false,
        isGuest: false,
        currentStep: 'authentication'
      });
      expect(session.id).toBeDefined();
      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('should save session to localStorage', () => {
      const storeId = '123';
      const session = checkoutSessionService.createSession(storeId);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'checkout_session',
        JSON.stringify(session)
      );
    });

    it('should set expiration time to 30 minutes from now', () => {
      const now = new Date();
      const session = checkoutSessionService.createSession('123');
      const expectedExpiration = new Date(now.getTime() + 30 * 60 * 1000);

      // Allow for small time differences in test execution
      expect(session.expiresAt.getTime()).toBeCloseTo(expectedExpiration.getTime(), -3);
    });
  });

  describe('getCurrentSession', () => {
    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const session = checkoutSessionService.getCurrentSession();
      
      expect(session).toBeNull();
    });

    it('should return session when valid session exists', () => {
      const mockSession = {
        id: 'test-session',
        storeId: '123',
        isAuthenticated: false,
        isGuest: false,
        currentStep: 'authentication',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));
      
      const session = checkoutSessionService.getCurrentSession();
      
      expect(session).toMatchObject({
        id: 'test-session',
        storeId: '123',
        isAuthenticated: false,
        isGuest: false,
        currentStep: 'authentication'
      });
    });

    it('should return null and clear session when expired', () => {
      const expiredSession = {
        id: 'expired-session',
        storeId: '123',
        isAuthenticated: false,
        isGuest: false,
        currentStep: 'authentication',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredSession));
      
      const session = checkoutSessionService.getCurrentSession();
      
      expect(session).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkout_session');
    });

    it('should handle corrupted session data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const session = checkoutSessionService.getCurrentSession();
      
      expect(session).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkout_session');
    });
  });

  describe('updateSession', () => {
    it('should update existing session with new values', () => {
      const initialSession = checkoutSessionService.createSession('123');
      
      const updatedSession = checkoutSessionService.updateSession({
        currentStep: 'address',
        isAuthenticated: true
      });

      expect(updatedSession).toMatchObject({
        id: initialSession.id,
        storeId: '123',
        currentStep: 'address',
        isAuthenticated: true
      });
      expect(updatedSession?.lastActivity).not.toEqual(initialSession.lastActivity);
    });

    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = checkoutSessionService.updateSession({ currentStep: 'address' });
      
      expect(result).toBeNull();
    });
  });

  describe('setCustomerAuthentication', () => {
    it('should set customer data for authenticated user', () => {
      checkoutSessionService.createSession('123');
      
      const customer = {
        id: 1,
        name: 'Test User',
        phone: '11999999999',
        email: 'test@test.com'
      };
      
      const updatedSession = checkoutSessionService.setCustomerAuthentication(customer, false, 'existing_account');
      
      expect(updatedSession).toMatchObject({
        customerId: '1',
        isAuthenticated: true,
        isGuest: false,
        authenticationMethod: 'existing_account',
        currentStep: 'address',
        customerData: {
          name: 'Test User',
          phone: '11999999999',
          email: 'test@test.com'
        }
      });
    });

    it('should set customer data for guest user', () => {
      checkoutSessionService.createSession('123');
      
      const customer = {
        name: 'Guest User',
        phone: '11888888888'
      };
      
      const updatedSession = checkoutSessionService.setCustomerAuthentication(customer, true, 'guest');
      
      expect(updatedSession).toMatchObject({
        isAuthenticated: false,
        isGuest: true,
        authenticationMethod: 'guest',
        currentStep: 'customer_data',
        customerData: {
          name: 'Guest User',
          phone: '11888888888',
          email: ''
        }
      });
    });

    it('should default authentication method based on guest status', () => {
      checkoutSessionService.createSession('123');
      
      const customer = { name: 'Test User', phone: '11999999999' };
      
      // Test guest default
      const guestSession = checkoutSessionService.setCustomerAuthentication(customer, true);
      expect(guestSession?.authenticationMethod).toBe('guest');
      
      // Test authenticated default
      const authSession = checkoutSessionService.setCustomerAuthentication(customer, false);
      expect(authSession?.authenticationMethod).toBe('existing_account');
    });
  });

  describe('setAuthenticationMethod', () => {
    it('should set authentication method', () => {
      checkoutSessionService.createSession('123');
      
      const updatedSession = checkoutSessionService.setAuthenticationMethod('phone');
      
      expect(updatedSession?.authenticationMethod).toBe('phone');
    });

    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = checkoutSessionService.setAuthenticationMethod('phone');
      
      expect(result).toBeNull();
    });
  });

  describe('shouldPromptAuthentication', () => {
    it('should return true when session needs authentication', () => {
      const session = checkoutSessionService.createSession('123');
      
      const shouldPrompt = checkoutSessionService.shouldPromptAuthentication();
      
      expect(shouldPrompt).toBe(true);
    });

    it('should return false when user is authenticated', () => {
      checkoutSessionService.createSession('123');
      checkoutSessionService.setCustomerAuthentication({ name: 'Test' }, false);
      
      const shouldPrompt = checkoutSessionService.shouldPromptAuthentication();
      
      expect(shouldPrompt).toBe(false);
    });

    it('should return false when user is guest', () => {
      checkoutSessionService.createSession('123');
      checkoutSessionService.setCustomerAuthentication({ name: 'Guest' }, true);
      
      const shouldPrompt = checkoutSessionService.shouldPromptAuthentication();
      
      expect(shouldPrompt).toBe(false);
    });

    it('should return true when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const shouldPrompt = checkoutSessionService.shouldPromptAuthentication();
      
      expect(shouldPrompt).toBe(true);
    });
  });

  describe('getNextStepAfterAuthentication', () => {
    it('should return customer_data for guest users', () => {
      const nextStep = checkoutSessionService.getNextStepAfterAuthentication(false, true);
      
      expect(nextStep).toBe('customer_data');
    });

    it('should return address for authenticated users', () => {
      const nextStep = checkoutSessionService.getNextStepAfterAuthentication(true, false);
      
      expect(nextStep).toBe('address');
    });

    it('should return authentication for unauthenticated non-guest users', () => {
      const nextStep = checkoutSessionService.getNextStepAfterAuthentication(false, false);
      
      expect(nextStep).toBe('authentication');
    });
  });

  describe('setCurrentStep', () => {
    it('should update current step', () => {
      checkoutSessionService.createSession('123');
      
      const updatedSession = checkoutSessionService.setCurrentStep('payment');
      
      expect(updatedSession?.currentStep).toBe('payment');
    });
  });

  describe('extendSession', () => {
    it('should extend session expiration time', () => {
      const session = checkoutSessionService.createSession('123');
      const originalExpiration = session.expiresAt;
      
      // Wait a bit to ensure time difference
      setTimeout(() => {
        const extendedSession = checkoutSessionService.extendSession();
        
        expect(extendedSession?.expiresAt.getTime()).toBeGreaterThan(originalExpiration.getTime());
      }, 10);
    });
  });

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      checkoutSessionService.createSession('123');
      
      checkoutSessionService.clearSession();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkout_session');
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const session = checkoutSessionService.createSession('123');
      
      const isValid = checkoutSessionService.isSessionValid(session);
      
      expect(isValid).toBe(true);
    });

    it('should return false for expired session', () => {
      const expiredSession = {
        id: 'expired',
        storeId: '123',
        isAuthenticated: false,
        isGuest: false,
        currentStep: 'authentication' as const,
        startedAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() - 1000) // Expired
      };
      
      const isValid = checkoutSessionService.isSessionValid(expiredSession);
      
      expect(isValid).toBe(false);
    });

    it('should return false for null session', () => {
      const isValid = checkoutSessionService.isSessionValid(null);
      
      expect(isValid).toBe(false);
    });
  });

  describe('getProgressPercentage', () => {
    it('should return correct progress for each step', () => {
      const session = checkoutSessionService.createSession('123');
      
      // Authentication step (first step)
      expect(checkoutSessionService.getProgressPercentage(session)).toBe(20);
      
      // Address step
      checkoutSessionService.setCurrentStep('address');
      expect(checkoutSessionService.getProgressPercentage()).toBe(60);
      
      // Payment step
      checkoutSessionService.setCurrentStep('payment');
      expect(checkoutSessionService.getProgressPercentage()).toBe(80);
      
      // Confirmation step
      checkoutSessionService.setCurrentStep('confirmation');
      expect(checkoutSessionService.getProgressPercentage()).toBe(100);
    });

    it('should return 0 for null session', () => {
      const progress = checkoutSessionService.getProgressPercentage(null);
      
      expect(progress).toBe(0);
    });
  });
});

describe('useCheckoutSession hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should create new session when storeId is provided', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    expect(result.current.session).toBeDefined();
    expect(result.current.session?.storeId).toBe('123');
    expect(result.current.loading).toBe(false);
  });

  it('should not create session when storeId is not provided', () => {
    const { result } = renderHook(() => useCheckoutSession());
    
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should use existing session when available', () => {
    const existingSession = {
      id: 'existing-session',
      storeId: '123',
      isAuthenticated: true,
      isGuest: false,
      currentStep: 'payment',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSession));
    
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    expect(result.current.session?.id).toBe('existing-session');
    expect(result.current.session?.currentStep).toBe('payment');
  });

  it('should update session through hook methods', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    act(() => {
      result.current.setCurrentStep('address');
    });
    
    expect(result.current.session?.currentStep).toBe('address');
  });

  it('should set customer authentication through hook', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    const customer = { id: 1, name: 'Test User', phone: '11999999999' };
    
    act(() => {
      result.current.setCustomerAuthentication(customer, false);
    });
    
    expect(result.current.session?.isAuthenticated).toBe(true);
    expect(result.current.session?.customerData?.name).toBe('Test User');
  });

  it('should clear session through hook', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    expect(result.current.session).toBeDefined();
    
    act(() => {
      result.current.clearSession();
    });
    
    expect(result.current.session).toBeNull();
  });

  it('should calculate progress percentage correctly', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    expect(result.current.progressPercentage).toBe(20); // Authentication step
    
    act(() => {
      result.current.setCurrentStep('payment');
    });
    
    expect(result.current.progressPercentage).toBe(80); // Payment step
  });

  it('should validate session correctly', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    expect(result.current.isValid).toBe(true);
    
    act(() => {
      result.current.clearSession();
    });
    
    expect(result.current.isValid).toBe(false);
  });

  it('should set authentication method through hook', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    act(() => {
      result.current.setAuthenticationMethod('phone');
    });
    
    expect(result.current.session?.authenticationMethod).toBe('phone');
  });

  it('should check if authentication prompt is needed', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    expect(result.current.shouldPromptAuthentication()).toBe(true);
    
    act(() => {
      result.current.setCustomerAuthentication({ name: 'Test' }, false);
    });
    
    expect(result.current.shouldPromptAuthentication()).toBe(false);
  });

  it('should determine next step after authentication', () => {
    const { result } = renderHook(() => useCheckoutSession('123'));
    
    expect(result.current.getNextStepAfterAuthentication(false, true)).toBe('customer_data');
    expect(result.current.getNextStepAfterAuthentication(true, false)).toBe('address');
    expect(result.current.getNextStepAfterAuthentication(false, false)).toBe('authentication');
  });
});