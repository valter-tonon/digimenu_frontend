/**
 * Performance Monitoring Service for Core Web Vitals and Custom Metrics
 * Tracks and reports performance metrics for the delivery flow
 */

import { analyticsService } from './analytics';
import { sentryService } from './sentryIntegration';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  page?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface CoreWebVitalsMetrics {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

export interface CustomMetrics {
  pageLoadTime?: number;
  checkoutFlowTime?: number;
  apiResponseTime?: number;
  componentRenderTime?: number;
  imageLoadTime?: number;
  formValidationTime?: number;
}

// Performance thresholds for Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 }
} as const;

export class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private isInitialized: boolean = false;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      this.initializeCoreWebVitalsObservers();
      this.initializeNavigationObserver();
      this.initializeResourceObserver();
      this.setupPerformanceReporting();
      
      this.isInitialized = true;
      console.log('Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Initialize Core Web Vitals observers
   */
  private initializeCoreWebVitalsObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('LCP', lastEntry.startTime, 'ms', {
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || window.location.href
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.recordMetric('FID', fid, 'ms', {
            eventType: entry.name,
            target: entry.target?.tagName || 'unknown'
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue, 'score', {
          entryCount: entries.length
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime, 'ms');
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('FCP observer not supported');
    }

    // Interaction to Next Paint (INP) - if supported
    try {
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.interactionId) {
            const inp = entry.processingEnd - entry.startTime;
            this.recordMetric('INP', inp, 'ms', {
              interactionType: entry.name,
              target: entry.target?.tagName || 'unknown'
            });
          }
        });
      });
      inpObserver.observe({ entryTypes: ['event'] });
      this.observers.push(inpObserver);
    } catch (e) {
      console.warn('INP observer not supported');
    }
  }

  /**
   * Initialize navigation observer
   */
  private initializeNavigationObserver(): void {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // Time to First Byte (TTFB)
          const ttfb = entry.responseStart - entry.requestStart;
          this.recordMetric('TTFB', ttfb, 'ms');

          // DOM Content Loaded
          const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
          this.recordMetric('DOM_CONTENT_LOADED', domContentLoaded, 'ms');

          // Page Load Time
          const pageLoadTime = entry.loadEventEnd - entry.navigationStart;
          this.recordMetric('PAGE_LOAD_TIME', pageLoadTime, 'ms');
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  /**
   * Initialize resource observer
   */
  private initializeResourceObserver(): void {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const resourceType = entry.initiatorType;
          const loadTime = entry.responseEnd - entry.startTime;
          
          this.recordMetric(`RESOURCE_LOAD_${resourceType.toUpperCase()}`, loadTime, 'ms', {
            url: entry.name,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported');
    }
  }

  /**
   * Set user ID for tracking
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Record a custom performance metric
   */
  public recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userId: this.userId,
      sessionId: this.sessionId,
      metadata
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);

    // Report to analytics service
    analyticsService.trackPerformanceMetric(name, value, unit);

    // Report to Sentry
    sentryService.capturePerformanceMetric(name, value, unit, {
      page: metric.page || 'unknown'
    });

    // Log performance issues
    this.checkPerformanceThresholds(name, value);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      const status = this.getPerformanceStatus(name, value);
      console.log(`Performance [${name}]: ${value.toFixed(2)}${unit} (${status})`);
    }
  }

  /**
   * Track API call performance
   */
  public trackApiCall(
    endpoint: string,
    method: string,
    startTime: number,
    endTime: number,
    success: boolean,
    statusCode?: number
  ): void {
    const duration = endTime - startTime;
    
    this.recordMetric('API_CALL_DURATION', duration, 'ms', {
      endpoint,
      method,
      success,
      statusCode
    });

    // Track slow API calls
    if (duration > 2000) {
      this.recordMetric('SLOW_API_CALL', duration, 'ms', {
        endpoint,
        method,
        statusCode
      });
    }
  }

  /**
   * Track component render performance
   */
  public trackComponentRender(
    componentName: string,
    renderTime: number,
    props?: any
  ): void {
    this.recordMetric('COMPONENT_RENDER_TIME', renderTime, 'ms', {
      component: componentName,
      propsCount: props ? Object.keys(props).length : 0
    });

    // Track slow renders
    if (renderTime > 16) { // 60fps threshold
      this.recordMetric('SLOW_COMPONENT_RENDER', renderTime, 'ms', {
        component: componentName
      });
    }
  }

  /**
   * Track form validation performance
   */
  public trackFormValidation(
    formName: string,
    validationTime: number,
    fieldCount: number,
    hasErrors: boolean
  ): void {
    this.recordMetric('FORM_VALIDATION_TIME', validationTime, 'ms', {
      form: formName,
      fieldCount,
      hasErrors
    });
  }

  /**
   * Track image loading performance
   */
  public trackImageLoad(
    imageUrl: string,
    loadTime: number,
    imageSize?: number
  ): void {
    this.recordMetric('IMAGE_LOAD_TIME', loadTime, 'ms', {
      url: imageUrl,
      size: imageSize
    });
  }

  /**
   * Track checkout flow performance
   */
  public trackCheckoutFlowStep(
    step: string,
    stepTime: number,
    totalTime: number
  ): void {
    this.recordMetric('CHECKOUT_STEP_TIME', stepTime, 'ms', {
      step,
      totalTime
    });
  }

  /**
   * Get Core Web Vitals metrics
   */
  public getCoreWebVitals(): CoreWebVitalsMetrics {
    const metrics: CoreWebVitalsMetrics = {};
    
    for (const [key, metric] of this.metrics) {
      if (metric.name === 'LCP') metrics.LCP = metric.value;
      if (metric.name === 'FID') metrics.FID = metric.value;
      if (metric.name === 'CLS') metrics.CLS = metric.value;
      if (metric.name === 'FCP') metrics.FCP = metric.value;
      if (metric.name === 'TTFB') metrics.TTFB = metric.value;
      if (metric.name === 'INP') metrics.INP = metric.value;
    }
    
    return metrics;
  }

  /**
   * Get custom metrics
   */
  public getCustomMetrics(): CustomMetrics {
    const metrics: CustomMetrics = {};
    
    for (const [key, metric] of this.metrics) {
      if (metric.name === 'PAGE_LOAD_TIME') metrics.pageLoadTime = metric.value;
      if (metric.name === 'API_CALL_DURATION') metrics.apiResponseTime = metric.value;
      if (metric.name === 'COMPONENT_RENDER_TIME') metrics.componentRenderTime = metric.value;
      if (metric.name === 'IMAGE_LOAD_TIME') metrics.imageLoadTime = metric.value;
      if (metric.name === 'FORM_VALIDATION_TIME') metrics.formValidationTime = metric.value;
    }
    
    return metrics;
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    coreWebVitals: CoreWebVitalsMetrics;
    customMetrics: CustomMetrics;
    performanceScore: number;
    issues: string[];
  } {
    const coreWebVitals = this.getCoreWebVitals();
    const customMetrics = this.getCustomMetrics();
    const issues: string[] = [];
    let score = 100;

    // Check Core Web Vitals thresholds
    Object.entries(coreWebVitals).forEach(([metric, value]) => {
      if (value !== undefined) {
        const threshold = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS];
        if (threshold) {
          if (value > threshold.needsImprovement) {
            issues.push(`${metric} is poor (${value.toFixed(2)}ms)`);
            score -= 20;
          } else if (value > threshold.good) {
            issues.push(`${metric} needs improvement (${value.toFixed(2)}ms)`);
            score -= 10;
          }
        }
      }
    });

    return {
      coreWebVitals,
      customMetrics,
      performanceScore: Math.max(0, score),
      issues
    };
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Disconnect all observers
   */
  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }

  /**
   * Private helper methods
   */

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkPerformanceThresholds(name: string, value: number): void {
    const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!threshold) return;

    if (value > threshold.needsImprovement) {
      console.warn(`Performance issue: ${name} is ${value.toFixed(2)}ms (threshold: ${threshold.needsImprovement}ms)`);
      
      // Report performance issue to Sentry
      sentryService.captureMessage(
        `Performance threshold exceeded: ${name}`,
        'warning',
        {
          tags: {
            metric: name,
            severity: 'poor'
          },
          contexts: {
            performance: {
              metric: name,
              value,
              threshold: threshold.needsImprovement,
              page: typeof window !== 'undefined' ? window.location.pathname : undefined
            }
          }
        }
      );
    }
  }

  private getPerformanceStatus(name: string, value: number): string {
    const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs improvement';
    return 'poor';
  }

  private setupPerformanceReporting(): void {
    // Report performance summary every 30 seconds
    setInterval(() => {
      const summary = this.getPerformanceSummary();
      if (summary.issues.length > 0) {
        console.warn('Performance issues detected:', summary.issues);
      }
    }, 30000);

    // Report on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        const summary = this.getPerformanceSummary();
        
        // Send final performance report
        analyticsService.trackEvent('performance_summary', 'performance', {
          core_web_vitals: summary.coreWebVitals,
          custom_metrics: summary.customMetrics,
          performance_score: summary.performanceScore,
          issues_count: summary.issues.length
        });
      });
    }
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Performance measurement utilities
export class PerformanceMeasurement {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  /**
   * End measurement and record metric
   */
  public end(metadata?: Record<string, any>): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    performanceMonitoring.recordMetric(this.name, duration, 'ms', metadata);
    
    return duration;
  }
}

// Utility function to measure performance
export function measurePerformance(name: string): PerformanceMeasurement {
  return new PerformanceMeasurement(name);
}

// Decorator for measuring function performance
export function measureFunction(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measurementName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const measurement = measurePerformance(measurementName);
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            measurement.end({ args: args.length });
          });
        }
        
        measurement.end({ args: args.length });
        return result;
      } catch (error) {
        measurement.end({ args: args.length, error: true });
        throw error;
      }
    };

    return descriptor;
  };
}