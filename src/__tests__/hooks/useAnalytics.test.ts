/**
 * Tests for Analytics Hooks
 * Validates useAnalytics, useDeliveryFlowTracking, and usePerformanceTracking hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useAnalytics, 
  useDeliveryFlowTracking, 
  usePerformanceTracking,
  useErrorTracking 
} from '@/hooks/useAnalytics';
import { analyticsService, DELIVERY_FLOW_EVENTS } from '@/services/analytics';

// Mock the analytics service
vi.mock('@/services/analytics', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
    trackDeliveryFlowEvent: vi.fn(),
    trackFunnelStep: vi.fn(),
    trackPerformanceMetric: vi.fn(),
    trackCoreWebVitals: vi.fn(),
    trackError: vi.fn(),
    setUserId: vi.fn(),
    getFunnelData: vi.fn(() => []),
    getPerformanceMetrics: vi.fn(() => []),
    clearData: vi.fn(),
    flush: vi.fn(() => Promise.resolve())
  },
  DELIVERY_FLOW_EVENTS: {
    MENU_LOADED: 'menu_loaded',
    PRODUCT_VIEWED: 'product_viewed',
    PRODUCT_ADDED_TO_CART: 'product_added_to_cart',
    CART_VIEWED: 'cart_viewed',
    CHECKOUT_STARTED: 'checkout_started',
    ORDER_CONFIRMED: 'order_confirmed',
    CHECKOUT_ERROR: 'checkout_error',
    PAGE_LOAD_TIME: 'page_load_time'
  },
  CONVERSION_FUNNEL_STEPS: {
    MENU_VIEW: { step: 'menu_view', number: 1 },
    PRODUCT_ADD: { step: 'product_add', number: 2 },
    CART_VIEW: { step: 'cart_view', number: 3 },
    CHECKOUT_START: { step: 'checkout_start', number: 4 },
    ORDER_COMPLETE: { step: 'order_complete', number: 8 }
  }
}));

// Mock useUserTracking hook
vi.mock('@/hooks/useUserTracking', () => ({
  useUserTracking: () => ({
    userId: 'test-user-123',
    initializeTracking: vi.fn(() => 'test-user-123')
  })
}));

// Mock window and performance
const mockWindow = {
  location: { pathname: '/test-path' },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

const mockDocument = {
  readyState: 'complete'
};

const mockPerformance = {
  now: vi.fn(() => Date.now())
};

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
    
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true
    });
    
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Analytics Functions', () => {
    it('should initialize analytics and track Core Web Vitals', () => {
      renderHook(() => useAnalytics());

      expect(analyticsService.setUserId).toHaveBeenCalledWith('test-user-123');
      expect(analyticsService.trackCoreWebVitals).toHaveBeenCalled();
    });

    it('should track custom events', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackEvent('test_event', 'test_category', { prop: 'value' });
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'test_event',
        'test_category',
        { prop: 'value' }
      );
    });

    it('should track delivery flow events', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackDeliveryFlowEvent('menu_loaded', { product_count: 10 });
      });

      expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
        'menu_loaded',
        { product_count: 10 }
      );
    });

    it('should track funnel steps', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFunnelStep('MENU_VIEW', { product_count: 5 });
      });

      expect(analyticsService.trackFunnelStep).toHaveBeenCalledWith(
        'menu_view',
        1,
        { product_count: 5 }
      );
    });

    it('should track performance metrics', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPerformanceMetric('test_metric', 1500, 'ms');
      });

      expect(analyticsService.trackPerformanceMetric).toHaveBeenCalledWith(
        'test_metric',
        1500,
        'ms'
      );
    });

    it('should track errors with context', () => {
      const { result } = renderHook(() => useAnalytics());
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      act(() => {
        result.current.trackError(error, context);
      });

      expect(analyticsService.trackError).toHaveBeenCalledWith(error, {
        ...context,
        page: '/test-path',
        timestamp: expect.any(String)
      });
    });

    it('should identify users', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.identifyUser('new-user-456');
      });

      expect(analyticsService.setUserId).toHaveBeenCalledWith('new-user-456');
    });
  });

  describe('Data Access Functions', () => {
    it('should get funnel data', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.getFunnelData();
      });

      expect(analyticsService.getFunnelData).toHaveBeenCalled();
    });

    it('should get performance metrics', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.getPerformanceMetrics();
      });

      expect(analyticsService.getPerformanceMetrics).toHaveBeenCalled();
    });

    it('should clear data', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.clearData();
      });

      expect(analyticsService.clearData).toHaveBeenCalled();
    });

    it('should flush data', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.flush();
      });

      expect(analyticsService.flush).toHaveBeenCalled();
    });
  });

  describe('Page Load Tracking', () => {
    it('should track page load time when document is ready', () => {
      mockDocument.readyState = 'complete';
      
      renderHook(() => useAnalytics());

      expect(analyticsService.trackPerformanceMetric).toHaveBeenCalledWith(
        'page_load_time',
        expect.any(Number)
      );

      expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
        DELIVERY_FLOW_EVENTS.PAGE_LOAD_TIME,
        {
          load_time: expect.any(Number),
          page: '/test-path'
        }
      );
    });

    it('should wait for window load event when document is not ready', () => {
      mockDocument.readyState = 'loading';
      
      renderHook(() => useAnalytics());

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'load',
        expect.any(Function)
      );
    });
  });
});

describe('useDeliveryFlowTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track menu loaded', () => {
    const { result } = renderHook(() => useDeliveryFlowTracking());

    act(() => {
      result.current.trackMenuLoaded(15);
    });

    expect(analyticsService.trackFunnelStep).toHaveBeenCalledWith(
      'menu_view',
      1,
      { product_count: 15 }
    );

    expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
      DELIVERY_FLOW_EVENTS.MENU_LOADED,
      { product_count: 15 }
    );
  });

  it('should track product viewed', () => {
    const { result } = renderHook(() => useDeliveryFlowTracking());

    act(() => {
      result.current.trackProductViewed('prod-123', 'Pizza Margherita', 'pizzas');
    });

    expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
      DELIVERY_FLOW_EVENTS.PRODUCT_VIEWED,
      {
        product_id: 'prod-123',
        product_name: 'Pizza Margherita',
        category: 'pizzas'
      }
    );
  });

  it('should track product added to cart', () => {
    const { result } = renderHook(() => useDeliveryFlowTracking());

    act(() => {
      result.current.trackProductAddedToCart('prod-123', 'Pizza Margherita', 2, 25.99);
    });

    expect(analyticsService.trackFunnelStep).toHaveBeenCalledWith(
      'product_add',
      2,
      {
        product_id: 'prod-123',
        product_name: 'Pizza Margherita',
        quantity: 2,
        price: 25.99
      }
    );

    expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
      DELIVERY_FLOW_EVENTS.PRODUCT_ADDED_TO_CART,
      {
        product_id: 'prod-123',
        product_name: 'Pizza Margherita',
        quantity: 2,
        price: 25.99,
        cart_value: 51.98
      }
    );
  });

  it('should track checkout started', () => {
    const { result } = renderHook(() => useDeliveryFlowTracking());

    act(() => {
      result.current.trackCheckoutStarted(75.50, 3);
    });

    expect(analyticsService.trackFunnelStep).toHaveBeenCalledWith(
      'checkout_start',
      4,
      { total_value: 75.50, item_count: 3 }
    );

    expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
      DELIVERY_FLOW_EVENTS.CHECKOUT_STARTED,
      { total_value: 75.50, item_count: 3 }
    );
  });

  it('should track order confirmed', () => {
    const { result } = renderHook(() => useDeliveryFlowTracking());

    act(() => {
      result.current.trackOrderConfirmed('order-456', 89.99, 'pix');
    });

    expect(analyticsService.trackFunnelStep).toHaveBeenCalledWith(
      'order_complete',
      8,
      {
        order_id: 'order-456',
        total_value: 89.99,
        payment_method: 'pix'
      }
    );

    expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
      DELIVERY_FLOW_EVENTS.ORDER_CONFIRMED,
      {
        order_id: 'order-456',
        total_value: 89.99,
        payment_method: 'pix'
      }
    );
  });

  it('should track checkout errors', () => {
    const { result } = renderHook(() => useDeliveryFlowTracking());

    act(() => {
      result.current.trackCheckoutError('payment', 'validation_error', 'Invalid card number');
    });

    expect(analyticsService.trackDeliveryFlowEvent).toHaveBeenCalledWith(
      DELIVERY_FLOW_EVENTS.CHECKOUT_ERROR,
      {
        step: 'payment',
        error_type: 'validation_error',
        error_message: 'Invalid card number'
      }
    );
  });
});

describe('usePerformanceTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track component render time', () => {
    const { result } = renderHook(() => usePerformanceTracking());

    act(() => {
      result.current.trackComponentRenderTime('ProductCard', 15.5);
    });

    expect(analyticsService.trackPerformanceMetric).toHaveBeenCalledWith(
      'ProductCard_render_time',
      15.5
    );
  });

  it('should track API call time', () => {
    const { result } = renderHook(() => usePerformanceTracking());

    act(() => {
      result.current.trackApiCallTime('/api/products', 250, true, 200);
    });

    expect(analyticsService.trackPerformanceMetric).toHaveBeenCalledWith(
      'api__api_products_duration',
      250
    );

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'api_call',
      'performance',
      {
        endpoint: '/api/products',
        duration: 250,
        success: true
      }
    );
  });

  it('should track form validation time', () => {
    const { result } = renderHook(() => usePerformanceTracking());

    act(() => {
      result.current.trackFormValidationTime('AddressForm', 45);
    });

    expect(analyticsService.trackPerformanceMetric).toHaveBeenCalledWith(
      'AddressForm_validation_time',
      45
    );
  });

  it('should track image load time', () => {
    const { result } = renderHook(() => usePerformanceTracking());

    act(() => {
      result.current.trackImageLoadTime('https://example.com/image.jpg', 800);
    });

    expect(analyticsService.trackPerformanceMetric).toHaveBeenCalledWith(
      'image_load_time',
      800
    );

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'image_loaded',
      'performance',
      {
        image_url: 'https://example.com/image.jpg',
        load_time: 800
      }
    );
  });
});

describe('useErrorTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track component errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    const error = new Error('Component render failed');
    const props = { productId: '123', quantity: 2 };

    act(() => {
      result.current.trackComponentError('ProductCard', error, props);
    });

    expect(analyticsService.trackError).toHaveBeenCalledWith(error, {
      component: 'ProductCard',
      props: JSON.stringify(props),
      error_boundary: 'component'
    });
  });

  it('should track API errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    const error = new Error('Network request failed');
    const requestData = { productId: '123' };

    act(() => {
      result.current.trackApiError('/api/products', error, requestData);
    });

    expect(analyticsService.trackError).toHaveBeenCalledWith(error, {
      endpoint: '/api/products',
      request_data: JSON.stringify(requestData),
      error_boundary: 'api'
    });
  });

  it('should track form errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    const error = new Error('Validation failed');
    const formData = { email: 'invalid-email' };

    act(() => {
      result.current.trackFormError('CustomerForm', 'email', error, formData);
    });

    expect(analyticsService.trackError).toHaveBeenCalledWith(error, {
      form: 'CustomerForm',
      field: 'email',
      form_data: JSON.stringify(formData),
      error_boundary: 'form'
    });
  });

  it('should track payment errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    const error = new Error('Payment processing failed');
    const orderData = { total: 99.99, items: 3 };

    act(() => {
      result.current.trackPaymentError('credit_card', error, orderData);
    });

    expect(analyticsService.trackError).toHaveBeenCalledWith(error, {
      payment_method: 'credit_card',
      order_data: JSON.stringify(orderData),
      error_boundary: 'payment'
    });
  });
});