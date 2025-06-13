/**
 * Azure Scaling Manager for PantryCRM
 * Intelligent scaling decisions based on B1 optimization metrics
 */

import { azureB1Optimizer } from './azure-b1-optimizations';
import { appInsights } from './application-insights';

interface ScalingMetrics {
  memoryUsagePercent: number;
  cpuUsagePercent: number;
  dtuUsagePercent: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  concurrentUsers: number;
}

interface ScalingRecommendation {
  action: 'scale_up' | 'scale_out' | 'optimize' | 'no_action';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string[];
  estimatedCost: string;
  timeframe: string;
  nextTier?: {
    appService?: string;
    sqlDatabase?: string;
    estimatedMonthlyCost: number;
  };
}

interface ScalingTrigger {
  name: string;
  condition: (metrics: ScalingMetrics) => boolean;
  action: ScalingRecommendation['action'];
  priority: ScalingRecommendation['priority'];
  description: string;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

/**
 * Azure Scaling Manager with intelligent decision making
 */
export class AzureScalingManager {
  private triggers: ScalingTrigger[] = [];
  private metricsHistory: Array<{ timestamp: Date; metrics: ScalingMetrics }> = [];
  private readonly HISTORY_RETENTION_HOURS = 24;

  constructor() {
    this.setupScalingTriggers();
    this.startMetricsCollection();
  }

  /**
   * Setup scaling triggers based on B1 optimization thresholds
   */
  private setupScalingTriggers(): void {
    this.triggers = [
      // Critical memory pressure - immediate action needed
      {
        name: 'critical_memory_pressure',
        condition: (metrics) => metrics.memoryUsagePercent > 90,
        action: 'scale_up',
        priority: 'critical',
        description: 'Memory usage consistently above 90% - B1 limit exceeded',
        cooldownMinutes: 5
      },

      // High memory usage - scale up soon
      {
        name: 'high_memory_usage',
        condition: (metrics) => metrics.memoryUsagePercent > 85,
        action: 'scale_up',
        priority: 'high',
        description: 'Memory usage above 85% - approaching B1 limits',
        cooldownMinutes: 15
      },

      // DTU exhaustion - database scaling needed
      {
        name: 'dtu_exhaustion',
        condition: (metrics) => metrics.dtuUsagePercent > 85,
        action: 'scale_up',
        priority: 'high',
        description: 'DTU usage above 85% - database performance degraded',
        cooldownMinutes: 10
      },

      // High response times - performance impact
      {
        name: 'high_response_times',
        condition: (metrics) => metrics.averageResponseTime > 20000, // 20 seconds
        action: 'scale_up',
        priority: 'medium',
        description: 'Average response time exceeds 20 seconds',
        cooldownMinutes: 20
      },

      // Error rate spike - stability concern
      {
        name: 'error_rate_spike',
        condition: (metrics) => metrics.errorRate > 5, // 5% error rate
        action: 'optimize',
        priority: 'high',
        description: 'Error rate above 5% - investigate before scaling',
        cooldownMinutes: 10
      },

      // Connection limit approach
      {
        name: 'connection_limit_approach',
        condition: (metrics) => metrics.activeConnections > 25, // 25 of 30 max
        action: 'optimize',
        priority: 'medium',
        description: 'Approaching connection limits - optimize connection pooling',
        cooldownMinutes: 30
      },

      // Sustained CPU pressure
      {
        name: 'sustained_cpu_pressure',
        condition: (metrics) => metrics.cpuUsagePercent > 80,
        action: 'scale_up',
        priority: 'medium',
        description: 'CPU usage above 80% - single core B1 limitation',
        cooldownMinutes: 15
      },

      // High concurrent users - scale out consideration
      {
        name: 'high_concurrent_users',
        condition: (metrics) => metrics.concurrentUsers > 15,
        action: 'scale_up',
        priority: 'medium',
        description: 'Concurrent users exceeding B1 capacity (15+ users)',
        cooldownMinutes: 30
      }
    ];

    console.log(`[SCALING_MANAGER] Initialized ${this.triggers.length} scaling triggers`);
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every 2 minutes
    setInterval(async () => {
      try {
        const metrics = await this.getCurrentMetrics();
        this.recordMetrics(metrics);
        
        // Check scaling triggers
        const recommendation = this.evaluateScaling(metrics);
        if (recommendation.action !== 'no_action') {
          await this.handleScalingRecommendation(recommendation, metrics);
        }

        // Clean up old metrics
        this.cleanupOldMetrics();

      } catch (error) {
        console.error('[SCALING_MANAGER] Error during metrics collection:', error);
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  /**
   * Get current system metrics
   */
  private async getCurrentMetrics(): Promise<ScalingMetrics> {
    const b1Usage = azureB1Optimizer.getCurrentResourceUsage();
    
    // Note: In a real implementation, these would come from Azure Monitor API
    // For now, using B1 optimizer data and placeholders
    return {
      memoryUsagePercent: b1Usage.memory.percentage,
      cpuUsagePercent: 0, // Would need Azure Monitor integration
      dtuUsagePercent: 0, // Would need Azure SQL metrics
      activeConnections: b1Usage.connections.database + b1Usage.connections.redis,
      averageResponseTime: 0, // Would come from Application Insights
      errorRate: 0, // Would come from Application Insights
      concurrentUsers: 0 // Would need application-level tracking
    };
  }

  /**
   * Record metrics in history
   */
  private recordMetrics(metrics: ScalingMetrics): void {
    this.metricsHistory.push({
      timestamp: new Date(),
      metrics
    });

    // Track metrics in Application Insights
    if (appInsights.isInitialized()) {
      appInsights.trackMetric('scaling.memory_usage_percent', metrics.memoryUsagePercent);
      appInsights.trackMetric('scaling.cpu_usage_percent', metrics.cpuUsagePercent);
      appInsights.trackMetric('scaling.dtu_usage_percent', metrics.dtuUsagePercent);
      appInsights.trackMetric('scaling.active_connections', metrics.activeConnections);
      appInsights.trackMetric('scaling.response_time_ms', metrics.averageResponseTime);
      appInsights.trackMetric('scaling.error_rate_percent', metrics.errorRate);
      appInsights.trackMetric('scaling.concurrent_users', metrics.concurrentUsers);
    }
  }

  /**
   * Clean up old metrics data
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - this.HISTORY_RETENTION_HOURS);

    this.metricsHistory = this.metricsHistory.filter(
      entry => entry.timestamp > cutoff
    );
  }

  /**
   * Evaluate scaling recommendations based on current metrics
   */
  evaluateScaling(metrics: ScalingMetrics): ScalingRecommendation {
    const now = new Date();
    const triggeredRules: ScalingTrigger[] = [];

    // Check each trigger
    for (const trigger of this.triggers) {
      // Check cooldown period
      if (trigger.lastTriggered) {
        const cooldownMs = trigger.cooldownMinutes * 60 * 1000;
        if (now.getTime() - trigger.lastTriggered.getTime() < cooldownMs) {
          continue; // Still in cooldown
        }
      }

      // Check condition
      if (trigger.condition(metrics)) {
        triggeredRules.push(trigger);
      }
    }

    if (triggeredRules.length === 0) {
      return {
        action: 'no_action',
        priority: 'low',
        reasoning: ['All metrics within acceptable ranges'],
        estimatedCost: '$0',
        timeframe: 'N/A'
      };
    }

    // Find highest priority trigger
    const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
    const highestPriority = triggeredRules.reduce((prev, current) => 
      priorities[current.priority] > priorities[prev.priority] ? current : prev
    );

    // Mark trigger as activated
    highestPriority.lastTriggered = now;

    // Generate recommendation based on triggered rules
    return this.generateRecommendation(triggeredRules, metrics);
  }

  /**
   * Generate scaling recommendation
   */
  private generateRecommendation(
    triggeredRules: ScalingTrigger[], 
    metrics: ScalingMetrics
  ): ScalingRecommendation {
    const scaleUpRules = triggeredRules.filter(r => r.action === 'scale_up');
    const optimizeRules = triggeredRules.filter(r => r.action === 'optimize');

    // Determine primary action
    let action: ScalingRecommendation['action'] = 'no_action';
    let priority: ScalingRecommendation['priority'] = 'low';
    const reasoning: string[] = [];

    if (scaleUpRules.length > 0) {
      action = 'scale_up';
      priority = scaleUpRules.reduce((maxPriority, rule) => {
        const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorities[rule.priority] > priorities[maxPriority] ? rule.priority : maxPriority;
      }, 'low' as ScalingRecommendation['priority']);

      reasoning.push(...scaleUpRules.map(r => r.description));
    } else if (optimizeRules.length > 0) {
      action = 'optimize';
      priority = 'medium';
      reasoning.push(...optimizeRules.map(r => r.description));
    }

    // Generate cost estimates and next tier recommendations
    const nextTier = this.getNextTierRecommendation(metrics);
    const timeframe = priority === 'critical' ? 'Immediate' : 
                     priority === 'high' ? 'Within 24 hours' : 
                     priority === 'medium' ? 'Within 1 week' : 'When convenient';

    return {
      action,
      priority,
      reasoning,
      estimatedCost: nextTier ? `+$${nextTier.estimatedMonthlyCost - 18}/month` : '$0',
      timeframe,
      nextTier
    };
  }

  /**
   * Get next tier recommendation based on bottlenecks
   */
  private getNextTierRecommendation(metrics: ScalingMetrics): ScalingRecommendation['nextTier'] {
    const recommendations: ScalingRecommendation['nextTier'] = {
      estimatedMonthlyCost: 18 // Current cost
    };

    // Determine if App Service needs scaling
    if (metrics.memoryUsagePercent > 80 || metrics.cpuUsagePercent > 80 || metrics.concurrentUsers > 15) {
      recommendations.appService = 'B2 (3.5GB RAM, 2 cores)';
      recommendations.estimatedMonthlyCost += 13; // B2 is ~$26/month vs B1 $13/month
    }

    // Determine if database needs scaling
    if (metrics.dtuUsagePercent > 80 || metrics.activeConnections > 20) {
      recommendations.sqlDatabase = 'Standard S0 (10 DTU)';
      recommendations.estimatedMonthlyCost += 10; // S0 is ~$15/month vs Basic $5/month
    }

    return recommendations.estimatedMonthlyCost > 18 ? recommendations : undefined;
  }

  /**
   * Handle scaling recommendation
   */
  private async handleScalingRecommendation(
    recommendation: ScalingRecommendation, 
    metrics: ScalingMetrics
  ): Promise<void> {
    console.log(`[SCALING_MANAGER] Scaling recommendation: ${recommendation.action} (${recommendation.priority} priority)`);
    console.log(`[SCALING_MANAGER] Reasoning: ${recommendation.reasoning.join(', ')}`);

    // Track scaling events in Application Insights
    if (appInsights.isInitialized()) {
      appInsights.trackEvent('scaling_recommendation', {
        action: recommendation.action,
        priority: recommendation.priority,
        reasoning: recommendation.reasoning.join('; '),
        timeframe: recommendation.timeframe,
        estimatedCost: recommendation.estimatedCost,
        nextTierAppService: recommendation.nextTier?.appService || 'none',
        nextTierDatabase: recommendation.nextTier?.sqlDatabase || 'none'
      });
    }

    // For critical priority, could integrate with Azure CLI or ARM templates
    if (recommendation.priority === 'critical') {
      console.warn(`[SCALING_MANAGER] CRITICAL: ${recommendation.reasoning.join(', ')}`);
      
      // Could trigger automated scaling here in future versions
      // await this.executeAutoScaling(recommendation);
    }

    // Generate scaling report
    await this.generateScalingReport(recommendation, metrics);
  }

  /**
   * Generate scaling report
   */
  private async generateScalingReport(
    recommendation: ScalingRecommendation, 
    metrics: ScalingMetrics
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      recommendation,
      currentMetrics: metrics,
      historicalTrend: this.getMetricsTrend(),
      actionRequired: recommendation.action !== 'no_action'
    };

    console.log('[SCALING_MANAGER] Scaling Report Generated:', JSON.stringify(report, null, 2));

    // In a production environment, this could:
    // 1. Send alerts via email/Slack
    // 2. Create Azure DevOps work items
    // 3. Trigger automated scaling workflows
    // 4. Update monitoring dashboards
  }

  /**
   * Get metrics trend analysis
   */
  private getMetricsTrend(): {
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    averageMemoryLast24h: number;
    peakMemoryLast24h: number;
  } {
    if (this.metricsHistory.length < 2) {
      return {
        memoryTrend: 'stable',
        averageMemoryLast24h: 0,
        peakMemoryLast24h: 0
      };
    }

    const memoryValues = this.metricsHistory.map(h => h.metrics.memoryUsagePercent);
    const average = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length;
    const peak = Math.max(...memoryValues);

    // Simple trend analysis (last 10 vs previous 10 readings)
    const recentReadings = memoryValues.slice(-10);
    const earlierReadings = memoryValues.slice(-20, -10);

    if (recentReadings.length < 5 || earlierReadings.length < 5) {
      return {
        memoryTrend: 'stable',
        averageMemoryLast24h: average,
        peakMemoryLast24h: peak
      };
    }

    const recentAvg = recentReadings.reduce((sum, val) => sum + val, 0) / recentReadings.length;
    const earlierAvg = earlierReadings.reduce((sum, val) => sum + val, 0) / earlierReadings.length;

    const difference = recentAvg - earlierAvg;
    const trend = difference > 5 ? 'increasing' : difference < -5 ? 'decreasing' : 'stable';

    return {
      memoryTrend: trend,
      averageMemoryLast24h: average,
      peakMemoryLast24h: peak
    };
  }

  /**
   * Get current scaling status
   */
  getScalingStatus(): {
    currentTier: string;
    lastRecommendation?: ScalingRecommendation;
    metricsHistory: number;
    activeTriggers: string[];
  } {
    const activeTriggers = this.triggers
      .filter(t => t.lastTriggered && (Date.now() - t.lastTriggered.getTime()) < (t.cooldownMinutes * 60 * 1000))
      .map(t => t.name);

    return {
      currentTier: 'Azure B1 + SQL Basic',
      metricsHistory: this.metricsHistory.length,
      activeTriggers
    };
  }

  /**
   * Manually trigger scaling evaluation
   */
  async evaluateNow(): Promise<ScalingRecommendation> {
    const metrics = await this.getCurrentMetrics();
    return this.evaluateScaling(metrics);
  }

  /**
   * Get scaling recommendations for planning
   */
  async getScalingPlan(): Promise<{
    current: { tier: string; cost: number };
    recommendations: Array<{
      scenario: string;
      tier: string;
      cost: number;
      capabilities: string[];
      useCase: string;
    }>;
  }> {
    return {
      current: {
        tier: 'B1 + SQL Basic',
        cost: 18
      },
      recommendations: [
        {
          scenario: 'Memory pressure relief',
          tier: 'B2 + SQL Basic',
          cost: 31,
          capabilities: ['3.5GB RAM', '2 CPU cores', 'Better concurrent handling'],
          useCase: 'Memory usage consistently > 80%'
        },
        {
          scenario: 'Database performance improvement',
          tier: 'B1 + SQL Standard S0',
          cost: 28,
          capabilities: ['10 DTU (vs 5)', '250GB storage', 'Better query performance'],
          useCase: 'DTU usage > 80% or slow queries'
        },
        {
          scenario: 'Full performance upgrade',
          tier: 'B2 + SQL Standard S0',
          cost: 41,
          capabilities: ['3.5GB RAM', '2 cores', '10 DTU', '250GB storage'],
          useCase: 'Both memory and database bottlenecks'
        },
        {
          scenario: 'Production-ready scaling',
          tier: 'S1 + SQL Standard S1',
          cost: 70,
          capabilities: ['1.75GB RAM', 'Auto-scaling', '20 DTU', 'Staging slots'],
          useCase: 'High availability and auto-scaling needs'
        }
      ]
    };
  }
}

// Global scaling manager instance
export const scalingManager = new AzureScalingManager();

/**
 * Scaling health check endpoint data
 */
export async function getScalingHealthCheck(): Promise<{
  status: 'healthy' | 'attention_needed' | 'action_required';
  currentMetrics: ScalingMetrics;
  recommendation: ScalingRecommendation;
  trend: ReturnType<AzureScalingManager['getMetricsTrend']>;
}> {
  const recommendation = await scalingManager.evaluateNow();
  const metrics = await scalingManager['getCurrentMetrics']();
  const trend = scalingManager['getMetricsTrend']();

  const status = recommendation.priority === 'critical' ? 'action_required' :
                 recommendation.priority === 'high' ? 'attention_needed' : 'healthy';

  return {
    status,
    currentMetrics: metrics,
    recommendation,
    trend
  };
}