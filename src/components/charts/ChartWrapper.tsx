'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const OptimizedDonutChart = dynamic(
  () => import('./OptimizedDonutChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }
);

interface ChartWrapperProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ 
  children, 
  fallback 
}) => {
  return (
    <Suspense fallback={fallback || <div>Loading chart...</div>}>
      {children}
    </Suspense>
  );
};

export { OptimizedDonutChart };
export default ChartWrapper;