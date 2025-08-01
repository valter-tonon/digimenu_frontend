/**
 * Magic UI Component Dynamic Loader
 * Implements code splitting and tree shaking for Magic UI components
 */

import { lazy, ComponentType } from 'react';

// Type definitions for Magic UI components
export interface MagicUIComponentProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

// Component loading states
export interface ComponentLoadingState {
  isLoading: boolean;
  error: Error | null;
  component: ComponentType<any> | null;
}

// Dynamic import functions with error handling
const createDynamicImport = <T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType<T>
) => {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.warn('Failed to load Magic UI component:', error);
      
      // Return fallback component if available
      if (fallback) {
        return { default: fallback };
      }
      
      // Return minimal fallback
      return {
        default: ({ children, className, ...props }: any) => {
          const React = require('react');
          return React.createElement('div', { className, ...props }, children);
        }
      };
    }
  });
};

// Lazy-loaded Magic UI components with fallbacks
export const LazyMagicComponents = {
  // Loading components
  MagicSpinner: createDynamicImport(
    () => import('@/components/ui/MagicUILoading').then(m => ({ default: m.MagicSpinner }))
  ),
  
  MagicPulse: createDynamicImport(
    () => import('@/components/ui/MagicUILoading').then(m => ({ default: m.MagicPulse }))
  ),
  
  MagicWave: createDynamicImport(
    () => import('@/components/ui/MagicUILoading').then(m => ({ default: m.MagicWave }))
  ),
  
  MagicOrbit: createDynamicImport(
    () => import('@/components/ui/MagicUILoading').then(m => ({ default: m.MagicOrbit }))
  ),
  
  MagicGradient: createDynamicImport(
    () => import('@/components/ui/MagicUILoading').then(m => ({ default: m.MagicGradient }))
  ),
  
  MagicLoadingOverlay: createDynamicImport(
    () => import('@/components/ui/MagicUILoading').then(m => ({ default: m.MagicLoadingOverlay }))
  ),
  
  // Progress components
  ProgressIndicator: createDynamicImport(
    () => import('@/components/ui/ProgressIndicator')
  ),
  
  // Skeleton components
  SkeletonLoader: createDynamicImport(
    () => import('@/components/ui/SkeletonLoader').then(m => ({ default: m.ProductGridSkeleton }))
  ),
  
  // Success celebration components
  SuccessCelebration: createDynamicImport(
    () => import('@/components/ui/SuccessCelebration')
  ),
};

// Heavy animation components (loaded only when needed)
export const LazyAnimationComponents = {
  Confetti: createDynamicImport(
    () => import('canvas-confetti').then(confetti => ({
      default: ({ onComplete, ...options }: any) => {
        confetti.default(options).then(onComplete);
        return null;
      }
    }))
  ),
};

// Component preloader for critical components
export class MagicUIPreloader {
  private static preloadedComponents = new Set<string>();
  private static preloadPromises = new Map<string, Promise<any>>();

  /**
   * Preload critical Magic UI components
   */
  static async preloadCritical(): Promise<void> {
    const criticalComponents = [
      'MagicSpinner',
      'MagicLoadingOverlay',
      'ProgressIndicator'
    ];

    const preloadPromises = criticalComponents.map(componentName => 
      this.preloadComponent(componentName)
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Preload a specific component
   */
  static async preloadComponent(componentName: string): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    if (this.preloadPromises.has(componentName)) {
      return this.preloadPromises.get(componentName);
    }

    const preloadPromise = this.loadComponent(componentName);
    this.preloadPromises.set(componentName, preloadPromise);

    try {
      await preloadPromise;
      this.preloadedComponents.add(componentName);
    } catch (error) {
      console.warn(`Failed to preload component ${componentName}:`, error);
      this.preloadPromises.delete(componentName);
    }
  }

  /**
   * Load component dynamically
   */
  private static async loadComponent(componentName: string): Promise<any> {
    switch (componentName) {
      case 'MagicSpinner':
        return import('@/components/ui/MagicUILoading').then(m => m.MagicSpinner);
      case 'MagicPulse':
        return import('@/components/ui/MagicUILoading').then(m => m.MagicPulse);
      case 'MagicWave':
        return import('@/components/ui/MagicUILoading').then(m => m.MagicWave);
      case 'MagicOrbit':
        return import('@/components/ui/MagicUILoading').then(m => m.MagicOrbit);
      case 'MagicGradient':
        return import('@/components/ui/MagicUILoading').then(m => m.MagicGradient);
      case 'MagicLoadingOverlay':
        return import('@/components/ui/MagicUILoading').then(m => m.MagicLoadingOverlay);
      case 'ProgressIndicator':
        return import('@/components/ui/ProgressIndicator');
      case 'SkeletonLoader':
        return import('@/components/ui/SkeletonLoader').then(m => m.ProductGridSkeleton);
      case 'SuccessCelebration':
        return import('@/components/ui/SuccessCelebration');
      default:
        throw new Error(`Unknown component: ${componentName}`);
    }
  }

  /**
   * Check if component is preloaded
   */
  static isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  /**
   * Get preload statistics
   */
  static getStats() {
    return {
      preloaded: Array.from(this.preloadedComponents),
      pending: Array.from(this.preloadPromises.keys()),
      total: this.preloadedComponents.size + this.preloadPromises.size
    };
  }
}

// Bundle size optimization utilities
export class BundleOptimizer {
  /**
   * Get component bundle size estimate
   */
  static getComponentSize(componentName: string): number {
    const sizeMap: Record<string, number> = {
      'MagicSpinner': 2.1, // KB
      'MagicPulse': 2.8,
      'MagicWave': 2.3,
      'MagicOrbit': 3.1,
      'MagicGradient': 2.9,
      'MagicLoadingOverlay': 1.8,
      'ProgressIndicator': 4.2,
      'SkeletonLoader': 3.5,
      'SuccessCelebration': 5.8,
      'Confetti': 12.4, // Heavy animation component
    };

    return sizeMap[componentName] || 0;
  }

  /**
   * Calculate total bundle size for components
   */
  static calculateBundleSize(components: string[]): number {
    return components.reduce((total, component) => {
      return total + this.getComponentSize(component);
    }, 0);
  }

  /**
   * Get optimization recommendations
   */
  static getOptimizationRecommendations(components: string[]): {
    critical: string[];
    lazy: string[];
    heavy: string[];
    totalSize: number;
  } {
    const critical = ['MagicSpinner', 'MagicLoadingOverlay'];
    const heavy = ['Confetti', 'SuccessCelebration'];
    const lazy = components.filter(c => !critical.includes(c) && !heavy.includes(c));

    return {
      critical,
      lazy,
      heavy,
      totalSize: this.calculateBundleSize(components)
    };
  }
}

// Performance monitoring for component loading
export class ComponentPerformanceMonitor {
  private static loadTimes = new Map<string, number>();
  private static loadErrors = new Map<string, Error[]>();

  /**
   * Start timing component load
   */
  static startTiming(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      this.loadTimes.set(componentName, loadTime);
      
      // Log slow loading components
      if (loadTime > 100) {
        console.warn(`Slow loading component: ${componentName} (${loadTime.toFixed(2)}ms)`);
      }
    };
  }

  /**
   * Record component load error
   */
  static recordError(componentName: string, error: Error): void {
    const errors = this.loadErrors.get(componentName) || [];
    errors.push(error);
    this.loadErrors.set(componentName, errors);
  }

  /**
   * Get performance metrics
   */
  static getMetrics() {
    const metrics = {
      loadTimes: Object.fromEntries(this.loadTimes),
      errors: Object.fromEntries(this.loadErrors),
      averageLoadTime: 0,
      slowestComponent: '',
      errorRate: 0
    };

    if (this.loadTimes.size > 0) {
      const times = Array.from(this.loadTimes.values());
      metrics.averageLoadTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      const slowest = Array.from(this.loadTimes.entries())
        .sort(([,a], [,b]) => b - a)[0];
      metrics.slowestComponent = slowest?.[0] || '';
    }

    const totalComponents = this.loadTimes.size + this.loadErrors.size;
    if (totalComponents > 0) {
      metrics.errorRate = this.loadErrors.size / totalComponents;
    }

    return metrics;
  }

  /**
   * Reset metrics
   */
  static reset(): void {
    this.loadTimes.clear();
    this.loadErrors.clear();
  }
}

// Export utilities
export {
  createDynamicImport,
  type ComponentLoadingState,
  type MagicUIComponentProps
};