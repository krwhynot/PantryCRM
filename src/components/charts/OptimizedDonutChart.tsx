'use client';

import React from 'react';
import SSRChartWrapper from '@/components/charts/SSRChartWrapper';
import type { ChartDataPoint } from '@/types/crm';

interface ChartData {
  segment: string;
  count: number;
  color?: string;
}

interface OptimizedDonutChartProps {
  data: ChartData[];
  title: string;
  colors?: string[];
  className?: string;
  showLegend?: boolean;
  enableTooltip?: boolean;
  showLabel?: boolean;
}

// Color palette optimized for accessibility
const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#06B6D4', // cyan  
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#D946EF', // fuchsia
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
];

const OptimizedDonutChart: React.FC<OptimizedDonutChartProps> = ({
  data,
  title,
  colors = DEFAULT_COLORS,
  className = '',
  showLegend = true,
  enableTooltip = true,
  showLabel = false
}) => {
  // Transform data to ChartDataPoint format
  const chartData: ChartDataPoint[] = data.map((item, index) => ({
    name: item.segment,
    value: item.count,
    category: 'segment'
  }));

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="h-80">
        <SSRChartWrapper
          type="donut"
          data={chartData}
          height={320}
          colors={colors}
          legend={showLegend}
          tooltip={enableTooltip}
          enableVirtualization={true}
          maxDataPoints={10}
          pieConfig={{
            innerRadius: 60,
            outerRadius: 120
          }}
          className="w-full"
        />
      </div>
      
      {/* Fallback data display for SSR */}
      <noscript>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {chartData.map((item) => (
            <div key={item.name} className="flex justify-between p-2 bg-gray-50 rounded">
              <span>{item.name}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </noscript>
    </div>
  );
};

export default OptimizedDonutChart;