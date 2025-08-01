/**
 * State Persistence System
 * Handles state persistence across browser sessions with intelligent sync
 */

'use client';

// Persistence configuration
export interface PersistenceConfig {
  key: string;
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
  version: number;
  migrations?: Record<number, (data: any) => any>;
  encryption: boolean;
  compression: boolean;
  syncAcrossTabs: boolean;
  debounceMs: number;
  maxSize: number; // in bytes
  ttl?: number; // time to live in milliseconds
}

export interface PersistedState<T = any> {
  data: T;
  version: number;
  timestamp: number;
  checksum?: string;
}

// Default configurations for different state types
export const DEFAULT_PERSISTENCE_CONFIGS: Record<string, PersistenceConfig> = {
  cart: {
    key: 'delivery-cart',
    storage: 'localStorage',
    version: 1,
    encryption: false,
    compression: true,
    syncAcrossTabs: true,
    debounceMs: 500,
    maxSize: 50 * 1024, // 50KB
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  userPreferences: {
    key: 'user-preferences',
    storage: 'localStorage',
    version: 1,
    encryption: true,
    compression: false,
    syncAcrossTabs: true,
    debounceMs: 1000,
    maxSize: 10 * 1024, // 10KB
  },
  
  checkoutForm: {
    key: 'checkout-form',
    storage: 'sessionStorage',
    version: 1,
    encryption: true,
    compression: false,
    syncAcrossTabs: false,
    debounceMs: 300,
    maxSize: 20 * 1024, // 20KB
    ttl: 60 * 60 * 1000, // 1 hour
  },
  
  uiState: {
    key: 'ui-state',
    storage: 'sessionStorage',
    version: 1,
    encryption: false,
    compression: false,
    syncAcrossTabs: true,
    debounceMs: 100,
    maxSize: 5 * 1024, // 5KB
  },
  
  searchHistory: {
    key: 'search-history',
    storage: 'localStorage',
    version: 1,
    encryption: false,
    compression: true,
    syncAcrossTabs: false,
    debounceMs: 1000,
    maxSize: 15 * 1024, // 15KB
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};

// Storage interface
interface PersistentStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// LocalStorage adapter
class LocalStorageAdapter implements PersistentStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('LocalStorage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('LocalStorage setItem error:', error);
      if (error instanceof DOMException && error.code === 22) {
        // Quota exceeded - clear old data
        await this.clearOldData();
        localStorage.setItem(key, value);
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage removeItem error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }

  private async clearOldData(): Promise<void> {
    const keys = Object.keys(localStorage);
    const entries = keys.map(key => ({
      key,
      timestamp: this.getTimestamp(key),
    })).filter(entry => entry.timestamp > 0);

    // Sort by timestamp and remove oldest 25%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  private getTimestamp(key: string): number {
    try {
      const value = localStorage.getItem(key);
      if (!value) return 0;
      
      const parsed = JSON.parse(value);
      return parsed.timestamp || 0;
    } catch {
      return 0;
    }
  }
}

// SessionStorage adapter
class SessionStorageAdapter implements PersistentStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('SessionStorage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('SessionStorage setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('SessionStorage removeItem error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('SessionStorage clear error:', error);
    }
  }
}

// IndexedDB adapter
class IndexedDBAdapter implements PersistentStorage {
  private dbName = 'state-persistence-db';
  private storeName = 'persisted-states';
  private version = 1;

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key,
          value,
          timestamp: Date.now(),
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB removeItem error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }
}

// State persistence manager
export class StatePersistenceManager {
  private storages = new Map<string, PersistentStorage>();
  private configs = new Map<string, PersistenceConfig>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private listeners = new Map<string, Function[]>();

  constructor() {
    this.initializeDefaultConfigs();
    this.setupTabSync();
  }

  /**
   * Initialize default configurations
   */
  private initializeDefaultConfigs(): void {
    Object.entries(DEFAULT_PERSISTENCE_CONFIGS).forEach(([type, config]) => {
      this.setConfig(type, config);
    });
  }

  /**
   * Set persistence configuration
   */
  setConfig(type: string, config: PersistenceConfig): void {
    this.configs.set(type, config);
    
    // Initialize storage adapter
    let storage: PersistentStorage;
    switch (config.storage) {
      case 'localStorage':
        storage = new LocalStorageAdapter();
        break;
      case 'sessionStorage':
        storage = new SessionStorageAdapter();
        break;
      case 'indexedDB':
        storage = new IndexedDBAdapter();
        break;
      default:
        storage = new LocalStorageAdapter();
    }
    
    this.storages.set(type, storage);
  }

  /**
   * Persist state
   */
  async persist<T>(type: string, data: T): Promise<void> {
    const config = this.configs.get(type);
    const storage = this.storages.get(type);
    
    if (!config || !storage) {
      console.warn(`No configuration found for state type: ${type}`);
      return;
    }

    // Debounce persistence
    if (config.debounceMs > 0) {
      const existingTimer = this.debounceTimers.get(type);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.doPersist(type, data, config, storage);
        this.debounceTimers.delete(type);
      }, config.debounceMs);

      this.debounceTimers.set(type, timer);
    } else {
      await this.doPersist(type, data, config, storage);
    }
  }

  /**
   * Actually persist the data
   */
  private async doPersist<T>(
    type: string,
    data: T,
    config: PersistenceConfig,
    storage: PersistentStorage
  ): Promise<void> {
    try {
      let processedData = data;

      // Compress data if configured
      if (config.compression) {
        processedData = await this.compress(processedData);
      }

      // Encrypt data if configured
      if (config.encryption) {
        processedData = await this.encrypt(processedData);
      }

      const persistedState: PersistedState<T> = {
        data: processedData,
        version: config.version,
        timestamp: Date.now(),
        checksum: await this.generateChecksum(processedData),
      };

      const serialized = JSON.stringify(persistedState);

      // Check size limit
      if (serialized.length * 2 > config.maxSize) {
        console.warn(`State size exceeds limit for type: ${type}`);
        return;
      }

      await storage.setItem(config.key, serialized);

      // Notify listeners
      this.emit(type, 'persisted', data);

      // Broadcast to other tabs if configured
      if (config.syncAcrossTabs && typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(`state-sync-${type}`);
        channel.postMessage({
          type: 'state-updated',
          data: persistedState,
        });
        channel.close();
      }
    } catch (error) {
      console.error(`Failed to persist state for type: ${type}`, error);
    }
  }

  /**
   * Restore state
   */
  async restore<T>(type: string): Promise<T | null> {
    const config = this.configs.get(type);
    const storage = this.storages.get(type);
    
    if (!config || !storage) {
      console.warn(`No configuration found for state type: ${type}`);
      return null;
    }

    try {
      const serialized = await storage.getItem(config.key);
      if (!serialized) {
        return null;
      }

      const persistedState: PersistedState<T> = JSON.parse(serialized);

      // Check TTL
      if (config.ttl && Date.now() - persistedState.timestamp > config.ttl) {
        await storage.removeItem(config.key);
        return null;
      }

      // Verify checksum
      if (persistedState.checksum) {
        const expectedChecksum = await this.generateChecksum(persistedState.data);
        if (expectedChecksum !== persistedState.checksum) {
          console.warn(`Checksum mismatch for state type: ${type}`);
          await storage.removeItem(config.key);
          return null;
        }
      }

      // Handle version migrations
      let data = persistedState.data;
      if (persistedState.version < config.version && config.migrations) {
        for (let v = persistedState.version; v < config.version; v++) {
          const migration = config.migrations[v + 1];
          if (migration) {
            data = migration(data);
          }
        }
      }

      // Decrypt data if configured
      if (config.encryption) {
        data = await this.decrypt(data);
      }

      // Decompress data if configured
      if (config.compression) {
        data = await this.decompress(data);
      }

      this.emit(type, 'restored', data);
      return data;
    } catch (error) {
      console.error(`Failed to restore state for type: ${type}`, error);
      return null;
    }
  }

  /**
   * Clear persisted state
   */
  async clear(type: string): Promise<void> {
    const config = this.configs.get(type);
    const storage = this.storages.get(type);
    
    if (!config || !storage) {
      return;
    }

    await storage.removeItem(config.key);
    this.emit(type, 'cleared');
  }

  /**
   * Clear all persisted states
   */
  async clearAll(): Promise<void> {
    const promises = Array.from(this.configs.keys()).map(type => this.clear(type));
    await Promise.all(promises);
  }

  /**
   * Add event listener
   */
  on(type: string, event: string, callback: Function): void {
    const key = `${type}:${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(type: string, event: string, callback: Function): void {
    const key = `${type}:${event}`;
    const callbacks = this.listeners.get(key);
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
  private emit(type: string, event: string, data?: any): void {
    const key = `${type}:${event}`;
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Setup tab synchronization
   */
  private setupTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    this.configs.forEach((config, type) => {
      if (!config.syncAcrossTabs) return;

      const channel = new BroadcastChannel(`state-sync-${type}`);
      channel.addEventListener('message', (event) => {
        if (event.data.type === 'state-updated') {
          this.emit(type, 'synced', event.data.data.data);
        }
      });
    });
  }

  /**
   * Generate checksum for data integrity
   */
  private async generateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(str);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Compress data (placeholder)
   */
  private async compress<T>(data: T): Promise<T> {
    // TODO: Implement actual compression
    return data;
  }

  /**
   * Decompress data (placeholder)
   */
  private async decompress<T>(data: T): Promise<T> {
    // TODO: Implement actual decompression
    return data;
  }

  /**
   * Encrypt data (placeholder)
   */
  private async encrypt<T>(data: T): Promise<T> {
    // TODO: Implement actual encryption using Web Crypto API
    return data;
  }

  /**
   * Decrypt data (placeholder)
   */
  private async decrypt<T>(data: T): Promise<T> {
    // TODO: Implement actual decryption using Web Crypto API
    return data;
  }
}

// React hook for state persistence
import React from 'react';

export const useStatePersistence = <T>(type: string, initialState: T) => {
  const [state, setState] = React.useState<T>(initialState);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const manager = React.useMemo(() => new StatePersistenceManager(), []);

  // Restore state on mount
  React.useEffect(() => {
    const restoreState = async () => {
      try {
        setIsLoading(true);
        const restored = await manager.restore<T>(type);
        if (restored !== null) {
          setState(restored);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to restore state');
      } finally {
        setIsLoading(false);
      }
    };

    restoreState();
  }, [manager, type]);

  // Persist state when it changes
  React.useEffect(() => {
    if (!isLoading) {
      manager.persist(type, state).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to persist state');
      });
    }
  }, [manager, type, state, isLoading]);

  // Listen for sync events
  React.useEffect(() => {
    const handleSync = (syncedData: T) => {
      setState(syncedData);
    };

    manager.on(type, 'synced', handleSync);
    
    return () => {
      manager.off(type, 'synced', handleSync);
    };
  }, [manager, type]);

  const clearState = React.useCallback(async () => {
    try {
      await manager.clear(type);
      setState(initialState);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear state');
    }
  }, [manager, type, initialState]);

  return {
    state,
    setState,
    isLoading,
    error,
    clearState,
  };
};

// Export singleton instance
export const statePersistence = new StatePersistenceManager();

export default StatePersistenceManager;