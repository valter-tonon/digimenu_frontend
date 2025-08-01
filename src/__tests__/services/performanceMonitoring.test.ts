/**
 * Tests for Performance Monitoring Service
 * Validates Core Web Vitals tracking, custom metrics, and performance analysis
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { 
  PerformanceMonitoringService,
  performanceMonitoring,
  PerformanceMeasurement,
  measurePerformance,
  measureFunction,
  PERFORMANCE_THRESHOLDS,
  type PerformanceMetric,
  type CoreWebVitalsMetrics
} from '@/services/performanceMonitoring';

// Mock analytics service
vi.mock('@/services/analytics', () => ({
  analyticsService: {
    trackPerformanceMetric: vi.fn(),
    trackEvent: vi.fn()
  }
}));

// Mock Sentry service
vi.mock('@/services/sentryIntegration', () => ({
  sentryService: {
    capturePerformanceMetric: vi.fn(),
    captureMessage: vi.fn()
  }
}));

// Mock PerformanceObserver
const mockObserver = {
  observe: vi.fn(),
  disconnect: vi.fn()
};

const mockPerformanceObserver = vi.fn().mockImplementation((callback) => {
  // Store callback for manual triggering
  mockPerformanceObserver.callback = callback;
  return mockObserver;
});

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now())
};

// Mock window
const mockWindow = {
  location: { pathname: '/test-path' },
  innerWidth: 1920,
  innerHeight: 1080,
  screen: { width: 1920, height: 1080 },
  addEventListener: vi.fn()
};

describe('PerformanceMonitoringService', () => {
  let performanceService: PerformanceMonitoringService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup global mocks
    global.PerformanceObserver = mockPerformanceObserver;
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    });
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    performanceService = new PerformanceMonitoringService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    performanceService.disconnect();
  });

  describe('Initialization', () => {
    it('should initialize performance observers', () => {
      expect(mockPerformanceObserver).toHaveBeenCalledTimes(6); // LCP, FID, CLS, FCP, INP, Navigation, Resource
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['largest-contentful-paint'] });
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['first-input'] });
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['layout-shift'] });
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['paint'] });
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      // Remove PerformanceObserver
      delete (global as any).PerformanceObserver;
      
      expect(() => new PerformanceMonitoringService()).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('PerformanceObserver not supported');
    });
  });

  describe('Core Web Vitals Tracking', () => {
    it('should track Largest Contentful Paint (LCP)', () => {
      const lcpEntry = {
        startTime: 2500,
        element: { tagName: 'IMG' },
        url: 'https://example.com/image.jpg'
      };

      // Simulate LCP observer callback
      const lcpCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('LCP')
      )?.[0];
      
      if (lcpCallback) {
        lcpCallback({
          getEntries: () => [lcpEntry]
        });
      }

      const metrics = performanceService.getAllMetrics();
      const lcpMetric = metrics.find(m => m.name === 'LCP');
      
      expect(lcpMetric).toBeDefined();
      expect(lcpMetric?.value).toBe(2500);
      expect(lcpMetric?.unit).toBe('ms');
    });

    it('should track First Input Delay (FID)', () => {
      const fidEntry = {
        processingStart: 150,
        startTime: 100,
        name: 'click',
        target: { tagName: 'BUTTON' }
      };

      // Find and call FID observer
      const fidCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('FID')
      )?.[0];
      
      if (fidCallback) {
        fidCallback({
          getEntries: () => [fidEntry]
        });
      }

      const metrics = performanceService.getAllMetrics();
      const fidMetric = metrics.find(m => m.name === 'FID');
      
      expect(fidMetric).toBeDefined();
      expect(fidMetric?.value).toBe(50); // processingStart - startTime
    });

    it('should track Cumulative Layout Shift (CLS)', () => {
      const clsEntries = [
        { value: 0.05, hadRecentInput: false },
        { value: 0.03, hadRecentInput: false },
        { value: 0.02, hadRecentInput: true } // Should be ignored
      ];

      const clsCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('CLS')
      )?.[0];
      
      if (clsCallback) {
        clsEntries.forEach(entry => {
          clsCallback({
            getEntries: () => [entry]
          });
        });
      }

      const metrics = performanceService.getAllMetrics();
      const clsMetrics = metrics.filter(m => m.name === 'CLS');
      
      expect(clsMetrics.length).toBeGreaterThan(0);
      // Should accumulate only entries without recent input
      const lastCls = clsMetrics[clsMetrics.length - 1];
      expect(lastCls.value).toBe(0.08); // 0.05 + 0.03
    });

    it('should track First Contentful Paint (FCP)', () => {
      const fcpEntry = {
        name: 'first-contentful-paint',
        startTime: 1800
      };

      const fcpCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('FCP')
      )?.[0];
      
      if (fcpCallback) {
        fcpCallback({
          getEntries: () => [fcpEntry]
        });
      }

      const metrics = performanceService.getAllMetrics();
      const fcpMetric = metrics.find(m => m.name === 'FCP');
      
      expect(fcpMetric).toBeDefined();
      expect(fcpMetric?.value).toBe(1800);
    });
  });

  describe('Custom Metrics Recording', () => {
    it('should record custom performance metrics', () => {
      const metricName = 'custom_metric';
      const value = 1500;
      const unit = 'ms';
      const metadata = { component: 'TestComponent' };

      performanceService.recordMetric(metricName, value, unit, metadata);

      const metrics = performanceService.getAllMetrics();
      const customMetric = metrics.find(m => m.name === metricName);

      expect(customMetric).toBeDefined();
      expect(customMetric).toMatchObject({
        name: metricName,
        value,
        unit,
        metadata,
        page: '/test-path',
        timestamp: expect.any(Number)
      });
    });

    it('should track API call performance', () => {
      const endpoint = '/api/products';
      const method = 'GET';
      const startTime = 1000;
      const endTime = 1250;
      const success = true;
      const statusCode = 200;

      performanceService.trackApiCall(endpoint, method, startTime, endTime, success, statusCode);

      const metrics = performanceService.getAllMetrics();
      const apiMetric = metrics.find(m => m.name === 'API_CALL_DURATION');

      expect(apiMetric).toBeDefined();
      expect(apiMetric?.value).toBe(250);
      expect(apiMetric?.metadata).toMatchObject({
        endpoint,
        method,
        success,
        statusCode
      });
    });

    it('should track slow API calls separately', () => {
      const endpoint = '/api/slow-endpoint';
      const method = 'POST';
      const startTime = 1000;
      const endTime = 4000; // 3 seconds - slow
      const success = true;

      performanceService.trackApiCall(endpoint, method, startTime, endTime, success);

      const metrics = performanceService.getAllMetrics();
      const slowApiMetric = metrics.find(m => m.name === 'SLOW_API_CALL');

      expect(slowApiMetric).toBeDefined();
      expect(slowApiMetric?.value).toBe(3000);
    });

    it('should track component render performance', () => {
      const componentName = 'ProductCard';
      const renderTime = 25.5;
      const props = { productId: '123', quantity: 2 };

      performanceService.trackComponentRender(componentName, renderTime, props);

      const metrics = performanceService.getAllMetrics();
      const renderMetric = metrics.find(m => m.name === 'COMPONENT_RENDER_TIME');

      expect(renderMetric).toBeDefined();
      expect(renderMetric?.value).toBe(25.5);
      expect(renderMetric?.metadata).toMatchObject({
        component: componentName,
        propsCount: 2
      });
    });

    it('should track slow component renders', () => {
      const componentName = 'SlowComponent';
      const renderTime = 20; // > 16ms threshold

      performanceService.trackComponentRender(componentName, renderTime);

      const metrics = performanceService.getAllMetrics();
      const slowRenderMetric = metrics.find(m => m.name === 'SLOW_COMPONENT_RENDER');

      expect(slowRenderMetric).toBeDefined();
      expect(slowRenderMetric?.value).toBe(20);
    });
  });

  describe('Performance Analysis', () => {
    beforeEach(() => {
      // Record some test metrics
      performanceService.recordMetric('LCP', 2000, 'ms');
      performanceService.recordMetric('FID', 80, 'ms');
      performanceService.recordMetric('CLS', 0.05, 'score');
      performanceService.recordMetric('PAGE_LOAD_TIME', 1800, 'ms');
    });

    it('should get Core Web Vitals metrics', () => {
      const coreWebVitals = performanceService.getCoreWebVitals();

      expect(coreWebVitals).toMatchObject({
        LCP: 2000,
        FID: 80,
        CLS: 0.05
      });
    });

    it('should get custom metrics', () => {
      const customMetrics = performanceService.getCustomMetrics();

      expect(customMetrics).toMatchObject({
        pageLoadTime: 1800
      });
    });

    it('should generate performance summary', () => {
      const summary = performanceService.getPerformanceSummary();

      expect(summary).toMatchObject({
        coreWebVitals: {
          LCP: 2000,
          FID: 80,
          CLS: 0.05
        },
        customMetrics: {
          pageLoadTime: 1800
        },
        performanceScore: expect.any(Number),
        issues: expect.any(Array)
      });

      expect(summary.performanceScore).toBeGreaterThan(0);
      expect(summary.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should identify performance issues', () => {
      // Add a poor performing metric
      performanceService.recordMetric('LCP', 5000, 'ms'); // Poor LCP

      const summary = performanceService.getPerformanceSummary();

      expect(summary.issues).toContain(expect.stringContaining('LCP is poor'));
      expect(summary.performanceScore).toBeLessThan(100);
    });
  });

  describe('Performance Thresholds', () => {
    it('should warn about performance issues', () => {
      const poorLcp = 5000; // Above threshold

      performanceService.recordMetric('LCP', poorLcp, 'ms');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance issue: LCP')
      );
    });

    it('should not warn about good performance', () => {
      const goodLcp = 1500; // Below threshold

      performanceService.recordMetric('LCP', goodLcp, 'ms');

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Data Management', () => {
    it('should clear all metrics', () => {
      performanceService.recordMetric('test_metric', 100, 'ms');
      expect(performanceService.getAllMetrics()).toHaveLength(1);

      performanceService.clearMetrics();
      expect(performanceService.getAllMetrics()).toHaveLength(0);
    });

    it('should disconnect observers', () => {
      performanceService.disconnect();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should set user ID', () => {
      const userId = 'user123';
      performanceService.setUserId(userId);

      performanceService.recordMetric('test_metric', 100, 'ms');
      const metrics = performanceService.getAllMetrics();

      expect(metrics[0].userId).toBe(userId);
    });
  });
});

describe('PerformanceMeasurement', () => {
  beforeEach(() => {
    mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1250);
  });

  it('should measure performance duration', () => {
    const measurement = new PerformanceMeasurement('test_measurement');
    const duration = measurement.end({ component: 'TestComponent' });

    expect(duration).toBe(250);
    expect(performanceMonitoring.getAllMetrics()).toContainEqual(
      expect.objectContaining({
        name: 'test_measurement',
        value: 250,
        unit: 'ms',
        metadata: { component: 'TestComponent' }
      })
    );
  });
});

describe('measurePerformance utility', () => {
  it('should create performance measurement', () => {
    const measurement = measurePerformance('utility_test');

    expect(measurement).toBeInstanceOf(PerformanceMeasurement);
  });
});

describe('measureFunction decorator', () => {
  it('should measure function execution time', () => {
    class TestClass {
      @measureFunction('test_function')
      testMethod(arg1: string, arg2: number): string {
        return `${arg1}-${arg2}`;
      }
    }

    mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);

    const instance = new TestClass();
    const result = instance.testMethod('test', 123);

    expect(result).toBe('test-123');
    expect(performanceMonitoring.getAllMetrics()).toContainEqual(
      expect.objectContaining({
        name: 'test_function',
        value: 100,
        metadata: { args: 2 }
      })
    );
  });

  it('should measure async function execution time', async () => {
    class TestClass {
      @measureFunction('async_test')
      async asyncMethod(): Promise<string> {
        return Promise.resolve('async-result');
      }
    }

    mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1200);

    const instance = new TestClass();
    const result = await instance.asyncMethod();

    expect(result).toBe('async-result');
    expect(performanceMonitoring.getAllMetrics()).toContainEqual(
      expect.objectContaining({
        name: 'async_test',
        value: 200
      })
    );
  });

  it('should handle function errors', () => {
    class TestClass {
      @measureFunction('error_test')
      errorMethod(): never {
        throw new Error('Test error');
      }
    }

    mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050);

    const instance = new TestClass();

    expect(() => instance.errorMethod()).toThrow('Test error');
    expect(performanceMonitoring.getAllMetrics()).toContainEqual(
      expect.objectContaining({
        name: 'error_test',
        value: 50,
        metadata: { args: 0, error: true }
      })
    );
  });
});

describe('Performance Thresholds Constants', () => {
  it('should export performance thresholds', () => {
    expect(PERFORMANCE_THRESHOLDS.LCP).toEqual({
      good: 2500,
      needsImprovement: 4000
    });

    expect(PERFORMANCE_THRESHOLDS.FID).toEqual({
      good: 100,
      needsImprovement: 300
    });

    expect(PERFORMANCE_THRESHOLDS.CLS).toEqual({
      good: 0.1,
      needsImprovement: 0.25
    });
  });
});

describe('Singleton Instance', () => {
  it('should export performance monitoring singleton', () => {
    expect(performanceMonitoring).toBeInstanceOf(PerformanceMonitoringService);
  });
});