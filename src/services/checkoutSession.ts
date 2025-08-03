/**
 * Checkout Session Management Service
 * 
 * Handles session state during the checkout process,
 * including authentication state, customer data, and progress tracking.
 */

export interface CheckoutSession {
  id: string;
  storeId: string;
  customerId?: string;
  isAuthenticated: boolean;
  isGuest: boolean;
  authenticationMethod?: AuthenticationMethod;
  customerData?: {
    name: string;
    phone: string;
    email?: string;
  };
  currentStep: CheckoutStep;
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export type CheckoutStep = 
  | 'authentication'
  | 'customer_data'
  | 'address'
  | 'payment'
  | 'confirmation';

export type AuthenticationMethod = 'phone' | 'guest' | 'existing_account' | 'new_account';

export interface CheckoutSessionData {
  customer?: any;
  isGuest: boolean;
  currentStep: CheckoutStep;
  formData: {
    customerData?: {
      name: string;
      phone: string;
      email?: string;
    };
    deliveryAddress?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      zipCode?: string;
      reference?: string;
    };
    paymentMethod?: string;
    changeAmount?: number;
    orderNotes?: string;
  };
}

class CheckoutSessionService {
  private readonly SESSION_KEY = 'checkout_session';
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Creates a new checkout session
   */
  createSession(storeId: string): CheckoutSession {
    const now = new Date();
    const session: CheckoutSession = {
      id: this.generateSessionId(),
      storeId,
      isAuthenticated: false,
      isGuest: false,
      currentStep: 'authentication',
      startedAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.SESSION_DURATION)
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Gets the current checkout session
   */
  getCurrentSession(): CheckoutSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: CheckoutSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting checkout session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Updates the current session
   */
  updateSession(updates: Partial<CheckoutSession>): CheckoutSession | null {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return null;

    const updatedSession: CheckoutSession = {
      ...currentSession,
      ...updates,
      lastActivity: new Date()
    };

    this.saveSession(updatedSession);
    return updatedSession;
  }

  /**
   * Sets customer authentication data
   */
  setCustomerAuthentication(customer: any, isGuest: boolean, method?: AuthenticationMethod): CheckoutSession | null {
    return this.updateSession({
      customerId: customer?.id?.toString(),
      isAuthenticated: !isGuest,
      isGuest,
      authenticationMethod: method || (isGuest ? 'guest' : 'existing_account'),
      customerData: {
        name: customer?.name || '',
        phone: customer?.phone || '',
        email: customer?.email || ''
      },
      currentStep: isGuest ? 'customer_data' : 'address'
    });
  }

  /**
   * Sets authentication method for the session
   */
  setAuthenticationMethod(method: AuthenticationMethod): CheckoutSession | null {
    return this.updateSession({ authenticationMethod: method });
  }

  /**
   * Checks if user should be prompted for authentication
   */
  shouldPromptAuthentication(): boolean {
    const session = this.getCurrentSession();
    if (!session) return true;
    
    return !session.isAuthenticated && !session.isGuest && session.currentStep === 'authentication';
  }

  /**
   * Determines next step based on authentication state
   */
  getNextStepAfterAuthentication(isAuthenticated: boolean, isGuest: boolean): CheckoutStep {
    if (isGuest) {
      return 'customer_data';
    } else if (isAuthenticated) {
      return 'address';
    } else {
      return 'authentication';
    }
  }

  /**
   * Updates the current step
   */
  setCurrentStep(step: CheckoutStep): CheckoutSession | null {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return null;
    
    // Evitar atualizações desnecessárias se o step já é o mesmo
    if (currentSession.currentStep === step) {
      return currentSession;
    }
    
    return this.updateSession({ currentStep: step });
  }

  /**
   * Updates session activity timestamp
   */
  updateActivity(): CheckoutSession | null {
    return this.updateSession({ lastActivity: new Date() });
  }

  /**
   * Extends session expiration
   */
  extendSession(): CheckoutSession | null {
    const now = new Date();
    return this.updateSession({
      expiresAt: new Date(now.getTime() + this.SESSION_DURATION)
    });
  }

  /**
   * Clears the current session
   */
  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  /**
   * Validates if session is still valid
   */
  isSessionValid(session?: CheckoutSession): boolean {
    const currentSession = session || this.getCurrentSession();
    if (!currentSession) return false;

    return new Date() <= new Date(currentSession.expiresAt);
  }

  /**
   * Gets session progress percentage
   */
  getProgressPercentage(session?: CheckoutSession): number {
    const currentSession = session || this.getCurrentSession();
    if (!currentSession) return 0;

    const stepOrder: CheckoutStep[] = [
      'authentication',
      'customer_data', 
      'address',
      'payment',
      'confirmation'
    ];

    const currentIndex = stepOrder.indexOf(currentSession.currentStep);
    return ((currentIndex + 1) / stepOrder.length) * 100;
  }

  /**
   * Saves session data to localStorage
   */
  private saveSession(session: CheckoutSession): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      } catch (error) {
        console.error('Error saving checkout session:', error);
      }
    }
  }

  /**
   * Generates a unique session ID
   */
  private generateSessionId(): string {
    return `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const checkoutSessionService = new CheckoutSessionService();

/**
 * React hook for checkout session management
 */
import { useState, useEffect, useCallback } from 'react';

export const useCheckoutSession = (storeId?: string) => {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  // FIXED: Usar useCallback para evitar recriação desnecessária
  const initializeSession = useCallback(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    // Try to get existing session
    const existingSession = checkoutSessionService.getCurrentSession();
    
    if (existingSession && existingSession.storeId === storeId) {
      setSession(existingSession);
    } else {
      // Create new session if store ID is provided
      const newSession = checkoutSessionService.createSession(storeId);
      setSession(newSession);
    }
    
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const updateSession = useCallback((updates: Partial<CheckoutSession>) => {
    const updatedSession = checkoutSessionService.updateSession(updates);
    setSession(updatedSession);
    return updatedSession;
  }, []);

  const setCustomerAuthentication = useCallback((customer: any, isGuest: boolean, method?: AuthenticationMethod) => {
    const updatedSession = checkoutSessionService.setCustomerAuthentication(customer, isGuest, method);
    setSession(updatedSession);
    return updatedSession;
  }, []);

  const setAuthenticationMethod = useCallback((method: AuthenticationMethod) => {
    const updatedSession = checkoutSessionService.setAuthenticationMethod(method);
    setSession(updatedSession);
    return updatedSession;
  }, []);

  const setCurrentStep = useCallback((step: CheckoutStep) => {
    const updatedSession = checkoutSessionService.setCurrentStep(step);
    setSession(updatedSession);
    return updatedSession;
  }, []);

  const clearSession = useCallback(() => {
    checkoutSessionService.clearSession();
    setSession(null);
  }, []);

  const extendSession = useCallback(() => {
    const updatedSession = checkoutSessionService.extendSession();
    setSession(updatedSession);
    return updatedSession;
  }, []);

  return {
    session,
    loading,
    updateSession,
    setCustomerAuthentication,
    setAuthenticationMethod,
    setCurrentStep,
    clearSession,
    extendSession,
    isValid: session ? checkoutSessionService.isSessionValid(session) : false,
    progressPercentage: checkoutSessionService.getProgressPercentage(session),
    shouldPromptAuthentication: () => checkoutSessionService.shouldPromptAuthentication(),
    getNextStepAfterAuthentication: (isAuthenticated: boolean, isGuest: boolean) => 
      checkoutSessionService.getNextStepAfterAuthentication(isAuthenticated, isGuest)
  };
};