/**
 * Performance Tests for Magic UI Component Loading
 * Tests loading times, bundle sizes, and optimization effectiveness
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  MagicUIPreloader, 
  ComponentPerformanceMonitor, 
  BundleOptimizer 
} from '@/lib/magicui-loader';
import { 
  TreeShakingOptimizer, 
  RuntimeFeatureDetector 
} from '@/lib/magicui-tree-shaking';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Magic UI Component Loading Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ComponentPerformanceMonitor.reset();
    RuntimeFeatureDetector.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Preloading', () => {
    it('should preload critical components within performance budget', async () => {
      const startTime = performance.now();
      
      await MagicUIPreloader.preloadCritical();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Critical components should load within 100ms
      expect(loadTime).toBeLessThan(100);
      
      const stats = MagicUIPreloader.getStats();
      expect(stats.preloaded.length).toBeGreaterThan(0);
    });

    it('should preload individual components efficiently', async () => {
      const componentName = 'MagicSpinner';
      const startTime = performance.now();
      
      await MagicUIPreloader.preloadComponent(componentName);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Individual components should load within 50ms
      expect(loadTime).toBeLessThan(50);
      expect(MagicUIPreloader.isPreloaded(componentName)).toBe(true);
    });

    it('should handle concurrent preloading without performance degradation', async () => {
      const components = ['MagicSpinner', 'MagicPulse', 'MagicWave'];
      const startTime = performance.now();
      
      const promises = components.map(component => 
        MagicUIPreloader.preloadComponent(component)
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalLoadTime = endTime - startTime;
      
      // Concurrent loading should be faster than sequential
      expect(totalLoadTime).toBeLessThan(150);
      
      components.forEach(component => {
        expect(MagicUIPreloader.isPreloaded(component)).toBe(true);
      });
    });

    it('should not reload already preloaded components', async () => {
      const componentName = 'MagicSpinner';
      
      // First load
      await MagicUIPreloader.preloadComponent(componentName);
      expect(MagicUIPreloader.isPreloaded(componentName)).toBe(true);
      
      const startTime = performance.now();
      
      // Second load should be instant
      await MagicUIPreloader.preloadComponent(componentName);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should be nearly instant (< 5ms)
      expect(loadTime).toBeLessThan(5);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track component load times accurately', () => {
      const componentName = 'MagicSpinner';
      const mockLoadTime = 45;
      
      // Mock performance.now to return predictable values
      mockPerformance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(mockLoadTime);
      
      const endTiming = ComponentPerformanceMonitor.startTiming(componentName);
      endTiming();
      
      const metrics = ComponentPerformanceMonitor.getMetrics();
      expect(metrics.loadTimes[componentName]).toBe(mockLoadTime);
    });

    it('should identify slow loading components', () => {
      const slowComponent = 'SlowComponent';
      const fastComponent = 'FastComponent';
      
      // Mock slow loading
      mockPerformance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(150) // 150ms - slow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(30); // 30ms - fast
      
      const endSlowTiming = ComponentPerformanceMonitor.startTiming(slowComponent);
      endSlowTiming();
      
      const endFastTiming = ComponentPerformanceMonitor.startTiming(fastComponent);
      endFastTiming();
      
      const metrics = ComponentPerformanceMonitor.getMetrics();
      expect(metrics.slowestComponent).toBe(slowComponent);
      expect(metrics.loadTimes[slowComponent]).toBe(150);
      expect(metrics.loadTimes[fastComponent]).toBe(30);
    });

    it('should calculate average load times correctly', () => {
      const components = ['Component1', 'Component2', 'Component3'];
      const loadTimes = [30, 60, 90]; // Average should be 60
      
      components.forEach((component, index) => {
        mockPerformance.now
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(loadTimes[index]);
        
        const endTiming = ComponentPerformanceMonitor.startTiming(component);
        endTiming();
      });
      
      const metrics = ComponentPerformanceMonitor.getMetrics();
      expect(metrics.averageLoadTime).toBe(60);
    });

    it('should track error rates accurately', () => {
      const componentName = 'ErrorComponent';
      const error = new Error('Load failed');
      
      ComponentPerformanceMonitor.recordError(componentName, error);
      ComponentPerformanceMonitor.recordError(componentName, error);
      
      const metrics = ComponentPerformanceMonitor.getMetrics();
      expect(metrics.errors[componentName]).toHaveLength(2);
      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should calculate component sizes accurately', () => {
      const spinnerSize = BundleOptimizer.getComponentSize('MagicSpinner');
      const confettiSize = BundleOptimizer.getComponentSize('Confetti');
      
      expect(spinnerSize).toBeGreaterThan(0);
      expect(confettiSize).toBeGreaterThan(spinnerSize); // Confetti should be larger
    });

    it('should calculate total bundle size correctly', () => {
      const components = ['MagicSpinner', 'MagicPulse', 'MagicWave'];
      const totalSize = BundleOptimizer.calculateBundleSize(components);
      
      const expectedSize = components.reduce((sum, component) => {
        return sum + BundleOptimizer.getComponentSize(component);
      }, 0);
      
      expect(totalSize).toBe(expectedSize);
    });

    it('should provide optimization recommendations', () => {
      const components = [
        'MagicSpinner', 
        'MagicPulse', 
        'Confetti', 
        'SuccessCelebration'
      ];
      
      const recommendations = BundleOptimizer.getOptimizationRecommendations(components);
      
      expect(recommendations.critical).toContain('MagicSpinner');
      expect(recommendations.heavy).toContain('Confetti');
      expect(recommendations.totalSize).toBeGreaterThan(0);
    });

    it('should identify heavy components for lazy loading', () => {
      const components = ['MagicSpinner', 'Confetti', 'SuccessCelebration'];
      const recommendations = BundleOptimizer.getOptimizationRecommendations(components);
      
      // Heavy components should be identified
      expect(recommendations.heavy.length).toBeGreaterThan(0);
      expect(recommendations.heavy).toContain('Confetti');
    });
  });

  describe('Tree Shaking Optimization', () => {
    it('should identify enabled features correctly', () => {
      expect(TreeShakingOptimizer.isFeatureEnabled('SPINNER_ANIMATIONS')).toBe(true);
      expect(TreeShakingOptimizer.isFeatureEnabled('PARTICLE_EFFECTS')).toBe(false);
    });

    it('should determine component inclusion based on features', () => {
      expect(TreeShakingOptimizer.shouldIncludeComponent('MagicSpinner')).toBe(true);
      expect(TreeShakingOptimizer.shouldIncludeComponent('ProgressIndicator')).toBe(true);
    });

    it('should calculate bundle size reduction accurately', () => {
      const reduction = TreeShakingOptimizer.calculateBundleSizeReduction();
      
      expect(reduction.originalSize).toBeGreaterThan(reduction.optimizedSize);
      expect(reduction.reduction).toBeGreaterThan(0);
      expect(reduction.reductionPercentage).toBeGreaterThan(0);
      expect(reduction.reductionPercentage).toBeLessThanOrEqual(100);
    });

    it('should get optimized component list', () => {
      const optimizedComponents = TreeShakingOptimizer.getOptimizedComponents();
      
      expect(optimizedComponents).toContain('MagicSpinner');
      expect(optimizedComponents).toContain('ProgressIndicator');
      expect(optimizedComponents.length).toBeGreaterThan(0);
    });

    it('should identify disabled features', () => {
      const disabledFeatures = TreeShakingOptimizer.getDisabledFeatures();
      
      expect(disabledFeatures).toContain('PARTICLE_EFFECTS');
      expect(disabledFeatures).toContain('CUSTOM_SHAPES');
      expect(disabledFeatures).toContain('EMOJI_CONFETTI');
    });
  });

  describe('Runtime Feature Detection', () => {
    it('should detect feature usage at runtime', () => {
      RuntimeFeatureDetector.detectFeatureUsage('SPINNER_ANIMATIONS');
      RuntimeFeatureDetector.detectFeatureUsage('CONFETTI_EFFECTS');
      
      const report = RuntimeFeatureDetector.generateOptimizationReport();
      
      expect(report.unusedFeatures).not.toContain('SPINNER_ANIMATIONS');
      expect(report.unusedFeatures).not.toContain('CONFETTI_EFFECTS');
    });

    it('should identify unused features', () => {
      // Don't detect any feature usage
      const report = RuntimeFeatureDetector.generateOptimizationReport();
      
      expect(report.unusedFeatures.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide optimization recommendations', () => {
      const report = RuntimeFeatureDetector.generateOptimizationReport();
      
      expect(report).toHaveProperty('enabledFeatures');
      expect(report).toHaveProperty('disabledFeatures');
      expect(report).toHaveProperty('unusedFeatures');
      expect(report).toHaveProperty('bundleReduction');
      expect(report).toHaveProperty('recommendations');
      
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should recommend disabling unused features', () => {
      // Simulate no feature usage
      const report = RuntimeFeatureDetector.generateOptimizationReport();
      
      if (report.unusedFeatures.length > 0) {
        const hasUnusedRecommendation = report.recommendations.some(rec => 
          rec.includes('unused features')
        );
        expect(hasUnusedRecommendation).toBe(true);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet loading time benchmarks', async () => {
      const benchmarks = {
        criticalComponents: 100, // ms
        individualComponent: 50, // ms
        concurrentLoading: 150, // ms
        cacheHit: 5, // ms
      };
      
      // Test critical components loading
      const criticalStart = performance.now();
      await MagicUIPreloader.preloadCritical();
      const criticalTime = performance.now() - criticalStart;
      
      expect(criticalTime).toBeLessThan(benchmarks.criticalComponents);
      
      // Test individual component loading
      const individualStart = performance.now();
      await MagicUIPreloader.preloadComponent('MagicPulse');
      const individualTime = performance.now() - individualStart;
      
      expect(individualTime).toBeLessThan(benchmarks.individualComponent);
    });

    it('should maintain performance under load', async () => {
      const iterations = 10;
      const loadTimes: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await MagicUIPreloader.preloadComponent(`TestComponent${i}`);
        const end = performance.now();
        loadTimes.push(end - start);
      }
      
      const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const maxLoadTime = Math.max(...loadTimes);
      
      // Performance should remain consistent
      expect(averageLoadTime).toBeLessThan(100);
      expect(maxLoadTime).toBeLessThan(200);
    });

    it('should optimize memory usage', () => {
      const initialStats = MagicUIPreloader.getStats();
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;
      
      // Simulate loading multiple components
      const promises = Array.from({ length: 5 }, (_, i) => 
        MagicUIPreloader.preloadComponent(`MemoryTest${i}`)
      );
      
      return Promise.all(promises).then(() => {
        const finalStats = MagicUIPreloader.getStats();
        const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
        
        // Memory increase should be reasonable
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePerComponent = memoryIncrease / 5;
        
        // Each component should use less than 1MB
        expect(memoryIncreasePerComponent).toBeLessThan(1024 * 1024);
      });
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors without significant performance impact', async () => {
      const errorComponent = 'NonExistentComponent';
      
      const start = performance.now();
      
      try {
        await MagicUIPreloader.preloadComponent(errorComponent);
      } catch (error) {
        // Expected to fail
      }
      
      const end = performance.now();
      const errorHandlingTime = end - start;
      
      // Error handling should be fast
      expect(errorHandlingTime).toBeLessThan(50);
    });

    it('should maintain performance metrics during errors', () => {
      const componentName = 'ErrorComponent';
      const error = new Error('Test error');
      
      const start = performance.now();
      ComponentPerformanceMonitor.recordError(componentName, error);
      const end = performance.now();
      
      const recordingTime = end - start;
      
      // Error recording should be very fast
      expect(recordingTime).toBeLessThan(10);
      
      const metrics = ComponentPerformanceMonitor.getMetrics();
      expect(metrics.errors[componentName]).toContain(error);
    });
  });
});

describe('Magic UI Bundle Analysis Integration', () => {
  it('should provide comprehensive bundle analysis', () => {
    const analysis = {
      components: TreeShakingOptimizer.getOptimizedComponents(),
      bundleReduction: TreeShakingOptimizer.calculateBundleSizeReduction(),
      disabledFeatures: TreeShakingOptimizer.getDisabledFeatures(),
    };
    
    expect(analysis.components.length).toBeGreaterThan(0);
    expect(analysis.bundleReduction.reductionPercentage).toBeGreaterThan(0);
    expect(analysis.disabledFeatures.length).toBeGreaterThan(0);
  });

  it('should validate optimization effectiveness', () => {
    const reduction = TreeShakingOptimizer.calculateBundleSizeReduction();
    
    // Should achieve at least 20% bundle size reduction
    expect(reduction.reductionPercentage).toBeGreaterThanOrEqual(20);
    
    // Should save at least 10KB
    expect(reduction.reduction).toBeGreaterThanOrEqual(10);
  });
});