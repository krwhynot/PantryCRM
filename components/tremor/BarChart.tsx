"use client";

import { OptimizedBarChart } from "./OptimizedBarChart";
import { type ChartDataPoint } from "@/utils/chartDataProcessor";

interface BarChartDemoProps {
  chartData: ChartDataPoint[];
  title: string;
}

export const BarChartDemo = ({ chartData, title }: BarChartDemoProps) => {
  return (
    <OptimizedBarChart
      data={chartData}
      title={title}
      categories={["value"]}
      colors={["blue"]}
      className="rounded-md"
      showLegend={false}
      showGridLines={false}
      enableTooltip={true}
      layout="vertical"
    />
  );
};
