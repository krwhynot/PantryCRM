"use client";

import { Card, Title } from "@tremor/react";
import { memo, useMemo } from "react";
import SSRChartWrapper from '@/components/charts/SSRChartWrapper';
import type { ChartDataPoint } from '@/types/crm';
import { useChartCleanup, useChartDimensions, useChartPerformance, useChartAnimation } from "@/hooks/useChartOptimization";
import { dataFormatter } from "@/utils/chartDataProcessor";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface OptimizedAreaChartProps {
  data: ChartDataPoint[];
  title: string;
  categories?: string[];
  colors?: string[];
  className?: string;
  showLegend?: boolean;
  showGridLines?: boolean;
  enableTooltip?: boolean;
}

export const OptimizedAreaChart = memo<OptimizedAreaChartProps>(({ 
  data, 
  title, 
  categories = ["value"],
  colors = ["blue"],
  className = "",
  showLegend,
  showGridLines = false,
  enableTooltip = true
}) => {
  const chartRef = useChartCleanup();
  const dimensions = useChartDimensions();
  const enableAnimation = useChartAnimation(data?.length || 0);
  
  // Performance monitoring
  useChartPerformance(`OptimizedAreaChart-${title}`);

  // Memoized chart data processing
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    
    return data
      .filter(item => item != null && typeof item.value === 'number')
      .map(item => ({
        ...item,
        value: Number(item.value.toFixed(2))
      }));
  }, [data]);

  // Memoized chart configuration
  const chartConfig = useMemo(() => ({
    height: dimensions.height,
    showXAxis: dimensions.showXAxis,
    showYAxis: dimensions.showYAxis,
    showLegend: showLegend ?? dimensions.showLegend,
    showGridLines,
    showAnimation: enableAnimation,
    enableTouchEvents: !dimensions.showYAxis, // Enable touch for mobile
    connectNulls: false,
    autoMinValue: true,
    minValue: 0
  }), [dimensions, showLegend, showGridLines, enableAnimation]);

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
    <ErrorBoundary>
      <Card className={`tremor-chart-container ${className}`} ref={chartRef}>
        <Title className="text-sm sm:text-base">{title}</Title>
        <div className="mt-6">
          <SSRChartWrapper
            type="area"
            data={chartData}
            height={chartConfig.height}
            colors={colors}
            legend={chartConfig.showLegend}
            tooltip={enableTooltip}
            enableVirtualization={true}
            maxDataPoints={100}
            lineConfig={{
              smooth: true,
              fill: true,
              showPoints: false
            }}
            className="w-full"
          />
        </div>
      </Card>
    </ErrorBoundary>
  );
});

OptimizedAreaChart.displayName = "OptimizedAreaChart";