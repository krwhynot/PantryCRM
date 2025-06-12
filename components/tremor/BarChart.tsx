"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const dataFormatter = (number: number) => {
  // return number no decimal places
  return number.toFixed(0);
};

export const BarChartDemo = ({ chartData, title }: any) => {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis width={48} />
            <Tooltip formatter={(value) => [dataFormatter(Number(value)), "Number"]} />
            <Bar dataKey="Number" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
