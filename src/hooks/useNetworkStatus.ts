'use client';

import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  saveData: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    saveData: false
  });

  useEffect(() => {
    // Initial network status check
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      const isOnline = navigator.onLine;
      let isSlowConnection = false;
      let connectionType = 'unknown';
      let saveData = false;

      if (connection) {
        connectionType = connection.effectiveType || connection.type || 'unknown';
        saveData = connection.saveData || false;
        
        // Determine if connection is slow
        // 2G, slow-2g, or very low speed
        isSlowConnection = connection.effectiveType === '2g' || 
                          connection.effectiveType === 'slow-2g' ||
                          (connection.downlink && connection.downlink < 1);
      }

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType,
        saveData
      });
    };

    // Update on initial load
    updateNetworkStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[NetworkStatus] Back online');
      updateNetworkStatus();
      
      // Trigger background sync if service worker is available
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          // Check if background sync is supported
          if ('sync' in registration) {
            (registration as any).sync.register('background-sync').catch(console.error);
          }
        });
      }
    };

    const handleOffline = () => {
      console.log('[NetworkStatus] Gone offline');
      updateNetworkStatus();
    };

    // Listen for connection changes
    const handleConnectionChange = () => {
      console.log('[NetworkStatus] Connection changed');
      updateNetworkStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection quality changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}

// Hook for offline-aware data fetching
export function useOfflineAwareFetch() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const fetchWithFallback = async (url: string, options?: RequestInit) => {
    // If offline, try to get from cache first
    if (!isOnline) {
      try {
        const cachedResponse = await caches.match(url);
        if (cachedResponse) {
          return cachedResponse;
        }
      } catch (error) {
        console.warn('[OfflineFetch] Cache access failed:', error);
      }
      
      throw new Error('Network unavailable and no cached data found');
    }

    // Adjust fetch options for slow connections
    const fetchOptions: RequestInit = {
      ...options,
      ...(isSlowConnection && {
        // Reduce timeout for slow connections
        signal: AbortSignal.timeout(10000)
      })
    };

    try {
      const response = await fetch(url, fetchOptions);
      
      // Cache successful responses for offline use
      if (response.ok && 'caches' in window) {
        try {
          const cache = await caches.open('pantry-crm-data-v1');
          cache.put(url, response.clone());
        } catch (error) {
          console.warn('[OfflineFetch] Failed to cache response:', error);
        }
      }
      
      return response;
    } catch (error) {
      // If network request fails, try cache as fallback
      try {
        const cachedResponse = await caches.match(url);
        if (cachedResponse) {
          console.log('[OfflineFetch] Using cached fallback for:', url);
          return cachedResponse;
        }
      } catch (cacheError) {
        console.warn('[OfflineFetch] Cache fallback failed:', cacheError);
      }
      
      throw error;
    }
  };

  return { fetchWithFallback, isOnline, isSlowConnection };
}