'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
  // Transform data for Recharts format
  const chartData = data.map((item, index) => ({
    name: item.segment,
    value: item.count,
    color: item.color || colors[index % colors.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              label={showLabel ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {enableTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-gray-700">{value}</span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
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