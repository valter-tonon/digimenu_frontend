/**
 * Monitoring Dashboard Hook
 * Provides access to real-time monitoring metrics, alerts, and A/B testing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  monitoringDashboard,
  type MonitoringMetrics,
  type ErrorMetrics,
  type PerformanceMetrics,
  type UserBehaviorMetrics,
  type AlertRule,
  type ABTestConfig,
  type ErrorEvent
} from '@/services/monitoringDashboard';

export interface UseMonitoringDashboardReturn {
  // Metrics
  metrics: MonitoringMetrics | null;
  errorMetrics: ErrorMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  userBehaviorMetrics: UserBehaviorMetrics | null;
  
  // Loading states
  isLoading: boolean;
  isConnected: boolean;
  
  // Error reporting
  reportError: (error: Error, context?: Record<string, any>) => void;
  
  // Alert management
  alertRules: AlertRule[];
  createAlertRule: (rule: Omit<AlertRule, 'id'>) => Promise<string>;
  updateAlertRule: (id: string, updates: Partial<AlertRule>) => Promise<boolean>;
  deleteAlertRule: (id: string) => Promise<boolean>;
  
  // A/B Testing
  abTests: ABTestConfig[];
  createABTest: (config: Omit<ABTestConfig, 'id'>) => Promise<string>;
  getABTestVariant: (testId: string, userId: string) => string | null;
  trackABTestConversion: (testId: string, variantId: string, userId: string) => void;
  getABTestResults: (testId: string) => Promise<any>;
  
  // Data export
  exportMetrics: (format?: 'json' | 'csv') => string;
  
  // Refresh
  refreshMetrics: () => void;
}

export function useMonitoringDashboard(): UseMonitoringDashboardReturn {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [userBehaviorMetrics, setUserBehaviorMetrics] = useState<UserBehaviorMetrics | null>(null);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [abTests, setAbTests] = useState<ABTestConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize monitoring and set up periodic updates
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        setIsLoading(true);
        
        // Get initial metrics
        await refreshMetrics();
        
        // Load alert rules and A/B tests
        const rules = monitoringDashboard.getAlertRules();
        setAlertRules(rules);
        
        setIsConnected(true);
        setIsLoading(false);
        
        // Set up periodic refresh
        refreshIntervalRef.current = setInterval(() => {
          refreshMetrics();
        }, 30000); // Refresh every 30 seconds
        
      } catch (error) {
        console.error('Failed to initialize monitoring dashboard:', error);
        setIsLoading(false);
        setIsConnected(false);
      }
    };

    initializeMonitoring();

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      monitoringDashboard.disconnect();
    };
  }, []);

  // Refresh all metrics
  const refreshMetrics = useCallback(async () => {
    try {
      const allMetrics = monitoringDashboard.getMetrics();
      const errors = monitoringDashboard.getErrorMetrics();
      const performance = monitoringDashboard.getPerformanceMetrics();
      const userBehavior = monitoringDashboard.getUserBehaviorMetrics();
      
      setMetrics(allMetrics);
      setErrorMetrics(errors);
      setPerformanceMetrics(performance);
      setUserBehaviorMetrics(userBehavior);
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      setIsConnected(false);
    }
  }, []);

  // Report error
  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    monitoringDashboard.reportError(error, context);
    
    // Refresh error metrics after reporting
    setTimeout(() => {
      const updatedErrorMetrics = monitoringDashboard.getErrorMetrics();
      setErrorMetrics(updatedErrorMetrics);
    }, 1000);
  }, []);

  // Alert rule management
  const createAlertRule = useCallback(async (rule: Omit<AlertRule, 'id'>): Promise<string> => {
    try {
      const ruleId = monitoringDashboard.createAlertRule(rule);
      const updatedRules = monitoringDashboard.getAlertRules();
      setAlertRules(updatedRules);
      return ruleId;
    } catch (error) {
      console.error('Failed to create alert rule:', error);
      throw error;
    }
  }, []);

  const updateAlertRule = useCallback(async (id: string, updates: Partial<AlertRule>): Promise<boolean> => {
    try {
      const success = monitoringDashboard.updateAlertRule(id, updates);
      if (success) {
        const updatedRules = monitoringDashboard.getAlertRules();
        setAlertRules(updatedRules);
      }
      return success;
    } catch (error) {
      console.error('Failed to update alert rule:', error);
      throw error;
    }
  }, []);

  const deleteAlertRule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = monitoringDashboard.deleteAlertRule(id);
      if (success) {
        const updatedRules = monitoringDashboard.getAlertRules();
        setAlertRules(updatedRules);
      }
      return success;
    } catch (error) {
      console.error('Failed to delete alert rule:', error);
      throw error;
    }
  }, []);

  // A/B Testing
  const createABTest = useCallback(async (config: Omit<ABTestConfig, 'id'>): Promise<string> => {
    try {
      const testId = monitoringDashboard.createABTest(config);
      // Refresh A/B tests list would go here if we had a getter
      return testId;
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      throw error;
    }
  }, []);

  const getABTestVariant = useCallback((testId: string, userId: string): string | null => {
    return monitoringDashboard.getABTestVariant(testId, userId);
  }, []);

  const trackABTestConversion = useCallback((testId: string, variantId: string, userId: string) => {
    monitoringDashboard.trackABTestConversion(testId, variantId, userId);
  }, []);

  const getABTestResults = useCallback(async (testId: string): Promise<any> => {
    return monitoringDashboard.getABTestResults(testId);
  }, []);

  // Data export
  const exportMetrics = useCallback((format: 'json' | 'csv' = 'json'): string => {
    return monitoringDashboard.exportMetrics(format);
  }, []);

  return {
    // Metrics
    metrics,
    errorMetrics,
    performanceMetrics,
    userBehaviorMetrics,
    
    // Loading states
    isLoading,
    isConnected,
    
    // Error reporting
    reportError,
    
    // Alert management
    alertRules,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
    
    // A/B Testing
    abTests,
    createABTest,
    getABTestVariant,
    trackABTestConversion,
    getABTestResults,
    
    // Data export
    exportMetrics,
    
    // Refresh
    refreshMetrics
  };
}

/**
 * Hook for real-time error monitoring
 */
export function useErrorMonitoring() {
  const { errorMetrics, reportError, isConnected } = useMonitoringDashboard();
  const [recentErrors, setRecentErrors] = useState<ErrorEvent[]>([]);

  useEffect(() => {
    if (errorMetrics?.recentErrors) {
      setRecentErrors(errorMetrics.recentErrors);
    }
  }, [errorMetrics]);

  const reportComponentError = useCallback((componentName: string, error: Error, props?: any) => {
    reportError(error, {
      component: componentName,
      props: JSON.stringify(props),
      error_boundary: 'component'
    });
  }, [reportError]);

  const reportApiError = useCallback((endpoint: string, error: Error, requestData?: any) => {
    reportError(error, {
      endpoint,
      request_data: JSON.stringify(requestData),
      error_boundary: 'api'
    });
  }, [reportError]);

  const reportFormError = useCallback((formName: string, fieldName: string, error: Error) => {
    reportError(error, {
      form: formName,
      field: fieldName,
      error_boundary: 'form'
    });
  }, [reportError]);

  return {
    errorMetrics,
    recentErrors,
    isConnected,
    reportError,
    reportComponentError,
    reportApiError,
    reportFormError
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const { performanceMetrics, isConnected } = useMonitoringDashboard();
  const [performanceScore, setPerformanceScore] = useState<number>(100);
  const [slowPages, setSlowPages] = useState<string[]>([]);

  useEffect(() => {
    if (performanceMetrics) {
      setPerformanceScore(performanceMetrics.performanceScore);
      setSlowPages(performanceMetrics.slowPages);
    }
  }, [performanceMetrics]);

  const getPerformanceStatus = useCallback((score: number): 'good' | 'needs-improvement' | 'poor' => {
    if (score >= 90) return 'good';
    if (score >= 70) return 'needs-improvement';
    return 'poor';
  }, []);

  const getCoreWebVitalsStatus = useCallback(() => {
    if (!performanceMetrics) return null;

    const { coreWebVitals } = performanceMetrics;
    
    return {
      LCP: {
        value: coreWebVitals.LCP,
        status: coreWebVitals.LCP <= 2500 ? 'good' : coreWebVitals.LCP <= 4000 ? 'needs-improvement' : 'poor'
      },
      FID: {
        value: coreWebVitals.FID,
        status: coreWebVitals.FID <= 100 ? 'good' : coreWebVitals.FID <= 300 ? 'needs-improvement' : 'poor'
      },
      CLS: {
        value: coreWebVitals.CLS,
        status: coreWebVitals.CLS <= 0.1 ? 'good' : coreWebVitals.CLS <= 0.25 ? 'needs-improvement' : 'poor'
      }
    };
  }, [performanceMetrics]);

  return {
    performanceMetrics,
    performanceScore,
    slowPages,
    isConnected,
    getPerformanceStatus,
    getCoreWebVitalsStatus
  };
}

/**
 * Hook for A/B testing
 */
export function useABTesting(userId: string) {
  const { 
    getABTestVariant, 
    trackABTestConversion, 
    createABTest, 
    getABTestResults 
  } = useMonitoringDashboard();
  
  const [activeVariants, setActiveVariants] = useState<Record<string, string>>({});

  const getVariant = useCallback((testId: string): string | null => {
    if (activeVariants[testId]) {
      return activeVariants[testId];
    }

    const variant = getABTestVariant(testId, userId);
    if (variant) {
      setActiveVariants(prev => ({ ...prev, [testId]: variant }));
    }

    return variant;
  }, [getABTestVariant, userId, activeVariants]);

  const trackConversion = useCallback((testId: string) => {
    const variant = activeVariants[testId];
    if (variant) {
      trackABTestConversion(testId, variant, userId);
    }
  }, [trackABTestConversion, userId, activeVariants]);

  return {
    getVariant,
    trackConversion,
    createABTest,
    getABTestResults,
    activeVariants
  };
}