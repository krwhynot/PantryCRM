'use client';

import React, { useState, useEffect } from 'react';
import { Check, Clock, WifiOff, AlertCircle, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { offlineStorage } from '@/src/lib/offline-storage';

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error' | 'syncing';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className,
  showDetails = true
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      // Trigger sync of pending items
      syncPendingItems();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending sync items periodically
  useEffect(() => {
    const checkPendingSync = async () => {
      try {
        const pendingItems = await offlineStorage.getPendingSync();
        const count = pendingItems.length;
        setPendingCount(count);

        if (!isOnline) {
          setSyncStatus('offline');
        } else if (count > 0) {
          setSyncStatus('pending');
        } else {
          setSyncStatus('synced');
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.error('Error checking pending sync:', error);
        setSyncStatus('error');
      }
    };

    checkPendingSync();
    const interval = setInterval(checkPendingSync, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  const syncPendingItems = async () => {
    try {
      setSyncStatus('syncing');
      const pendingItems = await offlineStorage.getPendingSync();
      
      for (const item of pendingItems) {
        try {
          // Attempt to sync each item
          const response = await fetch(`/api/${item.type}s`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          });

          if (response.ok) {
            await offlineStorage.markSynced(item.id);
          } else {
            await offlineStorage.incrementSyncAttempts(item.id);
          }
        } catch (error) {
          await offlineStorage.incrementSyncAttempts(item.id);
        }
      }

      // Recheck status after sync attempt
      const remainingItems = await offlineStorage.getPendingSync();
      setPendingCount(remainingItems.length);
      
      if (remainingItems.length === 0) {
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('pending');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'syncing':
        return <Wifi className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Check className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'All changes saved';
      case 'pending':
        return `${pendingCount} action${pendingCount !== 1 ? 's' : ''} queued`;
      case 'offline':
        return 'Working offline';
      case 'error':
        return 'Sync error';
      case 'syncing':
        return 'Syncing...';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'pending':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'offline':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'syncing':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (!showDetails && syncStatus === 'synced') {
    return null; // Hide when everything is synced and details not requested
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border-2 text-sm font-medium transition-all duration-300',
        getStatusColor(),
        className
      )}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {showDetails && lastSyncTime && syncStatus === 'synced' && (
        <span className="text-xs opacity-75 ml-1">
          • {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
      
      {/* Manual sync button for pending items */}
      {syncStatus === 'pending' && isOnline && (
        <button
          onClick={syncPendingItems}
          className="ml-2 px-2 py-1 text-xs bg-white/20 rounded hover:bg-white/30 transition-colors touch-target"
          aria-label="Retry sync"
        >
          Sync Now
        </button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;