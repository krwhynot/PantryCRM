/**
 * SSR-Safe Chart Wrapper
 * 
 * Universal chart component that handles SSR, dynamic imports, and performance
 * optimization for Azure B1 constraints. Consolidates all chart libraries
 * (Tremor, Recharts, D3) behind a single interface.
 */

'use client';

import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { ChartDataPoint } from '@/types/crm';

// =============================================================================
// CHART TYPES AND CONFIGURATIONS
// =============================================================================

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'funnel' | 'scatter';

export interface ChartConfig {
  type: ChartType;
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  responsive?: boolean;
  animate?: boolean;
  legend?: boolean;
  tooltip?: boolean;
  colors?: string[];
  theme?: 'light' | 'dark';
  
  // Performance optimizations for Azure B1
  enableVirtualization?: boolean;
  maxDataPoints?: number;
  renderThrottle?: number;
  
  // Chart-specific configurations
  barConfig?: {
    orientation?: 'vertical' | 'horizontal';
    stacked?: boolean;
    groupPadding?: number;
  };
  
  lineConfig?: {
    smooth?: boolean;
    showPoints?: boolean;
    fill?: boolean;
  };
  
  pieConfig?: {
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    endAngle?: number;
  };
}

export interface ChartProps extends ChartConfig {
  className?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint, index: number) => void;
  onChartReady?: () => void;
  fallbackComponent?: React.ComponentType<{ error?: Error }>;
}

// =============================================================================
// LAZY-LOADED CHART COMPONENTS
// =============================================================================

// Dynamic imports with loading states
const TremorBarChart = lazy(() => 
  import('./optimized/TremorBarChart').catch(() => 
    import('./fallback/FallbackChart').then(m => ({ default: m.FallbackChart }))
  )
);

const TremorLineChart = lazy(() => 
  import('./optimized/TremorLineChart').catch(() => 
    import('./fallback/FallbackChart').then(m => ({ default: m.FallbackChart }))
  )
);

const TremorAreaChart = lazy(() => 
  import('./optimized/TremorAreaChart').catch(() => 
    import('./fallback/FallbackChart').then(m => ({ default: m.FallbackChart }))
  )
);

const TremorDonutChart = lazy(() => 
  import('./optimized/TremorDonutChart').catch(() => 
    import('./fallback/FallbackChart').then(m => ({ default: m.FallbackChart }))
  )
);

const RechartsWrapper = lazy(() => 
  import('./optimized/RechartsWrapper').catch(() => 
    import('./fallback/FallbackChart').then(m => ({ default: m.FallbackChart }))
  )
);

// =============================================================================
// CHART LOADING COMPONENT
// =============================================================================

interface ChartLoadingProps {
  width?: number;
  height?: number;
  type: ChartType;
}

function ChartLoading({ width = 400, height = 300, type }: ChartLoadingProps) {
  return (
    <div 
      className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 animate-pulse"
      style={{ width, height }}
    >
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded animate-pulse" />
        <p className="text-sm text-gray-500">Loading {type} chart...</p>
      </div>
    </div>
  );
}

// =============================================================================
// CHART ERROR FALLBACK
// =============================================================================

interface ChartErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  chartType?: ChartType;
  width?: number;
  height?: number;
}

function ChartErrorFallback({ 
  error, 
  resetErrorBoundary, 
  chartType,
  width = 400,
  height = 300 
}: ChartErrorFallbackProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg p-4"
      style={{ width, height }}
    >
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-2 bg-red-300 rounded flex items-center justify-center">
          <span className="text-red-600 font-bold">!</span>
        </div>
        <h3 className="text-sm font-medium text-red-800 mb-1">Chart Loading Error</h3>
        <p className="text-xs text-red-600 mb-3">
          Failed to load {chartType} chart component
        </p>
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// DATA OPTIMIZATION UTILITIES
// =============================================================================

/**
 * Optimize chart data for Azure B1 performance constraints
 */
function optimizeChartData(
  data: ChartDataPoint[],
  maxDataPoints: number = 100,
  chartType: ChartType
): ChartDataPoint[] {
  // No optimization needed for small datasets
  if (data.length <= maxDataPoints) {
    return data;
  }

  // Different optimization strategies per chart type
  switch (chartType) {
    case 'line':
    case 'area':
      // Use time-based sampling for time series data
      return sampleTimeSeriesData(data, maxDataPoints);
    
    case 'bar':
      // Keep top N values, aggregate rest
      return aggregateBarData(data, maxDataPoints);
    
    case 'pie':
    case 'donut':
      // Keep top slices, combine small ones
      return aggregatePieData(data, maxDataPoints);
    
    default:
      // Simple sampling for other types
      return sampleUniformly(data, maxDataPoints);
  }
}

function sampleTimeSeriesData(data: ChartDataPoint[], maxPoints: number): ChartDataPoint[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

function aggregateBarData(data: ChartDataPoint[], maxPoints: number): ChartDataPoint[] {
  if (data.length <= maxPoints) return data;
  
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const topItems = sorted.slice(0, maxPoints - 1);
  const remaining = sorted.slice(maxPoints - 1);
  
  if (remaining.length > 0) {
    const otherValue = remaining.reduce((sum, item) => sum + item.value, 0);
    topItems.push({
      name: `Others (${remaining.length})`,
      value: otherValue,
      category: 'aggregated'
    });
  }
  
  return topItems;
}

function aggregatePieData(data: ChartDataPoint[], maxSlices: number): ChartDataPoint[] {
  if (data.length <= maxSlices) return data;
  
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const topSlices = sorted.slice(0, maxSlices - 1);
  const remaining = sorted.slice(maxSlices - 1);
  
  if (remaining.length > 0) {
    const otherValue = remaining.reduce((sum, item) => sum + item.value, 0);
    topSlices.push({
      name: 'Others',
      value: otherValue,
      category: 'aggregated'
    });
  }
  
  return topSlices;
}

function sampleUniformly(data: ChartDataPoint[], maxPoints: number): ChartDataPoint[] {
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// =============================================================================
// MAIN CHART WRAPPER COMPONENT
// =============================================================================

export default function SSRChartWrapper(props: ChartProps) {
  const {
    type,
    data,
    width,
    height,
    enableVirtualization = true,
    maxDataPoints = 100,
    renderThrottle = 100,
    onChartReady,
    fallbackComponent: CustomFallback,
    className = '',
    ...chartConfig
  } = props;

  const [isClient, setIsClient] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    onChartReady?.();
  }, [onChartReady]);

  // Optimize data for performance
  const optimizedData = useMemo(() => {
    if (!enableVirtualization) return data;
    return optimizeChartData(data, maxDataPoints, type);
  }, [data, maxDataPoints, type, enableVirtualization]);

  // Memoize chart component selection
  const ChartComponent = useMemo(() => {
    switch (type) {
      case 'bar':
        return TremorBarChart;
      case 'line':
        return TremorLineChart;
      case 'area':
        return TremorAreaChart;
      case 'pie':
      case 'donut':
        return TremorDonutChart;
      case 'funnel':
      case 'scatter':
        return RechartsWrapper;
      default:
        return TremorBarChart;
    }
  }, [type]);

  // Don't render anything during SSR
  if (!isClient) {
    return (
      <ChartLoading 
        width={width} 
        height={height} 
        type={type} 
      />
    );
  }

  // Performance monitoring for Azure B1
  const handleChartMount = () => {
    const mountTime = performance.now();
    if (mountTime > 2000) {
      console.warn(`Chart ${type} took ${mountTime.toFixed(2)}ms to mount. Consider optimization.`);
    }
  };

  return (
    <div className={`chart-wrapper ${className}`}>
      <ErrorBoundary
        FallbackComponent={(errorProps) => 
          CustomFallback ? 
            <CustomFallback {...errorProps} /> : 
            <ChartErrorFallback 
              {...errorProps} 
              chartType={type}
              width={width}
              height={height}
            />
        }
        onError={(error) => {
          console.error(`Chart ${type} error:`, error);
          // Force remount on error
          setChartKey(prev => prev + 1);
        }}
        resetKeys={[chartKey, type, data.length]}
      >
        <Suspense 
          fallback={
            <ChartLoading 
              width={width} 
              height={height} 
              type={type} 
            />
          }
        >
          <ChartComponent
            key={chartKey}
            type={type}
            data={optimizedData}
            width={width}
            height={height}
            onMount={handleChartMount}
            {...chartConfig}
          />
        </Suspense>
      </ErrorBoundary>
      
      {/* Performance debug info in development */}
      {process.env.NODE_ENV === 'development' && data.length !== optimizedData.length && (
        <div className="text-xs text-gray-500 mt-1">
          Data optimized: {data.length} → {optimizedData.length} points
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CHART FACTORY FOR COMMON PATTERNS
// =============================================================================

/**
 * Pre-configured chart components for common Food Service CRM use cases
 */
export const CRMCharts = {
  /**
   * Organization priority distribution
   */
  PriorityDistribution: (props: { data: ChartDataPoint[] }) => (
    <SSRChartWrapper
      type="donut"
      data={props.data}
      height={300}
      colors={['#22c55e', '#eab308', '#f97316', '#ef4444']} // A=Green, B=Yellow, C=Orange, D=Red
      pieConfig={{ innerRadius: 60 }}
      legend={true}
      tooltip={true}
    />
  ),

  /**
   * Interaction activity over time
   */
  ActivityTimeline: (props: { data: ChartDataPoint[] }) => (
    <SSRChartWrapper
      type="area"
      data={props.data}
      height={250}
      lineConfig={{ smooth: true, fill: true }}
      colors={['#3b82f6']}
      tooltip={true}
    />
  ),

  /**
   * Opportunity pipeline funnel
   */
  PipelineFunnel: (props: { data: ChartDataPoint[] }) => (
    <SSRChartWrapper
      type="funnel"
      data={props.data}
      height={350}
      colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
      tooltip={true}
    />
  ),

  /**
   * Segment performance comparison
   */
  SegmentPerformance: (props: { data: ChartDataPoint[] }) => (
    <SSRChartWrapper
      type="bar"
      data={props.data}
      height={300}
      barConfig={{ orientation: 'vertical', groupPadding: 0.1 }}
      responsive={true}
      tooltip={true}
      legend={true}
    />
  )
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for chart data transformation and caching
 */
export function useChartData<T>(
  rawData: T[],
  transformer: (data: T[]) => ChartDataPoint[],
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    try {
      return transformer(rawData);
    } catch (error) {
      console.error('Chart data transformation error:', error);
      return [];
    }
  }, [rawData, transformer, ...deps]);
}

/**
 * Hook for responsive chart dimensions
 */
export function useChartDimensions(containerRef: React.RefObject<HTMLDivElement>) {
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: width || 400, height: height || 300 });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return dimensions;
}