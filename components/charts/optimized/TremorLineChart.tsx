/**
 * Optimized Tremor Line Chart
 * 
 * Performance-optimized wrapper for Tremor's LineChart with Azure B1 constraints
 */

'use client';

import React, { memo, useMemo } from 'react';
import { LineChart, Card, Title } from '@tremor/react';
import type { ChartDataPoint } from '@/types/crm';

interface TremorLineChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showGridLines?: boolean;
  smooth?: boolean;
  showPoints?: boolean;
  categories?: string[];
  index?: string;
  onMount?: () => void;
  className?: string;
  connectNulls?: boolean;
  yAxisWidth?: number;
}

const TremorLineChart = memo(function TremorLineChart({
  data,
  width,
  height = 300,
  title,
  colors = ['blue', 'green', 'yellow', 'orange', 'red'],
  showLegend = true,
  showTooltip = true,
  showGridLines = true,
  smooth = false,
  showPoints = true,
  categories = ['value'],
  index = 'name',
  onMount,
  className = '',
  connectNulls = false,
  yAxisWidth = 60
}: TremorLineChartProps) {
  
  // Transform data for Tremor format
  const tremorData = useMemo(() => {
    return data.map(item => ({
      [index]: item.name,
      value: item.value,
      category: item.category || 'default',
      date: item.date || item.name, // For time series data
      ...item
    }));
  }, [data, index]);

  // Performance optimization: sample data points for Azure B1
  const optimizedData = useMemo(() => {
    if (tremorData.length <= 100) return tremorData;
    
    // For large time series, use intelligent sampling
    const step = Math.ceil(tremorData.length / 100);
    const sampled = tremorData.filter((_, index) => index % step === 0);
    
    // Always include the last point
    if (sampled[sampled.length - 1] !== tremorData[tremorData.length - 1]) {
      sampled.push(tremorData[tremorData.length - 1]);
    }
    
    return sampled;
  }, [tremorData]);

  // Calculate min/max for better Y-axis scaling
  const { minValue, maxValue } = useMemo(() => {
    const values = optimizedData.map(item => item.value).filter(v => v != null);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values)
    };
  }, [optimizedData]);

  // Chart configuration optimized for performance
  const chartConfig = useMemo(() => ({
    colors,
    showLegend,
    showTooltip,
    showGridLines,
    // Performance optimizations
    animation: tremorData.length < 50, // Disable animation for large datasets
    enableBrush: false, // Disable brush for performance
    enableZoom: false,  // Disable zoom for performance
    curveType: smooth ? 'monotone' : 'linear',
    showDots: showPoints && tremorData.length < 100, // Hide dots for large datasets
    connectNulls
  }), [colors, showLegend, showTooltip, showGridLines, smooth, showPoints, tremorData.length, connectNulls]);

  React.useEffect(() => {
    onMount?.();
  }, [onMount]);

  // Performance warning for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && data.length > 200) {
      console.warn(`TremorLineChart: Large dataset (${data.length} points) may impact performance on Azure B1`);
    }
  }, [data.length]);

  // Custom value formatter for better tooltips
  const valueFormatter = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  // Intelligent Y-axis domain for better visualization
  const yAxisDomain = useMemo(() => {
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% padding
    return [
      Math.max(0, minValue - padding),
      maxValue + padding
    ];
  }, [minValue, maxValue]);

  const chartContent = (
    <LineChart
      data={optimizedData}
      index={index}
      categories={categories}
      colors={chartConfig.colors}
      showLegend={chartConfig.showLegend}
      showTooltip={chartConfig.showTooltip}
      showGridLines={chartConfig.showGridLines}
      valueFormatter={valueFormatter}
      className={`h-${Math.floor(height / 4)} ${className}`}
      connectNulls={chartConfig.connectNulls}
      yAxisWidth={yAxisWidth}
      minValue={yAxisDomain[0]}
      maxValue={yAxisDomain[1]}
      startEndOnly={tremorData.length > 20} // Show only start/end labels for large datasets
    />
  );

  // Trend indicator for single-series data
  const trendIndicator = useMemo(() => {
    if (categories.length > 1 || optimizedData.length < 2) return null;
    
    const firstValue = optimizedData[0]?.value || 0;
    const lastValue = optimizedData[optimizedData.length - 1]?.value || 0;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? ((change / firstValue) * 100).toFixed(1) : '0';
    
    const isPositive = change > 0;
    const isNeutral = change === 0;
    
    return (
      <div className="flex items-center justify-center mt-2 text-sm">
        <span className="text-gray-600 mr-2">Trend:</span>
        <span className={`font-medium ${
          isNeutral ? 'text-gray-500' : 
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? '↗' : isNeutral ? '→' : '↘'} {Math.abs(change).toLocaleString()} ({changePercent}%)
        </span>
      </div>
    );
  }, [optimizedData, categories.length]);

  // Data quality indicators
  const dataQuality = useMemo(() => {
    const nullCount = data.filter(item => item.value == null).length;
    const hasGaps = nullCount > 0;
    
    if (!hasGaps) return null;
    
    return (
      <div className="text-xs text-amber-600 mt-1 text-center">
        ⚠ {nullCount} missing data points
      </div>
    );
  }, [data]);

  // Wrap in Card if title is provided
  if (title) {
    return (
      <Card 
        className={className}
        style={{ width, height: height + 80 }} // Add space for title and trend
      >
        <Title className="text-center mb-4">{title}</Title>
        {chartContent}
        {trendIndicator}
        {dataQuality}
        
        {/* Performance info in development */}
        {process.env.NODE_ENV === 'development' && data.length !== optimizedData.length && (
          <div className="text-xs text-gray-400 mt-2 text-center">
            Showing {optimizedData.length} of {data.length} data points
          </div>
        )}
      </Card>
    );
  }

  return (
    <div 
      className={className}
      style={{ width, height }}
    >
      {chartContent}
      {trendIndicator}
      {dataQuality}
      
      {/* Performance info in development */}
      {process.env.NODE_ENV === 'development' && data.length !== optimizedData.length && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          Showing {optimizedData.length} of {data.length} data points
        </div>
      )}
    </div>
  );
});

export default TremorLineChart;