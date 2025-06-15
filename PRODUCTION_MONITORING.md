# Production Monitoring Dashboard Architecture

## Overview

Comprehensive monitoring system specifically designed for Azure B1 hosting constraints, providing real-time insights into application performance, resource utilization, and business metrics for the Kitchen Pantry CRM.

---

## Core Requirements

### Azure B1 Specific Constraints
- **5 DTU Database Limit**: Monitor DTU consumption and query performance
- **1.75GB Memory Limit**: Track memory usage and prevent OOM errors
- **Shared CPU**: Monitor CPU throttling and performance degradation
- **100GB Storage**: Track storage usage and growth patterns
- **Network Limitations**: Monitor bandwidth usage and connection counts

### Business Monitoring Needs
- **User Activity**: Track active sessions, feature usage, peak times
- **Performance Metrics**: Response times, error rates, availability
- **Business KPIs**: Interaction logs, pipeline conversion, revenue tracking
- **Security Monitoring**: Failed logins, suspicious activity, data access

---

## Architecture Components

### 1. Metrics Collection System

```typescript
// lib/monitoring/metrics-collector.ts
interface SystemMetrics {
  timestamp: Date;
  
  // Azure B1 Specific
  dtuUtilization: number;        // 0-100%
  memoryUsage: number;           // MB used out of 1750MB
  cpuUtilization: number;        // 0-100%
  storageUsage: number;          // GB used out of 100GB
  connectionCount: number;       // Active DB connections
  
  // Application Performance
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  errorRate: number;             // Errors per minute
  throughput: number;            // Requests per minute
  
  // Business Metrics
  activeUsers: number;
  interactionsLogged: number;
  reportsGenerated: number;
  offlineSync: {
    pending: number;
    failed: number;
  };
}

class MetricsCollector {
  private metricsBuffer: SystemMetrics[] = [];
  private readonly BUFFER_SIZE = 60; // Keep 1 hour of minute-level data
  
  async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();
    
    // Collect Azure SQL metrics
    const sqlMetrics = await this.collectSQLMetrics();
    
    // Collect application metrics
    const appMetrics = await this.collectAppMetrics();
    
    // Collect business metrics
    const businessMetrics = await this.collectBusinessMetrics();
    
    const metrics: SystemMetrics = {
      timestamp,
      ...sqlMetrics,
      ...appMetrics,
      ...businessMetrics
    };
    
    // Buffer metrics
    this.metricsBuffer.push(metrics);
    if (this.metricsBuffer.length > this.BUFFER_SIZE) {
      this.metricsBuffer.shift();
    }
    
    // Check for alerts
    await this.checkAlerts(metrics);
    
    return metrics;
  }
  
  private async collectSQLMetrics(): Promise<Partial<SystemMetrics>> {
    try {
      // Query Azure SQL DMVs for DTU and performance metrics
      const dtuQuery = `
        SELECT 
          avg_cpu_percent,
          avg_data_io_percent,
          avg_log_write_percent,
          storage_percent,
          connection_count
        FROM sys.dm_db_resource_stats 
        WHERE end_time >= DATEADD(minute, -5, GETUTCDATE())
      `;
      
      const [result] = await prismadb.$queryRaw<any[]>`${dtuQuery}`;
      
      return {
        dtuUtilization: Math.max(
          result.avg_cpu_percent,
          result.avg_data_io_percent,
          result.avg_log_write_percent
        ),
        storageUsage: (result.storage_percent / 100) * 100, // Convert to GB
        connectionCount: result.connection_count
      };
    } catch (error) {
      console.error('Failed to collect SQL metrics:', error);
      return {};
    }
  }
  
  private async collectAppMetrics(): Promise<Partial<SystemMetrics>> {
    const now = Date.now();
    
    // Memory usage (Node.js)
    const memUsage = process.memoryUsage();
    const memoryUsage = memUsage.heapUsed / 1024 / 1024; // Convert to MB
    
    // Response time from recent requests
    const responseTime = await this.getRecentResponseTimes();
    
    // Error rate from logs
    const errorRate = await this.getRecentErrorRate();
    
    // Throughput
    const throughput = await this.getRecentThroughput();
    
    return {
      memoryUsage,
      responseTime,
      errorRate,
      throughput
    };
  }
  
  private async collectBusinessMetrics(): Promise<Partial<SystemMetrics>> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Active users (sessions in last 5 minutes)
    const activeUsers = await prismadb.userSession.count({
      where: {
        lastActivity: { gte: fiveMinutesAgo }
      }
    });
    
    // Recent interactions
    const interactionsLogged = await prismadb.interaction.count({
      where: {
        createdAt: { gte: fiveMinutesAgo }
      }
    });
    
    // Recent reports
    const reportsGenerated = await prismadb.reportExecution.count({
      where: {
        createdAt: { gte: fiveMinutesAgo }
      }
    });
    
    // Offline sync status
    const offlineSync = await this.getOfflineSyncStatus();
    
    return {
      activeUsers,
      interactionsLogged,
      reportsGenerated,
      offlineSync
    };
  }
}
```

### 2. Real-time Dashboard Component

```typescript
// components/monitoring/MonitoringDashboard.tsx
interface MonitoringDashboardProps {
  refreshInterval?: number;
  alertsEnabled?: boolean;
}

const MonitoringDashboard = ({ refreshInterval = 30000, alertsEnabled = true }: MonitoringDashboardProps) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Real-time data fetching
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/metrics');
        const data = await response.json();
        setMetrics(data.current);
        setHistoricalData(data.historical);
        
        if (alertsEnabled) {
          setAlerts(data.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, alertsEnabled]);
  
  if (!metrics) {
    return <MonitoringSkeletonLoader />;
  }
  
  return (
    <div className={cn(
      'min-h-screen bg-gray-50',
      isFullscreen ? 'p-2' : 'p-6'
    )}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">System Monitoring</h1>
            <p className="text-gray-600">Azure B1 Performance Dashboard</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <SystemStatusIndicator status={getOverallStatus(metrics)} />
            <LastUpdatedTime timestamp={metrics.timestamp} />
            <Button
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} onDismiss={handleDismissAlert} />
      )}
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="DTU Utilization"
          value={metrics.dtuUtilization}
          unit="%"
          threshold={80}
          trend={calculateTrend(historicalData, 'dtuUtilization')}
          color={getStatusColor(metrics.dtuUtilization, 80, 95)}
        />
        
        <MetricCard
          title="Memory Usage"
          value={metrics.memoryUsage}
          unit="MB"
          max={1750}
          threshold={1400}
          trend={calculateTrend(historicalData, 'memoryUsage')}
          color={getStatusColor(metrics.memoryUsage, 1400, 1600)}
        />
        
        <MetricCard
          title="Response Time"
          value={metrics.responseTime.avg}
          unit="ms"
          threshold={2000}
          trend={calculateTrend(historicalData, 'responseTime.avg')}
          color={getStatusColor(metrics.responseTime.avg, 2000, 5000)}
        />
        
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers}
          unit=""
          trend={calculateTrend(historicalData, 'activeUsers')}
          color="blue"
        />
      </div>
      
      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PerformanceChart
          title="DTU Utilization Trend"
          data={historicalData}
          dataKey="dtuUtilization"
          threshold={80}
          unit="%"
        />
        
        <PerformanceChart
          title="Memory Usage Trend"
          data={historicalData}
          dataKey="memoryUsage"
          threshold={1400}
          max={1750}
          unit="MB"
        />
      </div>
      
      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DatabaseMetricsPanel metrics={metrics} historical={historicalData} />
        <ApplicationMetricsPanel metrics={metrics} historical={historicalData} />
        <BusinessMetricsPanel metrics={metrics} historical={historicalData} />
      </div>
    </div>
  );
};
```

### 3. Alert System

```typescript
// lib/monitoring/alert-system.ts
interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  duration: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: AlertAction[];
}

interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  target: string;
  message?: string;
}

const AZURE_B1_ALERT_RULES: AlertRule[] = [
  {
    id: 'dtu-critical',
    name: 'DTU Usage Critical',
    metric: 'dtuUtilization',
    condition: 'greater_than',
    threshold: 95,
    duration: 2,
    severity: 'critical',
    actions: [
      { type: 'email', target: 'admin@pantrycrm.com' },
      { type: 'slack', target: '#alerts' }
    ]
  },
  {
    id: 'memory-warning',
    name: 'Memory Usage High',
    metric: 'memoryUsage',
    condition: 'greater_than',
    threshold: 1400,
    duration: 5,
    severity: 'medium',
    actions: [
      { type: 'email', target: 'admin@pantrycrm.com' }
    ]
  },
  {
    id: 'response-time-slow',
    name: 'Slow Response Times',
    metric: 'responseTime.avg',
    condition: 'greater_than',
    threshold: 3000,
    duration: 3,
    severity: 'medium',
    actions: [
      { type: 'slack', target: '#performance' }
    ]
  },
  {
    id: 'storage-warning',
    name: 'Storage Space Low',
    metric: 'storageUsage',
    condition: 'greater_than',
    threshold: 85,
    duration: 10,
    severity: 'high',
    actions: [
      { type: 'email', target: 'admin@pantrycrm.com' }
    ]
  }
];

class AlertManager {
  private activeAlerts = new Map<string, Alert>();
  private alertHistory: Alert[] = [];
  
  async checkAlerts(metrics: SystemMetrics): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];
    
    for (const rule of AZURE_B1_ALERT_RULES) {
      const isTriggered = await this.evaluateRule(rule, metrics);
      
      if (isTriggered) {
        const existingAlert = this.activeAlerts.get(rule.id);
        
        if (!existingAlert) {
          // New alert
          const alert = await this.createAlert(rule, metrics);
          this.activeAlerts.set(rule.id, alert);
          triggeredAlerts.push(alert);
          
          // Execute alert actions
          await this.executeAlertActions(rule, alert);
        } else {
          // Update existing alert
          existingAlert.lastTriggered = new Date();
          existingAlert.count++;
        }
      } else {
        // Check if alert should be resolved
        const existingAlert = this.activeAlerts.get(rule.id);
        if (existingAlert) {
          await this.resolveAlert(existingAlert);
          this.activeAlerts.delete(rule.id);
        }
      }
    }
    
    return triggeredAlerts;
  }
  
  private async evaluateRule(rule: AlertRule, metrics: SystemMetrics): Promise<boolean> {
    const value = this.getMetricValue(metrics, rule.metric);
    
    switch (rule.condition) {
      case 'greater_than':
        return value > rule.threshold;
      case 'less_than':
        return value < rule.threshold;
      case 'equals':
        return value === rule.threshold;
      default:
        return false;
    }
  }
  
  private async executeAlertActions(rule: AlertRule, alert: Alert): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'email':
            await this.sendEmailAlert(action.target, alert, rule);
            break;
          case 'slack':
            await this.sendSlackAlert(action.target, alert, rule);
            break;
          case 'webhook':
            await this.sendWebhookAlert(action.target, alert, rule);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }
}
```

### 4. Performance Analytics

```typescript
// lib/monitoring/performance-analytics.ts
class PerformanceAnalytics {
  async generatePerformanceReport(timeRange: DateRange): Promise<PerformanceReport> {
    const metrics = await this.getMetricsInRange(timeRange);
    
    return {
      summary: {
        avgResponseTime: this.calculateAverage(metrics, 'responseTime.avg'),
        maxDTU: this.calculateMax(metrics, 'dtuUtilization'),
        avgMemoryUsage: this.calculateAverage(metrics, 'memoryUsage'),
        totalInteractions: this.calculateSum(metrics, 'interactionsLogged'),
        uptime: this.calculateUptime(metrics),
        errorRate: this.calculateAverage(metrics, 'errorRate')
      },
      
      trends: {
        performance: this.analyzeTrend(metrics, 'responseTime.avg'),
        resource: this.analyzeTrend(metrics, 'dtuUtilization'),
        usage: this.analyzeTrend(metrics, 'activeUsers')
      },
      
      recommendations: await this.generateRecommendations(metrics),
      
      anomalies: this.detectAnomalies(metrics),
      
      charts: {
        performanceOverTime: this.createPerformanceChart(metrics),
        resourceUtilization: this.createResourceChart(metrics),
        userActivity: this.createActivityChart(metrics)
      }
    };
  }
  
  private async generateRecommendations(metrics: SystemMetrics[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // DTU optimization recommendations
    const avgDTU = this.calculateAverage(metrics, 'dtuUtilization');
    if (avgDTU > 70) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High DTU Usage Detected',
        description: 'Consider optimizing database queries or implementing caching',
        actions: [
          'Review slow query log',
          'Implement query result caching',
          'Optimize database indexes',
          'Consider connection pooling'
        ]
      });
    }
    
    // Memory optimization recommendations
    const avgMemory = this.calculateAverage(metrics, 'memoryUsage');
    if (avgMemory > 1200) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        title: 'High Memory Usage',
        description: 'Memory usage approaching Azure B1 limits',
        actions: [
          'Review memory leaks in application code',
          'Implement garbage collection optimization',
          'Reduce image cache size',
          'Optimize data structures'
        ]
      });
    }
    
    // Response time recommendations
    const avgResponseTime = this.calculateAverage(metrics, 'responseTime.avg');
    if (avgResponseTime > 2000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Slow Response Times',
        description: 'API response times exceed target threshold',
        actions: [
          'Enable API response caching',
          'Optimize database queries',
          'Implement CDN for static assets',
          'Review API endpoint performance'
        ]
      });
    }
    
    return recommendations;
  }
  
  private detectAnomalies(metrics: SystemMetrics[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // Detect unusual spikes in DTU usage
    const dtuValues = metrics.map(m => m.dtuUtilization);
    const dtuMean = this.calculateMean(dtuValues);
    const dtuStdDev = this.calculateStandardDeviation(dtuValues);
    
    metrics.forEach(metric => {
      if (Math.abs(metric.dtuUtilization - dtuMean) > 2 * dtuStdDev) {
        anomalies.push({
          type: 'dtu_spike',
          timestamp: metric.timestamp,
          value: metric.dtuUtilization,
          severity: metric.dtuUtilization > 90 ? 'high' : 'medium',
          description: `Unusual DTU spike: ${metric.dtuUtilization}%`
        });
      }
    });
    
    return anomalies;
  }
}
```

### 5. Monitoring API Routes

```typescript
// app/api/monitoring/metrics/route.ts
export async function GET(req: NextRequest): Promise<NextResponse<APIResponse<MonitoringData>>> {
  // Admin authentication required
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  if (!user.isAdmin) {
    return createErrorResponse('Admin access required', 403);
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = parseTimeRange(searchParams.get('range') || '1h');
    
    // Collect current metrics
    const collector = new MetricsCollector();
    const currentMetrics = await collector.collectMetrics();
    
    // Get historical data
    const historicalMetrics = await getHistoricalMetrics(timeRange);
    
    // Check for active alerts
    const alertManager = new AlertManager();
    const activeAlerts = await alertManager.getActiveAlerts();
    
    // Generate performance insights
    const analytics = new PerformanceAnalytics();
    const insights = await analytics.generateInsights(historicalMetrics);
    
    const response: MonitoringData = {
      current: currentMetrics,
      historical: historicalMetrics,
      alerts: activeAlerts,
      insights,
      systemStatus: determineSystemStatus(currentMetrics, activeAlerts),
      lastUpdated: new Date()
    };
    
    return createSuccessResponse(response);
    
  } catch (err) {
    return handlePrismaError(err);
  }
}

// app/api/monitoring/alerts/route.ts
export async function POST(req: NextRequest): Promise<NextResponse<APIResponse<Alert>>> {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  if (!user.isAdmin) {
    return createErrorResponse('Admin access required', 403);
  }
  
  try {
    const { alertId, action } = await req.json();
    
    const alertManager = new AlertManager();
    
    switch (action) {
      case 'acknowledge':
        await alertManager.acknowledgeAlert(alertId, user.id);
        break;
      case 'resolve':
        await alertManager.resolveAlert(alertId, user.id);
        break;
      case 'snooze':
        const { duration } = await req.json();
        await alertManager.snoozeAlert(alertId, duration);
        break;
    }
    
    const updatedAlert = await alertManager.getAlert(alertId);
    return createSuccessResponse(updatedAlert);
    
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

---

## Azure B1 Optimization Strategies

### 1. DTU Management

```typescript
// lib/monitoring/dtu-optimizer.ts
class DTUOptimizer {
  async optimizeForDTUConstraints(): Promise<OptimizationResult> {
    const recommendations: OptimizationAction[] = [];
    
    // Identify expensive queries
    const expensiveQueries = await this.identifyExpensiveQueries();
    
    // Check connection pooling
    const connectionMetrics = await this.analyzeConnections();
    
    // Review index usage
    const indexAnalysis = await this.analyzeIndexUsage();
    
    // Generate optimization plan
    if (expensiveQueries.length > 0) {
      recommendations.push({
        type: 'query_optimization',
        priority: 'high',
        description: `${expensiveQueries.length} expensive queries identified`,
        actions: expensiveQueries.map(q => `Optimize query: ${q.summary}`)
      });
    }
    
    if (connectionMetrics.averageConnections > 80) {
      recommendations.push({
        type: 'connection_pooling',
        priority: 'medium',
        description: 'High connection count detected',
        actions: ['Implement connection pooling', 'Review connection lifecycle']
      });
    }
    
    return {
      currentDTU: await this.getCurrentDTU(),
      recommendations,
      estimatedImprovement: this.calculatePotentialImprovement(recommendations)
    };
  }
  
  private async identifyExpensiveQueries(): Promise<ExpensiveQuery[]> {
    const query = `
      SELECT TOP 10
        qs.query_id,
        qs.execution_count,
        qs.total_worker_time / 1000 as total_cpu_time_ms,
        qs.avg_worker_time / 1000 as avg_cpu_time_ms,
        qt.query_sql_text
      FROM sys.query_store_query_stats qs
      JOIN sys.query_store_query_text qt ON qs.query_id = qt.query_id
      WHERE qs.last_execution_time >= DATEADD(hour, -1, GETUTCDATE())
      ORDER BY qs.avg_worker_time DESC
    `;
    
    return await prismadb.$queryRaw<ExpensiveQuery[]>`${query}`;
  }
}
```

### 2. Memory Management

```typescript
// lib/monitoring/memory-optimizer.ts
class MemoryOptimizer {
  private memoryThresholds = {
    warning: 1400, // MB
    critical: 1600 // MB
  };
  
  async monitorMemoryUsage(): Promise<MemoryAnalysis> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    const analysis: MemoryAnalysis = {
      current: heapUsedMB,
      threshold: this.memoryThresholds.warning,
      status: this.getMemoryStatus(heapUsedMB),
      recommendations: []
    };
    
    if (heapUsedMB > this.memoryThresholds.warning) {
      analysis.recommendations.push({
        action: 'force_garbage_collection',
        description: 'Force garbage collection to free memory',
        priority: 'immediate'
      });
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    
    if (heapUsedMB > this.memoryThresholds.critical) {
      analysis.recommendations.push({
        action: 'restart_application',
        description: 'Application restart required to prevent OOM',
        priority: 'critical'
      });
    }
    
    return analysis;
  }
  
  setupMemoryAlerts(): void {
    // Monitor memory every 30 seconds
    setInterval(async () => {
      const analysis = await this.monitorMemoryUsage();
      
      if (analysis.status === 'critical') {
        await this.sendMemoryAlert(analysis);
      }
    }, 30000);
  }
}
```

This comprehensive production monitoring system provides real-time visibility into the Kitchen Pantry CRM's performance while respecting Azure B1 constraints and enabling proactive optimization and issue resolution.