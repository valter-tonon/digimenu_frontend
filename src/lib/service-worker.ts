/**
 * Service Worker Registration and Management
 * Handles SW lifecycle, caching strategies, and offline functionality
 */

'use client';

// Service worker configuration
const SW_CONFIG = {
  swUrl: '/sw.js',
  scope: '/',
  updateCheckInterval: 60000, // 1 minute
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Cache management interface
export interface CacheStatus {
  [cacheName: string]: {
    size: number;
    urls: string[];
  };
}

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

// Service worker manager class
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeListeners();
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Check if service workers are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  /**
   * Register service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('[SW] Service workers not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        SW_CONFIG.swUrl,
        { scope: SW_CONFIG.scope }
      );

      console.log('[SW] Service worker registered successfully');
      
      // Set up update checking
      this.setupUpdateChecking();
      
      // Emit registration event
      this.emit('registered', this.registration);
      
      return this.registration;
    } catch (error) {
      console.error('[SW] Service worker registration failed:', error);
      this.emit('error', error);
      return null;
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      
      if (result) {
        this.registration = null;
        this.clearUpdateChecking();
        this.emit('unregistered');
        console.log('[SW] Service worker unregistered successfully');
      }
      
      return result;
    } catch (error) {
      console.error('[SW] Service worker unregistration failed:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Update service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    try {
      await this.registration.update();
      this.emit('updated');
      console.log('[SW] Service worker updated');
    } catch (error) {
      console.error('[SW] Service worker update failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    // Send skip waiting message
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Wait for activation
    await new Promise<void>((resolve) => {
      const handleStateChange = () => {
        if (this.registration?.waiting?.state === 'activated') {
          this.registration.waiting.removeEventListener('statechange', handleStateChange);
          resolve();
        }
      };
      
      this.registration.waiting.addEventListener('statechange', handleStateChange);
    });

    // Reload page to use new service worker
    window.location.reload();
  }

  /**
   * Get current service worker state
   */
  getState(): ServiceWorkerState {
    return {
      isSupported: this.isSupported(),
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      isUpdateAvailable: !!this.registration?.waiting,
      registration: this.registration,
      error: null,
    };
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName?: string): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('Service worker not active');
    }

    this.registration.active.postMessage({
      type: 'CLEAR_CACHE',
      payload: { cacheName },
    });

    this.emit('cacheCleared', cacheName);
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('Service worker not active');
    }

    this.registration.active.postMessage({
      type: 'CACHE_URLS',
      payload: { urls },
    });

    this.emit('urlsCached', urls);
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<CacheStatus> {
    if (!this.registration?.active) {
      throw new Error('Service worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Cache status request timeout'));
      }, 5000);
    });
  }

  /**
   * Check if app is running offline
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Initialize service worker event listeners
   */
  private initializeListeners(): void {
    if (!this.isSupported()) return;

    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.emit('controllerchange');
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.emit('message', event.data);
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.emit('online');
    });

    window.addEventListener('offline', () => {
      this.emit('offline');
    });
  }

  /**
   * Set up automatic update checking
   */
  private setupUpdateChecking(): void {
    if (!this.registration) return;

    // Check for updates immediately
    this.checkForUpdates();

    // Set up periodic update checking
    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates();
    }, SW_CONFIG.updateCheckInterval);

    // Listen for registration updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.emit('updateAvailable', newWorker);
          }
        });
      }
    });
  }

  /**
   * Clear update checking timer
   */
  private clearUpdateChecking(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
  }

  /**
   * Check for service worker updates
   */
  private async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error('[SW] Update check failed:', error);
    }
  }
}

// React hook for service worker management
import React from 'react';

export const useServiceWorker = () => {
  const [state, setState] = React.useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isActive: false,
    isUpdateAvailable: false,
    registration: null,
    error: null,
  });

  const [isOnline, setIsOnline] = React.useState(true);
  const [cacheStatus, setCacheStatus] = React.useState<CacheStatus>({});

  const swManager = React.useMemo(() => ServiceWorkerManager.getInstance(), []);

  React.useEffect(() => {
    // Initialize state
    setState(swManager.getState());
    setIsOnline(!swManager.isOffline());

    // Set up event listeners
    const handleRegistered = () => {
      setState(swManager.getState());
    };

    const handleUpdateAvailable = () => {
      setState(swManager.getState());
    };

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleError = (error: any) => {
      setState(prev => ({ ...prev, error: error.message }));
    };

    swManager.on('registered', handleRegistered);
    swManager.on('updateAvailable', handleUpdateAvailable);
    swManager.on('online', handleOnline);
    swManager.on('offline', handleOffline);
    swManager.on('error', handleError);

    // Register service worker
    swManager.register();

    // Get initial cache status
    swManager.getCacheStatus()
      .then(setCacheStatus)
      .catch(console.error);

    return () => {
      swManager.off('registered', handleRegistered);
      swManager.off('updateAvailable', handleUpdateAvailable);
      swManager.off('online', handleOnline);
      swManager.off('offline', handleOffline);
      swManager.off('error', handleError);
    };
  }, [swManager]);

  const register = React.useCallback(() => {
    return swManager.register();
  }, [swManager]);

  const unregister = React.useCallback(() => {
    return swManager.unregister();
  }, [swManager]);

  const update = React.useCallback(() => {
    return swManager.update();
  }, [swManager]);

  const skipWaiting = React.useCallback(() => {
    return swManager.skipWaiting();
  }, [swManager]);

  const clearCache = React.useCallback((cacheName?: string) => {
    return swManager.clearCache(cacheName);
  }, [swManager]);

  const cacheUrls = React.useCallback((urls: string[]) => {
    return swManager.cacheUrls(urls);
  }, [swManager]);

  const refreshCacheStatus = React.useCallback(async () => {
    try {
      const status = await swManager.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('Failed to refresh cache status:', error);
    }
  }, [swManager]);

  return {
    state,
    isOnline,
    cacheStatus,
    register,
    unregister,
    update,
    skipWaiting,
    clearCache,
    cacheUrls,
    refreshCacheStatus,
  };
};

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

export default ServiceWorkerManager;