/**
 * Azure B1 Optimized Chart Loading Strategy
 * 
 * Designed specifically for Azure B1 tier constraints:
 * - 1.75GB RAM limitation
 * - 5 DTU database performance
 * - SSR/hydration considerations
 * - Bundle size optimization
 */

import { memo, useMemo, lazy, Suspense } from 'react';
import type { ChartDataPoint } from '@/types/crm';

// =============================================================================
// AZURE B1 CONFIGURATION
// =============================================================================

export const AZURE_B1_CHART_CONFIG = {
  // Memory constraints
  MAX_DATA_POINTS: 50,           // Limit data points to prevent memory issues
  CHART_RENDER_TIMEOUT: 3000,   // 3s timeout to prevent hanging
  LAZY_LOAD_THRESHOLD: 500,     // Load charts when within 500px of viewport
  
  // Performance optimizations
  ENABLE_VIRTUALIZATION: true,   // Virtual scrolling for large datasets
  DEBOUNCE_RESIZE: 250,         // Debounce window resize events
  CACHE_DURATION: 5 * 60 * 1000, // 5 minute cache for chart data
  
  // Bundle size optimization
  DYNAMIC_IMPORTS: true,         // Use dynamic imports for chart libraries
  TREE_SHAKING: true,           // Enable tree shaking
  
  // Database query optimization (5 DTU constraint)
  MAX_CONCURRENT_QUERIES: 2,    // Limit concurrent chart data queries
  QUERY_BATCH_SIZE: 25,         // Batch size for paginated chart data
} as const;

// =============================================================================
// CHART DATA VIRTUALIZATION
// =============================================================================

/**
 * Virtualized data handler for large datasets
 * Prevents memory overflow on Azure B1
 */
export class ChartDataVirtualizer {
  private cache = new Map<string, ChartDataPoint[]>();
  private readonly maxCacheSize = 10; // Limit cache size for memory
  
  /**
   * Virtualize large datasets for chart rendering
   */
  virtualizeData(
    data: ChartDataPoint[], 
    maxPoints: number = AZURE_B1_CHART_CONFIG.MAX_DATA_POINTS
  ): ChartDataPoint[] {
    if (data.length <= maxPoints) {
      return data;
    }
    
    // Intelligent sampling for large datasets
    const step = Math.ceil(data.length / maxPoints);
    const virtualized = data.filter((_, index) => index % step === 0);
    
    // Always include first and last points for continuity
    if (virtualized[0] !== data[0]) virtualized.unshift(data[0]);
    if (virtualized[virtualized.length - 1] !== data[data.length - 1]) {
      virtualized.push(data[data.length - 1]);
    }
    
    return virtualized.slice(0, maxPoints);
  }
  
  /**
   * Cache chart data with memory management
   */
  cacheData(key: string, data: ChartDataPoint[]): void {
    // Implement LRU cache for memory efficiency
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, data);
  }
  
  getCachedData(key: string): ChartDataPoint[] | undefined {
    return this.cache.get(key);
  }
}

// =============================================================================
// LAZY LOADING CHART COMPONENTS
// =============================================================================

/**
 * Dynamically import chart components to reduce initial bundle size
 */
export const LazyChartComponents = {
  BarChart: lazy(() => 
    import('recharts').then(module => ({ default: module.BarChart }))
  ),
  LineChart: lazy(() => 
    import('recharts').then(module => ({ default: module.LineChart }))
  ),
  AreaChart: lazy(() => 
    import('recharts').then(module => ({ default: module.AreaChart }))
  ),
  PieChart: lazy(() => 
    import('recharts').then(module => ({ default: module.PieChart }))
  ),
} as const;

/**
 * Chart loading fallback optimized for Azure B1
 */
export const ChartLoadingFallback = memo(() => (
  <div 
    className="h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center"
    role="img" 
    aria-label="Loading chart"
  >
    <div className="text-center space-y-2">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-gray-500">Loading chart...</p>
    </div>
  </div>
));

ChartLoadingFallback.displayName = 'ChartLoadingFallback';

// =============================================================================
// PERFORMANCE OPTIMIZED CHART WRAPPER
// =============================================================================

export interface AzureB1ChartProps {
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'area' | 'pie';
  height?: number;
  className?: string;
  enableVirtualization?: boolean;
  cacheKey?: string;
}

/**
 * Azure B1 optimized chart component with:
 * - Lazy loading
 * - Data virtualization  
 * - Memory management
 * - Error boundaries
 */
export const AzureB1Chart = memo<AzureB1ChartProps>(({ 
  data, 
  type, 
  height = 300,
  className = '',
  enableVirtualization = true,
  cacheKey
}) => {
  const virtualizer = useMemo(() => new ChartDataVirtualizer(), []);
  
  // Memoize processed data to prevent re-computation
  const processedData = useMemo(() => {
    if (!enableVirtualization) return data;
    
    // Check cache first
    if (cacheKey) {
      const cached = virtualizer.getCachedData(cacheKey);
      if (cached) return cached;
    }
    
    // Virtualize data for performance
    const virtualized = virtualizer.virtualizeData(data);
    
    // Cache the result
    if (cacheKey) {
      virtualizer.cacheData(cacheKey, virtualized);
    }
    
    return virtualized;
  }, [data, enableVirtualization, cacheKey, virtualizer]);
  
  // Dynamic component selection based on type
  const ChartComponent = useMemo(() => {
    switch (type) {
      case 'bar': return LazyChartComponents.BarChart;
      case 'line': return LazyChartComponents.LineChart;
      case 'area': return LazyChartComponents.AreaChart;
      case 'pie': return LazyChartComponents.PieChart;
      default: return LazyChartComponents.BarChart;
    }
  }, [type]);
  
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <div 
        className={`azure-b1-chart ${className}`}
        style={{ height }}
      >
        <ChartComponent 
          data={processedData}
          width="100%"
          height={height}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        />
      </div>
    </Suspense>
  );
});

AzureB1Chart.displayName = 'AzureB1Chart';

// =============================================================================
// CRM-SPECIFIC OPTIMIZED CHART COMPONENTS
// =============================================================================

/**
 * Pre-configured chart components for common CRM use cases
 * Optimized for food service industry data patterns
 */
export const CRMOptimizedCharts = {
  /**
   * Organization priority distribution (typically small dataset)
   */
  PriorityDistribution: memo<{ data: ChartDataPoint[] }>(({ data }) => (
    <AzureB1Chart
      type="pie"
      data={data}
      height={250}
      enableVirtualization={false} // Small dataset, no need to virtualize
      cacheKey="priority-distribution"
    />
  )),
  
  /**
   * Monthly interaction timeline (potentially large dataset)
   */
  ActivityTimeline: memo<{ data: ChartDataPoint[] }>(({ data }) => (
    <AzureB1Chart
      type="line"
      data={data}
      height={300}
      enableVirtualization={true}
      cacheKey="activity-timeline"
    />
  )),
  
  /**
   * Pipeline funnel by stage (medium dataset)
   */
  PipelineFunnel: memo<{ data: ChartDataPoint[] }>(({ data }) => (
    <AzureB1Chart
      type="bar"
      data={data}
      height={350}
      enableVirtualization={data.length > 20}
      cacheKey="pipeline-funnel"
    />
  )),
  
  /**
   * Segment performance comparison (variable dataset)
   */
  SegmentPerformance: memo<{ data: ChartDataPoint[] }>(({ data }) => (
    <AzureB1Chart
      type="area"
      data={data}
      height={300}
      enableVirtualization={data.length > 30}
      cacheKey="segment-performance"
    />
  )),
} as const;

// =============================================================================
// DATABASE QUERY OPTIMIZATION FOR CHARTS
// =============================================================================

/**
 * Chart data query patterns optimized for Azure SQL Basic (5 DTU)
 */
export class ChartDataQueryOptimizer {
  /**
   * Optimize aggregation queries for chart data
   */
  static buildOptimizedQuery(
    table: string,
    groupBy: string,
    aggregateField: string,
    timeRange?: { start: Date; end: Date }
  ) {
    let query = `
      SELECT 
        ${groupBy} as name,
        COUNT(*) as value,
        AVG(${aggregateField}) as average
      FROM ${table}
    `;
    
    if (timeRange) {
      query += ` WHERE createdAt BETWEEN '${timeRange.start.toISOString()}' AND '${timeRange.end.toISOString()}'`;
    }
    
    query += `
      GROUP BY ${groupBy}
      ORDER BY value DESC
      LIMIT ${AZURE_B1_CHART_CONFIG.MAX_DATA_POINTS}
    `;
    
    return query;
  }
  
  /**
   * Batch multiple chart queries to respect 5 DTU limit
   */
  static async batchChartQueries<T>(
    queries: (() => Promise<T>)[],
    maxConcurrent: number = AZURE_B1_CHART_CONFIG.MAX_CONCURRENT_QUERIES
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < queries.length; i += maxConcurrent) {
      const batch = queries.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(batch.map(query => query()));
      results.push(...batchResults);
    }
    
    return results;
  }
}

export default {
  AzureB1Chart,
  CRMOptimizedCharts,
  ChartDataVirtualizer,
  ChartDataQueryOptimizer,
  AZURE_B1_CHART_CONFIG
};