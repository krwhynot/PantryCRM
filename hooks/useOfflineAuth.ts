'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/src/lib/offline-storage';
import { useRouter } from 'next/navigation';

interface CachedAuthData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: number;
  expiresAt: number;
}

interface OfflineAuthOptions {
  maxCacheAge?: number; // Maximum age in milliseconds (default: 24 hours)
  enableOfflineMode?: boolean; // Whether to allow offline authentication
}

export function useOfflineAuth(options: OfflineAuthOptions = {}) {
  const {
    maxCacheAge = 24 * 60 * 60 * 1000, // 24 hours
    enableOfflineMode = true
  } = options;

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasOfflineAuth, setHasOfflineAuth] = useState(false);
  const [cachedUser, setCachedUser] = useState<CachedAuthData | null>(null);
  const [isCheckingOfflineAuth, setIsCheckingOfflineAuth] = useState(false);

  const router = useRouter();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for cached authentication on mount
  useEffect(() => {
    const checkCachedAuth = async () => {
      if (!enableOfflineMode) return;

      setIsCheckingOfflineAuth(true);
      try {
        const cached = await offlineStorage.getSetting('cachedAuth');
        
        if (cached && isValidCachedAuth(cached)) {
          setCachedUser(cached);
          setHasOfflineAuth(true);
        } else {
          // Clear invalid/expired cache
          await offlineStorage.setSetting('cachedAuth', null);
          setHasOfflineAuth(false);
        }
      } catch (error) {
        console.error('Error checking cached auth:', error);
        setHasOfflineAuth(false);
      } finally {
        setIsCheckingOfflineAuth(false);
      }
    };

    checkCachedAuth();
  }, [enableOfflineMode, maxCacheAge]);

  const isValidCachedAuth = useCallback((cached: CachedAuthData): boolean => {
    if (!cached || !cached.timestamp || !cached.expiresAt) return false;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    
    // Check if cache is within max age and not expired
    return age < maxCacheAge && now < cached.expiresAt;
  }, [maxCacheAge]);

  const cacheAuthData = useCallback(async (userData: any, sessionExpiry?: number) => {
    if (!enableOfflineMode) return;

    try {
      const cacheData: CachedAuthData = {
        user: {
          id: userData.id || userData.sub,
          name: userData.name,
          email: userData.email,
        },
        timestamp: Date.now(),
        expiresAt: sessionExpiry || (Date.now() + maxCacheAge)
      };

      await offlineStorage.setSetting('cachedAuth', cacheData);
      setCachedUser(cacheData);
      setHasOfflineAuth(true);
    } catch (error) {
      console.error('Error caching auth data:', error);
    }
  }, [enableOfflineMode, maxCacheAge]);

  const clearCachedAuth = useCallback(async () => {
    try {
      await offlineStorage.setSetting('cachedAuth', null);
      setCachedUser(null);
      setHasOfflineAuth(false);
    } catch (error) {
      console.error('Error clearing cached auth:', error);
    }
  }, []);

  const loginWithCachedAuth = useCallback(async (): Promise<boolean> => {
    if (!cachedUser || !isValidCachedAuth(cachedUser)) {
      return false;
    }

    try {
      // Simulate successful offline login
      // In a real app, you might want to set some session state here
      return true;
    } catch (error) {
      console.error('Error with offline login:', error);
      return false;
    }
  }, [cachedUser, isValidCachedAuth]);

  const shouldShowOfflineOption = useCallback((): boolean => {
    return isOffline && hasOfflineAuth && enableOfflineMode;
  }, [isOffline, hasOfflineAuth, enableOfflineMode]);

  const getOfflineUserInfo = useCallback(() => {
    return cachedUser?.user || null;
  }, [cachedUser]);

  const getCacheAge = useCallback((): string => {
    if (!cachedUser) return '';

    const ageMs = Date.now() - cachedUser.timestamp;
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));

    if (ageHours > 0) {
      return `${ageHours}h ${ageMinutes}m ago`;
    }
    return `${ageMinutes}m ago`;
  }, [cachedUser]);

  const getTimeUntilExpiry = useCallback((): string => {
    if (!cachedUser) return '';

    const timeLeft = cachedUser.expiresAt - Date.now();
    if (timeLeft <= 0) return 'Expired';

    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m left`;
    }
    return `${minutesLeft}m left`;
  }, [cachedUser]);

  const handleOfflineLogin = useCallback(async () => {
    const success = await loginWithCachedAuth();
    if (success) {
      router.push('/crm');
    }
    return success;
  }, [loginWithCachedAuth, router]);

  return {
    isOffline,
    hasOfflineAuth,
    cachedUser: cachedUser?.user || null,
    isCheckingOfflineAuth,
    shouldShowOfflineOption: shouldShowOfflineOption(),
    cacheAuthData,
    clearCachedAuth,
    loginWithCachedAuth,
    handleOfflineLogin,
    getOfflineUserInfo,
    getCacheAge,
    getTimeUntilExpiry
  };
}

export default useOfflineAuth;