/**
 * Fallback Chart Component
 * 
 * Lightweight fallback for when chart libraries fail to load.
 * Uses pure CSS and SVG for basic visualization without external dependencies.
 */

import React from 'react';
import type { ChartDataPoint, ChartType } from '@/types/crm';

interface FallbackChartProps {
  type: ChartType;
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  colors?: string[];
  title?: string;
}

export function FallbackChart({
  type,
  data,
  width = 400,
  height = 300,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  title
}: FallbackChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const renderBarChart = () => {
    const barWidth = (width - 60) / data.length - 10;
    const chartHeight = height - 60;

    return (
      <svg width={width} height={height} className="fallback-chart">
        {/* Background */}
        <rect width={width} height={height} fill="#f9fafb" rx={8} />
        
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((percent, i) => (
          <line
            key={i}
            x1={40}
            y1={40 + (chartHeight - 40) * (1 - percent)}
            x2={width - 20}
            y2={40 + (chartHeight - 40) * (1 - percent)}
            stroke="#e5e7eb"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (chartHeight - 40);
          const x = 50 + index * (barWidth + 10);
          const y = height - 20 - barHeight;
          const color = colors[index % colors.length];
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={2}
                className="transition-all duration-300 hover:opacity-80"
              />
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.value}
              </text>
              {/* Name label */}
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                className="text-xs fill-gray-500"
                transform={`rotate(-45, ${x + barWidth / 2}, ${height - 5})`}
              >
                {item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name}
              </text>
            </g>
          );
        })}
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => (
          <text
            key={i}
            x={35}
            y={40 + (chartHeight - 40) * (1 - percent) + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {Math.round(maxValue * percent)}
          </text>
        ))}
      </svg>
    );
  };

  const renderPieChart = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    let currentAngle = 0;
    const paths = data.map((item, index) => {
      const percentage = item.value / totalValue;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      currentAngle += angle;
      
      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      const color = colors[index % colors.length];
      
      return (
        <g key={index}>
          <path
            d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
            fill={color}
            className="transition-all duration-300 hover:opacity-80"
          />
          {/* Label */}
          {percentage > 0.05 && (
            <text
              x={centerX + (radius * 0.7) * Math.cos((startAngle + angle / 2 - 90) * Math.PI / 180)}
              y={centerY + (radius * 0.7) * Math.sin((startAngle + angle / 2 - 90) * Math.PI / 180)}
              textAnchor="middle"
              className="text-xs fill-white font-medium"
            >
              {Math.round(percentage * 100)}%
            </text>
          )}
        </g>
      );
    });

    return (
      <svg width={width} height={height} className="fallback-chart">
        <rect width={width} height={height} fill="#f9fafb" rx={8} />
        {paths}
      </svg>
    );
  };

  const renderLineChart = () => {
    const chartWidth = width - 60;
    const chartHeight = height - 60;
    const stepX = chartWidth / (data.length - 1);
    
    const points = data.map((item, index) => ({
      x: 40 + index * stepX,
      y: 40 + (chartHeight - 40) * (1 - item.value / maxValue)
    }));
    
    const pathData = points.reduce((path, point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
    }, '');

    return (
      <svg width={width} height={height} className="fallback-chart">
        <rect width={width} height={height} fill="#f9fafb" rx={8} />
        
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((percent, i) => (
          <line
            key={i}
            x1={40}
            y1={40 + (chartHeight - 40) * (1 - percent)}
            x2={width - 20}
            y2={40 + (chartHeight - 40) * (1 - percent)}
            stroke="#e5e7eb"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={colors[0]}
          strokeWidth={2}
          className="transition-all duration-300"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={colors[0]}
            className="transition-all duration-300 hover:r-6"
          />
        ))}
        
        {/* X-axis labels */}
        {data.map((item, index) => (
          <text
            key={index}
            x={40 + index * stepX}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {item.name.length > 6 ? item.name.substring(0, 6) + '...' : item.name}
          </text>
        ))}
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => (
          <text
            key={i}
            x={35}
            y={40 + (chartHeight - 40) * (1 - percent) + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {Math.round(maxValue * percent)}
          </text>
        ))}
      </svg>
    );
  };

  const renderAreaChart = () => {
    const chartWidth = width - 60;
    const chartHeight = height - 60;
    const stepX = chartWidth / (data.length - 1);
    
    const points = data.map((item, index) => ({
      x: 40 + index * stepX,
      y: 40 + (chartHeight - 40) * (1 - item.value / maxValue)
    }));
    
    const lineData = points.reduce((path, point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
    }, '');
    
    const areaData = `${lineData} L ${points[points.length - 1].x} ${height - 20} L ${points[0].x} ${height - 20} Z`;

    return (
      <svg width={width} height={height} className="fallback-chart">
        <rect width={width} height={height} fill="#f9fafb" rx={8} />
        
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((percent, i) => (
          <line
            key={i}
            x1={40}
            y1={40 + (chartHeight - 40) * (1 - percent)}
            x2={width - 20}
            y2={40 + (chartHeight - 40) * (1 - percent)}
            stroke="#e5e7eb"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Area */}
        <path
          d={areaData}
          fill={colors[0]}
          fillOpacity={0.3}
        />
        
        {/* Line */}
        <path
          d={lineData}
          fill="none"
          stroke={colors[0]}
          strokeWidth={2}
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={colors[0]}
          />
        ))}
        
        {/* Labels (same as line chart) */}
        {data.map((item, index) => (
          <text
            key={index}
            x={40 + index * stepX}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {item.name.length > 6 ? item.name.substring(0, 6) + '...' : item.name}
          </text>
        ))}
        
        {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => (
          <text
            key={i}
            x={35}
            y={40 + (chartHeight - 40) * (1 - percent) + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {Math.round(maxValue * percent)}
          </text>
        ))}
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
      case 'donut':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  };

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fallback-chart-container">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-2 text-center">
          {title}
        </h3>
      )}
      
      {renderChart()}
      
      {/* Legend for pie/donut charts */}
      {(type === 'pie' || type === 'donut') && (
        <div className="flex flex-wrap justify-center mt-4 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded mr-1"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-gray-600">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-center mt-2">
        <span className="text-xs text-gray-400">
          Fallback chart (lightweight mode)
        </span>
      </div>
    </div>
  );
}

export default FallbackChart;