"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const dataFormatter = (number: number) => {
  return Intl.NumberFormat("us").format(number).toString();
};

export const AreaChartDemo = ({ chartData, title }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={288}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => [dataFormatter(Number(value)), "Number"]} />
          <Area type="monotone" dataKey="Number" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
