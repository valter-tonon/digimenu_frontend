'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { ProviderErrorBoundary } from '@/components/error-boundaries/ProviderErrorBoundary';

// Types for different animation states
export type AnimationType = 
  | 'confetti'
  | 'borderBeam'
  | 'shimmer'
  | 'particles'
  | 'fadeIn'
  | 'slideIn'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'success'
  | 'error'
  | 'loading';

export type CheckoutStep = 
  | 'menu'
  | 'cart'
  | 'customer-data'
  | 'address'
  | 'payment'
  | 'confirmation'
  | 'tracking';

export type ModalType = 
  | 'productDetails'
  | 'addressForm'
  | 'paymentForm'
  | 'customerForm'
  | 'discountCode'
  | 'orderTracking'
  | 'errorDialog'
  | 'confirmDialog';

export interface AnimationState {
  showConfetti: boolean;
  highlightElement: string | null;
  activeAnimations: Set<string>;
  animationQueue: Array<{
    id: string;
    type: AnimationType;
    target?: string;
    duration?: number;
    delay?: number;
  }>;
}

export type ModalState = {
  [K in ModalType]: {
    isOpen: boolean;
    data?: any;
    onClose?: () => void;
  };
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface UIStateContextType {
  // Checkout flow state
  currentStep: CheckoutStep;
  setCurrentStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  
  // Animation management
  animations: AnimationState;
  triggerAnimation: (type: AnimationType, target?: string, options?: {
    duration?: number;
    delay?: number;
    onComplete?: () => void;
  }) => string;
  stopAnimation: (animationId: string) => void;
  clearAllAnimations: () => void;
  
  // Modal management
  modals: ModalState;
  openModal: (modal: ModalType, data?: any, onClose?: () => void) => void;
  closeModal: (modal: ModalType) => void;
  closeAllModals: () => void;
  
  // Loading state management
  loading: LoadingState;
  setLoading: (key: string, state: boolean) => void;
  isLoading: (key?: string) => boolean;
  
  // UI feedback
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  showConfetti: (duration?: number) => void;
  highlightElement: (elementId: string, duration?: number) => void;
  
  // Theme and layout
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  
  // Performance
  performanceMode: 'high' | 'balanced' | 'low';
  setPerformanceMode: (mode: 'high' | 'balanced' | 'low') => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

// Checkout step order
const CHECKOUT_STEPS: CheckoutStep[] = [
  'menu',
  'cart', 
  'customer-data',
  'address',
  'payment',
  'confirmation',
  'tracking'
];

// Default modal state
const createDefaultModalState = (): ModalState => ({
  productDetails: { isOpen: false },
  addressForm: { isOpen: false },
  paymentForm: { isOpen: false },
  customerForm: { isOpen: false },
  discountCode: { isOpen: false },
  orderTracking: { isOpen: false },
  errorDialog: { isOpen: false },
  confirmDialog: { isOpen: false }
});

// Default animation state
const createDefaultAnimationState = (): AnimationState => ({
  showConfetti: false,
  highlightElement: null,
  activeAnimations: new Set(),
  animationQueue: []
});

// Default fallback values
const DEFAULT_VALUES: UIStateContextType = {
  currentStep: 'menu',
  setCurrentStep: () => {},
  nextStep: () => {},
  previousStep: () => {},
  canGoNext: () => false,
  canGoPrevious: () => false,
  animations: createDefaultAnimationState(),
  triggerAnimation: () => '',
  stopAnimation: () => {},
  clearAllAnimations: () => {},
  modals: createDefaultModalState(),
  openModal: () => {},
  closeModal: () => {},
  closeAllModals: () => {},
  loading: {},
  setLoading: () => {},
  isLoading: () => false,
  showToast: () => {},
  showConfetti: () => {},
  highlightElement: () => {},
  theme: 'auto',
  setTheme: () => {},
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  reducedMotion: false,
  highContrast: false,
  setReducedMotion: () => {},
  setHighContrast: () => {},
  performanceMode: 'balanced',
  setPerformanceMode: () => {}
};

interface UIStateProviderProps {
  children: ReactNode;
  initialStep?: CheckoutStep;
  initialTheme?: 'light' | 'dark' | 'auto';
  performanceMode?: 'high' | 'balanced' | 'low';
}

function UIStateProviderInner({ 
  children, 
  initialStep = 'menu',
  initialTheme = 'auto',
  performanceMode = 'balanced'
}: UIStateProviderProps) {
  // Checkout flow state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(initialStep);
  
  // Animation state
  const [animations, setAnimations] = useState<AnimationState>(createDefaultAnimationState());
  
  // Modal state
  const [modals, setModals] = useState<ModalState>(createDefaultModalState());
  
  // Loading state
  const [loading, setLoadingState] = useState<LoadingState>({});
  
  // Theme and accessibility
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(initialTheme);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [performanceModeState, setPerformanceMode] = useState<'high' | 'balanced' | 'low'>(performanceMode);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Initialize responsive state and listen for changes
  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    if (typeof window !== 'undefined') {
      updateResponsiveState();
      window.addEventListener('resize', updateResponsiveState);
      return () => window.removeEventListener('resize', updateResponsiveState);
    }
  }, []);

  // Initialize accessibility preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReducedMotion(prefersReducedMotion);
      
      // Check for high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      setHighContrast(prefersHighContrast);
    }
  }, []);

  // Checkout flow methods
  const nextStep = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);
    if (currentIndex < CHECKOUT_STEPS.length - 1) {
      setCurrentStep(CHECKOUT_STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(CHECKOUT_STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  const canGoNext = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);
    return currentIndex < CHECKOUT_STEPS.length - 1;
  }, [currentStep]);

  const canGoPrevious = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);
    return currentIndex > 0;
  }, [currentStep]);

  // Animation methods
  const triggerAnimation = useCallback((
    type: AnimationType, 
    target?: string, 
    options?: {
      duration?: number;
      delay?: number;
      onComplete?: () => void;
    }
  ): string => {
    // Skip animations if reduced motion is enabled
    if (reducedMotion && type !== 'loading') {
      return '';
    }

    const animationId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setAnimations(prev => ({
      ...prev,
      activeAnimations: new Set([...prev.activeAnimations, animationId]),
      animationQueue: [...prev.animationQueue, {
        id: animationId,
        type,
        target,
        duration: options?.duration,
        delay: options?.delay
      }]
    }));

    // Auto-remove animation after duration
    const duration = options?.duration || 3000;
    setTimeout(() => {
      stopAnimation(animationId);
      options?.onComplete?.();
    }, duration);

    return animationId;
  }, [reducedMotion]);

  const stopAnimation = useCallback((animationId: string) => {
    setAnimations(prev => {
      const newActiveAnimations = new Set(prev.activeAnimations);
      newActiveAnimations.delete(animationId);
      
      return {
        ...prev,
        activeAnimations: newActiveAnimations,
        animationQueue: prev.animationQueue.filter(anim => anim.id !== animationId)
      };
    });
  }, []);

  const clearAllAnimations = useCallback(() => {
    setAnimations(createDefaultAnimationState());
  }, []);

  // Modal methods
  const openModal = useCallback((modal: ModalType, data?: any, onClose?: () => void) => {
    setModals(prev => ({
      ...prev,
      [modal]: {
        isOpen: true,
        data,
        onClose
      }
    }));
  }, []);

  const closeModal = useCallback((modal: ModalType) => {
    setModals(prev => {
      const modalState = prev[modal];
      modalState.onClose?.();
      
      return {
        ...prev,
        [modal]: {
          isOpen: false,
          data: undefined,
          onClose: undefined
        }
      };
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newModals = { ...prev };
      Object.keys(newModals).forEach(key => {
        const modal = key as ModalType;
        newModals[modal].onClose?.();
        newModals[modal] = {
          isOpen: false,
          data: undefined,
          onClose: undefined
        };
      });
      return newModals;
    });
  }, []);

  // Loading methods
  const setLoading = useCallback((key: string, state: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: state
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loading[key] || false;
    }
    return Object.values(loading).some(Boolean);
  }, [loading]);

  // UI feedback methods
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // This would integrate with a toast library like react-hot-toast
    if (typeof window !== 'undefined') {
      console.log(`Toast [${type}]: ${message}`);
      
      // Track analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'ui_feedback', {
          event_category: 'ui',
          event_label: type,
          value: 1
        });
      }
    }
  }, []);

  const showConfetti = useCallback((duration = 3000) => {
    if (reducedMotion) return;
    
    setAnimations(prev => ({ ...prev, showConfetti: true }));
    
    setTimeout(() => {
      setAnimations(prev => ({ ...prev, showConfetti: false }));
    }, duration);
  }, [reducedMotion]);

  const highlightElement = useCallback((elementId: string, duration = 2000) => {
    if (reducedMotion) return;
    
    setAnimations(prev => ({ ...prev, highlightElement: elementId }));
    
    setTimeout(() => {
      setAnimations(prev => ({ ...prev, highlightElement: null }));
    }, duration);
  }, [reducedMotion]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to close modals
      if (event.key === 'Escape') {
        const openModal = Object.entries(modals).find(([_, modal]) => modal.isOpen);
        if (openModal) {
          closeModal(openModal[0] as ModalType);
        }
      }
      
      // Ctrl/Cmd + K for search (if implemented)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Could open search modal
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [modals, closeModal]);

  const contextValue: UIStateContextType = {
    // Checkout flow
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
    
    // Animations
    animations,
    triggerAnimation,
    stopAnimation,
    clearAllAnimations,
    
    // Modals
    modals,
    openModal,
    closeModal,
    closeAllModals,
    
    // Loading
    loading,
    setLoading,
    isLoading,
    
    // UI feedback
    showToast,
    showConfetti,
    highlightElement,
    
    // Theme and layout
    theme,
    setTheme,
    isMobile,
    isTablet,
    isDesktop,
    
    // Accessibility
    reducedMotion,
    highContrast,
    setReducedMotion,
    setHighContrast,
    
    // Performance
    performanceMode: performanceModeState,
    setPerformanceMode
  };

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
}

export function UIStateProvider(props: UIStateProviderProps) {
  return (
    <ProviderErrorBoundary
      fallback={
        <UIStateContext.Provider value={DEFAULT_VALUES}>
          {props.children}
        </UIStateContext.Provider>
      }
      onError={(error) => {
        console.error('UIStateProvider Error:', error);
      }}
    >
      <UIStateProviderInner {...props} />
    </ProviderErrorBoundary>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  
  if (context === undefined) {
    console.warn('useUIState must be used within a UIStateProvider. Using default values.');
    return DEFAULT_VALUES;
  }
  
  return context;
}

// Specialized hooks for specific UI concerns
export function useCheckoutFlow() {
  const { currentStep, setCurrentStep, nextStep, previousStep, canGoNext, canGoPrevious } = useUIState();
  
  return {
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
    isFirstStep: currentStep === 'menu',
    isLastStep: currentStep === 'tracking',
    stepIndex: CHECKOUT_STEPS.indexOf(currentStep),
    totalSteps: CHECKOUT_STEPS.length
  };
}

export function useAnimations() {
  const { 
    animations, 
    triggerAnimation, 
    stopAnimation, 
    clearAllAnimations,
    showConfetti,
    highlightElement,
    reducedMotion 
  } = useUIState();
  
  return {
    animations,
    triggerAnimation,
    stopAnimation,
    clearAllAnimations,
    showConfetti,
    highlightElement,
    reducedMotion,
    hasActiveAnimations: animations.activeAnimations.size > 0
  };
}

export function useModals() {
  const { modals, openModal, closeModal, closeAllModals } = useUIState();
  
  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    hasOpenModals: Object.values(modals).some(modal => modal.isOpen)
  };
}

export function useLoadingStates() {
  const { loading, setLoading, isLoading } = useUIState();
  
  return {
    loading,
    setLoading,
    isLoading,
    isAnyLoading: isLoading()
  };
}

export function useResponsive() {
  const { isMobile, isTablet, isDesktop } = useUIState();
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
}