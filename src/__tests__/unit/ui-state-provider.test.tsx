import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  UIStateProvider, 
  useUIState, 
  useCheckoutFlow, 
  useAnimations, 
  useModals, 
  useLoadingStates,
  useResponsive,
  AnimationType,
  CheckoutStep,
  ModalType
} from '@/infrastructure/context/UIStateContext';

// Mock console methods
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
let consoleWarnSpy: any;

// Test component that uses the UI state context
const TestComponent = () => {
  const {
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
    animations,
    triggerAnimation,
    stopAnimation,
    clearAllAnimations,
    modals,
    openModal,
    closeModal,
    closeAllModals,
    loading,
    setLoading,
    isLoading,
    showToast,
    showConfetti,
    highlightElement,
    theme,
    setTheme,
    isMobile,
    isTablet,
    isDesktop,
    reducedMotion,
    highContrast,
    setReducedMotion,
    setHighContrast,
    performanceMode,
    setPerformanceMode
  } = useUIState();

  return (
    <div>
      <span data-testid="current-step">{currentStep}</span>
      <span data-testid="can-go-next">{canGoNext() ? 'Yes' : 'No'}</span>
      <span data-testid="can-go-previous">{canGoPrevious() ? 'Yes' : 'No'}</span>
      <span data-testid="show-confetti">{animations.showConfetti ? 'Yes' : 'No'}</span>
      <span data-testid="highlight-element">{animations.highlightElement || 'None'}</span>
      <span data-testid="active-animations">{animations.activeAnimations.size}</span>
      <span data-testid="is-loading">{isLoading() ? 'Yes' : 'No'}</span>
      <span data-testid="theme">{theme}</span>
      <span data-testid="is-mobile">{isMobile ? 'Yes' : 'No'}</span>
      <span data-testid="is-tablet">{isTablet ? 'Yes' : 'No'}</span>
      <span data-testid="is-desktop">{isDesktop ? 'Yes' : 'No'}</span>
      <span data-testid="reduced-motion">{reducedMotion ? 'Yes' : 'No'}</span>
      <span data-testid="high-contrast">{highContrast ? 'Yes' : 'No'}</span>
      <span data-testid="performance-mode">{performanceMode}</span>
      
      {/* Modal states */}
      <span data-testid="product-modal">{modals.productDetails.isOpen ? 'Open' : 'Closed'}</span>
      <span data-testid="address-modal">{modals.addressForm.isOpen ? 'Open' : 'Closed'}</span>
      
      {/* Action buttons */}
      <button data-testid="next-step" onClick={nextStep}>Next Step</button>
      <button data-testid="previous-step" onClick={previousStep}>Previous Step</button>
      <button data-testid="set-cart-step" onClick={() => setCurrentStep('cart')}>Set Cart Step</button>
      
      <button data-testid="trigger-confetti" onClick={() => triggerAnimation('confetti')}>
        Trigger Confetti
      </button>
      <button data-testid="trigger-border-beam" onClick={() => triggerAnimation('borderBeam', 'element-1')}>
        Trigger Border Beam
      </button>
      <button data-testid="show-confetti-btn" onClick={() => showConfetti(1000)}>
        Show Confetti
      </button>
      <button data-testid="highlight-btn" onClick={() => highlightElement('test-element', 1000)}>
        Highlight Element
      </button>
      <button data-testid="clear-animations" onClick={clearAllAnimations}>
        Clear Animations
      </button>
      
      <button data-testid="open-product-modal" onClick={() => openModal('productDetails', { id: 1 })}>
        Open Product Modal
      </button>
      <button data-testid="close-product-modal" onClick={() => closeModal('productDetails')}>
        Close Product Modal
      </button>
      <button data-testid="close-all-modals" onClick={closeAllModals}>
        Close All Modals
      </button>
      
      <button data-testid="set-loading" onClick={() => setLoading('test', true)}>
        Set Loading
      </button>
      <button data-testid="clear-loading" onClick={() => setLoading('test', false)}>
        Clear Loading
      </button>
      
      <button data-testid="show-toast" onClick={() => showToast('Test message', 'success')}>
        Show Toast
      </button>
      
      <button data-testid="set-dark-theme" onClick={() => setTheme('dark')}>
        Set Dark Theme
      </button>
      <button data-testid="toggle-reduced-motion" onClick={() => setReducedMotion(!reducedMotion)}>
        Toggle Reduced Motion
      </button>
      <button data-testid="toggle-high-contrast" onClick={() => setHighContrast(!highContrast)}>
        Toggle High Contrast
      </button>
      <button data-testid="set-performance-low" onClick={() => setPerformanceMode('low')}>
        Set Low Performance
      </button>
    </div>
  );
};

// Test component for checkout flow hook
const CheckoutFlowTestComponent = () => {
  const {
    currentStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    stepIndex,
    totalSteps
  } = useCheckoutFlow();

  return (
    <div>
      <span data-testid="checkout-current-step">{currentStep}</span>
      <span data-testid="checkout-can-go-next">{canGoNext() ? 'Yes' : 'No'}</span>
      <span data-testid="checkout-can-go-previous">{canGoPrevious() ? 'Yes' : 'No'}</span>
      <span data-testid="checkout-is-first">{isFirstStep ? 'Yes' : 'No'}</span>
      <span data-testid="checkout-is-last">{isLastStep ? 'Yes' : 'No'}</span>
      <span data-testid="checkout-step-index">{stepIndex}</span>
      <span data-testid="checkout-total-steps">{totalSteps}</span>
      
      <button data-testid="checkout-next" onClick={nextStep}>Next</button>
      <button data-testid="checkout-previous" onClick={previousStep}>Previous</button>
    </div>
  );
};

// Test component for animations hook
const AnimationsTestComponent = () => {
  const {
    animations,
    triggerAnimation,
    stopAnimation,
    clearAllAnimations,
    showConfetti,
    highlightElement,
    reducedMotion,
    hasActiveAnimations
  } = useAnimations();

  return (
    <div>
      <span data-testid="anim-show-confetti">{animations.showConfetti ? 'Yes' : 'No'}</span>
      <span data-testid="anim-highlight">{animations.highlightElement || 'None'}</span>
      <span data-testid="anim-active-count">{animations.activeAnimations.size}</span>
      <span data-testid="anim-has-active">{hasActiveAnimations ? 'Yes' : 'No'}</span>
      <span data-testid="anim-reduced-motion">{reducedMotion ? 'Yes' : 'No'}</span>
      
      <button data-testid="anim-trigger" onClick={() => triggerAnimation('pulse', 'test')}>
        Trigger Animation
      </button>
      <button data-testid="anim-confetti" onClick={() => showConfetti(500)}>
        Show Confetti
      </button>
      <button data-testid="anim-highlight" onClick={() => highlightElement('test', 500)}>
        Highlight
      </button>
      <button data-testid="anim-clear" onClick={clearAllAnimations}>
        Clear All
      </button>
    </div>
  );
};

// Test component for modals hook
const ModalsTestComponent = () => {
  const { modals, openModal, closeModal, closeAllModals, hasOpenModals } = useModals();

  return (
    <div>
      <span data-testid="modal-product-open">{modals.productDetails.isOpen ? 'Yes' : 'No'}</span>
      <span data-testid="modal-address-open">{modals.addressForm.isOpen ? 'Yes' : 'No'}</span>
      <span data-testid="modal-has-open">{hasOpenModals ? 'Yes' : 'No'}</span>
      
      <button data-testid="modal-open-product" onClick={() => openModal('productDetails')}>
        Open Product
      </button>
      <button data-testid="modal-close-product" onClick={() => closeModal('productDetails')}>
        Close Product
      </button>
      <button data-testid="modal-close-all" onClick={closeAllModals}>
        Close All
      </button>
    </div>
  );
};

// Test component for loading states hook
const LoadingStatesTestComponent = () => {
  const { loading, setLoading, isLoading, isAnyLoading } = useLoadingStates();

  return (
    <div>
      <span data-testid="loading-test">{loading.test ? 'Yes' : 'No'}</span>
      <span data-testid="loading-is-test">{isLoading('test') ? 'Yes' : 'No'}</span>
      <span data-testid="loading-is-any">{isAnyLoading ? 'Yes' : 'No'}</span>
      
      <button data-testid="loading-set" onClick={() => setLoading('test', true)}>
        Set Loading
      </button>
      <button data-testid="loading-clear" onClick={() => setLoading('test', false)}>
        Clear Loading
      </button>
    </div>
  );
};

// Test component for responsive hook
const ResponsiveTestComponent = () => {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();

  return (
    <div>
      <span data-testid="resp-is-mobile">{isMobile ? 'Yes' : 'No'}</span>
      <span data-testid="resp-is-tablet">{isTablet ? 'Yes' : 'No'}</span>
      <span data-testid="resp-is-desktop">{isDesktop ? 'Yes' : 'No'}</span>
      <span data-testid="resp-breakpoint">{breakpoint}</span>
    </div>
  );
};

describe('UIStateProvider', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Restore and recreate console.warn spy
    if (consoleWarnSpy) {
      consoleWarnSpy.mockRestore();
    }
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Default Values', () => {
    it('should provide default values when used without provider', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('menu');
      expect(screen.getByTestId('can-go-next')).toHaveTextContent('No');
      expect(screen.getByTestId('can-go-previous')).toHaveTextContent('No');
      expect(screen.getByTestId('show-confetti')).toHaveTextContent('No');
      expect(screen.getByTestId('highlight-element')).toHaveTextContent('None');
      expect(screen.getByTestId('active-animations')).toHaveTextContent('0');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('No');
      expect(screen.getByTestId('theme')).toHaveTextContent('auto');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('Yes');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('No');
      expect(screen.getByTestId('performance-mode')).toHaveTextContent('balanced');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'useUIState must be used within a UIStateProvider. Using default values.'
      );
    });

    it('should work correctly when wrapped in provider', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('current-step')).toHaveTextContent('menu');
      expect(screen.getByTestId('can-go-next')).toHaveTextContent('Yes');
      expect(screen.getByTestId('can-go-previous')).toHaveTextContent('No');
      expect(screen.getByTestId('theme')).toHaveTextContent('auto');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should use initial values when provided', () => {
      render(
        <UIStateProvider initialStep="cart" initialTheme="dark" performanceMode="high">
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('current-step')).toHaveTextContent('cart');
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('performance-mode')).toHaveTextContent('high');
    });
  });

  describe('Checkout Flow', () => {
    it('should navigate through checkout steps', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Start at menu
      expect(screen.getByTestId('current-step')).toHaveTextContent('menu');
      expect(screen.getByTestId('can-go-next')).toHaveTextContent('Yes');
      expect(screen.getByTestId('can-go-previous')).toHaveTextContent('No');

      // Go to next step (cart)
      fireEvent.click(screen.getByTestId('next-step'));
      expect(screen.getByTestId('current-step')).toHaveTextContent('cart');
      expect(screen.getByTestId('can-go-previous')).toHaveTextContent('Yes');

      // Go back to menu
      fireEvent.click(screen.getByTestId('previous-step'));
      expect(screen.getByTestId('current-step')).toHaveTextContent('menu');
    });

    it('should set specific step', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      fireEvent.click(screen.getByTestId('set-cart-step'));
      expect(screen.getByTestId('current-step')).toHaveTextContent('cart');
    });
  });

  describe('Animations', () => {
    it('should trigger and manage animations', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Initially no animations
      expect(screen.getByTestId('active-animations')).toHaveTextContent('0');

      // Trigger animation
      fireEvent.click(screen.getByTestId('trigger-confetti'));
      expect(screen.getByTestId('active-animations')).toHaveTextContent('1');

      // Clear animations
      fireEvent.click(screen.getByTestId('clear-animations'));
      expect(screen.getByTestId('active-animations')).toHaveTextContent('0');
    });

    it('should show confetti', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('show-confetti')).toHaveTextContent('No');

      fireEvent.click(screen.getByTestId('show-confetti-btn'));
      expect(screen.getByTestId('show-confetti')).toHaveTextContent('Yes');

      // Should auto-hide after duration
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByTestId('show-confetti')).toHaveTextContent('No');
    });

    it('should highlight elements', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('highlight-element')).toHaveTextContent('None');

      fireEvent.click(screen.getByTestId('highlight-btn'));
      expect(screen.getByTestId('highlight-element')).toHaveTextContent('test-element');

      // Should auto-clear after duration
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByTestId('highlight-element')).toHaveTextContent('None');
    });

    it('should respect reduced motion preference', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('Yes');

      // Confetti should not show with reduced motion
      fireEvent.click(screen.getByTestId('show-confetti-btn'));
      expect(screen.getByTestId('show-confetti')).toHaveTextContent('No');
    });
  });

  describe('Modals', () => {
    it('should open and close modals', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Initially closed
      expect(screen.getByTestId('product-modal')).toHaveTextContent('Closed');

      // Open modal
      fireEvent.click(screen.getByTestId('open-product-modal'));
      expect(screen.getByTestId('product-modal')).toHaveTextContent('Open');

      // Close modal
      fireEvent.click(screen.getByTestId('close-product-modal'));
      expect(screen.getByTestId('product-modal')).toHaveTextContent('Closed');
    });

    it('should close all modals', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Open multiple modals
      fireEvent.click(screen.getByTestId('open-product-modal'));
      expect(screen.getByTestId('product-modal')).toHaveTextContent('Open');

      // Close all
      fireEvent.click(screen.getByTestId('close-all-modals'));
      expect(screen.getByTestId('product-modal')).toHaveTextContent('Closed');
    });
  });

  describe('Loading States', () => {
    it('should manage loading states', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Initially not loading
      expect(screen.getByTestId('is-loading')).toHaveTextContent('No');

      // Set loading
      fireEvent.click(screen.getByTestId('set-loading'));
      expect(screen.getByTestId('is-loading')).toHaveTextContent('Yes');

      // Clear loading
      fireEvent.click(screen.getByTestId('clear-loading'));
      expect(screen.getByTestId('is-loading')).toHaveTextContent('No');
    });
  });

  describe('Theme and Settings', () => {
    it('should manage theme', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('auto');

      fireEvent.click(screen.getByTestId('set-dark-theme'));
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    it('should toggle accessibility settings', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('No');
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('No');

      fireEvent.click(screen.getByTestId('toggle-reduced-motion'));
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('Yes');

      fireEvent.click(screen.getByTestId('toggle-high-contrast'));
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('Yes');
    });

    it('should manage performance mode', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('performance-mode')).toHaveTextContent('balanced');

      fireEvent.click(screen.getByTestId('set-performance-low'));
      expect(screen.getByTestId('performance-mode')).toHaveTextContent('low');
    });
  });

  describe('Specialized Hooks', () => {
    it('should provide checkout flow hook', () => {
      render(
        <UIStateProvider>
          <CheckoutFlowTestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('checkout-current-step')).toHaveTextContent('menu');
      expect(screen.getByTestId('checkout-is-first')).toHaveTextContent('Yes');
      expect(screen.getByTestId('checkout-is-last')).toHaveTextContent('No');
      expect(screen.getByTestId('checkout-step-index')).toHaveTextContent('0');
      expect(screen.getByTestId('checkout-total-steps')).toHaveTextContent('7');

      fireEvent.click(screen.getByTestId('checkout-next'));
      expect(screen.getByTestId('checkout-current-step')).toHaveTextContent('cart');
      expect(screen.getByTestId('checkout-step-index')).toHaveTextContent('1');
    });

    it('should provide animations hook', () => {
      render(
        <UIStateProvider>
          <AnimationsTestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('anim-has-active')).toHaveTextContent('No');

      fireEvent.click(screen.getByTestId('anim-trigger'));
      expect(screen.getByTestId('anim-has-active')).toHaveTextContent('Yes');

      fireEvent.click(screen.getByTestId('anim-clear'));
      expect(screen.getByTestId('anim-has-active')).toHaveTextContent('No');
    });

    it('should provide modals hook', () => {
      render(
        <UIStateProvider>
          <ModalsTestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('modal-has-open')).toHaveTextContent('No');

      fireEvent.click(screen.getByTestId('modal-open-product'));
      expect(screen.getByTestId('modal-has-open')).toHaveTextContent('Yes');
      expect(screen.getByTestId('modal-product-open')).toHaveTextContent('Yes');

      fireEvent.click(screen.getByTestId('modal-close-all'));
      expect(screen.getByTestId('modal-has-open')).toHaveTextContent('No');
    });

    it('should provide loading states hook', () => {
      render(
        <UIStateProvider>
          <LoadingStatesTestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('loading-is-any')).toHaveTextContent('No');

      fireEvent.click(screen.getByTestId('loading-set'));
      expect(screen.getByTestId('loading-is-any')).toHaveTextContent('Yes');
      expect(screen.getByTestId('loading-is-test')).toHaveTextContent('Yes');

      fireEvent.click(screen.getByTestId('loading-clear'));
      expect(screen.getByTestId('loading-is-any')).toHaveTextContent('No');
    });

    it('should provide responsive hook', () => {
      render(
        <UIStateProvider>
          <ResponsiveTestComponent />
        </UIStateProvider>
      );

      expect(screen.getByTestId('resp-is-desktop')).toHaveTextContent('Yes');
      expect(screen.getByTestId('resp-breakpoint')).toHaveTextContent('desktop');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should close modals with ESC key', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Open modal
      fireEvent.click(screen.getByTestId('open-product-modal'));
      expect(screen.getByTestId('product-modal')).toHaveTextContent('Open');

      // Press ESC
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByTestId('product-modal')).toHaveTextContent('Closed');
    });
  });

  describe('Responsive Behavior', () => {
    it('should update responsive state on window resize', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Initially desktop
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('Yes');
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('No');

      // Simulate mobile resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('Yes');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('No');
    });
  });

  describe('Animation Auto-cleanup', () => {
    it('should auto-remove animations after duration', () => {
      render(
        <UIStateProvider>
          <TestComponent />
        </UIStateProvider>
      );

      // Trigger animation
      fireEvent.click(screen.getByTestId('trigger-border-beam'));
      expect(screen.getByTestId('active-animations')).toHaveTextContent('1');

      // Should auto-remove after default duration (3000ms)
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByTestId('active-animations')).toHaveTextContent('0');
    });
  });
});