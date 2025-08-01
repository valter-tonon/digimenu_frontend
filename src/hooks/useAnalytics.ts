/**
 * Analytics Hook for Delivery Flow Enhancement
 * Provides easy access to analytics tracking functionality
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  analyticsService, 
  DELIVERY_FLOW_EVENTS, 
  CONVERSION_FUNNEL_STEPS,
  type AnalyticsEvent,
  type ConversionFunnelStep,
  type PerformanceMetric
} from '@/services/analytics';
import { useUserTracking } from '@/hooks/useUserTracking';

export interface UseAnalyticsReturn {
  // Event tracking
  trackEvent: (name: string, category: string, properties?: Record<string, any>) => void;
  trackDeliveryFlowEvent: (eventName: string, properties?: Record<string, any>) => void;
  
  // Conversion funnel tracking
  trackFunnelStep: (step: keyof typeof CONVERSION_FUNNEL_STEPS, metadata?: Record<string, any>) => void;
  getFunnelData: () => ConversionFunnelStep[];
  
  // Performance tracking
  trackPerformanceMetric: (name: string, value: number, unit?: string) => void;
  trackPageLoadTime: () => void;
  trackCoreWebVitals: () => void;
  
  // Error tracking
  trackError: (error: Error, context?: Record<string, any>) => void;
  
  // User identification
  identifyUser: (userId: string) => void;
  
  // Delivery flow specific events
  events: typeof DELIVERY_FLOW_EVENTS;
  funnelSteps: typeof CONVERSION_FUNNEL_STEPS;
  
  // Data access
  getPerformanceMetrics: () => PerformanceMetric[];
  clearData: () => void;
  flush: () => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { userId, initializeTracking } = useUserTracking();
  const pageLoadStartTime = useRef<number>(Date.now());
  const hasTrackedPageLoad = useRef<boolean>(false);

  // Initialize user tracking and analytics
  useEffect(() => {
    const trackingUserId = initializeTracking();
    if (trackingUserId) {
      analyticsService.setUserId(trackingUserId);
    }
  }, [initializeTracking]);

  // Track Core Web Vitals on mount
  useEffect(() => {
    analyticsService.trackCoreWebVitals();
  }, []);

  // Track page load time
  const trackPageLoadTime = useCallback(() => {
    if (hasTrackedPageLoad.current) return;
    
    const loadTime = Date.now() - pageLoadStartTime.current;
    analyticsService.trackPerformanceMetric('page_load_time', loadTime);
    analyticsService.trackDeliveryFlowEvent(DELIVERY_FLOW_EVENTS.PAGE_LOAD_TIME, {
      load_time: loadTime,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined
    });
    
    hasTrackedPageLoad.current = true;
  }, []);

  // Track page load when component mounts and page is loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        trackPageLoadTime();
      } else {
        window.addEventListener('load', trackPageLoadTime);
        return () => window.removeEventListener('load', trackPageLoadTime);
      }
    }
  }, [trackPageLoadTime]);

  // Event tracking functions
  const trackEvent = useCallback((name: string, category: string, properties?: Record<string, any>) => {
    analyticsService.trackEvent(name, category, properties);
  }, []);

  const trackDeliveryFlowEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    analyticsService.trackDeliveryFlowEvent(eventName, properties);
  }, []);

  // Funnel tracking
  const trackFunnelStep = useCallback((step: keyof typeof CONVERSION_FUNNEL_STEPS, metadata?: Record<string, any>) => {
    const funnelStep = CONVERSION_FUNNEL_STEPS[step];
    analyticsService.trackFunnelStep(funnelStep.step, funnelStep.number, metadata);
  }, []);

  const getFunnelData = useCallback(() => {
    return analyticsService.getFunnelData();
  }, []);

  // Performance tracking
  const trackPerformanceMetric = useCallback((name: string, value: number, unit: string = 'ms') => {
    analyticsService.trackPerformanceMetric(name, value, unit);
  }, []);

  const trackCoreWebVitals = useCallback(() => {
    analyticsService.trackCoreWebVitals();
  }, []);

  // Error tracking
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    analyticsService.trackError(error, {
      ...context,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      timestamp: new Date().toISOString()
    });
  }, []);

  // User identification
  const identifyUser = useCallback((userId: string) => {
    analyticsService.setUserId(userId);
  }, []);

  // Data access functions
  const getPerformanceMetrics = useCallback(() => {
    return analyticsService.getPerformanceMetrics();
  }, []);

  const clearData = useCallback(() => {
    analyticsService.clearData();
  }, []);

  const flush = useCallback(() => {
    return analyticsService.flush();
  }, []);

  return {
    // Event tracking
    trackEvent,
    trackDeliveryFlowEvent,
    
    // Conversion funnel tracking
    trackFunnelStep,
    getFunnelData,
    
    // Performance tracking
    trackPerformanceMetric,
    trackPageLoadTime,
    trackCoreWebVitals,
    
    // Error tracking
    trackError,
    
    // User identification
    identifyUser,
    
    // Constants
    events: DELIVERY_FLOW_EVENTS,
    funnelSteps: CONVERSION_FUNNEL_STEPS,
    
    // Data access
    getPerformanceMetrics,
    clearData,
    flush
  };
}

// Specialized hooks for specific use cases

/**
 * Hook for tracking delivery flow events with automatic funnel progression
 */
export function useDeliveryFlowTracking() {
  const analytics = useAnalytics();

  const trackMenuLoaded = useCallback((productCount: number) => {
    analytics.trackFunnelStep('MENU_VIEW', { product_count: productCount });
    analytics.trackDeliveryFlowEvent(analytics.events.MENU_LOADED, { product_count: productCount });
  }, [analytics]);

  const trackProductViewed = useCallback((productId: string, productName: string, category?: string) => {
    analytics.trackDeliveryFlowEvent(analytics.events.PRODUCT_VIEWED, {
      product_id: productId,
      product_name: productName,
      category
    });
  }, [analytics]);

  const trackProductAddedToCart = useCallback((productId: string, productName: string, quantity: number, price: number) => {
    analytics.trackFunnelStep('PRODUCT_ADD', { 
      product_id: productId,
      product_name: productName,
      quantity,
      price
    });
    analytics.trackDeliveryFlowEvent(analytics.events.PRODUCT_ADDED_TO_CART, {
      product_id: productId,
      product_name: productName,
      quantity,
      price,
      cart_value: price * quantity
    });
  }, [analytics]);

  const trackCartViewed = useCallback((itemCount: number, totalValue: number) => {
    analytics.trackFunnelStep('CART_VIEW', { item_count: itemCount, total_value: totalValue });
    analytics.trackDeliveryFlowEvent(analytics.events.CART_VIEWED, {
      item_count: itemCount,
      total_value: totalValue
    });
  }, [analytics]);

  const trackCheckoutStarted = useCallback((totalValue: number, itemCount: number) => {
    analytics.trackFunnelStep('CHECKOUT_START', { total_value: totalValue, item_count: itemCount });
    analytics.trackDeliveryFlowEvent(analytics.events.CHECKOUT_STARTED, {
      total_value: totalValue,
      item_count: itemCount
    });
  }, [analytics]);

  const trackCustomerDataStep = useCallback((isNewCustomer: boolean) => {
    analytics.trackFunnelStep('CUSTOMER_DATA', { is_new_customer: isNewCustomer });
    analytics.trackDeliveryFlowEvent(analytics.events.CUSTOMER_DATA_STEP, {
      is_new_customer: isNewCustomer
    });
  }, [analytics]);

  const trackAddressStep = useCallback((addressType: 'new' | 'saved', cepProvided?: string) => {
    analytics.trackFunnelStep('ADDRESS_INPUT', { address_type: addressType, cep_provided: cepProvided });
    analytics.trackDeliveryFlowEvent(analytics.events.ADDRESS_STEP, {
      address_type: addressType,
      cep_provided: cepProvided
    });
  }, [analytics]);

  const trackPaymentStep = useCallback((paymentMethod: string) => {
    analytics.trackFunnelStep('PAYMENT_METHOD', { payment_method: paymentMethod });
    analytics.trackDeliveryFlowEvent(analytics.events.PAYMENT_STEP, {
      payment_method: paymentMethod
    });
  }, [analytics]);

  const trackOrderConfirmed = useCallback((orderId: string, totalValue: number, paymentMethod: string) => {
    analytics.trackFunnelStep('ORDER_COMPLETE', { 
      order_id: orderId,
      total_value: totalValue,
      payment_method: paymentMethod
    });
    analytics.trackDeliveryFlowEvent(analytics.events.ORDER_CONFIRMED, {
      order_id: orderId,
      total_value: totalValue,
      payment_method: paymentMethod
    });
  }, [analytics]);

  const trackCheckoutError = useCallback((step: string, errorType: string, errorMessage: string) => {
    analytics.trackDeliveryFlowEvent(analytics.events.CHECKOUT_ERROR, {
      step,
      error_type: errorType,
      error_message: errorMessage
    });
  }, [analytics]);

  const trackCartAbandoned = useCallback((itemCount: number, totalValue: number, timeSpent: number) => {
    analytics.trackDeliveryFlowEvent(analytics.events.CART_ABANDONED, {
      item_count: itemCount,
      total_value: totalValue,
      time_spent: timeSpent
    });
  }, [analytics]);

  return {
    trackMenuLoaded,
    trackProductViewed,
    trackProductAddedToCart,
    trackCartViewed,
    trackCheckoutStarted,
    trackCustomerDataStep,
    trackAddressStep,
    trackPaymentStep,
    trackOrderConfirmed,
    trackCheckoutError,
    trackCartAbandoned
  };
}

/**
 * Hook for tracking performance metrics
 */
export function usePerformanceTracking() {
  const analytics = useAnalytics();

  const trackComponentRenderTime = useCallback((componentName: string, renderTime: number) => {
    analytics.trackPerformanceMetric(`${componentName}_render_time`, renderTime);
  }, [analytics]);

  const trackApiCallTime = useCallback((endpoint: string, duration: number, success: boolean) => {
    analytics.trackPerformanceMetric(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}_duration`, duration);
    analytics.trackEvent('api_call', 'performance', {
      endpoint,
      duration,
      success
    });
  }, [analytics]);

  const trackFormValidationTime = useCallback((formName: string, validationTime: number) => {
    analytics.trackPerformanceMetric(`${formName}_validation_time`, validationTime);
  }, [analytics]);

  const trackImageLoadTime = useCallback((imageUrl: string, loadTime: number) => {
    analytics.trackPerformanceMetric('image_load_time', loadTime);
    analytics.trackEvent('image_loaded', 'performance', {
      image_url: imageUrl,
      load_time: loadTime
    });
  }, [analytics]);

  return {
    trackComponentRenderTime,
    trackApiCallTime,
    trackFormValidationTime,
    trackImageLoadTime
  };
}

/**
 * Hook for tracking errors with context
 */
export function useErrorTracking() {
  const analytics = useAnalytics();

  const trackComponentError = useCallback((componentName: string, error: Error, props?: any) => {
    analytics.trackError(error, {
      component: componentName,
      props: JSON.stringify(props),
      error_boundary: 'component'
    });
  }, [analytics]);

  const trackApiError = useCallback((endpoint: string, error: Error, requestData?: any) => {
    analytics.trackError(error, {
      endpoint,
      request_data: JSON.stringify(requestData),
      error_boundary: 'api'
    });
  }, [analytics]);

  const trackFormError = useCallback((formName: string, fieldName: string, error: Error, formData?: any) => {
    analytics.trackError(error, {
      form: formName,
      field: fieldName,
      form_data: JSON.stringify(formData),
      error_boundary: 'form'
    });
  }, [analytics]);

  const trackPaymentError = useCallback((paymentMethod: string, error: Error, orderData?: any) => {
    analytics.trackError(error, {
      payment_method: paymentMethod,
      order_data: JSON.stringify(orderData),
      error_boundary: 'payment'
    });
  }, [analytics]);

  return {
    trackComponentError,
    trackApiError,
    trackFormError,
    trackPaymentError
  };
}