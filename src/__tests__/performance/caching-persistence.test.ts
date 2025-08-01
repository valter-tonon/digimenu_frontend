/**
 * Performance Tests for Caching and State Persistence
 * Tests caching strategies, state persistence, and offline functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiCacheManager, apiCache } from '@/lib/api-cache';
import { StatePersistenceManager, statePersistence } from '@/lib/state-persistence';
import { ServiceWorkerManager } from '@/lib/service-worker';

// Mock browser APIs
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockLocalStorage.store.delete(key);
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store.clear();
  }),
  get length() {
    return mockLocalStorage.store.size;
  },
  key: vi.fn((index: number) => {
    const keys = Array.from(mockLocalStorage.store.keys());
    return keys[index] || null;
  }),
};

const mockSessionStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockSessionStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage.store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockSessionStorage.store.delete(key);
  }),
  clear: vi.fn(() => {
    mockSessionStorage.store.clear();
  }),
  get length() {
    return mockSessionStorage.store.size;
  },
  key: vi.fn((index: number) => {
    const keys = Array.from(mockSessionStorage.store.keys());
    return keys[index] || null;
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {
      objectStoreNames: { contains: vi.fn(() => false) },
      createObjectStore: vi.fn(() => ({
        createIndex: vi.fn(),
      })),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
          put: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
          delete: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
          clear: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
          getAllKeys: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
        })),
      })),
    },
    onsuccess: vi.fn(),
    onerror: vi.fn(),
    onupgradeneeded: vi.fn(),
  })),
};

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: any) => void) | null = null;
  
  constructor(name: string) {
    this.name = name;
  }
  
  postMessage(data: any) {
    // Simulate message to other tabs
  }
  
  close() {
    // Cleanup
  }
  
  addEventListener(type: string, listener: (event: any) => void) {
    if (type === 'message') {
      this.onmessage = listener;
    }
  }
}

Object.defineProperty(global, 'BroadcastChannel', {
  value: MockBroadcastChannel,
  writable: true,
});

describe('API Cache Manager Performance', () => {
  let cacheManager: ApiCacheManager;

  beforeEach(() => {
    cacheManager = new ApiCacheManager();
    mockLocalStorage.store.clear();
    mockSessionStorage.store.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cache Performance', () => {
    it('should cache and retrieve data efficiently', async () => {
      const testData = { id: 1, name: 'Test Product', price: 10.99 };
      const cacheKey = '/api/products/1';
      
      const startSet = performance.now();
      await cacheManager.set('static', cacheKey, testData);
      const setTime = performance.now() - startSet;
      
      const startGet = performance.now();
      const retrieved = await cacheManager.get('static', cacheKey);
      const getTime = performance.now() - startGet;
      
      expect(retrieved).toEqual(testData);
      expect(setTime).toBeLessThan(10); // Should be very fast
      expect(getTime).toBeLessThan(5); // Retrieval should be even faster
    });

    it('should handle cache misses efficiently', async () => {
      const startTime = performance.now();
      const result = await cacheManager.get('static', '/api/nonexistent');
      const endTime = performance.now();
      
      expect(result).toBeNull();
      expect(endTime - startTime).toBeLessThan(5); // Cache miss should be fast
    });

    it('should handle cache expiration correctly', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheKey = '/api/test';
      
      // Set with very short TTL
      await cacheManager.set('static', cacheKey, testData, { ttl: 1 });
      
      // Should be available immediately
      let result = await cacheManager.get('static', cacheKey);
      expect(result).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should be expired
      result = await cacheManager.get('static', cacheKey);
      expect(result).toBeNull();
    });

    it('should maintain good performance under load', async () => {
      const iterations = 100;
      const testData = { id: 1, name: 'Load Test' };
      
      const startTime = performance.now();
      
      // Perform many cache operations
      const promises = Array.from({ length: iterations }, async (_, i) => {
        const key = `/api/test/${i}`;
        await cacheManager.set('dynamic', key, { ...testData, id: i });
        return await cacheManager.get('dynamic', key);
      });
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / (iterations * 2); // set + get
      
      expect(results).toHaveLength(iterations);
      expect(avgTimePerOperation).toBeLessThan(1); // Should average < 1ms per operation
    });

    it('should handle cache invalidation efficiently', async () => {
      const testData = { id: 1, name: 'Test' };
      
      // Cache multiple related items
      await cacheManager.set('static', '/api/menu/categories', testData);
      await cacheManager.set('static', '/api/menu/products', testData);
      await cacheManager.set('static', '/api/store/info', testData);
      
      const startTime = performance.now();
      await cacheManager.invalidate('/api/admin/menu');
      const endTime = performance.now();
      
      // Should invalidate menu-related caches
      const categories = await cacheManager.get('static', '/api/menu/categories');
      const products = await cacheManager.get('static', '/api/menu/products');
      const store = await cacheManager.get('static', '/api/store/info');
      
      expect(categories).toBeNull();
      expect(products).toBeNull();
      expect(store).toEqual(testData); // Should not be invalidated
      expect(endTime - startTime).toBeLessThan(20); // Invalidation should be fast
    });

    it('should provide accurate cache statistics', async () => {
      const testData = { id: 1, name: 'Stats Test' };
      
      // Perform cache operations
      await cacheManager.set('static', '/api/test/1', testData);
      await cacheManager.set('static', '/api/test/2', testData);
      
      await cacheManager.get('static', '/api/test/1'); // Hit
      await cacheManager.get('static', '/api/test/2'); // Hit
      await cacheManager.get('static', '/api/test/3'); // Miss
      
      const stats = await cacheManager.getStats('static');
      
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.totalEntries).toBe(2);
        expect(stats.hitRate).toBeCloseTo(0.67, 1); // 2 hits out of 3 requests
        expect(stats.missRate).toBeCloseTo(0.33, 1); // 1 miss out of 3 requests
      }
    });
  });

  describe('Memory Management', () => {
    it('should evict old entries when cache is full', async () => {
      // Configure small cache for testing
      cacheManager.setConfig('test', {
        ttl: 60000,
        maxSize: 3,
        strategy: 'memory',
        compression: false,
        encryption: false,
        invalidationRules: [],
      });
      
      const testData = { name: 'Test' };
      
      // Fill cache to capacity
      await cacheManager.set('test', '/api/test/1', testData);
      await cacheManager.set('test', '/api/test/2', testData);
      await cacheManager.set('test', '/api/test/3', testData);
      
      // Access first item to make it recently used
      await cacheManager.get('test', '/api/test/1');
      
      // Add one more item (should trigger eviction)
      await cacheManager.set('test', '/api/test/4', testData);
      
      // First item should still be there (recently accessed)
      const item1 = await cacheManager.get('test', '/api/test/1');
      expect(item1).toEqual(testData);
      
      // One of the other items should be evicted
      const stats = await cacheManager.getStats('test');
      expect(stats?.totalEntries).toBeLessThanOrEqual(3);
    });

    it('should handle memory pressure gracefully', async () => {
      const largeData = {
        data: 'x'.repeat(10000), // 10KB string
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` })),
      };
      
      const startTime = performance.now();
      
      // Try to cache large amounts of data
      const promises = Array.from({ length: 50 }, async (_, i) => {
        try {
          await cacheManager.set('dynamic', `/api/large/${i}`, largeData);
          return true;
        } catch (error) {
          return false;
        }
      });
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      // Should handle gracefully without crashing
      expect(endTime - startTime).toBeLessThan(1000);
      expect(results.some(r => r)).toBe(true); // At least some should succeed
    });
  });
});

describe('State Persistence Manager Performance', () => {
  let persistenceManager: StatePersistenceManager;

  beforeEach(() => {
    persistenceManager = new StatePersistenceManager();
    mockLocalStorage.store.clear();
    mockSessionStorage.store.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Persistence Performance', () => {
    it('should persist and restore state efficiently', async () => {
      const testState = {
        items: [
          { id: 1, name: 'Product 1', quantity: 2 },
          { id: 2, name: 'Product 2', quantity: 1 },
        ],
        total: 29.98,
        timestamp: Date.now(),
      };
      
      const startPersist = performance.now();
      await persistenceManager.persist('cart', testState);
      const persistTime = performance.now() - startPersist;
      
      const startRestore = performance.now();
      const restored = await persistenceManager.restore('cart');
      const restoreTime = performance.now() - startRestore;
      
      expect(restored).toEqual(testState);
      expect(persistTime).toBeLessThan(20); // Should be fast
      expect(restoreTime).toBeLessThan(10); // Restore should be even faster
    });

    it('should handle debounced persistence correctly', async () => {
      const testState = { counter: 0 };
      
      const startTime = performance.now();
      
      // Rapid updates (should be debounced)
      for (let i = 0; i < 10; i++) {
        await persistenceManager.persist('uiState', { counter: i });
      }
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const endTime = performance.now();
      
      // Should have debounced the writes
      expect(endTime - startTime).toBeLessThan(200);
      
      // Should have the final state
      const restored = await persistenceManager.restore('uiState');
      expect(restored).toEqual({ counter: 9 });
    });

    it('should handle large state objects efficiently', async () => {
      const largeState = {
        products: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Product ${i}`,
          description: 'A'.repeat(100), // 100 char description
          price: Math.random() * 100,
          category: `Category ${i % 10}`,
        })),
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: 'abc123',
        },
      };
      
      const startTime = performance.now();
      await persistenceManager.persist('searchHistory', largeState);
      const persistTime = performance.now() - startTime;
      
      const restoreStart = performance.now();
      const restored = await persistenceManager.restore('searchHistory');
      const restoreTime = performance.now() - restoreStart;
      
      expect(restored).toEqual(largeState);
      expect(persistTime).toBeLessThan(100); // Should handle large objects reasonably
      expect(restoreTime).toBeLessThan(50);
    });

    it('should handle concurrent persistence operations', async () => {
      const states = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        data: `State ${i}`,
        timestamp: Date.now() + i,
      }));
      
      const startTime = performance.now();
      
      // Concurrent persistence operations
      const promises = states.map((state, i) => 
        persistenceManager.persist(`test-${i % 5}`, state)
      );
      
      await Promise.all(promises);
      const endTime = performance.now();
      
      // Should handle concurrent operations efficiently
      expect(endTime - startTime).toBeLessThan(200);
      
      // Verify all states were persisted
      const restored = await Promise.all(
        Array.from({ length: 5 }, (_, i) => 
          persistenceManager.restore(`test-${i}`)
        )
      );
      
      expect(restored.every(state => state !== null)).toBe(true);
    });

    it('should handle storage quota exceeded gracefully', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = mockLocalStorage.setItem;
      let callCount = 0;
      
      mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
        callCount++;
        if (callCount > 3) {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError');
          (error as any).code = 22;
          throw error;
        }
        return originalSetItem(key, value);
      });
      
      const testState = { data: 'x'.repeat(1000) };
      
      // Should not throw error
      await expect(persistenceManager.persist('cart', testState)).resolves.not.toThrow();
      
      // Restore original implementation
      mockLocalStorage.setItem.mockImplementation(originalSetItem);
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('should sync state across tabs efficiently', async () => {
      const testState = { syncTest: true, timestamp: Date.now() };
      
      // Mock BroadcastChannel message handling
      let messageHandler: ((event: any) => void) | null = null;
      const mockChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn((type: string, handler: (event: any) => void) => {
          if (type === 'message') {
            messageHandler = handler;
          }
        }),
      };
      
      (global as any).BroadcastChannel = vi.fn(() => mockChannel);
      
      const startTime = performance.now();
      await persistenceManager.persist('cart', testState);
      const endTime = performance.now();
      
      // Should broadcast message
      expect(mockChannel.postMessage).toHaveBeenCalled();
      expect(endTime - startTime).toBeLessThan(50); // Should be fast even with sync
    });
  });

  describe('Data Integrity', () => {
    it('should detect and handle corrupted data', async () => {
      const testState = { integrity: 'test' };
      
      // Persist valid state
      await persistenceManager.persist('userPreferences', testState);
      
      // Corrupt the stored data
      const corruptedData = JSON.stringify({
        data: testState,
        version: 1,
        timestamp: Date.now(),
        checksum: 'invalid-checksum',
      });
      
      mockLocalStorage.setItem('user-preferences', corruptedData);
      
      // Should detect corruption and return null
      const restored = await persistenceManager.restore('userPreferences');
      expect(restored).toBeNull();
    });

    it('should handle version migrations efficiently', async () => {
      // Configure migration
      persistenceManager.setConfig('test-migration', {
        key: 'test-migration',
        storage: 'localStorage',
        version: 2,
        migrations: {
          2: (data: any) => ({
            ...data,
            migrated: true,
            newField: 'added in v2',
          }),
        },
        encryption: false,
        compression: false,
        syncAcrossTabs: false,
        debounceMs: 0,
        maxSize: 10240,
      });
      
      // Store old version data
      const oldData = { oldField: 'old value' };
      const oldState = {
        data: oldData,
        version: 1,
        timestamp: Date.now(),
      };
      
      mockLocalStorage.setItem('test-migration', JSON.stringify(oldState));
      
      const startTime = performance.now();
      const restored = await persistenceManager.restore('test-migration');
      const endTime = performance.now();
      
      expect(restored).toEqual({
        oldField: 'old value',
        migrated: true,
        newField: 'added in v2',
      });
      
      expect(endTime - startTime).toBeLessThan(20); // Migration should be fast
    });
  });
});

describe('Service Worker Integration Performance', () => {
  beforeEach(() => {
    // Mock service worker APIs
    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: {
        register: vi.fn(() => Promise.resolve({
          installing: null,
          waiting: null,
          active: { postMessage: vi.fn() },
          addEventListener: vi.fn(),
          update: vi.fn(() => Promise.resolve()),
          unregister: vi.fn(() => Promise.resolve(true)),
        })),
        addEventListener: vi.fn(),
      },
      writable: true,
    });
  });

  it('should register service worker efficiently', async () => {
    const swManager = ServiceWorkerManager.getInstance();
    
    const startTime = performance.now();
    const registration = await swManager.register();
    const endTime = performance.now();
    
    expect(registration).toBeDefined();
    expect(endTime - startTime).toBeLessThan(100); // Should be fast
  });

  it('should handle cache operations through service worker', async () => {
    const swManager = ServiceWorkerManager.getInstance();
    await swManager.register();
    
    const urls = ['/api/menu', '/api/categories', '/api/products'];
    
    const startTime = performance.now();
    await swManager.cacheUrls(urls);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50); // Should delegate quickly
  });
});

describe('Offline Functionality Performance', () => {
  it('should handle offline state transitions efficiently', async () => {
    const swManager = ServiceWorkerManager.getInstance();
    
    // Mock online/offline events
    const onlineEvent = new Event('online');
    const offlineEvent = new Event('offline');
    
    let eventHandlerTime = 0;
    
    swManager.on('online', () => {
      const start = performance.now();
      // Simulate online handling
      setTimeout(() => {
        eventHandlerTime = performance.now() - start;
      }, 0);
    });
    
    swManager.on('offline', () => {
      const start = performance.now();
      // Simulate offline handling
      setTimeout(() => {
        eventHandlerTime = performance.now() - start;
      }, 0);
    });
    
    // Trigger events
    window.dispatchEvent(offlineEvent);
    window.dispatchEvent(onlineEvent);
    
    // Wait for handlers
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(eventHandlerTime).toBeLessThan(5); // Event handling should be fast
  });
});

describe('Integration Performance Tests', () => {
  it('should handle combined caching and persistence efficiently', async () => {
    const cacheManager = new ApiCacheManager();
    const persistenceManager = new StatePersistenceManager();
    
    const testData = {
      products: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `Product ${i}`,
        price: Math.random() * 100,
      })),
      cart: {
        items: [{ id: 1, quantity: 2 }, { id: 2, quantity: 1 }],
        total: 29.98,
      },
    };
    
    const startTime = performance.now();
    
    // Concurrent operations
    await Promise.all([
      cacheManager.set('static', '/api/products', testData.products),
      persistenceManager.persist('cart', testData.cart),
      cacheManager.get('static', '/api/menu'),
      persistenceManager.restore('userPreferences'),
    ]);
    
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // Combined operations should be efficient
  });

  it('should maintain performance under realistic load', async () => {
    const cacheManager = new ApiCacheManager();
    const persistenceManager = new StatePersistenceManager();
    
    const operations = [];
    
    // Simulate realistic usage pattern
    for (let i = 0; i < 20; i++) {
      operations.push(
        cacheManager.set('dynamic', `/api/product/${i}`, { id: i, name: `Product ${i}` }),
        cacheManager.get('static', '/api/menu'),
        persistenceManager.persist('cart', { items: [{ id: i, quantity: 1 }] }),
      );
    }
    
    const startTime = performance.now();
    await Promise.all(operations);
    const endTime = performance.now();
    
    const totalTime = endTime - startTime;
    const avgTimePerOperation = totalTime / operations.length;
    
    expect(avgTimePerOperation).toBeLessThan(5); // Should average < 5ms per operation
    expect(totalTime).toBeLessThan(500); // Total should be reasonable
  });
});