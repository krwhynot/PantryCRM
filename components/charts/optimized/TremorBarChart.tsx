/**
 * Optimized Tremor Bar Chart
 * 
 * Performance-optimized wrapper for Tremor's BarChart with Azure B1 constraints
 */

'use client';

import React, { memo, useMemo } from 'react';
import { BarChart, Card, Title } from '@tremor/react';
import type { ChartDataPoint } from '@/types/crm';

interface TremorBarChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  colors?: string[];
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  categories?: string[];
  index?: string;
  onMount?: () => void;
  className?: string;
}

const TremorBarChart = memo(function TremorBarChart({
  data,
  width,
  height = 300,
  title,
  colors = ['blue', 'green', 'yellow', 'orange', 'red'],
  orientation = 'vertical',
  stacked = false,
  showLegend = true,
  showTooltip = true,
  categories = ['value'],
  index = 'name',
  onMount,
  className = ''
}: TremorBarChartProps) {
  
  // Transform data for Tremor format
  const tremorData = useMemo(() => {
    return data.map(item => ({
      [index]: item.name,
      value: item.value,
      category: item.category || 'default',
      ...item
    }));
  }, [data, index]);

  // Performance optimization: limit data points for Azure B1
  const optimizedData = useMemo(() => {
    if (tremorData.length <= 50) return tremorData;
    
    // For large datasets, show top 45 items + "Others"
    const sorted = [...tremorData].sort((a, b) => b.value - a.value);
    const topItems = sorted.slice(0, 45);
    const remaining = sorted.slice(45);
    
    if (remaining.length > 0) {
      const othersValue = remaining.reduce((sum, item) => sum + item.value, 0);
      topItems.push({
        [index]: `Others (${remaining.length})`,
        value: othersValue,
        category: 'aggregated'
      });
    }
    
    return topItems;
  }, [tremorData, index]);

  // Chart configuration optimized for performance
  const chartConfig = useMemo(() => ({
    colors,
    showLegend,
    showTooltip,
    stack: stacked,
    layout: orientation,
    // Performance optimizations
    animation: tremorData.length < 20, // Disable animation for large datasets
    enableBrush: false, // Disable brush for performance
    enableZoom: false   // Disable zoom for performance
  }), [colors, showLegend, showTooltip, stacked, orientation, tremorData.length]);

  React.useEffect(() => {
    onMount?.();
  }, [onMount]);

  // Performance warning for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && data.length > 100) {
      console.warn(`TremorBarChart: Large dataset (${data.length} items) may impact performance on Azure B1`);
    }
  }, [data.length]);

  const chartContent = (
    <BarChart
      data={optimizedData}
      index={index}
      categories={categories}
      colors={chartConfig.colors}
      showLegend={chartConfig.showLegend}
      showTooltip={chartConfig.showTooltip}
      stack={chartConfig.stack}
      layout={chartConfig.layout}
      className={`h-${Math.floor(height / 4)} ${className}`}
      enableBrush={chartConfig.enableBrush}
      startEndOnly={tremorData.length > 20} // Show only start/end labels for large datasets
    />
  );

  // Wrap in Card if title is provided
  if (title) {
    return (
      <Card 
        className={className}
        style={{ width, height: height + 60 }} // Add space for title
      >
        <Title className="text-center mb-4">{title}</Title>
        {chartContent}
        
        {/* Performance info in development */}
        {process.env.NODE_ENV === 'development' && data.length !== optimizedData.length && (
          <div className="text-xs text-gray-400 mt-2 text-center">
            Showing {optimizedData.length} of {data.length} items
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
      
      {/* Performance info in development */}
      {process.env.NODE_ENV === 'development' && data.length !== optimizedData.length && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          Showing {optimizedData.length} of {data.length} items
        </div>
      )}
    </div>
  );
});

export default TremorBarChart;