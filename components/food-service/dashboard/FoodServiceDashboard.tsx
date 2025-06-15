/**
 * Food Service CRM Dashboard
 * 
 * Comprehensive dashboard optimized for iPad landscape mode.
 * Integrates all architectural patterns: SSR charts, optimized queries,
 * responsive components, and performance monitoring.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Suspense } from 'react';
import { Building2, Users, MessageSquare, Target, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import SSRChartWrapper, { CRMCharts } from '@/components/charts/SSRChartWrapper';
import OrganizationCard from '@/components/food-service/core/OrganizationCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { 
  DashboardMetrics,
  OrganizationSummary,
  ChartDataPoint,
  InteractionSummary
} from '@/types/crm';

interface FoodServiceDashboardProps {
  metrics?: DashboardMetrics;
  recentOrganizations?: OrganizationSummary[];
  recentInteractions?: InteractionSummary[];
  className?: string;
  onQuickAction?: (action: string, data?: any) => void;
}

// Mock data for demonstration (in real app, this comes from API)
const MOCK_METRICS: DashboardMetrics = {
  organizations: {
    total: 247,
    byPriority: { A: 42, B: 86, C: 94, D: 25 },
    bySegment: { 
      FINE_DINING: 45,
      FAST_FOOD: 68,
      CASUAL_DINING: 89,
      CATERING: 23,
      INSTITUTIONAL: 12,
      HEALTHCARE: 8,
      EDUCATION: 1,
      CORPORATE: 1
    },
    byStatus: { ACTIVE: 220, INACTIVE: 15, LEAD: 12 },
    recentlyAdded: 8,
    needingFollowUp: 23
  },
  interactions: {
    total: 1456,
    thisWeek: 47,
    byType: {
      CALL: 623,
      EMAIL: 298,
      IN_PERSON: 267,
      DEMO_SAMPLED: 145,
      QUOTED_PRICE: 89,
      FOLLOW_UP: 34
    },
    byOutcome: {
      POSITIVE: 672,
      NEUTRAL: 534,
      NEGATIVE: 156,
      FOLLOW_UP_NEEDED: 94
    }
  },
  opportunities: {
    total: 89,
    totalValue: 2340000,
    byStage: {
      LEAD_DISCOVERY: 23,
      CONTACTED: 28,
      SAMPLED_VISITED: 19,
      FOLLOW_UP: 12,
      CLOSE: 7
    },
    averageProbability: 68,
    closingThisMonth: 14
  },
  performance: {
    averageResponseTime: 850,
    topPerformingSegments: [
      { segment: 'FINE_DINING', conversionRate: 34, averageValue: 85000 },
      { segment: 'CASUAL_DINING', conversionRate: 28, averageValue: 42000 },
      { segment: 'CATERING', conversionRate: 41, averageValue: 28000 }
    ]
  }
};

// Dashboard tile configuration
const DASHBOARD_TILES = [
  {
    id: 'total-accounts',
    title: 'Total Accounts',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'active-contacts',
    title: 'Active Contacts',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'this-week-interactions',
    title: 'This Week',
    icon: MessageSquare,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'pipeline-value',
    title: 'Pipeline Value',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
];

export default function FoodServiceDashboard({
  metrics = MOCK_METRICS,
  recentOrganizations = [],
  recentInteractions = [],
  className,
  onQuickAction
}: FoodServiceDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Transform metrics data for charts
  const priorityChartData: ChartDataPoint[] = useMemo(() => {
    return Object.entries(metrics.organizations.byPriority).map(([priority, count]) => ({
      name: `Priority ${priority}`,
      value: count,
      category: priority
    }));
  }, [metrics.organizations.byPriority]);

  const segmentChartData: ChartDataPoint[] = useMemo(() => {
    return Object.entries(metrics.organizations.bySegment)
      .filter(([_, count]) => count > 0)
      .map(([segment, count]) => ({
        name: segment.replace('_', ' '),
        value: count,
        category: segment
      }));
  }, [metrics.organizations.bySegment]);

  const interactionChartData: ChartDataPoint[] = useMemo(() => {
    return Object.entries(metrics.interactions.byType).map(([type, count]) => ({
      name: type.replace('_', ' '),
      value: count,
      category: type
    }));
  }, [metrics.interactions.byType]);

  const pipelineChartData: ChartDataPoint[] = useMemo(() => {
    return Object.entries(metrics.opportunities.byStage).map(([stage, count]) => ({
      name: stage.replace('_', ' '),
      value: count,
      category: stage
    }));
  }, [metrics.opportunities.byStage]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // In real app, this would refetch data
      await new Promise(resolve => setTimeout(resolve, 1000));
      onQuickAction?.('refresh-dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24" />
          ))}
        </div>
        
        {/* Skeleton charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food Service Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Territory performance and key metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'quarter'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-all',
                  'min-h-[36px]',
                  selectedTimeframe === timeframe
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="min-h-[36px]"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_TILES.map((tile, index) => {
          const Icon = tile.icon;
          let value: string | number = '';
          let subtitle = '';
          
          switch (tile.id) {
            case 'total-accounts':
              value = metrics.organizations.total;
              subtitle = `${metrics.organizations.recentlyAdded} added this week`;
              break;
            case 'active-contacts':
              value = metrics.organizations.byStatus.ACTIVE;
              subtitle = `${metrics.organizations.needingFollowUp} need follow-up`;
              break;
            case 'this-week-interactions':
              value = metrics.interactions.thisWeek;
              subtitle = `${metrics.interactions.total} total`;
              break;
            case 'pipeline-value':
              value = formatCurrency(metrics.opportunities.totalValue);
              subtitle = `${metrics.opportunities.closingThisMonth} closing this month`;
              break;
          }
          
          return (
            <Card key={tile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{tile.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                  </div>
                  <div className={cn('p-3 rounded-lg', tile.bgColor)}>
                    <Icon className={cn('w-6 h-6', tile.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Account Priority Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary
              fallback={
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Chart unavailable
                </div>
              }
            >
              <Suspense fallback={
                <div className="h-[300px] bg-gray-50 rounded animate-pulse" />
              }>
                <CRMCharts.PriorityDistribution data={priorityChartData} />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Segment Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-green-600" />
              <span>Segment Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary
              fallback={
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Chart unavailable
                </div>
              }
            >
              <Suspense fallback={
                <div className="h-[300px] bg-gray-50 rounded animate-pulse" />
              }>
                <SSRChartWrapper
                  type="bar"
                  data={segmentChartData}
                  height={300}
                  colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
                />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Interaction Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <span>Interaction Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary
              fallback={
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Chart unavailable
                </div>
              }
            >
              <Suspense fallback={
                <div className="h-[300px] bg-gray-50 rounded animate-pulse" />
              }>
                <SSRChartWrapper
                  type="donut"
                  data={interactionChartData}
                  height={300}
                  pieConfig={{ innerRadius: 60 }}
                />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Sales Pipeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary
              fallback={
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Chart unavailable
                </div>
              }
            >
              <Suspense fallback={
                <div className="h-[300px] bg-gray-50 rounded animate-pulse" />
              }>
                <CRMCharts.PipelineFunnel data={pipelineChartData} />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Organizations</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickAction?.('view-all-organizations')}
                className="min-h-[36px]"
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrganizations.length > 0 ? (
              recentOrganizations.slice(0, 3).map((org) => (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  compact
                  showQuickActions={false}
                  onClick={() => onQuickAction?.('view-organization', org)}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No recent organizations
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alerts and Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Action Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.organizations.needingFollowUp > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-900">Follow-ups Needed</p>
                  <p className="text-sm text-orange-700">
                    {metrics.organizations.needingFollowUp} accounts require attention
                  </p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {metrics.organizations.needingFollowUp}
                </Badge>
              </div>
            )}
            
            {metrics.opportunities.closingThisMonth > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Closing This Month</p>
                  <p className="text-sm text-blue-700">
                    {metrics.opportunities.closingThisMonth} opportunities need attention
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {metrics.opportunities.closingThisMonth}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">This Week's Goal</p>
                <p className="text-sm text-green-700">
                  {Math.round(metrics.interactions.thisWeek / 7 * 5)} interactions per day target
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                On Track
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Footer */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Dashboard Performance</span>
              <div className="flex items-center space-x-4">
                <span>Avg Response: {metrics.performance.averageResponseTime}ms</span>
                <span>Charts: SSR Optimized</span>
                <span>Cache: Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}