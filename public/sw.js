/**
 * Service Worker for Delivery Flow Enhancement
 * Provides offline functionality, caching, and state persistence
 */

const CACHE_NAME = 'delivery-flow-v1.0.0';
const STATIC_CACHE_NAME = 'delivery-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'delivery-dynamic-v1.0.0';
const API_CACHE_NAME = 'delivery-api-v1.0.0';

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000, // 1 day
  API: 5 * 60 * 1000, // 5 minutes
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/store',
  '/api/menu',
  '/api/categories',
  '/api/products',
];

// Network-first strategies for these patterns
const NETWORK_FIRST_PATTERNS = [
  /\/api\/orders/,
  /\/api\/cart/,
  /\/api\/checkout/,
  /\/api\/payment/,
];

// Cache-first strategies for these patterns
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static\//,
  /\/images\//,
  /\/icons\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(Boolean));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

/**
 * Fetch event - handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

/**
 * Handle different types of requests with appropriate caching strategies
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // API requests
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request);
    }
    
    // Static assets (cache-first)
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME);
    }
    
    // Dynamic content (network-first)
    return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.error('[SW] Request failed:', error);
    return await handleOfflineRequest(request);
  }
}

/**
 * Handle API requests with intelligent caching
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Network-first for critical APIs
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return await networkFirstStrategy(request, API_CACHE_NAME);
  }
  
  // Cache-first for cacheable APIs
  if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
    return await cacheFirstWithExpiry(request, API_CACHE_NAME, CACHE_DURATION.API);
  }
  
  // Default to network-first
  return await networkFirstStrategy(request, API_CACHE_NAME);
}

/**
 * Cache-first strategy
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Ignore network errors in background update
    });
    
    return cachedResponse;
  }
  
  // Fetch from network and cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

/**
 * Network-first strategy
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Cache-first with expiry check
 */
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cachedDate = cachedResponse.headers.get('sw-cached-date');
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate);
      if (age < maxAge) {
        return cachedResponse;
      }
    }
  }
  
  // Fetch fresh data
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Add cache timestamp
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-date': Date.now().toString(),
        },
      });
      
      cache.put(request, responseWithTimestamp.clone());
      return responseWithTimestamp;
    }
  } catch (error) {
    // Return stale cache if available
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Handle offline requests
 */
async function handleOfflineRequest(request) {
  const url = new URL(request.url);
  
  // Try to find cached version
  const cacheNames = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return await caches.match('/offline.html') || new Response(
      createOfflinePage(),
      { 
        headers: { 'Content-Type': 'text/html' },
        status: 200 
      }
    );
  }
  
  // Return offline response for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Você está offline. Algumas funcionalidades podem não estar disponíveis.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Return network error for other requests
  return new Response('Network Error', { status: 503 });
}

/**
 * Create offline page HTML
 */
function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Delivery</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .offline-container {
          text-align: center;
          max-width: 400px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          margin: 0 0 20px 0;
          font-size: 24px;
        }
        p {
          margin: 0 0 30px 0;
          opacity: 0.9;
          line-height: 1.5;
        }
        .retry-button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .retry-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>Você está offline</h1>
        <p>Verifique sua conexão com a internet e tente novamente.</p>
        <button class="retry-button" onclick="window.location.reload()">
          Tentar Novamente
        </button>
      </div>
    </body>
    </html>
  `;
}

/**
 * Background sync for failed requests
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  console.log('[SW] Handling background sync...');
  
  // Retry failed API requests
  const failedRequests = await getFailedRequests();
  
  for (const request of failedRequests) {
    try {
      await fetch(request);
      await removeFailedRequest(request);
      console.log('[SW] Retried request successfully:', request.url);
    } catch (error) {
      console.log('[SW] Retry failed for:', request.url);
    }
  }
}

/**
 * Store failed requests for retry
 */
async function storeFailedRequest(request) {
  const db = await openDB();
  const transaction = db.transaction(['failed-requests'], 'readwrite');
  const store = transaction.objectStore('failed-requests');
  
  await store.add({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  });
}

/**
 * Get failed requests from IndexedDB
 */
async function getFailedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['failed-requests'], 'readonly');
    const store = transaction.objectStore('failed-requests');
    return await store.getAll();
  } catch (error) {
    console.error('[SW] Error getting failed requests:', error);
    return [];
  }
}

/**
 * Remove failed request from IndexedDB
 */
async function removeFailedRequest(request) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['failed-requests'], 'readwrite');
    const store = transaction.objectStore('failed-requests');
    await store.delete(request.url);
  } catch (error) {
    console.error('[SW] Error removing failed request:', error);
  }
}

/**
 * Open IndexedDB for storing failed requests
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('delivery-sw-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('failed-requests')) {
        const store = db.createObjectStore('failed-requests', { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

/**
 * Message handling for cache management
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName);
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload?.urls);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0]?.postMessage(status);
      });
      break;
  }
});

/**
 * Clear specific cache or all caches
 */
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  if (!urls || !Array.isArray(urls)) return;
  
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.error('[SW] Failed to cache URL:', url, error);
      }
    })
  );
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      size: keys.length,
      urls: keys.map(request => request.url),
    };
  }
  
  return status;
}

console.log('[SW] Service worker loaded successfully');