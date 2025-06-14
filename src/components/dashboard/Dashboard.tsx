import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Inline fallback chart component to test SSR fixes
const FallbackChart: React.FC<{
  data: { segment: string; count: number }[];
  title: string;
  colors?: string[];
  className?: string;
  [key: string]: any;
}> = ({ data, title, colors = ["#3B82F6", "#06B6D4", "#6366F1", "#8B5CF6", "#D946EF"], className = '' }) => {
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
        ✅ SSR-compatible fallback chart (Recharts will be added after validation)
      </p>
    </div>
  );
};

interface Interaction {
  id: string;
  organizationName: string;
  type: string;
  date: string;
  userName: string;
}

interface DashboardProps {
  organizationCount: number;
  recentInteractions: Interaction[];
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
            <div className="space-y-2" data-testid="recent-interactions">
              {recentInteractions.map((interaction) => (
                <div key={interaction.id} className="text-sm">
                  <div className="font-medium">{interaction.organizationName}</div>
                  <div className="text-muted-foreground">
                    {interaction.type} • {interaction.date} • {interaction.userName}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <FallbackChart
          data={segmentData}
          title="Organizations by Segment"
          colors={["#3B82F6", "#06B6D4", "#6366F1", "#8B5CF6", "#D946EF"]}
          className="w-full"
          showLegend={true}
          enableTooltip={true}
          showLabel={false}
        />
      </div>
    </div>
  );
};
