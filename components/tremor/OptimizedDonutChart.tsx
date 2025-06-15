"use client";

import { Card, Title, Legend } from "@tremor/react";
import { memo, useMemo } from "react";
import SSRChartWrapper from '@/components/charts/SSRChartWrapper';
import type { ChartDataPoint } from '@/types/crm';
import { useChartCleanup, useChartDimensions, useChartPerformance } from "@/hooks/useChartOptimization";
import { dataFormatter, useSegmentData } from "@/utils/chartDataProcessor";

interface SegmentData {
  segment: string;
  count: number;
}

interface OptimizedDonutChartProps {
  data: SegmentData[];
  title: string;
  colors?: string[];
  className?: string;
  showLegend?: boolean;
  enableTooltip?: boolean;
  showLabel?: boolean;
}

export const OptimizedDonutChart = memo<OptimizedDonutChartProps>(({ 
  data, 
  title, 
  colors = ["blue", "cyan", "indigo", "violet", "fuchsia"],
  className = "",
  showLegend = true,
  enableTooltip = true,
  showLabel = false
}) => {
  const chartRef = useChartCleanup();
  const dimensions = useChartDimensions();
  
  // Performance monitoring
  useChartPerformance(`OptimizedDonutChart-${title}`);

  // Process segment data with optimization
  const chartData = useSegmentData(data);

  // Memoized chart configuration
  const chartConfig = useMemo(() => ({
    height: Math.min(dimensions.height, 250), // Donut charts work better with square aspect ratio
    showLegend: showLegend && dimensions.showLegend,
    showLabel,
    enableTouchEvents: !dimensions.showYAxis, // Enable touch for mobile
  }), [dimensions, showLegend, showLabel]);

  // Calculate total for percentage display
  const total = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0), 
    [chartData]
  );

  if (!chartData.length) {
    return (
      <Card className={`tremor-chart-container ${className}`} ref={chartRef}>
        <Title className="text-sm sm:text-base">{title}</Title>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card className={`tremor-chart-container ${className}`} ref={chartRef}>
      <Title className="text-sm sm:text-base">{title}</Title>
      
      <div className="mt-6">
        <SSRChartWrapper
          type="donut"
          data={chartData}
          height={chartConfig.height}
          colors={colors}
          legend={chartConfig.showLegend}
          tooltip={enableTooltip}
          enableVirtualization={true}
          maxDataPoints={10}
          pieConfig={{
            innerRadius: 60,
            outerRadius: Math.min(chartConfig.height / 2 - 10, 100)
          }}
          className="w-full"
        />
      </div>
      
      {chartConfig.showLegend && (
        <Legend
          className="mt-6"
          categories={chartData.map(item => item.name)}
          colors={colors.slice(0, chartData.length)}
        />
      )}
      
      {/* Mobile-friendly summary */}
      {!dimensions.showLegend && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-600 text-center">
            Total: {dataFormatter(total)}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {chartData.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: `var(--tremor-brand-${colors[index % colors.length]})` }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-medium">{dataFormatter(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
});

OptimizedDonutChart.displayName = "OptimizedDonutChart";