'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PerformanceMonitor } from '@/utils/performance';

interface PerformanceContextType {
  monitor: PerformanceMonitor | null;
  metrics: Record<string, number>;
  isMonitoring: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
  monitor: null,
  metrics: {},
  isMonitoring: false,
});

export function usePerformance() {
  return useContext(PerformanceContext);
}

interface PerformanceProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function PerformanceProvider({ 
  children, 
  enabled = process.env.NODE_ENV === 'production' 
}: PerformanceProviderProps) {
  const [monitor, setMonitor] = useState<PerformanceMonitor | null>(null);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Initialize performance monitor
    const performanceMonitor = new PerformanceMonitor();
    setMonitor(performanceMonitor);
    setIsMonitoring(true);

    // Update metrics periodically
    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics();
      setMetrics(currentMetrics);
    };

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      performanceMonitor.disconnect();
      setIsMonitoring(false);
    };
  }, [enabled]);

  // Report critical performance issues
  useEffect(() => {
    if (!metrics.LCP) return;

    const { LCP, FID, CLS } = metrics;
    
    // Alert for poor Core Web Vitals
    if (LCP > 4000) {
      console.warn('Poor LCP detected:', LCP);
    }
    
    if (FID > 300) {
      console.warn('Poor FID detected:', FID);
    }
    
    if (CLS > 0.25) {
      console.warn('Poor CLS detected:', CLS);
    }
  }, [metrics]);

  const value: PerformanceContextType = {
    monitor,
    metrics,
    isMonitoring,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Performance debug component for development
 */
export function PerformanceDebugger() {
  const { metrics, isMonitoring } = usePerformance();

  if (process.env.NODE_ENV !== 'development' || !isMonitoring) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="font-bold mb-2">Performance Metrics</div>
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="flex justify-between gap-4">
          <span>{key}:</span>
          <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
        </div>
      ))}
    </div>
  );
}