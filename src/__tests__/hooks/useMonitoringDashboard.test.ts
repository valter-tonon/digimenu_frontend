/**
 * Tests for Monitoring Dashboard Hooks
 * Validates useMonitoringDashboard, useErrorMonitoring, usePerformanceMonitoring, and useABTesting hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useMonitoringDashboard,
  useErrorMonitoring,
  usePerformanceMonitoring,
  useABTesting
} from '@/hooks/useMonitoringDashboard';

// Mock the monitoring dashboard service
const mockMonitoringDashboard = {
  getMetrics: vi.fn(),
  getErrorMetrics: vi.fn(),
  getPerformanceMetrics: vi.fn(),
  getUserBehaviorMetrics: vi.fn(),
  getAlertRules: vi.fn(),
  reportError: vi.fn(),
  createAlertRule: vi.fn(),
  updateAlertRule: vi.fn(),
  deleteAlertRule: vi.fn(),
  createABTest: vi.fn(),
  getABTestVariant: vi.fn(),
  trackABTestConversion: vi.fn(),
  getABTestResults: vi.fn(),
  exportMetrics: vi.fn(),
  disconnect: vi.fn()
};

vi.mock('@/services/monitoringDashboard', () => ({
  monitoringDashboard: mockMonitoringDashboard
}));

// Mock data
const mockMetrics = {
  errors: {
    totalErrors: 5,
    errorRate: 2.5,
    criticalErrors: 1,
    errorsByType: { javascript: 3, api: 2 },
    errorsByPage: { '/checkout': 2, '/menu': 3 },
    recentErrors: [
      {
        id: 'error-1',
        message: 'Test error',
        timestamp: '2023-01-01T00:00:00Z',
        page: '/test',
        severity: 'medium' as const,
        resolved: false
      }
    ]
  },
  performance: {
    coreWebVitals: {
      LCP: 2000,
      FID: 80,
      CLS: 0.05,
      FCP: 1500,
      TTFB: 600
    },
    customMetrics: {
      pageLoadTime: 1800,
      apiResponseTime: 250,
      checkoutFlowTime: 5000
    },
    performanceScore: 85,
    slowPages: ['/checkout']
  },
  userBehavior: {
    activeUsers: 50,
    conversionRate: 12.5,
    bounceRate: 35,
    averageSessionDuration: 180000,
    topPages: [
      { page: '/menu', views: 1000 },
      { page: '/checkout', views: 500 }
    ],
    funnelDropoff: [
      { step: 'Step 1 to 2', dropoffRate: 15 },
      { step: 'Step 2 to 3', dropoffRate: 10 }
    ]
  },
  system: {
    uptime: 86400000,
    memoryUsage: 65,
    cpuUsage: 45,
    networkLatency: 75,
    cacheHitRate: 92
  }
};

const mockAlertRules = [
  {
    id: 'rule-1',
    name: 'High Error Rate',
    metric: 'error_rate',
    condition: 'greater_than' as const,
    threshold: 5,
    enabled: true,
    notifications: ['admin@test.com']
  }
];

describe('useMonitoringDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock returns
    mockMonitoringDashboard.getMetrics.mockReturnValue(mockMetrics);
    mockMonitoringDashboard.getErrorMetrics.mockReturnValue(mockMetrics.errors);
    mockMonitoringDashboard.getPerformanceMetrics.mockReturnValue(mockMetrics.performance);
    mockMonitoringDashboard.getUserBehaviorMetrics.mockReturnValue(mockMetrics.userBehavior);
    mockMonitoringDashboard.getAlertRules.mockReturnValue(mockAlertRules);
    mockMonitoringDashboard.exportMetrics.mockReturnValue(JSON.stringify(mockMetrics));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization and Metrics', () => {
    it('should initialize and load metrics', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());

      expect(result.current.isLoading).toBe(true);

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.errorMetrics).toEqual(mockMetrics.errors);
      expect(result.current.performanceMetrics).toEqual(mockMetrics.performance);
      expect(result.current.userBehaviorMetrics).toEqual(mockMetrics.userBehavior);
    });

    it('should load alert rules', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.alertRules).toEqual(mockAlertRules);
    });

    it('should refresh metrics', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());

      await act(async () => {
        result.current.refreshMetrics();
      });

      expect(mockMonitoringDashboard.getMetrics).toHaveBeenCalled();
      expect(mockMonitoringDashboard.getErrorMetrics).toHaveBeenCalled();
      expect(mockMonitoringDashboard.getPerformanceMetrics).toHaveBeenCalled();
      expect(mockMonitoringDashboard.getUserBehaviorMetrics).toHaveBeenCalled();
    });
  });

  describe('Error Reporting', () => {
    it('should report errors', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      await act(async () => {
        result.current.reportError(error, context);
      });

      expect(mockMonitoringDashboard.reportError).toHaveBeenCalledWith(error, context);
    });

    it('should refresh error metrics after reporting', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const error = new Error('Test error');

      await act(async () => {
        result.current.reportError(error);
        // Wait for the timeout in reportError
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      expect(mockMonitoringDashboard.getErrorMetrics).toHaveBeenCalledTimes(2); // Initial + after report
    });
  });

  describe('Alert Rule Management', () => {
    it('should create alert rules', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const newRule = {
        name: 'New Rule',
        metric: 'error_rate',
        condition: 'greater_than' as const,
        threshold: 10,
        enabled: true,
        notifications: ['test@test.com']
      };

      mockMonitoringDashboard.createAlertRule.mockReturnValue('new-rule-id');

      await act(async () => {
        const ruleId = await result.current.createAlertRule(newRule);
        expect(ruleId).toBe('new-rule-id');
      });

      expect(mockMonitoringDashboard.createAlertRule).toHaveBeenCalledWith(newRule);
      expect(mockMonitoringDashboard.getAlertRules).toHaveBeenCalled();
    });

    it('should update alert rules', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const ruleId = 'rule-1';
      const updates = { threshold: 15 };

      mockMonitoringDashboard.updateAlertRule.mockReturnValue(true);

      await act(async () => {
        const success = await result.current.updateAlertRule(ruleId, updates);
        expect(success).toBe(true);
      });

      expect(mockMonitoringDashboard.updateAlertRule).toHaveBeenCalledWith(ruleId, updates);
      expect(mockMonitoringDashboard.getAlertRules).toHaveBeenCalled();
    });

    it('should delete alert rules', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const ruleId = 'rule-1';

      mockMonitoringDashboard.deleteAlertRule.mockReturnValue(true);

      await act(async () => {
        const success = await result.current.deleteAlertRule(ruleId);
        expect(success).toBe(true);
      });

      expect(mockMonitoringDashboard.deleteAlertRule).toHaveBeenCalledWith(ruleId);
      expect(mockMonitoringDashboard.getAlertRules).toHaveBeenCalled();
    });
  });

  describe('A/B Testing', () => {
    it('should create A/B tests', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const testConfig = {
        name: 'Button Test',
        description: 'Test button colors',
        variants: [
          { id: 'red', name: 'Red', weight: 50, config: {} },
          { id: 'blue', name: 'Blue', weight: 50, config: {} }
        ],
        enabled: true,
        startDate: '2023-01-01'
      };

      mockMonitoringDashboard.createABTest.mockReturnValue('test-id');

      await act(async () => {
        const testId = await result.current.createABTest(testConfig);
        expect(testId).toBe('test-id');
      });

      expect(mockMonitoringDashboard.createABTest).toHaveBeenCalledWith(testConfig);
    });

    it('should get A/B test variants', () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const testId = 'test-123';
      const userId = 'user-456';

      mockMonitoringDashboard.getABTestVariant.mockReturnValue('variant-a');

      act(() => {
        const variant = result.current.getABTestVariant(testId, userId);
        expect(variant).toBe('variant-a');
      });

      expect(mockMonitoringDashboard.getABTestVariant).toHaveBeenCalledWith(testId, userId);
    });

    it('should track A/B test conversions', () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const testId = 'test-123';
      const variantId = 'variant-a';
      const userId = 'user-456';

      act(() => {
        result.current.trackABTestConversion(testId, variantId, userId);
      });

      expect(mockMonitoringDashboard.trackABTestConversion).toHaveBeenCalledWith(
        testId,
        variantId,
        userId
      );
    });

    it('should get A/B test results', async () => {
      const { result } = renderHook(() => useMonitoringDashboard());
      const testId = 'test-123';
      const mockResults = { conversions: 25, participants: 100 };

      mockMonitoringDashboard.getABTestResults.mockResolvedValue(mockResults);

      await act(async () => {
        const results = await result.current.getABTestResults(testId);
        expect(results).toEqual(mockResults);
      });

      expect(mockMonitoringDashboard.getABTestResults).toHaveBeenCalledWith(testId);
    });
  });

  describe('Data Export', () => {
    it('should export metrics', () => {
      const { result } = renderHook(() => useMonitoringDashboard());

      act(() => {
        const exported = result.current.exportMetrics('json');
        expect(exported).toBe(JSON.stringify(mockMetrics));
      });

      expect(mockMonitoringDashboard.exportMetrics).toHaveBeenCalledWith('json');
    });
  });

  describe('Cleanup', () => {
    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() => useMonitoringDashboard());

      unmount();

      expect(mockMonitoringDashboard.disconnect).toHaveBeenCalled();
    });
  });
});

describe('useErrorMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMonitoringDashboard.getMetrics.mockReturnValue(mockMetrics);
    mockMonitoringDashboard.getErrorMetrics.mockReturnValue(mockMetrics.errors);
    mockMonitoringDashboard.getPerformanceMetrics.mockReturnValue(mockMetrics.performance);
    mockMonitoringDashboard.getUserBehaviorMetrics.mockReturnValue(mockMetrics.userBehavior);
    mockMonitoringDashboard.getAlertRules.mockReturnValue(mockAlertRules);
  });

  it('should provide error monitoring functionality', async () => {
    const { result } = renderHook(() => useErrorMonitoring());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.errorMetrics).toEqual(mockMetrics.errors);
    expect(result.current.recentErrors).toEqual(mockMetrics.errors.recentErrors);
    expect(result.current.isConnected).toBe(true);
  });

  it('should report component errors', async () => {
    const { result } = renderHook(() => useErrorMonitoring());
    const error = new Error('Component error');
    const componentName = 'TestComponent';
    const props = { id: '123' };

    await act(async () => {
      result.current.reportComponentError(componentName, error, props);
    });

    expect(mockMonitoringDashboard.reportError).toHaveBeenCalledWith(error, {
      component: componentName,
      props: JSON.stringify(props),
      error_boundary: 'component'
    });
  });

  it('should report API errors', async () => {
    const { result } = renderHook(() => useErrorMonitoring());
    const error = new Error('API error');
    const endpoint = '/api/test';
    const requestData = { param: 'value' };

    await act(async () => {
      result.current.reportApiError(endpoint, error, requestData);
    });

    expect(mockMonitoringDashboard.reportError).toHaveBeenCalledWith(error, {
      endpoint,
      request_data: JSON.stringify(requestData),
      error_boundary: 'api'
    });
  });

  it('should report form errors', async () => {
    const { result } = renderHook(() => useErrorMonitoring());
    const error = new Error('Form error');
    const formName = 'TestForm';
    const fieldName = 'email';

    await act(async () => {
      result.current.reportFormError(formName, fieldName, error);
    });

    expect(mockMonitoringDashboard.reportError).toHaveBeenCalledWith(error, {
      form: formName,
      field: fieldName,
      error_boundary: 'form'
    });
  });
});

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMonitoringDashboard.getMetrics.mockReturnValue(mockMetrics);
    mockMonitoringDashboard.getErrorMetrics.mockReturnValue(mockMetrics.errors);
    mockMonitoringDashboard.getPerformanceMetrics.mockReturnValue(mockMetrics.performance);
    mockMonitoringDashboard.getUserBehaviorMetrics.mockReturnValue(mockMetrics.userBehavior);
    mockMonitoringDashboard.getAlertRules.mockReturnValue(mockAlertRules);
  });

  it('should provide performance monitoring functionality', async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.performanceMetrics).toEqual(mockMetrics.performance);
    expect(result.current.performanceScore).toBe(85);
    expect(result.current.slowPages).toEqual(['/checkout']);
    expect(result.current.isConnected).toBe(true);
  });

  it('should determine performance status', async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.getPerformanceStatus(95)).toBe('good');
    expect(result.current.getPerformanceStatus(75)).toBe('needs-improvement');
    expect(result.current.getPerformanceStatus(50)).toBe('poor');
  });

  it('should get Core Web Vitals status', async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const coreWebVitalsStatus = result.current.getCoreWebVitalsStatus();

    expect(coreWebVitalsStatus).toEqual({
      LCP: { value: 2000, status: 'good' },
      FID: { value: 80, status: 'good' },
      CLS: { value: 0.05, status: 'good' }
    });
  });
});

describe('useABTesting', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockMonitoringDashboard.getABTestVariant.mockReturnValue('variant-a');
  });

  it('should get and cache variants', () => {
    const { result } = renderHook(() => useABTesting(userId));
    const testId = 'test-123';

    act(() => {
      const variant1 = result.current.getVariant(testId);
      const variant2 = result.current.getVariant(testId);

      expect(variant1).toBe('variant-a');
      expect(variant2).toBe('variant-a');
    });

    // Should only call the service once due to caching
    expect(mockMonitoringDashboard.getABTestVariant).toHaveBeenCalledTimes(1);
    expect(mockMonitoringDashboard.getABTestVariant).toHaveBeenCalledWith(testId, userId);
  });

  it('should track conversions for active variants', () => {
    const { result } = renderHook(() => useABTesting(userId));
    const testId = 'test-123';

    act(() => {
      // First get the variant to cache it
      result.current.getVariant(testId);
      // Then track conversion
      result.current.trackConversion(testId);
    });

    expect(mockMonitoringDashboard.trackABTestConversion).toHaveBeenCalledWith(
      testId,
      'variant-a',
      userId
    );
  });

  it('should not track conversions for unknown tests', () => {
    const { result } = renderHook(() => useABTesting(userId));
    const unknownTestId = 'unknown-test';

    act(() => {
      result.current.trackConversion(unknownTestId);
    });

    expect(mockMonitoringDashboard.trackABTestConversion).not.toHaveBeenCalled();
  });

  it('should provide access to A/B test management functions', () => {
    const { result } = renderHook(() => useABTesting(userId));

    expect(result.current.createABTest).toBeDefined();
    expect(result.current.getABTestResults).toBeDefined();
    expect(typeof result.current.createABTest).toBe('function');
    expect(typeof result.current.getABTestResults).toBe('function');
  });
});