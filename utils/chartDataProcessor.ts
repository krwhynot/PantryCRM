import { useMemo, useState, useEffect } from 'react';

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface AggregatedData {
  [key: string]: number | string;
}

/**
 * Hook for optimizing chart data processing with performance enhancements
 * @param rawData - Raw data array
 * @param threshold - Maximum number of data points before aggregation
 * @returns Optimized and sanitized chart data
 */
export const useOptimizedChartData = (rawData: any[], threshold = 1000) => {
  return useMemo(() => {
    if (!rawData?.length) return [];
    
    // Aggregate large datasets for performance
    if (rawData.length > threshold) {
      return aggregateDataPoints(rawData, threshold);
    }
    
    // Sanitize and validate data
    return rawData
      .filter(item => item != null && typeof item.value === 'number')
      .map(item => ({
        ...item,
        value: Number(item.value.toFixed(2))
      }));
  }, [rawData, threshold]);
};

/**
 * Aggregates data points by taking every nth point to reduce dataset size
 * @param data - Original data array
 * @param maxPoints - Maximum number of points to keep
 * @returns Aggregated data array
 */
const aggregateDataPoints = (data: any[], maxPoints: number): any[] => {
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
};

/**
 * Optimized data formatter for large numbers
 * @param number - Number to format
 * @returns Formatted string
 */
export const dataFormatter = (number: number): string => {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return Intl.NumberFormat("us").format(number);
};

/**
 * Processes segment data for donut/pie charts
 * @param data - Raw segment data
 * @returns Processed segment data with performance optimizations
 */
export const useSegmentData = (data: { segment: string; count: number }[]) => {
  return useMemo(() => {
    if (!data?.length) return [];
    
    return data
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(item => ({
        ...item,
        name: item.segment,
        value: item.count
      }));
  }, [data]);
};

/**
 * Debounced data processing for real-time updates
 * @param data - Raw data
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced processed data
 */
export const useDebouncedChartData = (data: any[], delay = 300) => {
  const [debouncedData, setDebouncedData] = useState(data);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedData(data);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [data, delay]);
  
  return useOptimizedChartData(debouncedData);
};