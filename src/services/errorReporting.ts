/**
 * Error Reporting Service
 * Handles error reporting to various monitoring services
 */

interface ErrorContext {
  errorId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  referrer?: string;
  viewport?: { width: number; height: number } | null;
  localStorage?: Record<string, any>;
  sessionStorage?: Record<string, any>;
  errorStack?: string;
  componentStack?: string;
  errorBoundary?: string;
  buildInfo?: {
    nodeEnv?: string;
    version?: string;
  };
  [key: string]: any;
}

interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint?: string;
}

export class ErrorReportingService {
  private isEnabled: boolean;
  private reportQueue: ErrorReport[] = [];
  private isProcessingQueue = false;
  private maxQueueSize = 50;
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor(enabled = true) {
    this.isEnabled = enabled && typeof window !== 'undefined';
    
    if (this.isEnabled) {
      this.startQueueProcessor();
      this.setupUnloadHandler();
    }
  }

  /**
   * Report an error with context
   */
  reportError(error: Error, context: ErrorContext = {}): void {
    if (!this.isEnabled) {
      return;
    }

    const severity = this.determineSeverity(error, context);
    const fingerprint = this.generateFingerprint(error, context);

    const report: ErrorReport = {
      error,
      context: {
        ...context,
        timestamp: context.timestamp || new Date().toISOString(),
        url: context.url || window.location.href,
        userAgent: context.userAgent || navigator.userAgent
      },
      severity,
      fingerprint
    };

    this.addToQueue(report);

    // For critical errors, try to send immediately
    if (severity === 'critical') {
      this.flushQueue();
    }
  }

  /**
   * Report a custom event or metric
   */
  reportEvent(eventName: string, data: Record<string, any> = {}): void {
    if (!this.isEnabled) {
      return;
    }

    // Create a synthetic error for event tracking
    const syntheticError = new Error(`Event: ${eventName}`);
    syntheticError.name = 'CustomEvent';

    this.reportError(syntheticError, {
      ...data,
      eventType: 'custom',
      eventName,
      errorBoundary: 'EventReporting'
    });
  }

  /**
   * Report performance metrics
   */
  reportPerformance(metrics: Record<string, number>): void {
    if (!this.isEnabled) {
      return;
    }

    const syntheticError = new Error('Performance Metrics');
    syntheticError.name = 'PerformanceReport';

    this.reportError(syntheticError, {
      metrics,
      eventType: 'performance',
      errorBoundary: 'PerformanceReporting'
    });
  }

  /**
   * Add error to processing queue
   */
  private addToQueue(report: ErrorReport): void {
    if (this.reportQueue.length >= this.maxQueueSize) {
      // Remove oldest report to make room
      this.reportQueue.shift();
    }

    this.reportQueue.push(report);
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.reportQueue.length > 0) {
        this.flushQueue();
      }
    }, this.flushInterval);
  }

  /**
   * Flush the error queue
   */
  private async flushQueue(): Promise<void> {
    if (this.isProcessingQueue || this.reportQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const batch = this.reportQueue.splice(0, this.batchSize);
      await this.sendBatch(batch);
    } catch (error) {
      console.warn('Failed to send error reports:', error);
      // Re-add failed reports to queue (at the beginning)
      // this.reportQueue.unshift(...batch);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Send a batch of error reports
   */
  private async sendBatch(reports: ErrorReport[]): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to console (always)
    promises.push(this.sendToConsole(reports));

    // Send to external services
    promises.push(this.sendToSentry(reports));
    promises.push(this.sendToAnalytics(reports));
    promises.push(this.sendToCustomEndpoint(reports));

    // Wait for all to complete (but don't fail if some fail)
    await Promise.allSettled(promises);
  }

  /**
   * Send reports to console
   */
  private async sendToConsole(reports: ErrorReport[]): Promise<void> {
    reports.forEach(report => {
      const { error, context, severity } = report;
      
      console.group(`📊 Error Report [${severity.toUpperCase()}]`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Fingerprint:', report.fingerprint);
      console.groupEnd();
    });
  }

  /**
   * Send reports to Sentry
   */
  private async sendToSentry(reports: ErrorReport[]): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).Sentry) {
      return;
    }

    const Sentry = (window as any).Sentry;

    reports.forEach(report => {
      const { error, context, severity } = report;

      Sentry.withScope((scope: any) => {
        scope.setLevel(this.mapSeverityToSentryLevel(severity));
        scope.setFingerprint([report.fingerprint]);
        
        // Add context data
        Object.entries(context).forEach(([key, value]) => {
          if (typeof value === 'object') {
            scope.setContext(key, value);
          } else {
            scope.setTag(key, value);
          }
        });

        Sentry.captureException(error);
      });
    });
  }

  /**
   * Send reports to Google Analytics
   */
  private async sendToAnalytics(reports: ErrorReport[]): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).gtag) {
      return;
    }

    const gtag = (window as any).gtag;

    reports.forEach(report => {
      const { error, context, severity } = report;

      gtag('event', 'error_report', {
        event_category: 'error_monitoring',
        event_label: `${error.name}: ${error.message}`,
        custom_map: {
          error_severity: severity,
          error_fingerprint: report.fingerprint,
          error_boundary: context.errorBoundary || 'unknown',
          error_id: context.errorId || 'unknown'
        },
        value: this.mapSeverityToNumericValue(severity)
      });
    });
  }

  /**
   * Send reports to custom endpoint
   */
  private async sendToCustomEndpoint(reports: ErrorReport[]): Promise<void> {
    const endpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;
    
    if (!endpoint) {
      return;
    }

    try {
      const payload = {
        reports: reports.map(report => ({
          error: {
            name: report.error.name,
            message: report.error.message,
            stack: report.error.stack
          },
          context: report.context,
          severity: report.severity,
          fingerprint: report.fingerprint,
          timestamp: new Date().toISOString()
        })),
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          batchSize: reports.length
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to send error reports to custom endpoint:', error);
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      context.errorBoundary === 'GlobalErrorBoundary'
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      error.name === 'TypeError' ||
      error.name === 'ReferenceError' ||
      error.message.includes('Network Error') ||
      context.errorBoundary?.includes('Provider')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      error.name === 'ValidationError' ||
      error.message.includes('API') ||
      error.message.includes('fetch')
    ) {
      return 'medium';
    }

    // Default to low severity
    return 'low';
  }

  /**
   * Generate error fingerprint for deduplication
   */
  private generateFingerprint(error: Error, context: ErrorContext): string {
    const components = [
      error.name,
      error.message.replace(/\d+/g, 'X'), // Replace numbers with X
      context.errorBoundary || 'unknown',
      context.url?.split('?')[0] || 'unknown' // Remove query params
    ];

    return btoa(components.join('|')).substring(0, 16);
  }

  /**
   * Map severity to Sentry level
   */
  private mapSeverityToSentryLevel(severity: string): string {
    const mapping: Record<string, string> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'fatal'
    };

    return mapping[severity] || 'error';
  }

  /**
   * Map severity to numeric value for analytics
   */
  private mapSeverityToNumericValue(severity: string): number {
    const mapping: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    return mapping[severity] || 2;
  }

  /**
   * Setup handler for page unload to flush remaining reports
   */
  private setupUnloadHandler(): void {
    const flushOnUnload = () => {
      if (this.reportQueue.length > 0) {
        // Use sendBeacon for reliable delivery during page unload
        const endpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;
        
        if (endpoint && navigator.sendBeacon) {
          const payload = JSON.stringify({
            reports: this.reportQueue.map(report => ({
              error: {
                name: report.error.name,
                message: report.error.message,
                stack: report.error.stack
              },
              context: report.context,
              severity: report.severity,
              fingerprint: report.fingerprint
            })),
            metadata: {
              unloadFlush: true,
              timestamp: new Date().toISOString()
            }
          });

          navigator.sendBeacon(endpoint, payload);
        }
      }
    };

    window.addEventListener('beforeunload', flushOnUnload);
    window.addEventListener('pagehide', flushOnUnload);
  }
}

// Singleton instance
let errorReportingService: ErrorReportingService | null = null;

/**
 * Get the global error reporting service instance
 */
export function getErrorReportingService(): ErrorReportingService {
  if (!errorReportingService) {
    errorReportingService = new ErrorReportingService(
      process.env.NODE_ENV === 'production' || 
      process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true'
    );
  }
  
  return errorReportingService;
}

/**
 * Convenience function to report errors
 */
export function reportError(error: Error, context: ErrorContext = {}): void {
  getErrorReportingService().reportError(error, context);
}

/**
 * Convenience function to report events
 */
export function reportEvent(eventName: string, data: Record<string, any> = {}): void {
  getErrorReportingService().reportEvent(eventName, data);
}

/**
 * Convenience function to report performance metrics
 */
export function reportPerformance(metrics: Record<string, number>): void {
  getErrorReportingService().reportPerformance(metrics);
}