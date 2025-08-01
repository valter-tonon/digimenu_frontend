/**
 * Sentry Integration Service for Error Tracking
 * Provides comprehensive error monitoring and performance tracking
 */

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  enabled?: boolean;
  beforeSend?: (event: any) => any | null;
  beforeSendTransaction?: (event: any) => any | null;
}

export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}

export interface SentryContext {
  [key: string]: any;
}

export interface SentryTag {
  [key: string]: string;
}

export class SentryIntegrationService {
  private config: SentryConfig;
  private isInitialized: boolean = false;

  constructor(config: SentryConfig) {
    this.config = {
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === 'production',
      ...config
    };

    if (this.config.enabled && this.config.dsn) {
      this.initialize();
    }
  }

  /**
   * Initialize Sentry SDK
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Dynamically import Sentry to avoid SSR issues
      const Sentry = await import('@sentry/nextjs');

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Performance monitoring
        integrations: [
          new Sentry.BrowserTracing({
            // Set sampling rate for performance monitoring
            tracingOrigins: ['localhost', /^\//],
            routingInstrumentation: Sentry.nextRouterInstrumentation,
          }),
          new Sentry.Replay({
            // Capture 10% of all sessions,
            // plus 100% of sessions with an error
            sessionSampleRate: 0.1,
            errorSampleRate: 1.0,
          }),
        ],

        // Filter out non-critical errors
        beforeSend: (event, hint) => {
          // Apply custom beforeSend if provided
          if (this.config.beforeSend) {
            event = this.config.beforeSend(event);
            if (!event) return null;
          }

          // Filter out common non-critical errors
          if (this.shouldFilterError(event, hint)) {
            return null;
          }

          // Enhance error with additional context
          return this.enhanceError(event);
        },

        beforeSendTransaction: (event) => {
          // Apply custom beforeSendTransaction if provided
          if (this.config.beforeSendTransaction) {
            return this.config.beforeSendTransaction(event);
          }
          return event;
        },

        // Additional configuration
        attachStacktrace: true,
        autoSessionTracking: true,
        sendDefaultPii: false,
        
        // Custom tags for all events
        initialScope: {
          tags: {
            component: 'delivery-flow',
            version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
          }
        }
      });

      this.isInitialized = true;
      console.log('Sentry initialized successfully');

    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set user context
   */
  public setUser(user: SentryUser): void {
    if (!this.isInitialized) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setUser(user);
    });
  }

  /**
   * Set custom context
   */
  public setContext(key: string, context: SentryContext): void {
    if (!this.isInitialized) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setContext(key, context);
    });
  }

  /**
   * Set custom tags
   */
  public setTags(tags: SentryTag): void {
    if (!this.isInitialized) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setTags(tags);
    });
  }

  /**
   * Set custom tag
   */
  public setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setTag(key, value);
    });
  }

  /**
   * Capture exception with context
   */
  public captureException(error: Error, context?: {
    tags?: SentryTag;
    contexts?: Record<string, SentryContext>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    fingerprint?: string[];
  }): void {
    if (!this.isInitialized) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.withScope(scope => {
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (context?.contexts) {
          Object.entries(context.contexts).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
        }

        if (context?.level) {
          scope.setLevel(context.level);
        }

        if (context?.fingerprint) {
          scope.setFingerprint(context.fingerprint);
        }

        Sentry.captureException(error);
      });
    });
  }

  /**
   * Capture message with context
   */
  public captureMessage(
    message: string, 
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: {
      tags?: SentryTag;
      contexts?: Record<string, SentryContext>;
    }
  ): void {
    if (!this.isInitialized) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.withScope(scope => {
        scope.setLevel(level);

        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (context?.contexts) {
          Object.entries(context.contexts).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
        }

        Sentry.captureMessage(message);
      });
    });
  }

  /**
   * Start transaction for performance monitoring
   */
  public startTransaction(name: string, op: string, description?: string): any {
    if (!this.isInitialized) return null;

    return import('@sentry/nextjs').then(Sentry => {
      return Sentry.startTransaction({
        name,
        op,
        description
      });
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  public addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, any>;
  }): void {
    if (!this.isInitialized) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category || 'custom',
        level: breadcrumb.level || 'info',
        data: breadcrumb.data,
        timestamp: Date.now() / 1000
      });
    });
  }

  /**
   * Capture delivery flow specific errors
   */
  public captureDeliveryFlowError(
    error: Error,
    step: string,
    context?: Record<string, any>
  ): void {
    this.captureException(error, {
      tags: {
        flow_step: step,
        error_type: 'delivery_flow'
      },
      contexts: {
        delivery_flow: {
          step,
          timestamp: new Date().toISOString(),
          ...context
        }
      },
      level: 'error',
      fingerprint: [`delivery-flow-${step}`, error.name]
    });
  }

  /**
   * Capture provider errors
   */
  public captureProviderError(
    error: Error,
    providerName: string,
    context?: Record<string, any>
  ): void {
    this.captureException(error, {
      tags: {
        provider: providerName,
        error_type: 'provider_error'
      },
      contexts: {
        provider: {
          name: providerName,
          timestamp: new Date().toISOString(),
          ...context
        }
      },
      level: 'error',
      fingerprint: [`provider-${providerName}`, error.name]
    });
  }

  /**
   * Capture API errors
   */
  public captureApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    requestData?: any
  ): void {
    this.captureException(error, {
      tags: {
        endpoint,
        method,
        status_code: statusCode?.toString() || 'unknown',
        error_type: 'api_error'
      },
      contexts: {
        api: {
          endpoint,
          method,
          status_code: statusCode,
          request_data: requestData,
          timestamp: new Date().toISOString()
        }
      },
      level: 'error',
      fingerprint: [`api-${endpoint}`, error.name]
    });
  }

  /**
   * Capture performance metrics
   */
  public capturePerformanceMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    tags?: SentryTag
  ): void {
    if (!this.isInitialized) return;

    this.addBreadcrumb({
      message: `Performance metric: ${name}`,
      category: 'performance',
      level: 'info',
      data: {
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
        ...tags
      }
    });
  }

  /**
   * Filter out non-critical errors
   */
  private shouldFilterError(event: any, hint?: any): boolean {
    const error = hint?.originalException || hint?.syntheticException;
    
    if (!error) return false;

    // Filter out common non-critical errors
    const nonCriticalPatterns = [
      /Non-Error promise rejection captured/i,
      /Script error/i,
      /Network request failed/i,
      /Loading chunk \d+ failed/i,
      /ChunkLoadError/i,
      /Loading CSS chunk/i,
      /ResizeObserver loop limit exceeded/i,
      /Non-Error promise rejection/i
    ];

    const errorMessage = error.message || error.toString();
    
    if (nonCriticalPatterns.some(pattern => pattern.test(errorMessage))) {
      return true;
    }

    // Filter out errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames) {
      const frames = event.exception.values[0].stacktrace.frames;
      const hasExtensionFrame = frames.some((frame: any) => 
        frame.filename?.includes('extension://') ||
        frame.filename?.includes('moz-extension://') ||
        frame.filename?.includes('safari-extension://')
      );
      
      if (hasExtensionFrame) {
        return true;
      }
    }

    return false;
  }

  /**
   * Enhance error with additional context
   */
  private enhanceError(event: any): any {
    // Add browser information
    if (typeof navigator !== 'undefined') {
      event.contexts = event.contexts || {};
      event.contexts.browser = {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        user_agent: navigator.userAgent
      };
    }

    // Add viewport information
    if (typeof window !== 'undefined') {
      event.contexts = event.contexts || {};
      event.contexts.viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        screen_width: window.screen?.width,
        screen_height: window.screen?.height
      };
    }

    // Add connection information
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      event.contexts = event.contexts || {};
      event.contexts.connection = {
        effective_type: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        save_data: connection.saveData
      };
    }

    return event;
  }

  /**
   * Get browser name
   */
  private getBrowserName(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'unknown';
  }

  /**
   * Get browser version
   */
  private getBrowserVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    
    return match ? match[2] : 'unknown';
  }

  /**
   * Check if Sentry is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Flush pending events
   */
  public async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const Sentry = await import('@sentry/nextjs');
      return await Sentry.flush(timeout);
    } catch (error) {
      console.warn('Failed to flush Sentry events:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sentryService = new SentryIntegrationService({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN
});

// Enhanced error reporting service that integrates with Sentry
export class EnhancedErrorReportingService {
  constructor(private sentryService: SentryIntegrationService) {}

  /**
   * Report delivery flow error
   */
  public reportDeliveryFlowError(
    error: Error,
    step: string,
    context?: Record<string, any>
  ): void {
    // Report to Sentry
    this.sentryService.captureDeliveryFlowError(error, step, context);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Delivery Flow Error [${step}]:`, error, context);
    }
  }

  /**
   * Report provider error
   */
  public reportProviderError(
    error: Error,
    providerName: string,
    context?: Record<string, any>
  ): void {
    this.sentryService.captureProviderError(error, providerName, context);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`Provider Error [${providerName}]:`, error, context);
    }
  }

  /**
   * Report API error
   */
  public reportApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    requestData?: any
  ): void {
    this.sentryService.captureApiError(error, endpoint, method, statusCode, requestData);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error [${method} ${endpoint}]:`, error, { statusCode, requestData });
    }
  }

  /**
   * Set user context
   */
  public setUser(userId: string, email?: string): void {
    this.sentryService.setUser({
      id: userId,
      email
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  public addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    this.sentryService.addBreadcrumb({
      message,
      category,
      data
    });
  }
}

// Export enhanced error reporting service
export const enhancedErrorReporting = new EnhancedErrorReportingService(sentryService);