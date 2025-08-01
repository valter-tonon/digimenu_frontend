/**
 * Tests for Sentry Integration Service
 * Validates error tracking, performance monitoring, and context management
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { 
  SentryIntegrationService, 
  sentryService,
  EnhancedErrorReportingService,
  enhancedErrorReporting,
  type SentryConfig 
} from '@/services/sentryIntegration';

// Mock Sentry SDK
const mockSentry = {
  init: vi.fn(),
  setUser: vi.fn(),
  setContext: vi.fn(),
  setTags: vi.fn(),
  setTag: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => {
    const mockScope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
      setLevel: vi.fn(),
      setFingerprint: vi.fn()
    };
    callback(mockScope);
  }),
  startTransaction: vi.fn(() => ({
    setTag: vi.fn(),
    setData: vi.fn(),
    finish: vi.fn()
  })),
  addBreadcrumb: vi.fn(),
  flush: vi.fn(() => Promise.resolve(true)),
  BrowserTracing: vi.fn(),
  Replay: vi.fn(),
  nextRouterInstrumentation: vi.fn()
};

// Mock dynamic import of Sentry
vi.mock('@sentry/nextjs', () => mockSentry);

// Mock window and navigator
const mockWindow = {
  location: { pathname: '/test-path' }
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  }
};

const mockScreen = {
  width: 1920,
  height: 1080
};

describe('SentryIntegrationService', () => {
  let sentryIntegration: SentryIntegrationService;
  let mockConfig: SentryConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'window', {
      value: {
        ...mockWindow,
        innerWidth: 1920,
        innerHeight: 1080,
        screen: mockScreen
      },
      writable: true
    });
    
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    mockConfig = {
      dsn: 'https://test-dsn@sentry.io/123456',
      environment: 'test',
      release: '1.0.0',
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      enabled: true
    };

    sentryIntegration = new SentryIntegrationService(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize Sentry with correct configuration', async () => {
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSentry.init).toHaveBeenCalledWith({
        dsn: mockConfig.dsn,
        environment: mockConfig.environment,
        release: mockConfig.release,
        sampleRate: mockConfig.sampleRate,
        tracesSampleRate: mockConfig.tracesSampleRate,
        integrations: expect.arrayContaining([
          expect.any(Object), // BrowserTracing
          expect.any(Object)  // Replay
        ]),
        beforeSend: expect.any(Function),
        beforeSendTransaction: expect.any(Function),
        attachStacktrace: true,
        autoSessionTracking: true,
        sendDefaultPii: false,
        initialScope: {
          tags: {
            component: 'delivery-flow',
            version: expect.any(String)
          }
        }
      });
    });

    it('should not initialize when disabled', () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      new SentryIntegrationService(disabledConfig);

      expect(mockSentry.init).not.toHaveBeenCalled();
    });

    it('should not initialize without DSN', () => {
      const noDsnConfig = { ...mockConfig, dsn: '' };
      new SentryIntegrationService(noDsnConfig);

      expect(mockSentry.init).not.toHaveBeenCalled();
    });
  });

  describe('User Management', () => {
    it('should set user context', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser'
      };

      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
      sentryIntegration.setUser(user);

      expect(mockSentry.setUser).toHaveBeenCalledWith(user);
    });

    it('should not set user when not initialized', () => {
      const uninitializedService = new SentryIntegrationService({
        ...mockConfig,
        enabled: false
      });

      uninitializedService.setUser({ id: 'user123' });

      expect(mockSentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe('Context and Tags', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
    });

    it('should set custom context', () => {
      const context = { sessionId: 'session123', feature: 'checkout' };

      sentryIntegration.setContext('custom', context);

      expect(mockSentry.setContext).toHaveBeenCalledWith('custom', context);
    });

    it('should set multiple tags', () => {
      const tags = { environment: 'test', version: '1.0.0' };

      sentryIntegration.setTags(tags);

      expect(mockSentry.setTags).toHaveBeenCalledWith(tags);
    });

    it('should set single tag', () => {
      sentryIntegration.setTag('feature', 'delivery-flow');

      expect(mockSentry.setTag).toHaveBeenCalledWith('feature', 'delivery-flow');
    });
  });

  describe('Exception Capturing', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
    });

    it('should capture exceptions with context', () => {
      const error = new Error('Test error');
      const context = {
        tags: { component: 'ProductCard' },
        contexts: { product: { id: '123', name: 'Pizza' } },
        level: 'error' as const,
        fingerprint: ['product-error']
      };

      sentryIntegration.captureException(error, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture delivery flow errors', () => {
      const error = new Error('Checkout failed');
      const step = 'payment';
      const context = { orderId: 'order123' };

      sentryIntegration.captureDeliveryFlowError(error, step, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture provider errors', () => {
      const error = new Error('Provider initialization failed');
      const providerName = 'CartProvider';
      const context = { retryCount: 3 };

      sentryIntegration.captureProviderError(error, providerName, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture API errors', () => {
      const error = new Error('API request failed');
      const endpoint = '/api/orders';
      const method = 'POST';
      const statusCode = 500;
      const requestData = { productId: '123' };

      sentryIntegration.captureApiError(error, endpoint, method, statusCode, requestData);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('Message Capturing', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
    });

    it('should capture messages with context', () => {
      const message = 'Performance threshold exceeded';
      const level = 'warning';
      const context = {
        tags: { metric: 'LCP' },
        contexts: { performance: { value: 3000 } }
      };

      sentryIntegration.captureMessage(message, level, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
    });

    it('should start transactions', async () => {
      const transaction = await sentryIntegration.startTransaction(
        'checkout-flow',
        'navigation',
        'User checkout process'
      );

      expect(mockSentry.startTransaction).toHaveBeenCalledWith({
        name: 'checkout-flow',
        op: 'navigation',
        description: 'User checkout process'
      });
    });

    it('should capture performance metrics as breadcrumbs', () => {
      sentryIntegration.capturePerformanceMetric('LCP', 2500, 'ms', { page: '/checkout' });

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Performance metric: LCP',
        category: 'performance',
        level: 'info',
        data: {
          metric_name: 'LCP',
          metric_value: 2500,
          metric_unit: 'ms',
          page: '/checkout'
        }
      });
    });
  });

  describe('Breadcrumbs', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
    });

    it('should add breadcrumbs', () => {
      const breadcrumb = {
        message: 'User clicked checkout button',
        category: 'ui',
        level: 'info' as const,
        data: { buttonId: 'checkout-btn' }
      };

      sentryIntegration.addBreadcrumb(breadcrumb);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: breadcrumb.message,
        category: breadcrumb.category,
        level: breadcrumb.level,
        data: breadcrumb.data,
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Error Filtering', () => {
    it('should filter non-critical errors', async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization

      // Get the beforeSend function from the init call
      const initCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      // Test filtering of non-critical errors
      const nonCriticalEvent = {
        exception: {
          values: [{
            value: 'Non-Error promise rejection captured'
          }]
        }
      };

      const result = beforeSend(nonCriticalEvent, {});
      expect(result).toBeNull();
    });

    it('should allow critical errors through', async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization

      const initCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      const criticalEvent = {
        exception: {
          values: [{
            value: 'Payment processing failed'
          }]
        }
      };

      const result = beforeSend(criticalEvent, {});
      expect(result).toBeTruthy();
    });

    it('should filter browser extension errors', async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization

      const initCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      const extensionEvent = {
        exception: {
          values: [{
            stacktrace: {
              frames: [{
                filename: 'chrome-extension://abc123/script.js'
              }]
            }
          }]
        }
      };

      const result = beforeSend(extensionEvent, {});
      expect(result).toBeNull();
    });
  });

  describe('Error Enhancement', () => {
    it('should enhance errors with browser context', async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization

      const initCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      const event = {
        exception: {
          values: [{
            value: 'Test error'
          }]
        }
      };

      const enhancedEvent = beforeSend(event, {});

      expect(enhancedEvent.contexts).toBeDefined();
      expect(enhancedEvent.contexts.browser).toMatchObject({
        name: 'Chrome',
        version: expect.any(String),
        user_agent: mockNavigator.userAgent
      });
      expect(enhancedEvent.contexts.viewport).toMatchObject({
        width: 1920,
        height: 1080,
        screen_width: 1920,
        screen_height: 1080
      });
      expect(enhancedEvent.contexts.connection).toMatchObject({
        effective_type: '4g',
        downlink: 10,
        rtt: 50,
        save_data: false
      });
    });
  });

  describe('Utility Methods', () => {
    it('should check if service is ready', async () => {
      expect(sentryIntegration.isReady()).toBe(false);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(sentryIntegration.isReady()).toBe(true);
    });

    it('should flush events', async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization

      const result = await sentryIntegration.flush(2000);

      expect(mockSentry.flush).toHaveBeenCalledWith(2000);
      expect(result).toBe(true);
    });
  });
});

describe('EnhancedErrorReportingService', () => {
  let mockSentryService: SentryIntegrationService;
  let errorReporting: EnhancedErrorReportingService;

  beforeEach(() => {
    mockSentryService = {
      captureDeliveryFlowError: vi.fn(),
      captureProviderError: vi.fn(),
      captureApiError: vi.fn(),
      setUser: vi.fn(),
      addBreadcrumb: vi.fn()
    } as any;

    errorReporting = new EnhancedErrorReportingService(mockSentryService);

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should report delivery flow errors', () => {
    const error = new Error('Checkout failed');
    const step = 'payment';
    const context = { orderId: 'order123' };

    errorReporting.reportDeliveryFlowError(error, step, context);

    expect(mockSentryService.captureDeliveryFlowError).toHaveBeenCalledWith(
      error,
      step,
      context
    );
  });

  it('should report provider errors', () => {
    const error = new Error('Provider failed');
    const providerName = 'CartProvider';
    const context = { retryCount: 2 };

    errorReporting.reportProviderError(error, providerName, context);

    expect(mockSentryService.captureProviderError).toHaveBeenCalledWith(
      error,
      providerName,
      context
    );
  });

  it('should report API errors', () => {
    const error = new Error('API failed');
    const endpoint = '/api/orders';
    const method = 'POST';
    const statusCode = 500;
    const requestData = { productId: '123' };

    errorReporting.reportApiError(error, endpoint, method, statusCode, requestData);

    expect(mockSentryService.captureApiError).toHaveBeenCalledWith(
      error,
      endpoint,
      method,
      statusCode,
      requestData
    );
  });

  it('should set user context', () => {
    const userId = 'user123';
    const email = 'test@example.com';

    errorReporting.setUser(userId, email);

    expect(mockSentryService.setUser).toHaveBeenCalledWith({
      id: userId,
      email
    });
  });

  it('should add breadcrumbs', () => {
    const message = 'User action';
    const category = 'ui';
    const data = { action: 'click' };

    errorReporting.addBreadcrumb(message, category, data);

    expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith({
      message,
      category,
      data
    });
  });

  it('should log to console in development', () => {
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Test error');
    errorReporting.reportDeliveryFlowError(error, 'test', {});

    expect(console.error).toHaveBeenCalledWith(
      'Delivery Flow Error [test]:',
      error,
      {}
    );

    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
});

describe('Singleton Instances', () => {
  it('should export configured sentry service', () => {
    expect(sentryService).toBeInstanceOf(SentryIntegrationService);
  });

  it('should export enhanced error reporting service', () => {
    expect(enhancedErrorReporting).toBeInstanceOf(EnhancedErrorReportingService);
  });
});