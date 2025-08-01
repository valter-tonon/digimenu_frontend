/**
 * Performance Monitoring and Core Web Vitals Tracking
 * Comprehensive performance monitoring system for production
 */

import { reportPerformance } from '@/services/errorReporting';

// Core Web Vitals thresholds
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
};

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

interface NavigationTiming {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  processing: number;
  load: number;
  total: number;
}

interface ResourceTiming {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined' || this.isMonitoring) return;

    this.isMonitoring = true;
    this.observeCoreWebVitals();
    this.observeNavigationTiming();
    this.observeResourceTiming();
    this.observeLongTasks();
    this.observeMemoryUsage();
  }

  private observeCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
    });

    // First Input Delay (FID)
    this.createObserver('first-input', (entries) => {
      const firstEntry = entries[0];
      this.recordMetric('FID', firstEntry.processingStart - firstEntry.startTime);
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.createObserver('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.recordMetric('CLS', clsValue);
    });

    // First Contentful Paint (FCP)
    this.createObserver('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime);
        }
      }
    });

    // Interaction to Next Paint (INP) - newer metric
    if ('PerformanceEventTiming' in window) {
      this.createObserver('event', (entries) => {
        let maxDuration = 0;
        for (const entry of entries) {
          if (entry.duration > maxDuration) {
            maxDuration = entry.duration;
          }
        }
        if (maxDuration > 0) {
          this.recordMetric('INP', maxDuration);
        }
      });
    }
  }

  private observeNavigationTiming() {
    if ('navigation' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const timing = this.calculateNavigationTiming(navEntry);
            this.recordNavigationMetrics(timing);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', observer);
    }
  }

  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const resources = entries.map(entry => this.processResourceEntry(entry));
      this.analyzeResourcePerformance(resources);
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  private observeLongTasks() {
    if ('PerformanceLongTaskTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.recordMetric('LONG_TASK', entry.duration);
          
          // Report long tasks that block the main thread
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
            this.reportLongTask(entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    }
  }

  private observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const memoryMetrics = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };

        this.recordMetric('MEMORY_USAGE', memoryMetrics.usagePercentage);

        // Alert if memory usage is high
        if (memoryMetrics.usagePercentage > 80) {
          console.warn('High memory usage detected:', memoryMetrics);
          this.reportMemoryIssue(memoryMetrics);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private createObserver(entryType: string, callback: (entries: any[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      console.warn(`Failed to create observer for ${entryType}:`, error);
    }
  }

  private recordMetric(name: string, value: number) {
    const rating = this.getRating(name, value);
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.set(name, metric);
    this.reportMetricToAnalytics(metric);

    // Log poor performance metrics
    if (rating === 'poor') {
      console.warn(`Poor ${name} performance: ${value}`, metric);
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private calculateNavigationTiming(entry: PerformanceNavigationTiming): NavigationTiming {
    return {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      processing: entry.domContentLoadedEventStart - entry.responseEnd,
      load: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.navigationStart
    };
  }

  private recordNavigationMetrics(timing: NavigationTiming) {
    Object.entries(timing).forEach(([key, value]) => {
      this.recordMetric(`NAV_${key.toUpperCase()}`, value);
    });

    // Record TTFB (Time to First Byte)
    this.recordMetric('TTFB', timing.request + timing.response);
  }

  private processResourceEntry(entry: PerformanceEntry): ResourceTiming {
    const resourceEntry = entry as PerformanceResourceTiming;
    
    return {
      name: resourceEntry.name,
      type: this.getResourceType(resourceEntry.name),
      size: resourceEntry.transferSize || 0,
      duration: resourceEntry.duration,
      startTime: resourceEntry.startTime
    };
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private analyzeResourcePerformance(resources: ResourceTiming[]) {
    // Group resources by type
    const resourcesByType = resources.reduce((acc, resource) => {
      if (!acc[resource.type]) acc[resource.type] = [];
      acc[resource.type].push(resource);
      return acc;
    }, {} as Record<string, ResourceTiming[]>);

    // Analyze each resource type
    Object.entries(resourcesByType).forEach(([type, typeResources]) => {
      const totalSize = typeResources.reduce((sum, r) => sum + r.size, 0);
      const avgDuration = typeResources.reduce((sum, r) => sum + r.duration, 0) / typeResources.length;
      
      this.recordMetric(`RESOURCE_${type.toUpperCase()}_SIZE`, totalSize);
      this.recordMetric(`RESOURCE_${type.toUpperCase()}_DURATION`, avgDuration);

      // Alert for large resources
      if (type === 'script' && totalSize > 500000) { // 500KB
        console.warn(`Large JavaScript bundle detected: ${totalSize} bytes`);
      }
      if (type === 'image' && totalSize > 1000000) { // 1MB
        console.warn(`Large image resources detected: ${totalSize} bytes`);
      }
    });
  }

  private reportMetricToAnalytics(metric: PerformanceMetric) {
    // Report to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_value: metric.value,
          page_url: metric.url
        }
      });
    }

    // Report to custom analytics
    reportPerformance({
      [metric.name]: metric.value,
      [`${metric.name}_rating`]: metric.rating,
      timestamp: metric.timestamp,
      url: metric.url
    });
  }

  private reportLongTask(entry: PerformanceEntry) {
    reportPerformance({
      long_task_duration: entry.duration,
      long_task_start: entry.startTime,
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  private reportMemoryIssue(memoryMetrics: any) {
    reportPerformance({
      memory_usage_percentage: memoryMetrics.usagePercentage,
      used_js_heap_size: memoryMetrics.usedJSHeapSize,
      js_heap_size_limit: memoryMetrics.jsHeapSizeLimit,
      timestamp: Date.now()
    });
  }

  // Public methods
  public getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  public getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  public getCoreWebVitals(): Record<string, PerformanceMetric | undefined> {
    return {
      LCP: this.metrics.get('LCP'),
      FID: this.metrics.get('FID'),
      CLS: this.metrics.get('CLS'),
      FCP: this.metrics.get('FCP'),
      TTFB: this.metrics.get('TTFB'),
      INP: this.metrics.get('INP')
    };
  }

  public getPerformanceScore(): number {
    const coreMetrics = this.getCoreWebVitals();
    const scores = Object.values(coreMetrics)
      .filter(Boolean)
      .map(metric => {
        switch (metric!.rating) {
          case 'good': return 100;
          case 'needs-improvement': return 50;
          case 'poor': return 0;
          default: return 50;
        }
      });

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  public generateReport(): string {
    const metrics = this.getMetrics();
    const coreWebVitals = this.getCoreWebVitals();
    const score = this.getPerformanceScore();

    let report = `Performance Report (Score: ${Math.round(score)}/100)\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `URL: ${window.location.href}\n\n`;

    report += 'Core Web Vitals:\n';
    Object.entries(coreWebVitals).forEach(([name, metric]) => {
      if (metric) {
        report += `  ${name}: ${Math.round(metric.value)}ms (${metric.rating})\n`;
      }
    });

    report += '\nAll Metrics:\n';
    metrics.forEach((metric, name) => {
      report += `  ${name}: ${Math.round(metric.value)} (${metric.rating})\n`;
    });

    return report;
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
    this.isMonitoring = false;
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor!;
}

// Bundle size analyzer
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private bundleMetrics: Map<string, number> = new Map();

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  analyzeBundleSize() {
    if (typeof window === 'undefined') return;

    // Analyze script tags
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalScriptSize = 0;

    scripts.forEach(async (script) => {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        try {
          const response = await fetch(src, { method: 'HEAD' });
          const size = parseInt(response.headers.get('content-length') || '0');
          totalScriptSize += size;
          this.bundleMetrics.set(src, size);
        } catch (error) {
          console.warn(`Failed to get size for ${src}:`, error);
        }
      }
    });

    // Analyze stylesheets
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    let totalStyleSize = 0;

    stylesheets.forEach(async (link) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('data:')) {
        try {
          const response = await fetch(href, { method: 'HEAD' });
          const size = parseInt(response.headers.get('content-length') || '0');
          totalStyleSize += size;
          this.bundleMetrics.set(href, size);
        } catch (error) {
          console.warn(`Failed to get size for ${href}:`, error);
        }
      }
    });

    // Report bundle metrics
    setTimeout(() => {
      reportPerformance({
        total_script_size: totalScriptSize,
        total_style_size: totalStyleSize,
        script_count: scripts.length,
        stylesheet_count: stylesheets.length,
        timestamp: Date.now()
      });
    }, 2000);
  }

  getBundleMetrics(): Map<string, number> {
    return new Map(this.bundleMetrics);
  }

  generateBundleReport(): string {
    const metrics = this.getBundleMetrics();
    let report = 'Bundle Size Report\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    const scripts = Array.from(metrics.entries()).filter(([url]) => url.includes('.js'));
    const styles = Array.from(metrics.entries()).filter(([url]) => url.includes('.css'));

    const totalScriptSize = scripts.reduce((sum, [, size]) => sum + size, 0);
    const totalStyleSize = styles.reduce((sum, [, size]) => sum + size, 0);

    report += `Total JavaScript: ${(totalScriptSize / 1024).toFixed(2)} KB\n`;
    report += `Total CSS: ${(totalStyleSize / 1024).toFixed(2)} KB\n`;
    report += `Total Bundle: ${((totalScriptSize + totalStyleSize) / 1024).toFixed(2)} KB\n\n`;

    report += 'JavaScript Files:\n';
    scripts.forEach(([url, size]) => {
      report += `  ${url}: ${(size / 1024).toFixed(2)} KB\n`;
    });

    report += '\nCSS Files:\n';
    styles.forEach(([url, size]) => {
      report += `  ${url}: ${(size / 1024).toFixed(2)} KB\n`;
    });

    return report;
  }
}

// Performance optimization utilities
export const PerformanceOptimizer = {
  // Preload critical resources
  preloadResource(href: string, as: string, crossorigin?: string) {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    
    document.head.appendChild(link);
  },

  // Prefetch resources for next navigation
  prefetchResource(href: string) {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    document.head.appendChild(link);
  },

  // Optimize images with intersection observer
  optimizeImages() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  // Defer non-critical JavaScript
  deferNonCriticalJS() {
    if (typeof document === 'undefined') return;

    const scripts = document.querySelectorAll('script[data-defer]');
    
    const loadScript = (script: Element) => {
      const newScript = document.createElement('script');
      newScript.src = script.getAttribute('data-defer')!;
      newScript.async = true;
      document.head.appendChild(newScript);
    };

    // Load deferred scripts after page load
    if (document.readyState === 'complete') {
      scripts.forEach(loadScript);
    } else {
      window.addEventListener('load', () => {
        scripts.forEach(loadScript);
      });
    }
  },

  // Monitor and report performance regressions
  detectPerformanceRegressions() {
    const monitor = getPerformanceMonitor();
    const currentScore = monitor.getPerformanceScore();
    
    // Store baseline score in localStorage
    const baselineKey = 'performance_baseline';
    const baseline = localStorage.getItem(baselineKey);
    
    if (!baseline) {
      localStorage.setItem(baselineKey, currentScore.toString());
      return;
    }

    const baselineScore = parseFloat(baseline);
    const regression = baselineScore - currentScore;

    // Report significant regressions (>10 points)
    if (regression > 10) {
      console.warn(`Performance regression detected: ${regression.toFixed(2)} points`);
      reportPerformance({
        performance_regression: regression,
        current_score: currentScore,
        baseline_score: baselineScore,
        timestamp: Date.now()
      });
    }

    // Update baseline if current score is better
    if (currentScore > baselineScore) {
      localStorage.setItem(baselineKey, currentScore.toString());
    }
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Start monitoring after page load
  if (document.readyState === 'complete') {
    getPerformanceMonitor();
    BundleAnalyzer.getInstance().analyzeBundleSize();
  } else {
    window.addEventListener('load', () => {
      getPerformanceMonitor();
      BundleAnalyzer.getInstance().analyzeBundleSize();
      PerformanceOptimizer.optimizeImages();
      PerformanceOptimizer.deferNonCriticalJS();
      
      // Check for regressions after 5 seconds
      setTimeout(() => {
        PerformanceOptimizer.detectPerformanceRegressions();
      }, 5000);
    });
  }
}