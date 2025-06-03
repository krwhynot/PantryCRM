import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Title } from "@tremor/react";

interface DashboardProps {
  organizationCount: number;
  recentInteractions: number;
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  organizationCount,
  recentInteractions,
  className = ''
}) => {
  // Dummy data for Tremor chart - replace with actual data fetching
  const segmentData = [
    { segment: 'Fine Dining', count: 120 },
    { segment: 'Fast Food', count: 80 },
    { segment: 'Healthcare', count: 50 },
    { segment: 'Catering', count: 30 },
    { segment: 'Institutional', count: 20 },
  ];

  return (
    <div className={`p-6 ${className}`} data-testid="dashboard">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Kitchen Pantry CRM Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="dashboard-grid">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600" data-testid="organization-count">
              {organizationCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600" data-testid="recent-interactions">
              {recentInteractions}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Organizations by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            className="mt-4 h-72"
            data={segmentData}
            index="segment"
            categories={["count"]}
            colors={["blue"]}
            yAxisWidth={48}
          />
        </CardContent>
      </Card>
    </div>
  );
};
