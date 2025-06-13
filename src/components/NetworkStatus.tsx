'use client';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const { isOnline, isSlowConnection, connectionType, saveData } = useNetworkStatus();
  const [showStatus, setShowStatus] = useState(false);
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOnline) {
      setLastOfflineTime(new Date());
      setShowStatus(true);
    } else if (lastOfflineTime) {
      // Show "back online" message briefly
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, lastOfflineTime]);

  useEffect(() => {
    // Show slow connection warning
    if (isSlowConnection) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSlowConnection]);

  if (!showStatus) return null;

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: '🔴',
        title: 'You\'re offline',
        message: 'Your data is safely stored and will sync when you\'re back online.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconBg: 'bg-red-100'
      };
    }
    
    if (isSlowConnection) {
      return {
        icon: '🐌',
        title: 'Slow connection detected',
        message: `Connection: ${connectionType}. Some features may load slowly.`,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconBg: 'bg-yellow-100'
      };
    }
    
    return {
      icon: '🟢',
      title: 'Back online',
      message: 'Your connection has been restored. Syncing data...',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconBg: 'bg-green-100'
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4">
      <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor} border rounded-lg p-4 shadow-lg`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-8 h-8 ${statusConfig.iconBg} rounded-full flex items-center justify-center`}>
            <span className="text-sm">{statusConfig.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{statusConfig.title}</h4>
            <p className="text-sm mt-1 opacity-90">{statusConfig.message}</p>
            
            {!isOnline && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center text-xs opacity-75">
                  <span className="inline-block w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></span>
                  Local data available
                </div>
                <div className="flex items-center text-xs opacity-75">
                  <span className="inline-block w-2 h-2 bg-current rounded-full mr-2"></span>
                  Auto-sync enabled
                </div>
              </div>
            )}
            
            {isSlowConnection && saveData && (
              <div className="mt-2 text-xs opacity-75">
                <span className="inline-block w-2 h-2 bg-current rounded-full mr-2"></span>
                Data saver mode active
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowStatus(false)}
            className="flex-shrink-0 text-current opacity-50 hover:opacity-75 focus:opacity-75 focus:outline-none touch-target"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {!isOnline && lastOfflineTime && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
            <p className="text-xs opacity-75">
              Offline since {lastOfflineTime.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for showing sync status
export function SyncStatus({ 
  isSyncing = false, 
  lastSyncTime, 
  pendingCount = 0 
}: {
  isSyncing?: boolean;
  lastSyncTime?: Date;
  pendingCount?: number;
}) {
  const { isOnline } = useNetworkStatus();

  if (!isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      {isSyncing && (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          <span>Syncing...</span>
        </>
      )}
      
      {!isSyncing && pendingCount > 0 && (
        <>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>{pendingCount} pending</span>
        </>
      )}
      
      {!isSyncing && pendingCount === 0 && lastSyncTime && (
        <>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Synced {lastSyncTime.toLocaleTimeString()}</span>
        </>
      )}
    </div>
  );
}