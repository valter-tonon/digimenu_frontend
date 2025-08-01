/**
 * Tests for Monitoring Dashboard Service
 * Validates real-time monitoring, alert management, and A/B testing functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { 
  MonitoringDashboardService,
  monitoringDashboard,
  type MonitoringMetrics,
  type AlertRule,
  type ABTestConfig,
  type ErrorEvent
} from '@/services/monitoringDashboard';

// Mock dependencies
vi.mock('@/services/analytics', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
    getFunnelData: vi.fn(() => [
      { stepNumber: 1, timestamp: '2023-01-01T00:00:00Z' },
      { stepNumber: 8, timestamp: '2023-01-01T00:05:00Z' }
    ])
  }
}));

vi.mock('@/services/sentryIntegration', () => ({
  sentryService: {
    captureException: vi.fn()
  }
}));

vi.mock('@/services/performanceMonitoring', () => ({
  performanceMonitoring: {
    getCoreWebVitals: vi.fn(() => ({
      LCP: 2000,
      FID: 80,
      CLS: 0.05,
      FCP: 1500,
      TTFB: 600
    })),
    getCustomMetrics: vi.fn(() => ({
      pageLoadTime: 1800,
      apiResponseTime: 250,
      checkoutFlowTime: 5000
    })),
    getPerformanceSummary: vi.fn(() => ({
      performanceScore: 85,
      issues: []
    })),
    getAllMetrics: vi.fn(() => [
      { name: 'PAGE_LOAD_TIME', value: 1800, page: '/menu' },
      { name: 'PAGE_LOAD_TIME', value: 3500, page: '/checkout' }
    ])
  }
}));

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50000000,
    jsHeapSizeLimit: 100000000
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock window
const mockWindow = {
  location: { pathname: '/test-path' }
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('MonitoringDashboardService', () => {
  let monitoringService: MonitoringDashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful fetch responses
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        alertRules: [],
        abTests: []
      })
    });

    // Mock localStorage responses
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'digimenu-monitoring-errors') {
        return JSON.stringify([
          {
            id: 'error-1',
            message: 'Test error',
            timestamp: new Date().toISOString(),
            page: '/test',
            severity: 'medium',
            type: 'javascript'
          }
        ]);
      }
      if (key === 'digimenu-session-data') {
        return JSON.stringify([
          { duration: 300000, pageViews: 3 },
          { duration: 150000, pageViews: 1 }
        ]);
      }
      return null;
    });

    monitoringService = new MonitoringDashboardService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    monitoringService.disconnect();
  });

  describe('Initialization', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitoringService.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.errors).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.userBehavior).toBeDefined();
      expect(metrics.system).toBeDefined();
    });

    it('should load configuration from backend', async () => {
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.fetch).toHaveBeenCalledWith('/api/monitoring/config');
    });

    it('should initialize WebSocket connection', async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.WebSocket).toHaveBeenCalled();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect error metrics', () => {
      const errorMetrics = monitoringService.getErrorMetrics();
      
      expect(errorMetrics.totalErrors).toBe(1);
      expect(errorMetrics.errorsByType).toHaveProperty('javascript');
      expect(errorMetrics.errorsByPage).toHaveProperty('/test');
      expect(errorMetrics.recentErrors).toHaveLength(1);
    });

    it('should collect performance metrics', () => {
      const performanceMetrics = monitoringService.getPerformanceMetrics();
      
      expect(performanceMetrics.coreWebVitals.LCP).toBe(2000);
      expect(performanceMetrics.coreWebVitals.FID).toBe(80);
      expect(performanceMetrics.customMetrics.pageLoadTime).toBe(1800);
      expect(performanceMetrics.performanceScore).toBe(85);
    });

    it('should collect user behavior metrics', () => {
      const userBehaviorMetrics = monitoringService.getUserBehaviorMetrics();
      
      expect(userBehaviorMetrics.conversionRate).toBeGreaterThan(0);
      expect(userBehaviorMetrics.bounceRate).toBe(50); // 1 out of 2 sessions
      expect(userBehaviorMetrics.averageSessionDuration).toBe(225000); // Average of 300000 and 150000
    });

    it('should identify slow pages', () => {
      const performanceMetrics = monitoringService.getPerformanceMetrics();
      
      expect(performanceMetrics.slowPages).toContain('/checkout');
      expect(performanceMetrics.slowPages).not.toContain('/menu');
    });
  });

  describe('Error Reporting', () => {
    it('should report errors and update metrics', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };
      
      monitoringService.reportError(error, context);
      
      const errorMetrics = monitoringService.getErrorMetrics();
      expect(errorMetrics.totalErrors).toBe(2); // 1 existing + 1 new
      expect(errorMetrics.recentErrors[0].message).toBe('Test error');
    });

    it('should determine error severity correctly', () => {
      const criticalError = new Error('Payment failed');
      monitoringService.reportError(criticalError);
      
      const errorMetrics = monitoringService.getErrorMetrics();
      const recentError = errorMetrics.recentErrors[0];
      expect(recentError.severity).toBe('critical');
    });

    it('should store errors in localStorage', () => {
      const error = new Error('Storage test error');
      monitoringService.reportError(error);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'digimenu-monitoring-errors',
        expect.stringContaining('Storage test error')
      );
    });
  });

  describe('Alert Management', () => {
    it('should create alert rules', () => {
      const rule: Omit<AlertRule, 'id'> = {
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5,
        enabled: true,
        notifications: ['email@test.com']
      };
      
      const ruleId = monitoringService.createAlertRule(rule);
      
      expect(ruleId).toBeDefined();
      expect(typeof ruleId).toBe('string');
      
      const alertRules = monitoringService.getAlertRules();
      expect(alertRules).toHaveLength(1);
      expect(alertRules[0].name).toBe('High Error Rate');
    });

    it('should update alert rules', () => {
      const rule: Omit<AlertRule, 'id'> = {
        name: 'Test Rule',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5,
        enabled: true,
        notifications: []
      };
      
      const ruleId = monitoringService.createAlertRule(rule);
      const success = monitoringService.updateAlertRule(ruleId, { threshold: 10 });
      
      expect(success).toBe(true);
      
      const alertRules = monitoringService.getAlertRules();
      const updatedRule = alertRules.find(r => r.id === ruleId);
      expect(updatedRule?.threshold).toBe(10);
    });

    it('should delete alert rules', () => {
      const rule: Omit<AlertRule, 'id'> = {
        name: 'Test Rule',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5,
        enabled: true,
        notifications: []
      };
      
      const ruleId = monitoringService.createAlertRule(rule);
      const success = monitoringService.deleteAlertRule(ruleId);
      
      expect(success).toBe(true);
      
      const alertRules = monitoringService.getAlertRules();
      expect(alertRules).toHaveLength(0);
    });
  });

  describe('A/B Testing', () => {
    it('should create A/B tests', () => {
      const testConfig: Omit<ABTestConfig, 'id'> = {
        name: 'Button Color Test',
        description: 'Test different button colors',
        variants: [
          { id: 'red', name: 'Red Button', weight: 50, config: { color: 'red' } },
          { id: 'blue', name: 'Blue Button', weight: 50, config: { color: 'blue' } }
        ],
        enabled: true,
        startDate: '2023-01-01',
        targetAudience: { trafficPercentage: 100 }
      };
      
      const testId = monitoringService.createABTest(testConfig);
      
      expect(testId).toBeDefined();
      expect(typeof testId).toBe('string');
    });

    it('should assign consistent variants to users', () => {
      const testConfig: Omit<ABTestConfig, 'id'> = {
        name: 'Test',
        description: 'Test',
        variants: [
          { id: 'a', name: 'Variant A', weight: 50, config: {} },
          { id: 'b', name: 'Variant B', weight: 50, config: {} }
        ],
        enabled: true,
        startDate: '2023-01-01'
      };
      
      const testId = monitoringService.createABTest(testConfig);
      const userId = 'user123';
      
      const variant1 = monitoringService.getABTestVariant(testId, userId);
      const variant2 = monitoringService.getABTestVariant(testId, userId);
      
      expect(variant1).toBe(variant2); // Should be consistent
      expect(['a', 'b']).toContain(variant1);
    });

    it('should track A/B test conversions', () => {
      const testId = 'test123';
      const variantId = 'variant-a';
      const userId = 'user123';
      
      monitoringService.trackABTestConversion(testId, variantId, userId);
      
      // Should call analytics service
      const { analyticsService } = require('@/services/analytics');
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'ab_test_conversion',
        'experiment',
        {
          test_id: testId,
          variant_id: variantId,
          user_id: userId
        }
      );
    });

    it('should get A/B test results', async () => {
      const testId = 'test123';
      const mockResults = { conversions: 50, participants: 100 };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });
      
      const results = await monitoringService.getABTestResults(testId);
      
      expect(results).toEqual(mockResults);
      expect(global.fetch).toHaveBeenCalledWith(`/api/monitoring/ab-tests/${testId}/results`);
    });
  });

  describe('Data Export', () => {
    it('should export metrics as JSON', () => {
      const jsonExport = monitoringService.exportMetrics('json');
      
      expect(() => JSON.parse(jsonExport)).not.toThrow();
      
      const parsed = JSON.parse(jsonExport);
      expect(parsed.errors).toBeDefined();
      expect(parsed.performance).toBeDefined();
    });

    it('should export metrics as CSV', () => {
      const csvExport = monitoringService.exportMetrics('csv');
      
      expect(csvExport).toContain('Metric,Value,Timestamp');
      expect(csvExport).toContain('Total Errors');
      expect(csvExport).toContain('Performance Score');
    });
  });

  describe('Real-time Updates', () => {
    it('should handle WebSocket error updates', () => {
      const errorUpdate = {
        type: 'error',
        payload: {
          id: 'ws-error-1',
          message: 'WebSocket error',
          timestamp: new Date().toISOString(),
          page: '/test',
          severity: 'high'
        }
      };
      
      // Simulate WebSocket message
      const onMessage = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (onMessage) {
        onMessage({ data: JSON.stringify(errorUpdate) });
      }
      
      const errorMetrics = monitoringService.getErrorMetrics();
      expect(errorMetrics.totalErrors).toBeGreaterThan(0);
    });

    it('should handle WebSocket performance updates', () => {
      const performanceUpdate = {
        type: 'performance',
        payload: {
          performanceScore: 75,
          coreWebVitals: { LCP: 3000 }
        }
      };
      
      const onMessage = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (onMessage) {
        onMessage({ data: JSON.stringify(performanceUpdate) });
      }
      
      const performanceMetrics = monitoringService.getPerformanceMetrics();
      expect(performanceMetrics.performanceScore).toBe(75);
    });
  });

  describe('Alert Triggering', () => {
    it('should trigger alerts when thresholds are exceeded', () => {
      // Create an alert rule
      const rule: Omit<AlertRule, 'id'> = {
        name: 'Critical Error Alert',
        metric: 'critical_errors',
        condition: 'greater_than',
        threshold: 0,
        enabled: true,
        notifications: ['admin@test.com']
      };
      
      monitoringService.createAlertRule(rule);
      
      // Report a critical error
      const criticalError = new Error('Payment processing failed');
      monitoringService.reportError(criticalError);
      
      // Should trigger alert (would be tested via WebSocket or API call)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/monitoring/alerts',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should disconnect properly', () => {
      monitoringService.disconnect();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });
});

describe('Singleton Instance', () => {
  it('should export monitoring dashboard singleton', () => {
    expect(monitoringDashboard).toBeInstanceOf(MonitoringDashboardService);
  });
});