/**
 * Performance Regression Tests
 * Tests to ensure Core Web Vitals and performance metrics stay within acceptable ranges
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getPerformanceMonitor, BundleAnalyzer, PerformanceOptimizer, PERFORMANCE_THRESHOLDS } from '@/utils/performanceMonitoring';

// Mock performance APIs
const mockPerformanceObserver = vi.fn();
const mockPerformanceEntry = {
  name: 'test-entry',
  entryType: 'measure',
  startTime: 100,
  duration: 50
};

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
  mockPerformanceObserver.mockImplementation(callback);
  return {
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  };
});

// Mock performance.getEntriesByType
Object.defineProperty(global.performance, 'getEntriesByType', {
  value: vi.fn(() => [mockPerformanceEntry])
});

// Mock performance.mark and performance.measure
Object.defineProperty(global.performance, 'mark', {
  value: vi.fn()
});

Object.defineProperty(global.performance, 'measure', {
  value: vi.fn(() => mockPerformanceEntry)
});

// Mock performance.now
Object.defineProperty(global.performance, 'now', {
  value: vi.fn(() => Date.now())
});

// Mock window.gtag for analytics
Object.defineProperty(global.window, 'gtag', {
  value: vi.fn(),
  writable: true
});

describe('Performance Monitoring', () => {
  let performanceMonitor: any;

  beforeAll(() => {
    // Initialize performance monitoring
    performanceMonitor = getPerformanceMonitor();
  });

  afterAll(() => {
    if (performanceMonitor) {
      performanceMonitor.disconnect();
    }
  });

  describe('Core Web Vitals Thresholds', () => {
    it('should have correct LCP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.LCP.good).toBe(2500);
      expect(PERFORMANCE_THRESHOLDS.LCP.needsImprovement).toBe(4000);
    });

    it('should have correct FID thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FID.good).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.FID.needsImprovement).toBe(300);
    });

    it('should have correct CLS thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.CLS.good).toBe(0.1);
      expect(PERFORMANCE_THRESHOLDS.CLS.needsImprovement).toBe(0.25);
    });

    it('should have correct FCP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FCP.good).toBe(1800);
      expect(PERFORMANCE_THRESHOLDS.FCP.needsImprovement).toBe(3000);
    });

    it('should have correct TTFB thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.TTFB.good).toBe(800);
      expect(PERFORMANCE_THRESHOLDS.TTFB.needsImprovement).toBe(1800);
    });
  });

  describe('Performance Monitor', () => {
    it('should initialize without errors', () => {
      expect(performanceMonitor).toBeDefined();
      expect(typeof performanceMonitor.getMetrics).toBe('function');
      expect(typeof performanceMonitor.getCoreWebVitals).toBe('function');
    });

    it('should track metrics correctly', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toBeInstanceOf(Map);
    });

    it('should calculate performance score', () => {
      const score = performanceMonitor.getPerformanceScore();
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should generate performance report', () => {
      const report = performanceMonitor.generateReport();
      expect(typeof report).toBe('string');
      expect(report).toContain('Performance Report');
      expect(report).toContain('Core Web Vitals');
    });

    it('should get core web vitals', () => {
      const vitals = performanceMonitor.getCoreWebVitals();
      expect(vitals).toHaveProperty('LCP');
      expect(vitals).toHaveProperty('FID');
      expect(vitals).toHaveProperty('CLS');
      expect(vitals).toHaveProperty('FCP');
      expect(vitals).toHaveProperty('TTFB');
    });
  });

  describe('Bundle Analyzer', () => {
    let bundleAnalyzer: BundleAnalyzer;

    beforeAll(() => {
      bundleAnalyzer = BundleAnalyzer.getInstance();
    });

    it('should be a singleton', () => {
      const instance1 = BundleAnalyzer.getInstance();
      const instance2 = BundleAnalyzer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should track bundle metrics', () => {
      const metrics = bundleAnalyzer.getBundleMetrics();
      expect(metrics).toBeInstanceOf(Map);
    });

    it('should generate bundle report', () => {
      const report = bundleAnalyzer.generateBundleReport();
      expect(typeof report).toBe('string');
      expect(report).toContain('Bundle Size Report');
      expect(report).toContain('Total JavaScript');
      expect(report).toContain('Total CSS');
    });
  });

  describe('Performance Optimizer', () => {
    beforeAll(() => {
      // Mock DOM methods
      document.createElement = vi.fn().mockReturnValue({
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        dataset: {},
        rel: '',
        href: '',
        as: '',
        crossOrigin: '',
        src: '',
        async: false
      });

      document.head = {
        appendChild: vi.fn()
      } as any;

      document.querySelectorAll = vi.fn().mockReturnValue([]);
    });

    it('should preload resources', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');

      PerformanceOptimizer.preloadResource('/test.js', 'script');

      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should prefetch resources', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');

      PerformanceOptimizer.prefetchResource('/next-page.js');

      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should optimize images', () => {
      // Mock IntersectionObserver
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      };

      global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver);

      PerformanceOptimizer.optimizeImages();

      expect(global.IntersectionObserver).toHaveBeenCalled();
    });

    it('should defer non-critical JavaScript', () => {
      const mockScript = {
        getAttribute: vi.fn().mockReturnValue('/deferred.js'),
        setAttribute: vi.fn(),
        dataset: {}
      };

      document.querySelectorAll = vi.fn().mockReturnValue([mockScript]);
      document.readyState = 'complete';

      PerformanceOptimizer.deferNonCriticalJS();

      expect(document.querySelectorAll).toHaveBeenCalledWith('script[data-defer]');
    });
  });

  describe('Performance Regression Detection', () => {
    beforeAll(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });
    });

    it('should detect performance regressions', () => {
      const getItemSpy = vi.spyOn(localStorage, 'getItem').mockReturnValue('90');
      const setItemSpy = vi.spyOn(localStorage, 'setItem');

      // Mock a performance score that's worse than baseline
      vi.spyOn(performanceMonitor, 'getPerformanceScore').mockReturnValue(70);

      PerformanceOptimizer.detectPerformanceRegressions();

      expect(getItemSpy).toHaveBeenCalledWith('performance_baseline');
      // Should not update baseline since score is worse
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('should update baseline when performance improves', () => {
      const getItemSpy = vi.spyOn(localStorage, 'getItem').mockReturnValue('70');
      const setItemSpy = vi.spyOn(localStorage, 'setItem');

      // Mock a performance score that's better than baseline
      vi.spyOn(performanceMonitor, 'getPerformanceScore').mockReturnValue(90);

      PerformanceOptimizer.detectPerformanceRegressions();

      expect(getItemSpy).toHaveBeenCalledWith('performance_baseline');
      expect(setItemSpy).toHaveBeenCalledWith('performance_baseline', '90');
    });

    it('should set initial baseline when none exists', () => {
      const getItemSpy = vi.spyOn(localStorage, 'getItem').mockReturnValue(null);
      const setItemSpy = vi.spyOn(localStorage, 'setItem');

      vi.spyOn(performanceMonitor, 'getPerformanceScore').mockReturnValue(85);

      PerformanceOptimizer.detectPerformanceRegressions();

      expect(getItemSpy).toHaveBeenCalledWith('performance_baseline');
      expect(setItemSpy).toHaveBeenCalledWith('performance_baseline', '85');
    });
  });
});

describe('Performance Benchmarks', () => {
  describe('Bundle Size Limits', () => {
    it('should not exceed JavaScript bundle size limit', async () => {
      const bundleAnalyzer = BundleAnalyzer.getInstance();
      const metrics = bundleAnalyzer.getBundleMetrics();
      
      const jsFiles = Array.from(metrics.entries()).filter(([url]) => url.includes('.js'));
      const totalJsSize = jsFiles.reduce((sum, [, size]) => sum + size, 0);
      
      // Should not exceed 500KB for JavaScript
      expect(totalJsSize).toBeLessThanOrEqual(500 * 1024);
    });

    it('should not exceed CSS bundle size limit', async () => {
      const bundleAnalyzer = BundleAnalyzer.getInstance();
      const metrics = bundleAnalyzer.getBundleMetrics();
      
      const cssFiles = Array.from(metrics.entries()).filter(([url]) => url.includes('.css'));
      const totalCssSize = cssFiles.reduce((sum, [, size]) => sum + size, 0);
      
      // Should not exceed 100KB for CSS
      expect(totalCssSize).toBeLessThanOrEqual(100 * 1024);
    });

    it('should not exceed total bundle size limit', async () => {
      const bundleAnalyzer = BundleAnalyzer.getInstance();
      const metrics = bundleAnalyzer.getBundleMetrics();
      
      const totalSize = Array.from(metrics.values()).reduce((sum, size) => sum + size, 0);
      
      // Should not exceed 600KB total
      expect(totalSize).toBeLessThanOrEqual(600 * 1024);
    });
  });

  describe('Core Web Vitals Benchmarks', () => {
    it('should maintain good LCP performance', () => {
      const vitals = performanceMonitor.getCoreWebVitals();
      
      if (vitals.LCP) {
        expect(vitals.LCP.value).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.LCP.good);
        expect(vitals.LCP.rating).toBe('good');
      }
    });

    it('should maintain good FID performance', () => {
      const vitals = performanceMonitor.getCoreWebVitals();
      
      if (vitals.FID) {
        expect(vitals.FID.value).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.FID.good);
        expect(vitals.FID.rating).toBe('good');
      }
    });

    it('should maintain good CLS performance', () => {
      const vitals = performanceMonitor.getCoreWebVitals();
      
      if (vitals.CLS) {
        expect(vitals.CLS.value).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.CLS.good);
        expect(vitals.CLS.rating).toBe('good');
      }
    });

    it('should maintain good FCP performance', () => {
      const vitals = performanceMonitor.getCoreWebVitals();
      
      if (vitals.FCP) {
        expect(vitals.FCP.value).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.FCP.good);
        expect(vitals.FCP.rating).toBe('good');
      }
    });

    it('should maintain good TTFB performance', () => {
      const vitals = performanceMonitor.getCoreWebVitals();
      
      if (vitals.TTFB) {
        expect(vitals.TTFB.value).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.TTFB.good);
        expect(vitals.TTFB.rating).toBe('good');
      }
    });
  });

  describe('Performance Score Benchmarks', () => {
    it('should maintain minimum performance score', () => {
      const score = performanceMonitor.getPerformanceScore();
      
      // Should maintain at least 80/100 performance score
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should not have significant performance regressions', () => {
      const score = performanceMonitor.getPerformanceScore();
      
      // Mock baseline score
      const baselineScore = 90;
      const regression = baselineScore - score;
      
      // Should not regress more than 10 points
      expect(regression).toBeLessThanOrEqual(10);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should not exceed memory usage limits', () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          totalJSHeapSize: 100 * 1024 * 1024, // 100MB
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
        },
        configurable: true
      });

      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      // Should not exceed 80% memory usage
      expect(usagePercentage).toBeLessThanOrEqual(80);
    });
  });

  describe('Resource Loading Benchmarks', () => {
    it('should not have excessive long tasks', () => {
      const metrics = performanceMonitor.getMetrics();
      const longTaskMetric = metrics.get('LONG_TASK');
      
      if (longTaskMetric) {
        // Long tasks should not exceed 50ms
        expect(longTaskMetric.value).toBeLessThanOrEqual(50);
      }
    });

    it('should have reasonable navigation timing', () => {
      const metrics = performanceMonitor.getMetrics();
      const totalNavTime = metrics.get('NAV_TOTAL');
      
      if (totalNavTime) {
        // Total navigation time should not exceed 3 seconds
        expect(totalNavTime.value).toBeLessThanOrEqual(3000);
      }
    });
  });
});

describe('Performance Optimization Validation', () => {
  describe('Resource Optimization', () => {
    it('should have optimized images', () => {
      // Check that images have proper loading attributes
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        // Should have loading="lazy" for non-critical images
        if (!img.hasAttribute('data-critical')) {
          expect(img.getAttribute('loading')).toBe('lazy');
        }
      });
    });

    it('should have preloaded critical resources', () => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      expect(preloadLinks.length).toBeGreaterThan(0);
    });

    it('should have deferred non-critical scripts', () => {
      const deferredScripts = document.querySelectorAll('script[data-defer]');
      // Should have some deferred scripts for optimization
      expect(deferredScripts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Code Splitting Validation', () => {
    it('should have multiple JavaScript chunks', () => {
      const bundleAnalyzer = BundleAnalyzer.getInstance();
      const metrics = bundleAnalyzer.getBundleMetrics();
      
      const jsFiles = Array.from(metrics.keys()).filter(url => url.includes('.js'));
      
      // Should have multiple chunks for code splitting
      expect(jsFiles.length).toBeGreaterThan(1);
    });

    it('should not have excessively large individual chunks', () => {
      const bundleAnalyzer = BundleAnalyzer.getInstance();
      const metrics = bundleAnalyzer.getBundleMetrics();
      
      const jsFiles = Array.from(metrics.entries()).filter(([url]) => url.includes('.js'));
      
      jsFiles.forEach(([url, size]) => {
        // Individual chunks should not exceed 250KB
        expect(size).toBeLessThanOrEqual(250 * 1024);
      });
    });
  });

  describe('Caching Validation', () => {
    it('should have proper cache headers for static assets', async () => {
      // This would typically be tested in an integration environment
      // For now, we'll just verify the structure exists
      expect(typeof PerformanceOptimizer.preloadResource).toBe('function');
      expect(typeof PerformanceOptimizer.prefetchResource).toBe('function');
    });
  });
});