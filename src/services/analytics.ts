/**
 * Analytics Service for Delivery Flow Enhancement
 * Handles event tracking, conversion funnel tracking, and performance monitoring
 */

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export interface ConversionFunnelStep {
  step: string;
  stepNumber: number;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  page?: string;
  userId?: string;
}

export interface AnalyticsConfig {
  gtag?: {
    measurementId: string;
    enabled: boolean;
  };
  amplitude?: {
    apiKey: string;
    enabled: boolean;
  };
  mixpanel?: {
    token: string;
    enabled: boolean;
  };
  customEndpoint?: {
    url: string;
    enabled: boolean;
  };
  enableConsoleLogging?: boolean;
  enableLocalStorage?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private funnelSteps: ConversionFunnelStep[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId?: string;

  constructor(config: AnalyticsConfig) {
    this.config = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableLocalStorage: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeProviders();
    this.setupPeriodicFlush();
    this.loadQueuedEvents();
  }

  /**
   * Initialize analytics providers
   */
  private initializeProviders(): void {
    // Initialize Google Analytics
    if (this.config.gtag?.enabled && this.config.gtag.measurementId) {
      this.initializeGoogleAnalytics();
    }

    // Initialize Amplitude
    if (this.config.amplitude?.enabled && this.config.amplitude.apiKey) {
      this.initializeAmplitude();
    }

    // Initialize Mixpanel
    if (this.config.mixpanel?.enabled && this.config.mixpanel.token) {
      this.initializeMixpanel();
    }
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGoogleAnalytics(): void {
    if (typeof window === 'undefined') return;

    try {
      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gtag!.measurementId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };

      (window as any).gtag('js', new Date());
      (window as any).gtag('config', this.config.gtag!.measurementId, {
        page_title: document.title,
        page_location: window.location.href
      });

      console.log('Google Analytics initialized');
    } catch (error) {
      console.warn('Failed to initialize Google Analytics:', error);
    }
  }

  /**
   * Initialize Amplitude
   */
  private initializeAmplitude(): void {
    if (typeof window === 'undefined') return;

    try {
      // Load Amplitude SDK
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://cdn.amplitude.com/libs/amplitude-8.21.9-min.gz.js';
      script.onload = () => {
        if ((window as any).amplitude) {
          (window as any).amplitude.getInstance().init(this.config.amplitude!.apiKey);
          console.log('Amplitude initialized');
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.warn('Failed to initialize Amplitude:', error);
    }
  }

  /**
   * Initialize Mixpanel
   */
  private initializeMixpanel(): void {
    if (typeof window === 'undefined') return;

    try {
      // Load Mixpanel SDK
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
      script.onload = () => {
        if ((window as any).mixpanel) {
          (window as any).mixpanel.init(this.config.mixpanel!.token);
          console.log('Mixpanel initialized');
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.warn('Failed to initialize Mixpanel:', error);
    }
  }

  /**
   * Set user ID for tracking
   */
  public setUserId(userId: string): void {
    this.userId = userId;

    // Update providers
    if (this.config.gtag?.enabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.config.gtag.measurementId, {
        user_id: userId
      });
    }

    if (this.config.amplitude?.enabled && typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().setUserId(userId);
    }

    if (this.config.mixpanel?.enabled && typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
    }
  }

  /**
   * Track a custom event
   */
  public trackEvent(name: string, category: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      category,
      properties: {
        ...properties,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      },
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.addToQueue(event);
    this.sendToProviders(event);

    if (this.config.enableConsoleLogging) {
      console.log('Analytics Event:', event);
    }
  }

  /**
   * Track delivery flow specific events
   */
  public trackDeliveryFlowEvent(eventName: string, properties?: Record<string, any>): void {
    this.trackEvent(eventName, 'delivery_flow', {
      ...properties,
      flow_version: '2.0',
      timestamp: Date.now()
    });
  }

  /**
   * Track conversion funnel step
   */
  public trackFunnelStep(step: string, stepNumber: number, metadata?: Record<string, any>): void {
    const funnelStep: ConversionFunnelStep = {
      step,
      stepNumber,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      metadata: {
        ...metadata,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined
      }
    };

    this.funnelSteps.push(funnelStep);

    // Track as regular event too
    this.trackEvent(`funnel_${step}`, 'conversion_funnel', {
      step_number: stepNumber,
      funnel_session: this.sessionId,
      ...metadata
    });

    // Store in localStorage for persistence
    if (this.config.enableLocalStorage) {
      this.storeFunnelSteps();
    }
  }

  /**
   * Track performance metric
   */
  public trackPerformanceMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userId: this.userId
    };

    this.performanceMetrics.push(metric);

    // Track as event
    this.trackEvent('performance_metric', 'performance', {
      metric_name: name,
      metric_value: value,
      metric_unit: unit
    });

    // Send to providers immediately for performance metrics
    this.sendPerformanceMetric(metric);
  }

  /**
   * Track Core Web Vitals
   */
  public trackCoreWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.trackPerformanceMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.trackPerformanceMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
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
        this.trackPerformanceMetric('CLS', clsValue, 'score');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.trackPerformanceMetric('FCP', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer not supported');
    }
  }

  /**
   * Track error events
   */
  public trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('error_occurred', 'error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }

  /**
   * Get conversion funnel data
   */
  public getFunnelData(): ConversionFunnelStep[] {
    return [...this.funnelSteps];
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  /**
   * Clear all stored data
   */
  public clearData(): void {
    this.eventQueue = [];
    this.funnelSteps = [];
    this.performanceMetrics = [];
    
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('digimenu-analytics-events');
      localStorage.removeItem('digimenu-funnel-steps');
    }
  }

  /**
   * Flush events immediately
   */
  public flush(): Promise<void> {
    return this.flushEvents();
  }

  /**
   * Private methods
   */

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToQueue(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    // Auto-flush if queue is full
    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flushEvents();
    }

    // Store in localStorage
    if (this.config.enableLocalStorage) {
      this.storeQueuedEvents();
    }
  }

  private sendToProviders(event: AnalyticsEvent): void {
    // Send to Google Analytics
    if (this.config.gtag?.enabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, {
        event_category: event.category,
        ...event.properties
      });
    }

    // Send to Amplitude
    if (this.config.amplitude?.enabled && typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().logEvent(event.name, {
        category: event.category,
        ...event.properties
      });
    }

    // Send to Mixpanel
    if (this.config.mixpanel?.enabled && typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event.name, {
        category: event.category,
        ...event.properties
      });
    }
  }

  private sendPerformanceMetric(metric: PerformanceMetric): void {
    // Send to Google Analytics as custom metric
    if (this.config.gtag?.enabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_map: { metric_name: metric.name }
      });
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to custom endpoint if configured
      if (this.config.customEndpoint?.enabled && this.config.customEndpoint.url) {
        await fetch(this.config.customEndpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events: eventsToFlush,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.warn('Failed to flush events to custom endpoint:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private setupPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval || 30000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEvents();
      });
    }
  }

  private storeQueuedEvents(): void {
    try {
      localStorage.setItem('digimenu-analytics-events', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.warn('Failed to store queued events:', error);
    }
  }

  private storeFunnelSteps(): void {
    try {
      localStorage.setItem('digimenu-funnel-steps', JSON.stringify(this.funnelSteps));
    } catch (error) {
      console.warn('Failed to store funnel steps:', error);
    }
  }

  private loadQueuedEvents(): void {
    try {
      const storedEvents = localStorage.getItem('digimenu-analytics-events');
      if (storedEvents) {
        this.eventQueue = JSON.parse(storedEvents);
        localStorage.removeItem('digimenu-analytics-events');
      }

      const storedFunnelSteps = localStorage.getItem('digimenu-funnel-steps');
      if (storedFunnelSteps) {
        this.funnelSteps = JSON.parse(storedFunnelSteps);
      }
    } catch (error) {
      console.warn('Failed to load queued events:', error);
    }
  }
}

// Delivery Flow specific event names
export const DELIVERY_FLOW_EVENTS = {
  // Menu browsing
  MENU_LOADED: 'menu_loaded',
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_ADDED_TO_CART: 'product_added_to_cart',
  CART_VIEWED: 'cart_viewed',
  
  // Checkout flow
  CHECKOUT_STARTED: 'checkout_started',
  AUTHENTICATION_STEP: 'authentication_step',
  CUSTOMER_DATA_STEP: 'customer_data_step',
  ADDRESS_STEP: 'address_step',
  PAYMENT_STEP: 'payment_step',
  ORDER_CONFIRMED: 'order_confirmed',
  
  // Errors
  CHECKOUT_ERROR: 'checkout_error',
  PAYMENT_ERROR: 'payment_error',
  VALIDATION_ERROR: 'validation_error',
  
  // Performance
  PAGE_LOAD_TIME: 'page_load_time',
  CHECKOUT_COMPLETION_TIME: 'checkout_completion_time',
  
  // User behavior
  CART_ABANDONED: 'cart_abandoned',
  CHECKOUT_ABANDONED: 'checkout_abandoned',
  BACK_TO_MENU: 'back_to_menu'
} as const;

// Conversion funnel steps
export const CONVERSION_FUNNEL_STEPS = {
  MENU_VIEW: { step: 'menu_view', number: 1 },
  PRODUCT_ADD: { step: 'product_add', number: 2 },
  CART_VIEW: { step: 'cart_view', number: 3 },
  CHECKOUT_START: { step: 'checkout_start', number: 4 },
  CUSTOMER_DATA: { step: 'customer_data', number: 5 },
  ADDRESS_INPUT: { step: 'address_input', number: 6 },
  PAYMENT_METHOD: { step: 'payment_method', number: 7 },
  ORDER_COMPLETE: { step: 'order_complete', number: 8 }
} as const;

// Export singleton instance
export const analyticsService = new AnalyticsService({
  gtag: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  },
  amplitude: {
    apiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '',
    enabled: !!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  },
  mixpanel: {
    token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    enabled: !!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  },
  customEndpoint: {
    url: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics',
    enabled: true
  },
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableLocalStorage: true,
  batchSize: 10,
  flushInterval: 30000
});