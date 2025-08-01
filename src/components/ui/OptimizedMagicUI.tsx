/**
 * Optimized Magic UI Component Wrapper
 * Provides code splitting, lazy loading, and performance monitoring
 */

'use client';

import React, { Suspense, useEffect, useState, ComponentType } from 'react';
import { 
  LazyMagicComponents, 
  LazyAnimationComponents,
  MagicUIPreloader,
  ComponentPerformanceMonitor,
  type MagicUIComponentProps 
} from '@/lib/magicui-loader';
import { cn } from '@/lib/utils';

// Loading fallback component
const LoadingFallback: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  className, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)} role="status">
      <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeClasses[size])} />
      <span className="sr-only">Carregando componente...</span>
    </div>
  );
};

// Error boundary for Magic UI components
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MagicUIErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; componentName?: string },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Magic UI Component Error:', error, errorInfo);
    
    if (this.props.componentName) {
      ComponentPerformanceMonitor.recordError(this.props.componentName, error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4 text-gray-500">
          <span>Componente indisponível</span>
        </div>
      );
    }

    return this.props.children;
  }
}

// Optimized Magic UI component wrapper
interface OptimizedMagicUIProps extends MagicUIComponentProps {
  component: keyof typeof LazyMagicComponents | keyof typeof LazyAnimationComponents;
  fallback?: React.ReactNode;
  preload?: boolean;
  critical?: boolean;
  onLoadComplete?: () => void;
  onLoadError?: (error: Error) => void;
}

export const OptimizedMagicUI: React.FC<OptimizedMagicUIProps> = ({
  component,
  fallback,
  preload = false,
  critical = false,
  onLoadComplete,
  onLoadError,
  className,
  children,
  ...props
}) => {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Get the lazy component
  const LazyComponent = (LazyMagicComponents as any)[component] || (LazyAnimationComponents as any)[component];

  useEffect(() => {
    // Preload component if requested or critical
    if (preload || critical) {
      const endTiming = ComponentPerformanceMonitor.startTiming(component);
      
      MagicUIPreloader.preloadComponent(component)
        .then(() => {
          setIsPreloaded(true);
          endTiming();
          onLoadComplete?.();
        })
        .catch((error) => {
          setLoadError(error);
          endTiming();
          onLoadError?.(error);
        });
    }
  }, [component, preload, critical, onLoadComplete, onLoadError]);

  // If there's a load error and no fallback, show error state
  if (loadError && !fallback) {
    return (
      <div className={cn('flex items-center justify-center p-2 text-red-500 text-sm', className)}>
        Erro ao carregar componente
      </div>
    );
  }

  // If component doesn't exist, show fallback
  if (!LazyComponent) {
    return fallback || (
      <div className={cn('flex items-center justify-center p-2', className)}>
        {children}
      </div>
    );
  }

  return (
    <MagicUIErrorBoundary componentName={component} fallback={fallback}>
      <Suspense 
        fallback={fallback || <LoadingFallback className={className} />}
      >
        <LazyComponent className={className} {...props}>
          {children}
        </LazyComponent>
      </Suspense>
    </MagicUIErrorBoundary>
  );
};

// Specific optimized components for common use cases
export const OptimizedSpinner: React.FC<Omit<OptimizedMagicUIProps, 'component'>> = (props) => (
  <OptimizedMagicUI component="MagicSpinner" critical {...props} />
);

export const OptimizedLoadingOverlay: React.FC<Omit<OptimizedMagicUIProps, 'component'>> = (props) => (
  <OptimizedMagicUI component="MagicLoadingOverlay" critical {...props} />
);

export const OptimizedProgressIndicator: React.FC<Omit<OptimizedMagicUIProps, 'component'>> = (props) => (
  <OptimizedMagicUI component="ProgressIndicator" preload {...props} />
);

export const OptimizedSuccessCelebration: React.FC<Omit<OptimizedMagicUIProps, 'component'>> = (props) => (
  <OptimizedMagicUI component="SuccessCelebration" {...props} />
);

export const OptimizedConfetti: React.FC<Omit<OptimizedMagicUIProps, 'component'>> = (props) => (
  <OptimizedMagicUI component="Confetti" {...props} />
);

// Hook for managing Magic UI component loading
export const useMagicUILoader = () => {
  const [stats, setStats] = useState(MagicUIPreloader.getStats());
  const [metrics, setMetrics] = useState(ComponentPerformanceMonitor.getMetrics());

  const refreshStats = () => {
    setStats(MagicUIPreloader.getStats());
    setMetrics(ComponentPerformanceMonitor.getMetrics());
  };

  const preloadCritical = async () => {
    await MagicUIPreloader.preloadCritical();
    refreshStats();
  };

  const preloadComponent = async (componentName: string) => {
    await MagicUIPreloader.preloadComponent(componentName);
    refreshStats();
  };

  return {
    stats,
    metrics,
    refreshStats,
    preloadCritical,
    preloadComponent,
    isPreloaded: (componentName: string) => MagicUIPreloader.isPreloaded(componentName)
  };
};

// Provider for Magic UI optimization context
interface MagicUIOptimizationContextType {
  preloadCritical: () => Promise<void>;
  preloadComponent: (componentName: string) => Promise<void>;
  isPreloaded: (componentName: string) => boolean;
  stats: ReturnType<typeof MagicUIPreloader.getStats>;
  metrics: ReturnType<typeof ComponentPerformanceMonitor.getMetrics>;
}

const MagicUIOptimizationContext = React.createContext<MagicUIOptimizationContextType | null>(null);

export const MagicUIOptimizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loaderHook = useMagicUILoader();

  // Preload critical components on mount
  useEffect(() => {
    loaderHook.preloadCritical();
  }, []);

  return (
    <MagicUIOptimizationContext.Provider value={loaderHook}>
      {children}
    </MagicUIOptimizationContext.Provider>
  );
};

export const useMagicUIOptimization = () => {
  const context = React.useContext(MagicUIOptimizationContext);
  if (!context) {
    throw new Error('useMagicUIOptimization must be used within MagicUIOptimizationProvider');
  }
  return context;
};

// Performance monitoring component
export const MagicUIPerformanceMonitor: React.FC<{ 
  enabled?: boolean;
  onMetricsUpdate?: (metrics: ReturnType<typeof ComponentPerformanceMonitor.getMetrics>) => void;
}> = ({ enabled = process.env.NODE_ENV === 'development', onMetricsUpdate }) => {
  const { metrics, refreshStats } = useMagicUILoader();

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      refreshStats();
      onMetricsUpdate?.(metrics);
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled, refreshStats, onMetricsUpdate, metrics]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      <div>Magic UI Stats:</div>
      <div>Preloaded: {metrics.loadTimes ? Object.keys(metrics.loadTimes).length : 0}</div>
      <div>Avg Load: {metrics.averageLoadTime.toFixed(1)}ms</div>
      <div>Errors: {metrics.errors ? Object.keys(metrics.errors).length : 0}</div>
    </div>
  );
};

export default OptimizedMagicUI;