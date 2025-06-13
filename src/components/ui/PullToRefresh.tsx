'use client';

import { usePullToRefresh } from '../../hooks/useSwipeable';
import { ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
  resistance?: number;
  className?: string;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  resistance = 3,
  className = ''
}: PullToRefreshProps) {
  const containerRef = usePullToRefresh(onRefresh, {
    threshold,
    resistance,
    refreshingText: 'Updating CRM data...',
    pullText: 'Pull down to refresh',
    releaseText: 'Release to update'
  });

  return (
    <div ref={containerRef} className={`pull-to-refresh-container ${className}`}>
      {/* Pull indicator */}
      <div className="pull-indicator-wrapper fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200">
        <div className="pull-indicator bg-white rounded-full shadow-lg px-4 py-2 text-sm text-gray-600 border border-gray-200 flex items-center space-x-2">
          <div className="spinner hidden">
            <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className="indicator-text">Pull down to refresh</span>
        </div>
      </div>

      {/* Main content */}
      <div className="content-wrapper">
        {children}
      </div>

      <style jsx>{`
        .pull-to-refresh-container {
          transition: transform 0.2s ease-out;
        }

        .pull-indicator-wrapper {
          transform: translateX(-50%) translateY(-100%);
          transition: transform 0.2s ease-out;
        }

        .pull-to-refresh-container.pulling .pull-indicator-wrapper {
          transform: translateX(-50%) translateY(10px);
        }

        .pull-indicator.ready-to-refresh {
          background-color: #dbeafe;
          border-color: #3b82f6;
          color: #1d4ed8;
        }

        .pull-indicator.ready-to-refresh .indicator-text::before {
          content: "🔄 ";
        }

        .pull-indicator.refreshing .spinner {
          display: block;
        }

        .pull-indicator.refreshing {
          background-color: #ecfdf5;
          border-color: #10b981;
          color: #047857;
        }
      `}</style>
    </div>
  );
}