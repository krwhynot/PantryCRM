'use client';

import React from 'react';

interface ChartData {
  segment: string;
  count: number;
  color?: string;
}

interface FallbackChartProps {
  data: ChartData[];
  title: string;
  colors?: string[];
  className?: string;
  showLegend?: boolean;
  enableTooltip?: boolean;
  showLabel?: boolean;
}

const FallbackChart: React.FC<FallbackChartProps> = ({
  data,
  title,
  colors = ["#3B82F6", "#06B6D4", "#6366F1", "#8B5CF6", "#D946EF"],
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = ((item.count / total) * 100).toFixed(1);
          const color = colors[index % colors.length];
          
          return (
            <div key={item.segment} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="font-medium text-gray-900">{item.segment}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{item.count}</div>
                <div className="text-sm text-gray-500">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm font-medium text-gray-700">
          <span>Total Organizations</span>
          <span>{total}</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Interactive chart will be available once Recharts is installed
      </p>
    </div>
  );
};

export default FallbackChart;