/**
 * Tests for Analytics Service
 * Validates event tracking, conversion funnel tracking, and performance monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { 
  AnalyticsService, 
  DELIVERY_FLOW_EVENTS, 
  CONVERSION_FUNNEL_STEPS,
  type AnalyticsConfig 
} from '@/services/analytics';

// Mock window and document
const mockWindow = {
  location: {
    pathname: '/test-path',
    href: 'https://test.com/test-path'
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  gtag: vi.fn(),
  amplitude: {
    getInstance: () => ({
      init: vi.fn(),
      logEvent: vi.fn(),
      setUserId: vi.fn()
    })
  },
  mixpanel: {
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn()
  }
};

const mockDocument = {
  referrer: 'https://google.com',
  title: 'Test Page',
  createElement: vi.fn(() => ({
    async: false,
    src: '',
    onload: null,
    appendChild: vi.fn()
  })),
  head: {
    appendChild: vi.fn()
  }
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Mock fetch
global.fetch = vi.fn();

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockConfig: AnalyticsConfig;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
    
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true
    });
    
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    mockConfig = {
      gtag: {
        measurementId: 'GA_MEASUREMENT_ID',
        enabled: true
      },
      amplitude: {
        apiKey: 'AMPLITUDE_API_KEY',
        enabled: true
      },
      mixpanel: {
        token: 'MIXPANEL_TOKEN',
        enabled: true
      },
      customEndpoint: {
        url: '/api/analytics',
        enabled: true
      },
      enableConsoleLogging: true,
      enableLocalStorage: true,
      batchSize: 5,
      flushInterval: 1000
    };

    analyticsService = new AnalyticsService(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Event Tracking', () => {
    it('should track custom events', () => {
      const eventName = 'test_event';
      const category = 'test_category';
      const properties = { test_prop: 'test_value' };

      analyticsService.trackEvent(eventName, category, properties);

      // Should call gtag
      expect(mockWindow.gtag).toHaveBeenCalledWith('event', eventName, {
        event_category: category,
        ...properties,
        page: '/test-path',
        referrer: 'https://google.com',
        userAgent: mockNavigator.userAgent
      });

      // Should call amplitude
      expect(mockWindow.amplitude.getInstance().logEvent).toHaveBeenCalledWith(eventName, {
        category,
        ...properties,
        page: '/test-path',
        referrer: 'https://google.com',
        userAgent: mockNavigator.userAgent
      });

      // Should call mixpanel
      expect(mockWindow.mixpanel.track).toHaveBeenCalledWith(eventName, {
        category,
        ...properties,
        page: '/test-path',
        referrer: 'https://google.com',
        userAgent: mockNavigator.userAgent
      });
    });

    it('should track delivery flow events', () => {
      const properties = { product_id: '123', quantity: 2 };

      analyticsService.trackDeliveryFlowEvent(DELIVERY_FLOW_EVENTS.PRODUCT_ADDED_TO_CART, properties);

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', DELIVERY_FLOW_EVENTS.PRODUCT_ADDED_TO_CART, {
        event_category: 'delivery_flow',
        ...properties,
        flow_version: '2.0',
        timestamp: expect.any(Number),
        page: '/test-path',
        referrer: 'https://google.com',
        userAgent: mockNavigator.userAgent
      });
    });

    it('should set user ID across providers', () => {
      const userId = 'user123';

      analyticsService.setUserId(userId);

      expect(mockWindow.gtag).toHaveBeenCalledWith('config', mockConfig.gtag!.measurementId, {
        user_id: userId
      });

      expect(mockWindow.amplitude.getInstance().setUserId).toHaveBeenCalledWith(userId);
      expect(mockWindow.mixpanel.identify).toHaveBeenCalledWith(userId);
    });
  });

  describe('Conversion Funnel Tracking', () => {
    it('should track funnel steps', () => {
      const step = 'menu_view';
      const stepNumber = 1;
      const metadata = { product_count: 10 };

      analyticsService.trackFunnelStep(step, stepNumber, metadata);

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', `funnel_${step}`, {
        event_category: 'conversion_funnel',
        step_number: stepNumber,
        funnel_session: expect.any(String),
        ...metadata,
        page: '/test-path',
        referrer: 'https://google.com',
        userAgent: mockNavigator.userAgent
      });
    });

    it('should store funnel steps in localStorage', () => {
      const step = 'checkout_start';
      const stepNumber = 4;

      analyticsService.trackFunnelStep(step, stepNumber);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'digimenu-funnel-steps',
        expect.stringContaining(step)
      );
    });

    it('should retrieve funnel data', () => {
      const step = 'payment_method';
      const stepNumber = 7;

      analyticsService.trackFunnelStep(step, stepNumber);
      const funnelData = analyticsService.getFunnelData();

      expect(funnelData).toHaveLength(1);
      expect(funnelData[0]).toMatchObject({
        step,
        stepNumber,
        timestamp: expect.any(String)
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      const metricName = 'page_load_time';
      const value = 1500;
      const unit = 'ms';

      analyticsService.trackPerformanceMetric(metricName, value, unit);

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', 'performance_metric', {
        event_category: 'performance',
        event_label: metricName,
        value: Math.round(value),
        custom_map: { metric_name: metricName }
      });
    });

    it('should track Core Web Vitals', () => {
      // Mock PerformanceObserver
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      };

      global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
        // Simulate LCP entry
        setTimeout(() => {
          callback({
            getEntries: () => [{
              startTime: 2000,
              element: { tagName: 'IMG' },
              url: 'https://example.com/image.jpg'
            }]
          });
        }, 0);
        
        return mockObserver;
      });

      analyticsService.trackCoreWebVitals();

      expect(global.PerformanceObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['largest-contentful-paint'] });
    });

    it('should get performance metrics', () => {
      analyticsService.trackPerformanceMetric('test_metric', 100);
      const metrics = analyticsService.getPerformanceMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_metric',
        value: 100,
        unit: 'ms'
      });
    });
  });

  describe('Error Tracking', () => {
    it('should track errors', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      analyticsService.trackError(error, context);

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', 'error_occurred', {
        event_category: 'error',
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        ...context,
        page: '/test-path',
        referrer: 'https://google.com',
        userAgent: mockNavigator.userAgent
      });
    });
  });

  describe('Batch Processing', () => {
    it('should flush events when batch size is reached', async () => {
      // Mock fetch to resolve successfully
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      // Track events up to batch size
      for (let i = 0; i < mockConfig.batchSize!; i++) {
        analyticsService.trackEvent(`event_${i}`, 'test');
      }

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('events')
      });
    });

    it('should flush events manually', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      analyticsService.trackEvent('test_event', 'test');
      await analyticsService.flush();

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Data Management', () => {
    it('should clear all data', () => {
      analyticsService.trackEvent('test_event', 'test');
      analyticsService.trackFunnelStep('test_step', 1);
      analyticsService.trackPerformanceMetric('test_metric', 100);

      analyticsService.clearData();

      expect(analyticsService.getFunnelData()).toHaveLength(0);
      expect(analyticsService.getPerformanceMetrics()).toHaveLength(0);
      expect(localStorage.removeItem).toHaveBeenCalledWith('digimenu-analytics-events');
      expect(localStorage.removeItem).toHaveBeenCalledWith('digimenu-funnel-steps');
    });

    it('should load queued events from localStorage', () => {
      const queuedEvents = [
        {
          name: 'queued_event',
          category: 'test',
          timestamp: new Date().toISOString()
        }
      ];

      (localStorage.getItem as Mock).mockReturnValue(JSON.stringify(queuedEvents));

      // Create new instance to trigger loading
      new AnalyticsService(mockConfig);

      expect(localStorage.getItem).toHaveBeenCalledWith('digimenu-analytics-events');
      expect(localStorage.removeItem).toHaveBeenCalledWith('digimenu-analytics-events');
    });
  });

  describe('Provider Initialization', () => {
    it('should not initialize disabled providers', () => {
      const disabledConfig = {
        ...mockConfig,
        gtag: { ...mockConfig.gtag!, enabled: false },
        amplitude: { ...mockConfig.amplitude!, enabled: false },
        mixpanel: { ...mockConfig.mixpanel!, enabled: false }
      };

      new AnalyticsService(disabledConfig);

      // Should not create script elements for disabled providers
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should handle provider initialization errors gracefully', () => {
      // Mock console.warn to verify error handling
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock createElement to throw error
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('Script loading failed');
      });

      expect(() => new AnalyticsService(mockConfig)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Constants', () => {
    it('should export delivery flow events', () => {
      expect(DELIVERY_FLOW_EVENTS.MENU_LOADED).toBe('menu_loaded');
      expect(DELIVERY_FLOW_EVENTS.PRODUCT_ADDED_TO_CART).toBe('product_added_to_cart');
      expect(DELIVERY_FLOW_EVENTS.ORDER_CONFIRMED).toBe('order_confirmed');
    });

    it('should export conversion funnel steps', () => {
      expect(CONVERSION_FUNNEL_STEPS.MENU_VIEW).toEqual({ step: 'menu_view', number: 1 });
      expect(CONVERSION_FUNNEL_STEPS.ORDER_COMPLETE).toEqual({ step: 'order_complete', number: 8 });
    });
  });
});