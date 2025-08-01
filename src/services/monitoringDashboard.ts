/**
 * Monitoring Dashboard Integration Service
 * Provides real-time error monitoring, performance metrics collection, and user behavior tracking
 */

import { analyticsService } from './analytics';
import { sentryService } from './sentryIntegration';
import { performanceMonitoring } from './performanceMonitoring';

export interface MonitoringMetrics {
  errors: ErrorMetrics;
  performance: PerformanceMetrics;
  userBehavior: UserBehaviorMetrics;
  system: SystemMetrics;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  errorsByType: Record<string, number>;
  errorsByPage: Record<string, number>;
  recentErrors: ErrorEvent[];
}

export interface PerformanceMetrics {
  coreWebVitals: {
    LCP: number;
    FID: number;
    CLS: number;
    FCP: number;
    TTFB: number;
  };
  customMetrics: {
    pageLoadTime: number;
    apiResponseTime: number;
    checkoutFlowTime: number;
  };
  performanceScore: number;
  slowPages: string[];
}

export interface UserBehaviorMetrics {
  activeUsers: number;
  conversionRate: number;
  bounceRate: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  funnelDropoff: Array<{ step: string; dropoffRate: number }>;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  cacheHitRate: number;
}

export interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  page: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  enabled: boolean;
  notifications: string[];
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
    config: Record<string, any>;
  }>;
  enabled: boolean;
  startDate: string;
  endDate?: string;
  targetAudience?: {
    userSegments?: string[];
    trafficPercentage?: number;
  };
}

export class MonitoringDashboardService {
  private metrics: MonitoringMetrics;
  private alertRules: AlertRule[] = [];
  private abTests: ABTestConfig[] = [];
  private isInitialized: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private websocket: WebSocket | null = null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.initialize();
  }

  /**
   * Initialize monitoring dashboard
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadConfiguration();
      this.setupRealTimeUpdates();
      this.setupPeriodicMetricsCollection();
      this.initializeWebSocket();
      
      this.isInitialized = true;
      console.log('Monitoring dashboard initialized');
    } catch (error) {
      console.error('Failed to initialize monitoring dashboard:', error);
    }
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): MonitoringMetrics {
    return {
      errors: {
        totalErrors: 0,
        errorRate: 0,
        criticalErrors: 0,
        errorsByType: {},
        errorsByPage: {},
        recentErrors: []
      },
      performance: {
        coreWebVitals: {
          LCP: 0,
          FID: 0,
          CLS: 0,
          FCP: 0,
          TTFB: 0
        },
        customMetrics: {
          pageLoadTime: 0,
          apiResponseTime: 0,
          checkoutFlowTime: 0
        },
        performanceScore: 100,
        slowPages: []
      },
      userBehavior: {
        activeUsers: 0,
        conversionRate: 0,
        bounceRate: 0,
        averageSessionDuration: 0,
        topPages: [],
        funnelDropoff: []
      },
      system: {
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        cacheHitRate: 0
      }
    };
  }

  /**
   * Load configuration from backend
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const response = await fetch('/api/monitoring/config');
      if (response.ok) {
        const config = await response.json();
        this.alertRules = config.alertRules || [];
        this.abTests = config.abTests || [];
      }
    } catch (error) {
      console.warn('Failed to load monitoring configuration:', error);
    }
  }

  /**
   * Setup real-time metrics updates
   */
  private setupRealTimeUpdates(): void {
    // Update metrics every 30 seconds
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Collect initial metrics
    this.collectMetrics();
  }

  /**
   * Setup periodic metrics collection
   */
  private setupPeriodicMetricsCollection(): void {
    // Collect performance metrics
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60000); // Every minute

    // Collect error metrics
    setInterval(() => {
      this.collectErrorMetrics();
    }, 30000); // Every 30 seconds

    // Collect user behavior metrics
    setInterval(() => {
      this.collectUserBehaviorMetrics();
    }, 120000); // Every 2 minutes
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private initializeWebSocket(): void {
    if (typeof window === 'undefined') return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/monitoring';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Monitoring WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealTimeUpdate(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Monitoring WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('Monitoring WebSocket error:', error);
      };
    } catch (error) {
      console.warn('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Handle real-time updates from WebSocket
   */
  private handleRealTimeUpdate(data: any): void {
    switch (data.type) {
      case 'error':
        this.handleNewError(data.payload);
        break;
      case 'performance':
        this.handlePerformanceUpdate(data.payload);
        break;
      case 'user_behavior':
        this.handleUserBehaviorUpdate(data.payload);
        break;
      case 'alert':
        this.handleAlert(data.payload);
        break;
      default:
        console.warn('Unknown real-time update type:', data.type);
    }
  }

  /**
   * Collect all metrics
   */
  private async collectMetrics(): Promise<void> {
    await Promise.all([
      this.collectErrorMetrics(),
      this.collectPerformanceMetrics(),
      this.collectUserBehaviorMetrics(),
      this.collectSystemMetrics()
    ]);

    // Check alert rules
    this.checkAlertRules();

    // Send metrics to backend
    this.sendMetricsToBackend();
  }

  /**
   * Collect error metrics
   */
  private async collectErrorMetrics(): Promise<void> {
    try {
      // Get error data from local storage and analytics
      const storedErrors = this.getStoredErrors();
      const errorsByType: Record<string, number> = {};
      const errorsByPage: Record<string, number> = {};
      let criticalErrors = 0;

      storedErrors.forEach(error => {
        errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
        errorsByPage[error.page] = (errorsByPage[error.page] || 0) + 1;
        
        if (error.severity === 'critical') {
          criticalErrors++;
        }
      });

      this.metrics.errors = {
        totalErrors: storedErrors.length,
        errorRate: this.calculateErrorRate(storedErrors),
        criticalErrors,
        errorsByType,
        errorsByPage,
        recentErrors: storedErrors.slice(-10) // Last 10 errors
      };
    } catch (error) {
      console.error('Failed to collect error metrics:', error);
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    try {
      const coreWebVitals = performanceMonitoring.getCoreWebVitals();
      const customMetrics = performanceMonitoring.getCustomMetrics();
      const performanceSummary = performanceMonitoring.getPerformanceSummary();

      this.metrics.performance = {
        coreWebVitals: {
          LCP: coreWebVitals.LCP || 0,
          FID: coreWebVitals.FID || 0,
          CLS: coreWebVitals.CLS || 0,
          FCP: coreWebVitals.FCP || 0,
          TTFB: coreWebVitals.TTFB || 0
        },
        customMetrics: {
          pageLoadTime: customMetrics.pageLoadTime || 0,
          apiResponseTime: customMetrics.apiResponseTime || 0,
          checkoutFlowTime: customMetrics.checkoutFlowTime || 0
        },
        performanceScore: performanceSummary.performanceScore,
        slowPages: this.identifySlowPages()
      };
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }

  /**
   * Collect user behavior metrics
   */
  private async collectUserBehaviorMetrics(): Promise<void> {
    try {
      const funnelData = analyticsService.getFunnelData();
      const sessionData = this.getSessionData();

      this.metrics.userBehavior = {
        activeUsers: this.getActiveUsersCount(),
        conversionRate: this.calculateConversionRate(funnelData),
        bounceRate: this.calculateBounceRate(sessionData),
        averageSessionDuration: this.calculateAverageSessionDuration(sessionData),
        topPages: this.getTopPages(),
        funnelDropoff: this.calculateFunnelDropoff(funnelData)
      };
    } catch (error) {
      console.error('Failed to collect user behavior metrics:', error);
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const memoryInfo = this.getMemoryInfo();
      const networkInfo = this.getNetworkInfo();

      this.metrics.system = {
        uptime: performance.now(),
        memoryUsage: memoryInfo.usedPercent,
        cpuUsage: 0, // Not available in browser
        networkLatency: networkInfo.latency,
        cacheHitRate: this.calculateCacheHitRate()
      };
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Get current monitoring metrics
   */
  public getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error metrics
   */
  public getErrorMetrics(): ErrorMetrics {
    return { ...this.metrics.errors };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics.performance };
  }

  /**
   * Get user behavior metrics
   */
  public getUserBehaviorMetrics(): UserBehaviorMetrics {
    return { ...this.metrics.userBehavior };
  }

  /**
   * Report new error
   */
  public reportError(error: Error, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      userId: context?.userId,
      severity: this.determineSeverity(error, context),
      resolved: false
    };

    // Store error locally
    this.storeError(errorEvent);

    // Update metrics
    this.metrics.errors.totalErrors++;
    this.metrics.errors.recentErrors.unshift(errorEvent);
    
    // Keep only last 10 recent errors
    if (this.metrics.errors.recentErrors.length > 10) {
      this.metrics.errors.recentErrors = this.metrics.errors.recentErrors.slice(0, 10);
    }

    // Send to monitoring services
    sentryService.captureException(error, {
      contexts: { monitoring: context }
    });

    // Check if this triggers any alerts
    this.checkErrorAlerts(errorEvent);
  }

  /**
   * Create alert rule
   */
  public createAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const alertRule: AlertRule = {
      id: this.generateId(),
      ...rule
    };

    this.alertRules.push(alertRule);
    this.saveConfiguration();

    return alertRule.id;
  }

  /**
   * Update alert rule
   */
  public updateAlertRule(id: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) return false;

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    this.saveConfiguration();

    return true;
  }

  /**
   * Delete alert rule
   */
  public deleteAlertRule(id: string): boolean {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) return false;

    this.alertRules.splice(ruleIndex, 1);
    this.saveConfiguration();

    return true;
  }

  /**
   * Get alert rules
   */
  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Create A/B test
   */
  public createABTest(config: Omit<ABTestConfig, 'id'>): string {
    const abTest: ABTestConfig = {
      id: this.generateId(),
      ...config
    };

    this.abTests.push(abTest);
    this.saveConfiguration();

    return abTest.id;
  }

  /**
   * Get A/B test variant for user
   */
  public getABTestVariant(testId: string, userId: string): string | null {
    const test = this.abTests.find(t => t.id === testId && t.enabled);
    if (!test) return null;

    // Simple hash-based assignment
    const hash = this.hashString(`${testId}-${userId}`);
    const totalWeight = test.variants.reduce((sum, variant) => sum + variant.weight, 0);
    const normalizedHash = hash % totalWeight;

    let currentWeight = 0;
    for (const variant of test.variants) {
      currentWeight += variant.weight;
      if (normalizedHash < currentWeight) {
        return variant.id;
      }
    }

    return test.variants[0]?.id || null;
  }

  /**
   * Track A/B test conversion
   */
  public trackABTestConversion(testId: string, variantId: string, userId: string): void {
    analyticsService.trackEvent('ab_test_conversion', 'experiment', {
      test_id: testId,
      variant_id: variantId,
      user_id: userId
    });
  }

  /**
   * Get A/B test results
   */
  public async getABTestResults(testId: string): Promise<any> {
    try {
      const response = await fetch(`/api/monitoring/ab-tests/${testId}/results`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get A/B test results:', error);
    }
    return null;
  }

  /**
   * Export metrics data
   */
  public exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    } else {
      return this.convertMetricsToCSV(this.metrics);
    }
  }

  /**
   * Cleanup and disconnect
   */
  public disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.isInitialized = false;
  }

  /**
   * Private helper methods
   */

  private getStoredErrors(): any[] {
    try {
      const stored = localStorage.getItem('digimenu-monitoring-errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private storeError(error: ErrorEvent): void {
    try {
      const stored = this.getStoredErrors();
      stored.unshift(error);
      
      // Keep only last 100 errors
      if (stored.length > 100) {
        stored.splice(100);
      }
      
      localStorage.setItem('digimenu-monitoring-errors', JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to store error:', error);
    }
  }

  private calculateErrorRate(errors: any[]): number {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentErrors = errors.filter(e => new Date(e.timestamp).getTime() > oneHourAgo);
    
    // Assuming 1000 page views per hour as baseline
    return (recentErrors.length / 1000) * 100;
  }

  private identifySlowPages(): string[] {
    const performanceMetrics = performanceMonitoring.getAllMetrics();
    const pageLoadTimes: Record<string, number[]> = {};

    performanceMetrics.forEach(metric => {
      if (metric.name === 'PAGE_LOAD_TIME' && metric.page) {
        if (!pageLoadTimes[metric.page]) {
          pageLoadTimes[metric.page] = [];
        }
        pageLoadTimes[metric.page].push(metric.value);
      }
    });

    return Object.entries(pageLoadTimes)
      .filter(([page, times]) => {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        return avgTime > 3000; // Pages slower than 3 seconds
      })
      .map(([page]) => page);
  }

  private getSessionData(): any[] {
    try {
      const stored = localStorage.getItem('digimenu-session-data');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getActiveUsersCount(): number {
    // This would typically come from backend analytics
    return Math.floor(Math.random() * 100) + 10; // Mock data
  }

  private calculateConversionRate(funnelData: any[]): number {
    if (funnelData.length === 0) return 0;

    const startStep = funnelData.filter(d => d.stepNumber === 1).length;
    const endStep = funnelData.filter(d => d.stepNumber === 8).length;

    return startStep > 0 ? (endStep / startStep) * 100 : 0;
  }

  private calculateBounceRate(sessionData: any[]): number {
    if (sessionData.length === 0) return 0;

    const singlePageSessions = sessionData.filter(s => s.pageViews === 1).length;
    return (singlePageSessions / sessionData.length) * 100;
  }

  private calculateAverageSessionDuration(sessionData: any[]): number {
    if (sessionData.length === 0) return 0;

    const totalDuration = sessionData.reduce((sum, s) => sum + (s.duration || 0), 0);
    return totalDuration / sessionData.length;
  }

  private getTopPages(): Array<{ page: string; views: number }> {
    // Mock data - would come from analytics
    return [
      { page: '/menu', views: 1250 },
      { page: '/checkout', views: 890 },
      { page: '/cart', views: 650 },
      { page: '/orders', views: 420 },
      { page: '/profile', views: 280 }
    ];
  }

  private calculateFunnelDropoff(funnelData: any[]): Array<{ step: string; dropoffRate: number }> {
    const stepCounts: Record<number, number> = {};
    
    funnelData.forEach(d => {
      stepCounts[d.stepNumber] = (stepCounts[d.stepNumber] || 0) + 1;
    });

    const dropoff: Array<{ step: string; dropoffRate: number }> = [];
    
    for (let i = 1; i < 8; i++) {
      const currentCount = stepCounts[i] || 0;
      const nextCount = stepCounts[i + 1] || 0;
      const dropoffRate = currentCount > 0 ? ((currentCount - nextCount) / currentCount) * 100 : 0;
      
      dropoff.push({
        step: `Step ${i} to ${i + 1}`,
        dropoffRate
      });
    }

    return dropoff;
  }

  private getMemoryInfo(): { usedPercent: number } {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return { usedPercent: 0 };
  }

  private getNetworkInfo(): { latency: number } {
    // Mock network latency - would be measured via ping or API calls
    return { latency: Math.random() * 100 + 50 };
  }

  private calculateCacheHitRate(): number {
    // Mock cache hit rate - would come from service worker or backend
    return Math.random() * 20 + 80; // 80-100%
  }

  private determineSeverity(error: Error, context?: Record<string, any>): 'low' | 'medium' | 'high' | 'critical' {
    const criticalPatterns = [
      /payment.*failed/i,
      /checkout.*error/i,
      /authentication.*failed/i
    ];

    const highPatterns = [
      /api.*error/i,
      /network.*error/i,
      /provider.*error/i
    ];

    const errorMessage = error.message.toLowerCase();

    if (criticalPatterns.some(pattern => pattern.test(errorMessage))) {
      return 'critical';
    }

    if (highPatterns.some(pattern => pattern.test(errorMessage))) {
      return 'high';
    }

    if (context?.component || context?.page) {
      return 'medium';
    }

    return 'low';
  }

  private checkAlertRules(): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      const metricValue = this.getMetricValue(rule.metric);
      const shouldAlert = this.evaluateCondition(metricValue, rule.condition, rule.threshold);

      if (shouldAlert) {
        this.triggerAlert(rule, metricValue);
      }
    });
  }

  private checkErrorAlerts(error: ErrorEvent): void {
    const errorAlerts = this.alertRules.filter(rule => 
      rule.metric === 'error_rate' || rule.metric === 'critical_errors'
    );

    errorAlerts.forEach(rule => {
      if (error.severity === 'critical' && rule.metric === 'critical_errors') {
        this.triggerAlert(rule, 1);
      }
    });
  }

  private getMetricValue(metric: string): number {
    switch (metric) {
      case 'error_rate':
        return this.metrics.errors.errorRate;
      case 'critical_errors':
        return this.metrics.errors.criticalErrors;
      case 'performance_score':
        return this.metrics.performance.performanceScore;
      case 'conversion_rate':
        return this.metrics.userBehavior.conversionRate;
      case 'bounce_rate':
        return this.metrics.userBehavior.bounceRate;
      default:
        return 0;
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, value: number): void {
    const alert = {
      id: this.generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      timestamp: new Date().toISOString()
    };

    console.warn(`Alert triggered: ${rule.name}`, alert);

    // Send alert to backend
    this.sendAlert(alert);

    // Send real-time notification if WebSocket is connected
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'alert',
        payload: alert
      }));
    }
  }

  private async sendAlert(alert: any): Promise<void> {
    try {
      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private async sendMetricsToBackend(): Promise<void> {
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Failed to send metrics to backend:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await fetch('/api/monitoring/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertRules: this.alertRules,
          abTests: this.abTests
        })
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  private handleNewError(error: any): void {
    this.metrics.errors.totalErrors++;
    this.metrics.errors.recentErrors.unshift(error);
    
    if (this.metrics.errors.recentErrors.length > 10) {
      this.metrics.errors.recentErrors = this.metrics.errors.recentErrors.slice(0, 10);
    }
  }

  private handlePerformanceUpdate(performance: any): void {
    Object.assign(this.metrics.performance, performance);
  }

  private handleUserBehaviorUpdate(behavior: any): void {
    Object.assign(this.metrics.userBehavior, behavior);
  }

  private handleAlert(alert: any): void {
    console.warn('Real-time alert received:', alert);
    
    // You could trigger UI notifications here
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(`Alert: ${alert.ruleName}`, {
        body: `${alert.metric} is ${alert.value} (threshold: ${alert.threshold})`,
        icon: '/favicon.ico'
      });
    }
  }

  private convertMetricsToCSV(metrics: MonitoringMetrics): string {
    const rows = [
      ['Metric', 'Value', 'Timestamp'],
      ['Total Errors', metrics.errors.totalErrors.toString(), new Date().toISOString()],
      ['Error Rate', metrics.errors.errorRate.toString(), new Date().toISOString()],
      ['Performance Score', metrics.performance.performanceScore.toString(), new Date().toISOString()],
      ['Conversion Rate', metrics.userBehavior.conversionRate.toString(), new Date().toISOString()],
      ['Active Users', metrics.userBehavior.activeUsers.toString(), new Date().toISOString()]
    ];

    return rows.map(row => row.join(',')).join('\n');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const monitoringDashboard = new MonitoringDashboardService();