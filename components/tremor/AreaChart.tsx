"use client";

import { OptimizedAreaChart } from "./OptimizedAreaChart";
import { type ChartDataPoint } from "@/utils/chartDataProcessor";

interface AreaChartDemoProps {
  chartData: ChartDataPoint[];
  title: string;
}

export const AreaChartDemo = ({ chartData, title }: AreaChartDemoProps) => (
  <OptimizedAreaChart
    data={chartData}
    title={title}
    categories={["value"]}
    colors={["blue"]}
    showLegend={false}
    showGridLines={false}
    enableTooltip={true}
  />
);
