# Azure Monitor & Application Insights Alerts for Drizzle Migration Rollback

## Executive Summary

The PantryCRM project has **comprehensive monitoring infrastructure** with Application Insights integration and B1-specific performance monitoring. This plan extends existing monitoring to include **automated rollback triggers** and **migration-specific alerts** for the Drizzle/PostgreSQL migration.

## Current Monitoring Infrastructure Analysis

### ✅ Existing Monitoring Components

#### Application Insights Integration (`application-insights.ts`)
- **Comprehensive B1 Optimization**: Azure B1 tier-specific configuration
- **Resource Usage Monitoring**: Memory, connections, response times
- **Performance Tracking**: API requests, database queries, dependencies
- **Real-time Metrics**: Live metrics stream enabled
- **Custom Properties**: B1 tier identification and optimization levels
- **Sampling Optimization**: 50% sampling for cost optimization

#### Enhanced Performance Monitor (`monitoring.ts`)
- **B1-Specific Alerts**: Memory usage, response times, connection limits
- **Detailed Metrics Collection**: Every 30 seconds with cleanup
- **Performance Thresholds**: 1s search, 3s page load, 4 concurrent users
- **Health Status**: excellent/good/warning/critical classification
- **Optimization Recommendations**: Automated suggestions

#### Rollback Infrastructure (`rollback-manager.ts`)
- **Migration State Tracking**: Checkpoints, confidence scores, error tracking
- **Rollback Strategies**: Full, partial, table-specific, checkpoint-based
- **Error Classification**: Critical, high, medium, low severity
- **Automated Decision Making**: Confidence-based rollback determination

### Current Alert Capabilities

#### Performance Alerts
- Memory usage > 85% (critical for B1's 1.75GB limit)
- Average response time > 1s
- P95 response time > 3s
- Concurrent connections > 4
- Slow database queries > 1s

#### Security Alerts
- Authentication failures
- Rate limiting breaches
- Suspicious activity detection
- Critical security events

## Enhanced Monitoring for Drizzle Migration

### Phase 1: Pre-Migration Alert Setup (Week 1)

#### 1.1 Migration-Specific KQL Queries
```kusto
// Migration performance monitoring
customMetrics
| where name startswith "migration."
| where timestamp > ago(1h)
| summarize avg(value) by name, bin(timestamp, 5m)
| render timechart

// Database connection health during migration
customMetrics
| where name in ("database.connection.postgresql", "database.connection.sqlite")
| where timestamp > ago(30m)
| summarize avg(value), max(value) by name, bin(timestamp, 1m)
| render timechart

// Migration error rate
exceptions
| where outerMessage contains "migration" or outerMessage contains "drizzle"
| where timestamp > ago(1h)
| summarize count() by bin(timestamp, 5m), severityLevel
| render columnchart

// Rollback trigger conditions
customEvents
| where name == "migration.rollback.triggered"
| where timestamp > ago(24h)
| extend reason = tostring(customDimensions.reason)
| extend confidence = todouble(customDimensions.confidence)
| project timestamp, reason, confidence, customDimensions
```

#### 1.2 Azure Monitor Alert Rules
```json
{
  "migrationAlerts": [
    {
      "name": "Migration-DatabaseConnectionFailure",
      "description": "PostgreSQL connection failures during migration",
      "severity": "Critical",
      "query": "customMetrics | where name == 'database.connection.postgresql' and value == 0 | where timestamp > ago(5m)",
      "threshold": 1,
      "frequency": "PT1M",
      "timeWindow": "PT5M",
      "action": "TriggerRollback"
    },
    {
      "name": "Migration-HighErrorRate",
      "description": "High error rate during migration process",
      "severity": "High",
      "query": "exceptions | where outerMessage contains 'migration' | where timestamp > ago(10m) | summarize count()",
      "threshold": 10,
      "frequency": "PT2M",
      "timeWindow": "PT10M",
      "action": "AlertTeam"
    },
    {
      "name": "Migration-LowConfidenceScore",
      "description": "Migration confidence score below acceptable threshold",
      "severity": "High",
      "query": "customMetrics | where name == 'migration.confidence.average' and value < 5 | where timestamp > ago(15m)",
      "threshold": 1,
      "frequency": "PT5M",
      "timeWindow": "PT15M",
      "action": "TriggerPartialRollback"
    },
    {
      "name": "Migration-MemoryPressure",
      "description": "High memory usage during migration on B1 instance",
      "severity": "Warning",
      "query": "customMetrics | where name == 'b1.memory.percentage' and value > 90 | where timestamp > ago(5m)",
      "threshold": 1,
      "frequency": "PT1M",
      "timeWindow": "PT5M",
      "action": "PauseProcessing"
    },
    {
      "name": "Migration-PerformanceDegradation",
      "description": "Significant performance degradation during migration",
      "severity": "Medium",
      "query": "customMetrics | where name == 'api_response_time' and value > 5000 | where timestamp > ago(10m) | summarize count()",
      "threshold": 5,
      "frequency": "PT2M",
      "timeWindow": "PT10M",
      "action": "SlowdownProcessing"
    }
  ]
}
```

### Phase 2: Automated Rollback Integration (Week 1-2)

#### 2.1 Enhanced Application Insights Manager
```typescript
// lib/migration-monitoring.ts
import { appInsights } from './application-insights';
import { RollbackManager, RollbackStrategy } from '../src/lib/excel-migration/rollback-manager';

export class MigrationMonitoringManager {
  private rollbackManager: RollbackManager;
  private migrationActive = false;
  private rollbackTriggered = false;
  private alertThresholds = {
    criticalErrorCount: 5,
    lowConfidenceThreshold: 3.0,
    memoryPressureThreshold: 90,
    connectionFailureThreshold: 3,
    performanceDegradationThreshold: 5000 // 5 seconds
  };

  constructor() {
    this.rollbackManager = new RollbackManager('./migration-state');
    this.setupMigrationMonitoring();
  }

  /**
   * Start migration monitoring
   */
  startMigrationMonitoring(migrationId: string): void {
    this.migrationActive = true;
    this.rollbackTriggered = false;
    
    // Track migration start
    appInsights.trackEvent('migration.started', {
      migrationId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });

    // Start monitoring loops
    this.monitorMigrationHealth();
    this.monitorPerformanceMetrics();
    this.monitorDatabaseConnections();
  }

  /**
   * Stop migration monitoring
   */
  stopMigrationMonitoring(success: boolean): void {
    this.migrationActive = false;
    
    appInsights.trackEvent('migration.completed', {
      success: success.toString(),
      rollbackTriggered: this.rollbackTriggered.toString(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Monitor overall migration health
   */
  private monitorMigrationHealth(): void {
    const healthCheckInterval = setInterval(() => {
      if (!this.migrationActive) {
        clearInterval(healthCheckInterval);
        return;
      }

      try {
        this.checkCriticalConditions();
        this.trackMigrationMetrics();
      } catch (error) {
        console.error('Migration health check failed:', error);
        appInsights.trackException(error as Error, {
          context: 'migration_health_check'
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Check for critical conditions that require rollback
   */
  private async checkCriticalConditions(): Promise<void> {
    const conditions = await this.evaluateRollbackConditions();
    
    if (conditions.shouldRollback && !this.rollbackTriggered) {
      await this.triggerAutomaticRollback(conditions);
    }
  }

  /**
   * Evaluate if rollback should be triggered
   */
  private async evaluateRollbackConditions(): Promise<{
    shouldRollback: boolean;
    strategy: RollbackStrategy;
    reason: string;
    confidence: number;
  }> {
    // Get current migration state from rollback manager
    const migrationState = await this.rollbackManager.getCurrentState();
    
    if (!migrationState) {
      return {
        shouldRollback: false,
        strategy: { type: 'partial', reason: 'No migration state', confidence: 0 },
        reason: 'No active migration',
        confidence: 0
      };
    }

    // Check critical error count
    const criticalErrors = migrationState.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length >= this.alertThresholds.criticalErrorCount) {
      return {
        shouldRollback: true,
        strategy: { type: 'full', reason: 'Critical error threshold exceeded', confidence: 0.9 },
        reason: `${criticalErrors.length} critical errors detected`,
        confidence: 0.9
      };
    }

    // Check average confidence score
    const avgConfidence = this.calculateAverageConfidence(migrationState.checkpoints);
    if (avgConfidence < this.alertThresholds.lowConfidenceThreshold) {
      return {
        shouldRollback: true,
        strategy: { type: 'partial', reason: 'Low confidence threshold', confidence: 0.7 },
        reason: `Average confidence ${avgConfidence} below threshold ${this.alertThresholds.lowConfidenceThreshold}`,
        confidence: 0.7
      };
    }

    // Check memory pressure
    const memoryUsage = await this.getCurrentMemoryUsage();
    if (memoryUsage > this.alertThresholds.memoryPressureThreshold) {
      return {
        shouldRollback: true,
        strategy: { type: 'checkpoint', reason: 'Memory pressure', confidence: 0.6 },
        reason: `Memory usage ${memoryUsage}% exceeds threshold`,
        confidence: 0.6
      };
    }

    return {
      shouldRollback: false,
      strategy: { type: 'partial', reason: 'No issues detected', confidence: 0.1 },
      reason: 'All conditions normal',
      confidence: 0.1
    };
  }

  /**
   * Trigger automatic rollback
   */
  private async triggerAutomaticRollback(conditions: any): Promise<void> {
    this.rollbackTriggered = true;
    
    // Track rollback trigger event
    appInsights.trackEvent('migration.rollback.triggered', {
      reason: conditions.reason,
      confidence: conditions.confidence.toString(),
      strategy: conditions.strategy.type,
      automatic: 'true',
      timestamp: new Date().toISOString()
    });

    try {
      // Execute rollback
      const rollbackResult = await this.rollbackManager.executeRollback(conditions.strategy);
      
      // Track rollback completion
      appInsights.trackEvent('migration.rollback.completed', {
        success: rollbackResult.success.toString(),
        recordsAffected: rollbackResult.recordsAffected.toString(),
        duration: rollbackResult.duration.toString(),
        tablesAffected: rollbackResult.tablesAffected.join(','),
        errorCount: rollbackResult.errors.length.toString()
      });

      // Generate rollback report
      const report = await this.rollbackManager.generateRollbackReport(rollbackResult);
      
      // Send notifications
      await this.sendRollbackNotifications({
        conditions,
        rollbackResult,
        report
      });

    } catch (error) {
      appInsights.trackException(error as Error, {
        context: 'automatic_rollback_execution',
        rollbackReason: conditions.reason
      });
      
      throw error;
    }
  }

  /**
   * Monitor performance metrics during migration
   */
  private monitorPerformanceMetrics(): void {
    const performanceInterval = setInterval(() => {
      if (!this.migrationActive) {
        clearInterval(performanceInterval);
        return;
      }

      // Track migration-specific performance metrics
      this.trackResponseTimes();
      this.trackThroughputMetrics();
      this.trackResourceUtilization();
    }, 60000); // Every minute
  }

  /**
   * Monitor database connections
   */
  private monitorDatabaseConnections(): void {
    const connectionInterval = setInterval(async () => {
      if (!this.migrationActive) {
        clearInterval(connectionInterval);
        return;
      }

      try {
        // Test PostgreSQL connection
        const pgHealthy = await this.testPostgreSQLConnection();
        appInsights.trackMetric('database.connection.postgresql', pgHealthy ? 1 : 0);
        
        // Test SQLite connection (during migration)
        const sqliteHealthy = await this.testSQLiteConnection();
        appInsights.trackMetric('database.connection.sqlite', sqliteHealthy ? 1 : 0);
        
        if (!pgHealthy || !sqliteHealthy) {
          appInsights.trackEvent('database.connection.failure', {
            postgresql: pgHealthy.toString(),
            sqlite: sqliteHealthy.toString(),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        appInsights.trackException(error as Error, {
          context: 'database_connection_monitoring'
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Send rollback notifications
   */
  private async sendRollbackNotifications(data: any): Promise<void> {
    // Integration points for different notification channels
    
    // 1. Teams/Slack notification
    if (process.env.TEAMS_WEBHOOK_URL) {
      await this.sendTeamsNotification(data);
    }
    
    // 2. Email notification
    if (process.env.SMTP_ENABLED) {
      await this.sendEmailNotification(data);
    }
    
    // 3. SMS notification for critical alerts
    if (data.conditions.confidence > 0.8 && process.env.SMS_SERVICE_ENABLED) {
      await this.sendSMSNotification(data);
    }
    
    // 4. Azure Service Health notification
    if (process.env.AZURE_SERVICE_HEALTH_ENABLED) {
      await this.createServiceHealthAlert(data);
    }
  }

  // Helper methods
  private calculateAverageConfidence(checkpoints: any[]): number {
    if (checkpoints.length === 0) return 10; // Default high confidence
    return checkpoints.reduce((sum, cp) => sum + cp.confidence, 0) / checkpoints.length;
  }

  private async getCurrentMemoryUsage(): Promise<number> {
    const usage = process.memoryUsage();
    return Math.round((usage.heapUsed / usage.heapTotal) * 100);
  }

  private async testPostgreSQLConnection(): Promise<boolean> {
    // Implement PostgreSQL connection test
    return true; // Placeholder
  }

  private async testSQLiteConnection(): Promise<boolean> {
    // Implement SQLite connection test
    return true; // Placeholder
  }

  private trackResponseTimes(): void {
    // Implementation for response time tracking
  }

  private trackThroughputMetrics(): void {
    // Implementation for throughput tracking
  }

  private trackResourceUtilization(): void {
    // Implementation for resource utilization tracking
  }

  private async sendTeamsNotification(data: any): Promise<void> {
    // Teams webhook implementation
  }

  private async sendEmailNotification(data: any): Promise<void> {
    // Email notification implementation
  }

  private async sendSMSNotification(data: any): Promise<void> {
    // SMS notification implementation
  }

  private async createServiceHealthAlert(data: any): Promise<void> {
    // Azure Service Health alert implementation
  }
}

// Global migration monitoring instance
export const migrationMonitoring = new MigrationMonitoringManager();
```

### Phase 3: Azure Monitor Configuration (Week 2)

#### 3.1 ARM Template for Alert Rules
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "applicationInsightsName": {
      "type": "string",
      "defaultValue": "pantrycrm-insights"
    },
    "actionGroupName": {
      "type": "string",
      "defaultValue": "migration-alerts"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Insights/actionGroups",
      "apiVersion": "2019-06-01",
      "name": "[parameters('actionGroupName')]",
      "location": "global",
      "properties": {
        "groupShortName": "MigAlert",
        "enabled": true,
        "emailReceivers": [
          {
            "name": "DevTeam",
            "emailAddress": "dev-team@pantrycrm.com",
            "useCommonAlertSchema": true
          }
        ],
        "webhookReceivers": [
          {
            "name": "RollbackWebhook",
            "serviceUri": "https://pantrycrm.azurewebsites.net/api/migration/rollback/trigger",
            "useCommonAlertSchema": true
          }
        ]
      }
    },
    {
      "type": "Microsoft.Insights/scheduledQueryRules",
      "apiVersion": "2021-08-01",
      "name": "Migration-CriticalErrors",
      "location": "[resourceGroup().location]",
      "properties": {
        "displayName": "Migration Critical Errors",
        "description": "Alert when critical errors occur during migration",
        "severity": 0,
        "enabled": true,
        "evaluationFrequency": "PT1M",
        "scopes": [
          "[resourceId('Microsoft.Insights/components', parameters('applicationInsightsName'))]"
        ],
        "criteria": {
          "allOf": [
            {
              "query": "exceptions | where outerMessage contains 'migration' and severityLevel >= 3 | where timestamp > ago(5m) | summarize count()",
              "timeAggregation": "Count",
              "operator": "GreaterThan",
              "threshold": 3,
              "failingPeriods": {
                "numberOfEvaluationPeriods": 1,
                "minFailingPeriodsToAlert": 1
              }
            }
          ]
        },
        "actions": {
          "actionGroups": [
            "[resourceId('Microsoft.Insights/actionGroups', parameters('actionGroupName'))]"
          ]
        }
      }
    },
    {
      "type": "Microsoft.Insights/scheduledQueryRules",
      "apiVersion": "2021-08-01",
      "name": "Migration-LowConfidence",
      "location": "[resourceGroup().location]",
      "properties": {
        "displayName": "Migration Low Confidence Score",
        "description": "Alert when migration confidence scores are too low",
        "severity": 1,
        "enabled": true,
        "evaluationFrequency": "PT5M",
        "scopes": [
          "[resourceId('Microsoft.Insights/components', parameters('applicationInsightsName'))]"
        ],
        "criteria": {
          "allOf": [
            {
              "query": "customMetrics | where name == 'migration.confidence.average' and value < 5 | where timestamp > ago(15m)",
              "timeAggregation": "Count",
              "operator": "GreaterThan",
              "threshold": 0,
              "failingPeriods": {
                "numberOfEvaluationPeriods": 3,
                "minFailingPeriodsToAlert": 2
              }
            }
          ]
        },
        "actions": {
          "actionGroups": [
            "[resourceId('Microsoft.Insights/actionGroups', parameters('actionGroupName'))]"
          ]
        }
      }
    }
  ]
}
```

### Phase 4: Rollback Webhook Implementation (Week 2)

#### 4.1 API Endpoint for Automated Rollback
```typescript
// app/api/migration/rollback/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { migrationMonitoring } from '@/lib/migration-monitoring';
import { authenticateWebhook } from '@/lib/webhook-auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate webhook request
    const authResult = await authenticateWebhook(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: 'Unauthorized webhook request' },
        { status: 401 }
      );
    }

    const alertData = await request.json();
    
    // Parse Azure Monitor alert data
    const alertInfo = {
      alertName: alertData.data?.essentials?.alertRule,
      severity: alertData.data?.essentials?.severity,
      description: alertData.data?.essentials?.description,
      firedDateTime: alertData.data?.essentials?.firedDateTime,
      monitorCondition: alertData.data?.essentials?.monitorCondition
    };

    // Determine rollback strategy based on alert
    const strategy = determineRollbackStrategy(alertInfo);
    
    if (strategy.shouldExecute) {
      // Execute rollback
      const result = await migrationMonitoring.executeEmergencyRollback(strategy);
      
      return NextResponse.json({
        success: true,
        rollbackExecuted: true,
        strategy: strategy.type,
        result
      });
    } else {
      // Log alert but don't execute rollback
      await migrationMonitoring.logAlert(alertInfo);
      
      return NextResponse.json({
        success: true,
        rollbackExecuted: false,
        reason: 'Alert does not meet rollback criteria'
      });
    }

  } catch (error) {
    console.error('Rollback webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function determineRollbackStrategy(alertInfo: any) {
  // Mapping of alert names to rollback strategies
  const rollbackMapping = {
    'Migration-CriticalErrors': {
      shouldExecute: true,
      type: 'full',
      reason: 'Critical errors detected',
      confidence: 0.9
    },
    'Migration-LowConfidence': {
      shouldExecute: true,
      type: 'partial',
      reason: 'Low confidence scores',
      confidence: 0.7
    },
    'Migration-MemoryPressure': {
      shouldExecute: false, // Just pause, don't rollback
      type: 'pause',
      reason: 'Memory pressure',
      confidence: 0.5
    }
  };

  return rollbackMapping[alertInfo.alertName] || {
    shouldExecute: false,
    type: 'none',
    reason: 'Unknown alert type',
    confidence: 0
  };
}
```

### Phase 5: Dashboard and Reporting (Week 2-3)

#### 5.1 Migration Monitoring Dashboard
```typescript
// components/monitoring/MigrationDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, Title, AreaChart, BarChart, DonutChart } from '@tremor/react';

interface MigrationMetrics {
  confidence: number[];
  errorRate: number[];
  performance: number[];
  memoryUsage: number[];
  rollbackTriggers: any[];
}

export function MigrationMonitoringDashboard() {
  const [metrics, setMetrics] = useState<MigrationMetrics | null>(null);
  const [migrationStatus, setMigrationStatus] = useState('idle');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch migration metrics
    const fetchMetrics = async () => {
      const response = await fetch('/api/migration/metrics');
      const data = await response.json();
      setMetrics(data.metrics);
      setMigrationStatus(data.status);
      setAlerts(data.alerts);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return <div>Loading migration metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Title>Migration Status</Title>
          <div className={`text-2xl font-bold ${
            migrationStatus === 'completed' ? 'text-green-600' :
            migrationStatus === 'in_progress' ? 'text-blue-600' :
            migrationStatus === 'failed' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {migrationStatus.replace('_', ' ').toUpperCase()}
          </div>
        </Card>
        
        <Card>
          <Title>Confidence Score</Title>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.confidence[metrics.confidence.length - 1]?.toFixed(1) || 'N/A'}
          </div>
        </Card>
        
        <Card>
          <Title>Error Rate</Title>
          <div className="text-2xl font-bold text-orange-600">
            {(metrics.errorRate[metrics.errorRate.length - 1] || 0).toFixed(2)}%
          </div>
        </Card>
        
        <Card>
          <Title>Memory Usage</Title>
          <div className="text-2xl font-bold text-purple-600">
            {(metrics.memoryUsage[metrics.memoryUsage.length - 1] || 0).toFixed(1)}%
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Title>Confidence Score Trend</Title>
          <AreaChart
            data={metrics.confidence.map((value, index) => ({ time: index, confidence: value }))}
            index="time"
            categories={['confidence']}
            colors={['blue']}
            yAxisWidth={40}
          />
        </Card>
        
        <Card>
          <Title>Performance Metrics</Title>
          <AreaChart
            data={metrics.performance.map((value, index) => ({ time: index, response_time: value }))}
            index="time"
            categories={['response_time']}
            colors={['green']}
            yAxisWidth={40}
          />
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <Title>Recent Alerts</Title>
        <div className="space-y-2">
          {alerts.slice(0, 10).map((alert: any, index) => (
            <div key={index} className={`p-3 rounded-lg ${
              alert.severity === 'critical' ? 'bg-red-100 border-red-300' :
              alert.severity === 'high' ? 'bg-orange-100 border-orange-300' :
              alert.severity === 'medium' ? 'bg-yellow-100 border-yellow-300' :
              'bg-blue-100 border-blue-300'
            } border`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{alert.name}</div>
                  <div className="text-sm text-gray-600">{alert.description}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rollback Controls */}
      <Card>
        <Title>Emergency Controls</Title>
        <div className="flex space-x-4">
          <button 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            onClick={() => triggerRollback('full')}
          >
            Full Rollback
          </button>
          <button 
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            onClick={() => triggerRollback('partial')}
          >
            Partial Rollback
          </button>
          <button 
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            onClick={() => pauseMigration()}
          >
            Pause Migration
          </button>
        </div>
      </Card>
    </div>
  );
}

// Helper functions
async function triggerRollback(type: 'full' | 'partial') {
  const confirmed = confirm(`Are you sure you want to trigger a ${type} rollback?`);
  if (confirmed) {
    await fetch('/api/migration/rollback/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, manual: true })
    });
  }
}

async function pauseMigration() {
  await fetch('/api/migration/pause', { method: 'POST' });
}
```

## Success Criteria

### ✅ Phase 1 Complete
- [ ] Azure Monitor alert rules configured and active
- [ ] KQL queries tested and validated
- [ ] Alert thresholds set appropriately for B1 constraints

### ✅ Phase 2 Complete
- [ ] Automated rollback system integrated with existing monitoring
- [ ] Rollback triggers working based on confidence scores
- [ ] Performance degradation alerts functional

### ✅ Phase 3 Complete
- [ ] ARM templates deployed successfully
- [ ] Action groups configured with proper notification channels
- [ ] Alert rules triggering correctly in test scenarios

### ✅ Phase 4 Complete
- [ ] Webhook endpoint secured and functional
- [ ] Automated rollback execution tested
- [ ] Emergency rollback procedures documented

### ✅ Phase 5 Complete
- [ ] Migration monitoring dashboard operational
- [ ] Real-time metrics displaying correctly
- [ ] Manual rollback controls accessible

## Risk Assessment

### 🟢 Low Risk
- **Existing Infrastructure**: Comprehensive monitoring already in place
- **Application Insights**: Already configured and collecting data
- **Alert Framework**: Basic alerting structure exists

### 🟡 Medium Risk
- **False Positives**: Overly sensitive alerts could trigger unnecessary rollbacks
  - **Mitigation**: Proper threshold tuning and testing
- **Notification Fatigue**: Too many alerts could reduce effectiveness
  - **Mitigation**: Alert prioritization and grouping

### 🔴 High Risk (Mitigated)
- **Automated Rollback Failures**: Rollback system could malfunction
  - **Mitigation**: Comprehensive testing and manual override capabilities
- **Performance Impact**: Monitoring overhead could affect B1 performance
  - **Mitigation**: Optimized monitoring intervals and sampling

## Timeline and Dependencies

| Phase | Duration | Dependencies | Key Deliverables |
|-------|----------|--------------|------------------|
| **Phase 1** | 2-3 days | Azure Monitor access | Alert rules, KQL queries |
| **Phase 2** | 3-4 days | Rollback manager integration | Automated rollback system |
| **Phase 3** | 2-3 days | Azure ARM template deployment | Production alert configuration |
| **Phase 4** | 2-3 days | Webhook infrastructure | Emergency rollback API |
| **Phase 5** | 3-4 days | Dashboard framework | Monitoring dashboard |
| **Total** | **2-3 weeks** | **Migration phases DZ-006 to DZ-010** | **Complete monitoring system** |

## Integration with Migration Plan

- **DZ-002**: Azure infrastructure (monitoring resources)
- **DZ-006**: Data migration (rollback triggers)
- **DZ-007**: API updates (webhook endpoints)
- **DZ-009**: Testing (alert validation)
- **DZ-010**: Staging validation (monitoring verification)
- **DZ-011**: Production deployment (alert activation)

---

**Status**: Ready for implementation  
**Priority**: High (critical for migration safety)  
**Estimated Effort**: 2-3 weeks  
**Risk Level**: Medium (requires careful testing)  
**Coverage**: Automated rollback triggers, real-time monitoring, emergency controls