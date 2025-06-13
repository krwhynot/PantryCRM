// Service Worker for PantryCRM
// Implements offline-first strategy with food service industry optimizations

const CACHE_NAME = 'pantry-crm-v1';
const STATIC_CACHE = 'pantry-crm-static-v1';
const DATA_CACHE = 'pantry-crm-data-v1';

// Cache strategies for different resource types
const STATIC_ASSETS = [
  '/',
  '/organizations',
  '/contacts',
  '/migration',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
  // Food service specific assets
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache for offline access
const API_CACHE_PATTERNS = [
  '/api/organizations',
  '/api/contacts',
  '/api/interactions',
  '/api/migration/status'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DATA_CACHE) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default to network-first for other requests
  event.respondWith(networkFirstStrategy(request));
});

// Network-first strategy for API calls and dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }
    
    // Return offline fallback for API requests
    if (isApiRequest(request.url)) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This data is not available offline',
          cached: false 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.status === 200) {
        const cache = caches.open(STATIC_CACHE);
        cache.then(c => c.put(request, response));
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });
    
    return cachedResponse;
  }
  
  // Fallback to network
  const networkResponse = await fetch(request);
  
  if (networkResponse.status === 200) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Navigation handler with offline fallback
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Navigation offline, serving cached page');
    
    // Try to serve cached version of the requested page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Last resort - basic offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PantryCRM - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center; 
              padding: 50px; 
              background: #f8fafc;
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 { color: #3b82f6; margin-bottom: 16px; }
            p { color: #64748b; line-height: 1.6; }
            .retry-btn {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🍽️ PantryCRM</h1>
            <p>You're currently offline. Some features may not be available.</p>
            <p>Your data is safely stored and will sync when you're back online.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Helper functions
function isApiRequest(pathname) {
  return pathname.startsWith('/api/') || 
         API_CACHE_PATTERNS.some(pattern => pathname.includes(pattern));
}

function isStaticAsset(pathname) {
  return pathname.includes('_next/static/') ||
         pathname.includes('/icons/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg');
}

// Background sync for form submissions when online
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync', event.tag);
  
  if (event.tag === 'organization-sync') {
    event.waitUntil(syncOrganizations());
  } else if (event.tag === 'contact-sync') {
    event.waitUntil(syncContacts());
  } else if (event.tag === 'interaction-sync') {
    event.waitUntil(syncInteractions());
  }
});

// Sync functions for background data updates
async function syncOrganizations() {
  try {
    // Get pending organizations from IndexedDB
    const pendingData = await getPendingData('organizations');
    
    for (const item of pendingData) {
      try {
        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          await removePendingData('organizations', item.id);
          console.log('[ServiceWorker] Synced organization:', item.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync organization:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Organization sync failed:', error);
  }
}

async function syncContacts() {
  // Similar implementation for contacts
  console.log('[ServiceWorker] Contact sync not yet implemented');
}

async function syncInteractions() {
  // Similar implementation for interactions
  console.log('[ServiceWorker] Interaction sync not yet implemented');
}

// Placeholder functions for IndexedDB operations
async function getPendingData(type) {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function removePendingData(type, id) {
  // TODO: Implement IndexedDB removal
  console.log(`Removing pending ${type} data:`, id);
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    // Send cache status back to client
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      cached: true // TODO: Implement actual cache status check
    });
  }
});

console.log('[ServiceWorker] SW script loaded');