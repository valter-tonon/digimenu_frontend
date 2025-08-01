/**
 * Intelligent API Response Caching System
 * Provides smart caching strategies with invalidation and persistence
 */

'use client';

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  strategy: 'memory' | 'localStorage' | 'indexedDB' | 'hybrid';
  compression: boolean;
  encryption: boolean;
  invalidationRules: InvalidationRule[];
}

export interface InvalidationRule {
  pattern: RegExp;
  triggers: string[]; // API endpoints that invalidate this cache
  conditions?: (data: any) => boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: number;
  newestEntry: number;
}

// Default cache configurations for different API types
export const DEFAULT_CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static data (menu, categories, store info)
  static: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 100,
    strategy: 'hybrid',
    compression: true,
    encryption: false,
    invalidationRules: [
      {
        pattern: /\/api\/(menu|categories|store)/,
        triggers: ['/api/admin/menu', '/api/admin/categories'],
      },
    ],
  },

  // Dynamic data (products, prices)
  dynamic: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 200,
    strategy: 'memory',
    compression: false,
    encryption: false,
    invalidationRules: [
      {
        pattern: /\/api\/products/,
        triggers: ['/api/admin/products', '/api/inventory'],
      },
    ],
  },

  // User data (profile, preferences)
  user: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 50,
    strategy: 'localStorage',
    compression: true,
    encryption: true,
    invalidationRules: [
      {
        pattern: /\/api\/user/,
        triggers: ['/api/user/profile', '/api/user/preferences'],
      },
    ],
  },

  // Temporary data (search results, filters)
  temporary: {
    ttl: 2 * 60 * 1000, // 2 minutes
    maxSize: 50,
    strategy: 'memory',
    compression: false,
    encryption: false,
    invalidationRules: [],
  },
};

// Cache storage interface
interface CacheStorage {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// Memory cache storage
class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
    }
    return entry as CacheEntry<T> || null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}

// LocalStorage cache storage
class LocalStorageCacheStorage implements CacheStorage {
  private prefix = 'api-cache:';

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const entry = JSON.parse(stored) as CacheEntry<T>;
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      // Update access stats
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
      
      return entry;
    } catch (error) {
      console.error('LocalStorage cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.error('LocalStorage cache set error:', error);
      // Handle quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        await this.evictOldest();
        // Retry
        localStorage.setItem(this.prefix + key, JSON.stringify(entry));
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('LocalStorage cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  private async evictOldest(): Promise<void> {
    const keys = await this.keys();
    if (keys.length === 0) return;

    let oldestKey = keys[0];
    let oldestTime = Infinity;

    for (const key of keys) {
      const entry = await this.get(key);
      if (entry && entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    await this.delete(oldestKey);
  }
}

// IndexedDB cache storage
class IndexedDBCacheStorage implements CacheStorage {
  private dbName = 'api-cache-db';
  private storeName = 'cache-entries';
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
          store.createIndex('lastAccessed', 'lastAccessed');
        }
      };
    });
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(key);
      const entry = await new Promise<CacheEntry<T> | null>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (entry) {
        // Update access stats
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        store.put(entry);
      }

      return entry;
    } catch (error) {
      console.error('IndexedDB cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB cache set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      return true;
    } catch (error) {
      console.error('IndexedDB cache delete error:', error);
      return false;
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
      console.error('IndexedDB cache clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise<string[]>((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB cache keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}

// Hybrid cache storage (memory + persistent)
class HybridCacheStorage implements CacheStorage {
  private memoryCache = new MemoryCacheStorage();
  private persistentCache: CacheStorage;

  constructor() {
    // Use IndexedDB if available, fallback to localStorage
    this.persistentCache = typeof indexedDB !== 'undefined' 
      ? new IndexedDBCacheStorage()
      : new LocalStorageCacheStorage();
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    // Try memory cache first
    let entry = await this.memoryCache.get<T>(key);
    
    if (!entry) {
      // Fallback to persistent cache
      entry = await this.persistentCache.get<T>(key);
      
      if (entry) {
        // Promote to memory cache
        await this.memoryCache.set(key, entry);
      }
    }
    
    return entry;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Store in both caches
    await Promise.all([
      this.memoryCache.set(key, entry),
      this.persistentCache.set(key, entry),
    ]);
  }

  async delete(key: string): Promise<boolean> {
    const results = await Promise.all([
      this.memoryCache.delete(key),
      this.persistentCache.delete(key),
    ]);
    
    return results.some(result => result);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.memoryCache.clear(),
      this.persistentCache.clear(),
    ]);
  }

  async keys(): Promise<string[]> {
    const [memoryKeys, persistentKeys] = await Promise.all([
      this.memoryCache.keys(),
      this.persistentCache.keys(),
    ]);
    
    return Array.from(new Set([...memoryKeys, ...persistentKeys]));
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}

// Main API cache manager
export class ApiCacheManager {
  private storages = new Map<string, CacheStorage>();
  private configs = new Map<string, CacheConfig>();
  private stats = new Map<string, { hits: number; misses: number; evictions: number }>();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default cache configurations
   */
  private initializeDefaultConfigs(): void {
    Object.entries(DEFAULT_CACHE_CONFIGS).forEach(([type, config]) => {
      this.setConfig(type, config);
    });
  }

  /**
   * Set cache configuration for a type
   */
  setConfig(type: string, config: CacheConfig): void {
    this.configs.set(type, config);
    
    // Initialize storage based on strategy
    let storage: CacheStorage;
    switch (config.strategy) {
      case 'memory':
        storage = new MemoryCacheStorage();
        break;
      case 'localStorage':
        storage = new LocalStorageCacheStorage();
        break;
      case 'indexedDB':
        storage = new IndexedDBCacheStorage();
        break;
      case 'hybrid':
        storage = new HybridCacheStorage();
        break;
      default:
        storage = new MemoryCacheStorage();
    }
    
    this.storages.set(type, storage);
    this.stats.set(type, { hits: 0, misses: 0, evictions: 0 });
  }

  /**
   * Get cached data
   */
  async get<T>(type: string, key: string): Promise<T | null> {
    const storage = this.storages.get(type);
    const config = this.configs.get(type);
    const stats = this.stats.get(type);
    
    if (!storage || !config || !stats) {
      return null;
    }

    try {
      const entry = await storage.get<T>(key);
      
      if (!entry) {
        stats.misses++;
        return null;
      }

      // Check if entry is expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        await storage.delete(key);
        stats.misses++;
        return null;
      }

      stats.hits++;
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      stats.misses++;
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(type: string, key: string, data: T, options?: {
    ttl?: number;
    etag?: string;
    lastModified?: string;
  }): Promise<void> {
    const storage = this.storages.get(type);
    const config = this.configs.get(type);
    
    if (!storage || !config) {
      return;
    }

    try {
      // Check cache size and evict if necessary
      await this.evictIfNecessary(type);

      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl: options?.ttl || config.ttl,
        etag: options?.etag,
        lastModified: options?.lastModified,
        size: this.calculateSize(data),
        accessCount: 1,
        lastAccessed: Date.now(),
      };

      // Compress data if configured
      if (config.compression) {
        entry.data = await this.compress(data);
      }

      // Encrypt data if configured
      if (config.encryption) {
        entry.data = await this.encrypt(entry.data);
      }

      await storage.set(key, entry);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(type: string, key: string): Promise<boolean> {
    const storage = this.storages.get(type);
    if (!storage) return false;

    return await storage.delete(key);
  }

  /**
   * Clear cache for a type
   */
  async clear(type: string): Promise<void> {
    const storage = this.storages.get(type);
    if (!storage) return;

    await storage.clear();
    
    // Reset stats
    const stats = this.stats.get(type);
    if (stats) {
      stats.hits = 0;
      stats.misses = 0;
      stats.evictions = 0;
    }
  }

  /**
   * Invalidate cache based on rules
   */
  async invalidate(triggerEndpoint: string): Promise<void> {
    for (const [type, config] of this.configs.entries()) {
      for (const rule of config.invalidationRules) {
        if (rule.triggers.includes(triggerEndpoint)) {
          const storage = this.storages.get(type);
          if (!storage) continue;

          const keys = await storage.keys();
          for (const key of keys) {
            if (rule.pattern.test(key)) {
              await storage.delete(key);
            }
          }
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(type: string): Promise<CacheStats | null> {
    const storage = this.storages.get(type);
    const stats = this.stats.get(type);
    
    if (!storage || !stats) return null;

    const keys = await storage.keys();
    const entries = await Promise.all(
      keys.map(key => storage.get(key))
    );
    
    const validEntries = entries.filter(entry => entry !== null) as CacheEntry[];
    
    const totalHits = stats.hits;
    const totalMisses = stats.misses;
    const totalRequests = totalHits + totalMisses;
    
    return {
      totalEntries: validEntries.length,
      totalSize: validEntries.reduce((sum, entry) => sum + entry.size, 0),
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? totalMisses / totalRequests : 0,
      evictionCount: stats.evictions,
      oldestEntry: Math.min(...validEntries.map(entry => entry.timestamp)),
      newestEntry: Math.max(...validEntries.map(entry => entry.timestamp)),
    };
  }

  /**
   * Evict entries if cache is full
   */
  private async evictIfNecessary(type: string): Promise<void> {
    const storage = this.storages.get(type);
    const config = this.configs.get(type);
    const stats = this.stats.get(type);
    
    if (!storage || !config || !stats) return;

    const currentSize = await storage.size();
    if (currentSize < config.maxSize) return;

    // Evict least recently used entries
    const keys = await storage.keys();
    const entries = await Promise.all(
      keys.map(async key => ({ key, entry: await storage.get(key) }))
    );

    const validEntries = entries
      .filter(({ entry }) => entry !== null)
      .sort((a, b) => a.entry!.lastAccessed - b.entry!.lastAccessed);

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(validEntries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      await storage.delete(validEntries[i].key);
      stats.evictions++;
    }
  }

  /**
   * Calculate data size (rough estimate)
   */
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  /**
   * Compress data (placeholder - implement actual compression)
   */
  private async compress<T>(data: T): Promise<T> {
    // TODO: Implement actual compression (e.g., using pako)
    return data;
  }

  /**
   * Encrypt data (placeholder - implement actual encryption)
   */
  private async encrypt<T>(data: T): Promise<T> {
    // TODO: Implement actual encryption (e.g., using Web Crypto API)
    return data;
  }
}

// Export singleton instance
export const apiCache = new ApiCacheManager();

export default ApiCacheManager;