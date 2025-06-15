/**
 * Optimized Tremor Donut Chart
 * 
 * Performance-optimized wrapper for Tremor's DonutChart with Azure B1 constraints
 */

'use client';

import React, { memo, useMemo } from 'react';
import { DonutChart, Card, Title, Legend } from '@tremor/react';
import type { ChartDataPoint } from '@/types/crm';

interface TremorDonutChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabel?: boolean;
  innerRadius?: number;
  category?: string;
  index?: string;
  onMount?: () => void;
  className?: string;
  variant?: 'donut' | 'pie';
}

const TremorDonutChart = memo(function TremorDonutChart({
  data,
  width,
  height = 300,
  title,
  colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'indigo'],
  showLegend = true,
  showTooltip = true,
  showLabel = true,
  category = 'value',
  index = 'name',
  onMount,
  className = '',
  variant = 'donut'
}: TremorDonutChartProps) {
  
  // Transform data for Tremor format
  const tremorData = useMemo(() => {
    return data.map((item, idx) => ({
      [index]: item.name,
      [category]: item.value,
      category: item.category || 'default',
      color: colors[idx % colors.length],
      ...item
    }));
  }, [data, index, category, colors]);

  // Performance optimization: limit slices for Azure B1
  const optimizedData = useMemo(() => {
    if (tremorData.length <= 8) return tremorData;
    
    // For large datasets, show top 7 slices + "Others"
    const sorted = [...tremorData].sort((a, b) => b[category] - a[category]);
    const topSlices = sorted.slice(0, 7);
    const remaining = sorted.slice(7);
    
    if (remaining.length > 0) {
      const othersValue = remaining.reduce((sum, item) => sum + item[category], 0);
      topSlices.push({
        [index]: `Others (${remaining.length})`,
        [category]: othersValue,
        category: 'aggregated',
        color: 'gray'
      });
    }
    
    return topSlices;
  }, [tremorData, category, index]);

  // Calculate total for percentage calculations
  const total = useMemo(() => {
    return optimizedData.reduce((sum, item) => sum + item[category], 0);
  }, [optimizedData, category]);

  // Enhanced data with percentages for better tooltips
  const enhancedData = useMemo(() => {
    return optimizedData.map(item => ({
      ...item,
      percentage: total > 0 ? ((item[category] / total) * 100).toFixed(1) : '0',
      displayValue: `${item[category]} (${total > 0 ? ((item[category] / total) * 100).toFixed(1) : '0'}%)`
    }));
  }, [optimizedData, total, category]);

  // Chart configuration optimized for performance
  const chartConfig = useMemo(() => ({
    colors: optimizedData.map(item => item.color || colors[optimizedData.indexOf(item) % colors.length]),
    showTooltip,
    showLabel,
    // Performance optimizations
    animation: tremorData.length < 10, // Disable animation for many slices
    innerRadius: variant === 'donut' ? 40 : 0
  }), [optimizedData, colors, showTooltip, showLabel, tremorData.length, variant]);

  React.useEffect(() => {
    onMount?.();
  }, [onMount]);

  // Performance warning for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && data.length > 12) {
      console.warn(`TremorDonutChart: Many slices (${data.length}) may impact readability and performance`);
    }
  }, [data.length]);

  // Custom value formatter for better display
  const valueFormatter = (value: number) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    return `${value.toLocaleString()} (${percentage}%)`;
  };

  const chartContent = (
    <DonutChart
      data={enhancedData}
      category={category}
      index={index}
      colors={chartConfig.colors}
      showTooltip={chartConfig.showTooltip}
      showLabel={chartConfig.showLabel}
      valueFormatter={valueFormatter}
      className={`h-${Math.floor(height / 4)}`}
    />
  );

  // Custom legend for better space utilization
  const customLegend = showLegend && (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
        {enhancedData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: chartConfig.colors[index] }}
            />
            <span className="text-gray-600 truncate" title={item[index]}>
              {item[index]}
            </span>
            <span className="text-gray-500 text-xs ml-auto">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Summary statistics
  const summaryStats = (
    <div className="mt-2 text-center">
      <div className="text-2xl font-bold text-gray-800">
        {total.toLocaleString()}
      </div>
      <div className="text-sm text-gray-500">
        Total ({optimizedData.length} {optimizedData.length === 1 ? 'item' : 'items'})
      </div>
    </div>
  );

  // Wrap in Card if title is provided
  if (title) {
    return (
      <Card 
        className={className}
        style={{ width, minHeight: height + (showLegend ? 100 : 60) }}
      >
        <Title className="text-center mb-4">{title}</Title>
        
        <div className="flex flex-col items-center">
          {chartContent}
          {variant === 'donut' && summaryStats}
          {customLegend}
        </div>
        
        {/* Performance info in development */}
        {process.env.NODE_ENV === 'development' && data.length !== optimizedData.length && (
          <div className="text-xs text-gray-400 mt-2 text-center">
            Showing {optimizedData.length} of {data.length} slices
          </div>
        )}
      </Card>
    );
  }

  return (
    <div 
      className={className}
      style={{ width, minHeight: height + (showLegend ? 80 : 0) }}
    >
      <div className="flex flex-col items-center">
        {chartContent}
        {variant === 'donut' && summaryStats}
        {customLegend}
      </div>
      
      {/* Performance info in development */}
      {process.env.NODE_ENV === 'development' && data.length !== optimizedData.length && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          Showing {optimizedData.length} of {data.length} slices
        </div>
      )}
    </div>
  );
});

export default TremorDonutChart;