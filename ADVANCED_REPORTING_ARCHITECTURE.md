# Advanced Reporting System Architecture

## Overview

Comprehensive reporting system for Kitchen Pantry CRM with customizable dashboards, scheduled reports, and food service industry-specific analytics optimized for Azure B1 constraints.

---

## Core Requirements

### Business Requirements
- **Executive Dashboards**: High-level KPIs for management
- **Sales Performance**: Territory, segment, and individual performance tracking
- **Pipeline Analytics**: Opportunity progression and forecasting
- **Activity Reports**: Interaction tracking and follow-up management
- **Food Service Metrics**: Industry-specific analytics (segment performance, seasonal trends)
- **Custom Reports**: User-configurable reports with filters and grouping

### Technical Requirements
- **Real-time Data**: Live dashboard updates with WebSocket support
- **Export Capabilities**: PDF, Excel, CSV export formats
- **Scheduled Reports**: Automated email delivery
- **Mobile Optimization**: Touch-friendly charts and tables
- **Performance**: Sub-2 second load times on Azure B1 (5 DTU)

---

## Architecture Components

### 1. Report Configuration System

```typescript
// types/reporting.ts
interface ReportConfig {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  dataSource: DataSource;
  visualizations: VisualizationConfig[];
  filters: FilterConfig[];
  groupBy: GroupByConfig[];
  sortBy: SortConfig[];
  refreshInterval?: number; // seconds
  scheduledDelivery?: ScheduleConfig;
  permissions: ReportPermissions;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VisualizationConfig {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'gauge' | 'heatmap';
  chartType?: 'bar' | 'line' | 'area' | 'donut' | 'funnel';
  dataField: string;
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  styling: VisualizationStyling;
}

interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'between' | 'in';
  value: any;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'multiselect';
  options?: { label: string; value: any }[];
}

type ReportCategory = 
  | 'executive' 
  | 'sales' 
  | 'pipeline' 
  | 'activity' 
  | 'food-service' 
  | 'custom';
```

### 2. Data Processing Engine

```typescript
// lib/reporting/data-engine.ts
class ReportDataEngine {
  private cache = new Map<string, CachedResult>();
  
  async generateReportData(
    config: ReportConfig,
    userId: string,
    timeRange?: DateRange
  ): Promise<ReportData> {
    
    // Check cache first (important for Azure B1 DTU conservation)
    const cacheKey = this.generateCacheKey(config, timeRange);
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached, config.refreshInterval)) {
      return cached.data;
    }
    
    // Build optimized query based on config
    const query = await this.buildOptimizedQuery(config, userId, timeRange);
    
    // Execute with performance monitoring
    const startTime = Date.now();
    const rawData = await this.executeQuery(query);
    const queryTime = Date.now() - startTime;
    
    // Transform data for visualizations
    const transformedData = await this.transformData(rawData, config);
    
    // Cache result
    this.cache.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now(),
      queryTime,
      recordCount: rawData.length
    });
    
    return transformedData;
  }
  
  private async buildOptimizedQuery(
    config: ReportConfig,
    userId: string,
    timeRange?: DateRange
  ): Promise<OptimizedQuery> {
    
    const queryBuilder = new QueryBuilder();
    
    // Base query optimization for Azure B1
    queryBuilder
      .withIndexHints(config.dataSource)
      .withRelationStrategy('join') // Use database JOINs vs N+1
      .withRowLimit(5000) // Hard limit for performance
      .withTimeout(30000); // 30 second timeout
    
    // Apply filters
    config.filters.forEach(filter => {
      queryBuilder.addFilter(filter);
    });
    
    // Apply time range
    if (timeRange) {
      queryBuilder.addDateRange(timeRange);
    }
    
    // Apply user permissions (row-level security)
    queryBuilder.addUserFilter(userId);
    
    return queryBuilder.build();
  }
}
```

### 3. Pre-built Report Templates

```typescript
// lib/reporting/templates/food-service-reports.ts
export const FOOD_SERVICE_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-dashboard',
    name: 'Executive Dashboard',
    category: 'executive',
    description: 'High-level KPIs and performance metrics',
    visualizations: [
      {
        id: 'revenue-pipeline',
        type: 'chart',
        chartType: 'bar',
        title: 'Revenue Pipeline by Segment',
        dataSource: 'organizations',
        aggregation: 'sum',
        dataField: 'estimatedRevenue',
        groupBy: ['segment'],
        position: { x: 0, y: 0, width: 6, height: 4 }
      },
      {
        id: 'conversion-funnel',
        type: 'chart',
        chartType: 'funnel',
        title: 'Lead to Customer Conversion',
        dataSource: 'pipeline-stages',
        aggregation: 'count',
        dataField: 'id',
        position: { x: 6, y: 0, width: 6, height: 4 }
      },
      {
        id: 'activity-summary',
        type: 'metric',
        title: 'This Month Activity',
        dataSource: 'interactions',
        aggregation: 'count',
        dataField: 'id',
        filters: [{ field: 'createdAt', operator: 'between', value: 'thisMonth' }],
        position: { x: 0, y: 4, width: 3, height: 2 }
      },
      {
        id: 'revenue-target',
        type: 'gauge',
        title: 'Revenue Target Progress',
        dataSource: 'organizations',
        aggregation: 'sum',
        dataField: 'estimatedRevenue',
        target: 1000000,
        position: { x: 3, y: 4, width: 3, height: 2 }
      }
    ]
  },
  
  {
    id: 'segment-performance',
    name: 'Food Service Segment Analysis',
    category: 'food-service',
    description: 'Performance analysis by restaurant segment',
    visualizations: [
      {
        id: 'segment-revenue',
        type: 'chart',
        chartType: 'donut',
        title: 'Revenue Distribution by Segment',
        dataSource: 'organizations',
        aggregation: 'sum',
        dataField: 'estimatedRevenue',
        groupBy: ['segment'],
        position: { x: 0, y: 0, width: 6, height: 6 }
      },
      {
        id: 'segment-count',
        type: 'chart',
        chartType: 'bar',
        title: 'Organization Count by Segment',
        dataSource: 'organizations',
        aggregation: 'count',
        dataField: 'id',
        groupBy: ['segment'],
        position: { x: 6, y: 0, width: 6, height: 6 }
      },
      {
        id: 'segment-table',
        type: 'table',
        title: 'Segment Performance Details',
        dataSource: 'segment-summary',
        columns: ['segment', 'count', 'avgRevenue', 'totalRevenue', 'conversionRate'],
        position: { x: 0, y: 6, width: 12, height: 4 }
      }
    ]
  },
  
  {
    id: 'sales-activity',
    name: 'Sales Activity Report',
    category: 'activity',
    description: 'Track interactions and follow-up activities',
    visualizations: [
      {
        id: 'activity-timeline',
        type: 'chart',
        chartType: 'line',
        title: 'Daily Activity Trend',
        dataSource: 'interactions',
        aggregation: 'count',
        dataField: 'id',
        groupBy: ['date'],
        position: { x: 0, y: 0, width: 12, height: 4 }
      },
      {
        id: 'interaction-types',
        type: 'chart',
        chartType: 'donut',
        title: 'Interaction Types',
        dataSource: 'interactions',
        aggregation: 'count',
        dataField: 'id',
        groupBy: ['type'],
        position: { x: 0, y: 4, width: 6, height: 4 }
      },
      {
        id: 'follow-up-queue',
        type: 'table',
        title: 'Upcoming Follow-ups',
        dataSource: 'follow-ups',
        columns: ['organization', 'contact', 'dueDate', 'type', 'notes'],
        filters: [{ field: 'dueDate', operator: 'between', value: 'next7days' }],
        position: { x: 6, y: 4, width: 6, height: 4 }
      }
    ]
  }
];
```

### 4. Dashboard Builder UI

```typescript
// components/reporting/DashboardBuilder.tsx
interface DashboardBuilderProps {
  reportConfig?: ReportConfig;
  onSave: (config: ReportConfig) => void;
  onCancel: () => void;
}

const DashboardBuilder = ({ reportConfig, onSave, onCancel }: DashboardBuilderProps) => {
  const [config, setConfig] = useState<ReportConfig>(reportConfig || createEmptyConfig());
  const [draggedVisualization, setDraggedVisualization] = useState<VisualizationConfig | null>(null);
  const [previewData, setPreviewData] = useState<ReportData | null>(null);
  
  return (
    <div className="h-screen flex">
      {/* Left Panel - Configuration */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <ReportConfigPanel
          config={config}
          onChange={setConfig}
          onPreview={handlePreview}
        />
      </div>
      
      {/* Center Panel - Canvas */}
      <div className="flex-1 bg-gray-50">
        <DashboardCanvas
          config={config}
          previewData={previewData}
          onVisualizationChange={handleVisualizationChange}
          onLayoutChange={handleLayoutChange}
        />
      </div>
      
      {/* Right Panel - Visualization Library */}
      <div className="w-64 bg-white border-l border-gray-200">
        <VisualizationLibrary
          onDragStart={setDraggedVisualization}
          availableFields={getAvailableFields(config.dataSource)}
        />
      </div>
      
      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave(config)}>
              Save Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 5. Real-time Dashboard Component

```typescript
// components/reporting/LiveDashboard.tsx
interface LiveDashboardProps {
  reportConfig: ReportConfig;
  refreshInterval?: number;
  isFullscreen?: boolean;
}

const LiveDashboard = ({ reportConfig, refreshInterval = 30000, isFullscreen }: LiveDashboardProps) => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // WebSocket connection for real-time updates
  const { socket, connected } = useWebSocket(`/api/reporting/live/${reportConfig.id}`);
  
  useEffect(() => {
    if (socket && connected) {
      socket.on('data-update', (newData: ReportData) => {
        setData(newData);
        setLastUpdated(new Date());
        setLoading(false);
      });
      
      socket.on('error', (error: string) => {
        setError(error);
        setLoading(false);
      });
    }
    
    return () => {
      socket?.off('data-update');
      socket?.off('error');
    };
  }, [socket, connected]);
  
  // Fallback polling if WebSocket unavailable
  useEffect(() => {
    if (!connected && refreshInterval > 0) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/reporting/data/${reportConfig.id}`);
          const newData = await response.json();
          setData(newData);
          setLastUpdated(new Date());
        } catch (err) {
          console.error('Failed to refresh dashboard data:', err);
        }
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [connected, refreshInterval, reportConfig.id]);
  
  if (loading) {
    return <DashboardSkeleton visualizations={reportConfig.visualizations} />;
  }
  
  if (error) {
    return <ErrorBoundary error={error} onRetry={() => window.location.reload()} />;
  }
  
  return (
    <div className={cn(
      'bg-gray-50 min-h-screen',
      isFullscreen ? 'p-2' : 'p-6'
    )}>
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{reportConfig.name}</h1>
            <p className="text-gray-600 mt-1">{reportConfig.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated ? formatRelativeTime(lastUpdated) : 'Never'}
            </div>
            
            <div className="flex items-center space-x-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                connected ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <span className="text-xs text-gray-500">
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <DashboardActions
              config={reportConfig}
              data={data}
              onExport={handleExport}
              onSchedule={handleSchedule}
              onShare={handleShare}
            />
          </div>
        </div>
      </div>
      
      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {reportConfig.visualizations.map(viz => (
          <div
            key={viz.id}
            className={cn(
              'bg-white rounded-lg border border-gray-200 shadow-sm',
              `col-span-${viz.position.width}`,
              `row-span-${viz.position.height}`
            )}
            style={{
              gridColumn: `span ${viz.position.width}`,
              minHeight: `${viz.position.height * 120}px`
            }}
          >
            <VisualizationRenderer
              config={viz}
              data={data?.[viz.id]}
              loading={!data}
              isFullscreen={isFullscreen}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## API Routes

### 1. Report Data Endpoint

```typescript
// app/api/reporting/data/[reportId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
): Promise<NextResponse<APIResponse<ReportData>>> {
  
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  try {
    const { reportId } = await params;
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const timeRange = parseTimeRange(searchParams.get('timeRange'));
    const filters = parseFilters(searchParams.get('filters'));
    const refresh = searchParams.get('refresh') === 'true';
    
    // Get report configuration
    const reportConfig = await getReportConfig(reportId, user.id);
    if (!reportConfig) {
      return createErrorResponse('Report not found', 404);
    }
    
    // Check permissions
    if (!hasReportAccess(user, reportConfig)) {
      return createErrorResponse('Insufficient permissions', 403);
    }
    
    // Generate report data
    const dataEngine = new ReportDataEngine();
    const reportData = await dataEngine.generateReportData(
      reportConfig,
      user.id,
      timeRange,
      { refresh, additionalFilters: filters }
    );
    
    // Add performance metadata
    const response = createSuccessResponse(reportData);
    response.headers.set('X-Query-Time', reportData.metadata.queryTime.toString());
    response.headers.set('X-Cache-Hit', reportData.metadata.fromCache ? 'true' : 'false');
    
    return response;
    
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

### 2. Export Endpoint

```typescript
// app/api/reporting/export/[reportId]/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { reportId: string } }
): Promise<NextResponse> {
  
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  try {
    const { reportId } = await params;
    const { format, options } = await req.json();
    
    // Get report data
    const reportConfig = await getReportConfig(reportId, user.id);
    const reportData = await new ReportDataEngine().generateReportData(reportConfig, user.id);
    
    // Generate export based on format
    let fileBuffer: Buffer;
    let contentType: string;
    let filename: string;
    
    switch (format) {
      case 'pdf':
        fileBuffer = await generatePDFReport(reportConfig, reportData, options);
        contentType = 'application/pdf';
        filename = `${reportConfig.name}-${formatDate(new Date())}.pdf`;
        break;
        
      case 'excel':
        fileBuffer = await generateExcelReport(reportConfig, reportData, options);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${reportConfig.name}-${formatDate(new Date())}.xlsx`;
        break;
        
      case 'csv':
        fileBuffer = await generateCSVReport(reportData, options);
        contentType = 'text/csv';
        filename = `${reportConfig.name}-${formatDate(new Date())}.csv`;
        break;
        
      default:
        return createErrorResponse('Unsupported export format', 400);
    }
    
    // Return file download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });
    
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

### 3. Schedule Report Endpoint

```typescript
// app/api/reporting/schedule/route.ts
export async function POST(req: NextRequest): Promise<NextResponse<APIResponse<ScheduledReport>>> {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  try {
    const { reportId, schedule, recipients, format } = await req.json();
    
    // Validate schedule configuration
    const validation = validateScheduleConfig(schedule);
    if (!validation.valid) {
      return handleValidationError(validation.errors);
    }
    
    // Create scheduled report
    const scheduledReport = await prismadb.scheduledReport.create({
      data: {
        reportId,
        userId: user.id,
        schedule: schedule,
        recipients: recipients,
        format: format,
        isActive: true,
        nextRunAt: calculateNextRun(schedule),
        createdAt: new Date()
      }
    });
    
    // Queue the first execution
    await queueReportExecution(scheduledReport.id, scheduledReport.nextRunAt);
    
    return createSuccessResponse(scheduledReport);
    
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

---

## Performance Optimizations

### 1. Query Optimization

```typescript
// lib/reporting/query-optimizer.ts
class QueryOptimizer {
  optimizeReportQuery(config: ReportConfig): OptimizedQuery {
    const query = new QueryBuilder();
    
    // Use appropriate indexes
    this.addIndexHints(query, config.dataSource);
    
    // Limit result sets
    query.limit(config.maxResults || 5000);
    
    // Use efficient aggregations
    if (config.groupBy.length > 0) {
      query.groupBy(config.groupBy);
      query.select(this.getAggregateSelects(config.visualizations));
    }
    
    // Optimize date ranges
    if (config.filters.some(f => f.field.includes('Date'))) {
      query.addIndex('composite_date_index');
    }
    
    // Use relation load strategy
    query.relationLoadStrategy('join');
    
    return query.build();
  }
  
  private addIndexHints(query: QueryBuilder, dataSource: string) {
    const indexMap = {
      'organizations': ['segment_priority_idx', 'created_date_idx'],
      'interactions': ['date_type_idx', 'organization_date_idx'],
      'contacts': ['organization_name_idx'],
      'opportunities': ['stage_date_idx']
    };
    
    const indexes = indexMap[dataSource] || [];
    indexes.forEach(index => query.useIndex(index));
  }
}
```

### 2. Caching Strategy

```typescript
// lib/reporting/cache-manager.ts
class ReportCacheManager {
  private redis = new RedisClient();
  
  async getCachedReport(
    reportId: string,
    userId: string,
    filters: any
  ): Promise<CachedReportData | null> {
    
    const cacheKey = this.generateCacheKey(reportId, userId, filters);
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      if (!this.isExpired(data)) {
        return data;
      }
    }
    
    return null;
  }
  
  async setCachedReport(
    reportId: string,
    userId: string,
    filters: any,
    data: ReportData,
    ttl: number = 300 // 5 minutes default
  ): Promise<void> {
    
    const cacheKey = this.generateCacheKey(reportId, userId, filters);
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000
    };
    
    await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheData));
  }
}
```

### 3. Background Processing

```typescript
// lib/reporting/background-processor.ts
class ReportProcessor {
  async processScheduledReports(): Promise<void> {
    const dueReports = await this.getDueReports();
    
    for (const report of dueReports) {
      try {
        await this.processReport(report);
        await this.scheduleNextRun(report);
      } catch (error) {
        await this.handleReportError(report, error);
      }
    }
  }
  
  private async processReport(report: ScheduledReport): Promise<void> {
    // Generate report data
    const config = await getReportConfig(report.reportId, report.userId);
    const data = await new ReportDataEngine().generateReportData(config, report.userId);
    
    // Generate export file
    const fileBuffer = await this.generateExportFile(data, report.format, config);
    
    // Send to recipients
    await this.deliverReport(report, fileBuffer, config.name);
    
    // Update execution log
    await this.logExecution(report.id, 'success');
  }
}
```

---

## Mobile Optimization

### 1. Responsive Dashboard Layout

```typescript
// components/reporting/MobileDashboard.tsx
const MobileDashboard = ({ reportConfig }: { reportConfig: ReportConfig }) => {
  const [activeVisualization, setActiveVisualization] = useState(0);
  const { isMobile } = useDeviceDetection();
  
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-lg font-semibold">{reportConfig.name}</h1>
          <div className="flex mt-2 space-x-2">
            {reportConfig.visualizations.map((viz, index) => (
              <button
                key={viz.id}
                onClick={() => setActiveVisualization(index)}
                className={cn(
                  'px-3 py-1 text-sm rounded-full transition-colors',
                  activeVisualization === index
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {viz.title}
              </button>
            ))}
          </div>
        </div>
        
        {/* Mobile Visualization */}
        <div className="p-4">
          <VisualizationRenderer
            config={reportConfig.visualizations[activeVisualization]}
            data={data?.[reportConfig.visualizations[activeVisualization].id]}
            isMobile={true}
          />
        </div>
        
        {/* Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setActiveVisualization(Math.max(0, activeVisualization - 1))}
              disabled={activeVisualization === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-500 self-center">
              {activeVisualization + 1} of {reportConfig.visualizations.length}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setActiveVisualization(Math.min(reportConfig.visualizations.length - 1, activeVisualization + 1))}
              disabled={activeVisualization === reportConfig.visualizations.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop layout
  return <LiveDashboard reportConfig={reportConfig} />;
};
```

This advanced reporting architecture provides a comprehensive, performant solution for the Kitchen Pantry CRM's reporting needs, optimized for Azure B1 constraints while delivering powerful analytics capabilities for food service industry workflows.