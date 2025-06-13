/**
 * Data Quality Monitoring System
 * Tracks validation metrics and provides insights for continuous improvement
 * 
 * Features:
 * - Real-time quality metrics
 * - Historical trend analysis
 * - Automated alerts
 * - Quality dashboards
 */

import { PrismaClient } from '@prisma/client';
import { ValidationResult, ValidationError, ValidationWarning } from './validation-service';
import EventEmitter from 'events';

export interface QualityMetrics {
  timestamp: Date;
  entityType: string;
  totalRecords: number;
  validRecords: number;
  errorCount: number;
  warningCount: number;
  averageQualityScore: number;
  errorsByType: Record<string, number>;
  commonErrors: Array<{
    field: string;
    errorType: string;
    count: number;
    percentage: number;
  }>;
  dataCompleteness: {
    requiredFields: number;
    completedFields: number;
    percentage: number;
  };
  performanceMetrics: {
    validationDuration: number;
    recordsPerSecond: number;
  };
}

export interface QualityTrend {
  period: 'daily' | 'weekly' | 'monthly';
  entityType: string;
  trends: Array<{
    date: Date;
    averageScore: number;
    errorRate: number;
    warningRate: number;
    recordCount: number;
  }>;
}

export interface QualityAlert {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'QUALITY_DROP' | 'HIGH_ERROR_RATE' | 'MISSING_DATA' | 'VALIDATION_FAILURE';
  entityType: string;
  message: string;
  details: any;
  resolved: boolean;
}

export class DataQualityMonitor extends EventEmitter {
  private prisma: PrismaClient;
  private metricsCache: Map<string, QualityMetrics[]>;
  private alertThresholds: {
    qualityScoreMin: number;
    errorRateMax: number;
    warningRateMax: number;
    missingDataMax: number;
  };
  
  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.metricsCache = new Map();
    this.alertThresholds = {
      qualityScoreMin: 70,
      errorRateMax: 0.05, // 5%
      warningRateMax: 0.20, // 20%
      missingDataMax: 0.30 // 30%
    };
  }

  /**
   * Record validation metrics
   */
  async recordMetrics(
    entityType: string,
    validationResult: ValidationResult,
    duration: number
  ): Promise<QualityMetrics> {
    const startTime = Date.now();
    
    // Calculate error distribution
    const errorsByType: Record<string, number> = {};
    validationResult.errors.forEach(error => {
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
    });
    
    // Find common errors
    const errorFieldCounts: Record<string, Record<string, number>> = {};
    validationResult.errors.forEach(error => {
      const key = `${error.field}:${error.errorType}`;
      if (!errorFieldCounts[key]) {
        errorFieldCounts[key] = { field: error.field, errorType: error.errorType, count: 0 };
      }
      errorFieldCounts[key].count++;
    });
    
    const commonErrors = Object.values(errorFieldCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        field: item.field,
        errorType: item.errorType,
        count: item.count,
        percentage: (item.count / validationResult.processedCount) * 100
      }));
    
    // Calculate data completeness (simplified)
    const requiredFieldsCount = this.getRequiredFieldsCount(entityType);
    const averageCompleteness = 100 - (validationResult.warningCount / validationResult.processedCount / requiredFieldsCount * 100);
    
    const metrics: QualityMetrics = {
      timestamp: new Date(),
      entityType,
      totalRecords: validationResult.processedCount,
      validRecords: validationResult.processedCount - validationResult.errorCount,
      errorCount: validationResult.errorCount,
      warningCount: validationResult.warningCount,
      averageQualityScore: validationResult.dataQualityScore,
      errorsByType,
      commonErrors,
      dataCompleteness: {
        requiredFields: requiredFieldsCount,
        completedFields: Math.round(requiredFieldsCount * (averageCompleteness / 100)),
        percentage: averageCompleteness
      },
      performanceMetrics: {
        validationDuration: duration,
        recordsPerSecond: validationResult.processedCount / (duration / 1000)
      }
    };
    
    // Store in cache
    if (!this.metricsCache.has(entityType)) {
      this.metricsCache.set(entityType, []);
    }
    this.metricsCache.get(entityType)!.push(metrics);
    
    // Store in database
    await this.storeMetrics(metrics);
    
    // Check for alerts
    await this.checkAlerts(metrics);
    
    // Emit metrics event
    this.emit('metrics:recorded', metrics);
    
    return metrics;
  }

  /**
   * Get quality trends over time
   */
  async getQualityTrends(
    entityType: string,
    period: 'daily' | 'weekly' | 'monthly',
    lookbackDays: number = 30
  ): Promise<QualityTrend> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    
    // In production, this would query from database
    // For now, we'll use cache data
    const cachedMetrics = this.metricsCache.get(entityType) || [];
    const relevantMetrics = cachedMetrics.filter(m => m.timestamp >= startDate);
    
    // Group by period
    const grouped = this.groupMetricsByPeriod(relevantMetrics, period);
    
    const trends = Object.entries(grouped).map(([dateKey, metrics]) => {
      const totalRecords = metrics.reduce((sum, m) => sum + m.totalRecords, 0);
      const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
      const totalWarnings = metrics.reduce((sum, m) => sum + m.warningCount, 0);
      const avgScore = metrics.reduce((sum, m) => sum + m.averageQualityScore, 0) / metrics.length;
      
      return {
        date: new Date(dateKey),
        averageScore: Math.round(avgScore),
        errorRate: totalErrors / totalRecords,
        warningRate: totalWarnings / totalRecords,
        recordCount: totalRecords
      };
    });
    
    return {
      period,
      entityType,
      trends: trends.sort((a, b) => a.date.getTime() - b.date.getTime())
    };
  }

  /**
   * Generate quality report
   */
  async generateQualityReport(
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    let report = '# Data Quality Report\n\n';
    report += `**Period**: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`;
    report += `**Generated**: ${new Date().toISOString()}\n\n`;
    
    // Executive Summary
    report += '## Executive Summary\n\n';
    
    const allMetrics: QualityMetrics[] = [];
    for (const [entityType, metrics] of this.metricsCache) {
      const periodMetrics = metrics.filter(m => 
        m.timestamp >= startDate && m.timestamp <= endDate
      );
      allMetrics.push(...periodMetrics);
      
      if (periodMetrics.length > 0) {
        const totalRecords = periodMetrics.reduce((sum, m) => sum + m.totalRecords, 0);
        const avgScore = periodMetrics.reduce((sum, m) => sum + m.averageQualityScore, 0) / periodMetrics.length;
        const totalErrors = periodMetrics.reduce((sum, m) => sum + m.errorCount, 0);
        
        report += `### ${entityType}\n`;
        report += `- **Records Processed**: ${totalRecords.toLocaleString()}\n`;
        report += `- **Average Quality Score**: ${avgScore.toFixed(1)}%\n`;
        report += `- **Total Errors**: ${totalErrors.toLocaleString()}\n`;
        report += `- **Error Rate**: ${((totalErrors / totalRecords) * 100).toFixed(2)}%\n\n`;
      }
    }
    
    // Data Quality Trends
    report += '## Quality Trends\n\n';
    for (const entityType of ['Organizations', 'Contacts', 'Interactions', 'Opportunities']) {
      const trends = await this.getQualityTrends(entityType, 'daily', 30);
      if (trends.trends.length > 0) {
        report += `### ${entityType}\n\n`;
        report += '| Date | Quality Score | Error Rate | Records |\n';
        report += '|------|---------------|------------|----------|\n';
        
        trends.trends.slice(-7).forEach(trend => {
          report += `| ${trend.date.toISOString().split('T')[0]} `;
          report += `| ${trend.averageScore}% `;
          report += `| ${(trend.errorRate * 100).toFixed(2)}% `;
          report += `| ${trend.recordCount.toLocaleString()} |\n`;
        });
        report += '\n';
      }
    }
    
    // Common Issues
    report += '## Common Data Quality Issues\n\n';
    const allErrors: Array<{ entity: string; field: string; type: string; count: number }> = [];
    
    for (const [entityType, metrics] of this.metricsCache) {
      const periodMetrics = metrics.filter(m => 
        m.timestamp >= startDate && m.timestamp <= endDate
      );
      
      periodMetrics.forEach(metric => {
        metric.commonErrors.forEach(error => {
          allErrors.push({
            entity: entityType,
            field: error.field,
            type: error.errorType,
            count: error.count
          });
        });
      });
    }
    
    // Group and sort errors
    const errorSummary = allErrors.reduce((acc, error) => {
      const key = `${error.entity}:${error.field}:${error.type}`;
      if (!acc[key]) {
        acc[key] = { ...error, count: 0 };
      }
      acc[key].count += error.count;
      return acc;
    }, {} as Record<string, any>);
    
    const topErrors = Object.values(errorSummary)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    if (topErrors.length > 0) {
      report += '| Entity | Field | Error Type | Occurrences |\n';
      report += '|--------|-------|------------|-------------|\n';
      
      topErrors.forEach(error => {
        report += `| ${error.entity} | ${error.field} | ${error.type} | ${error.count.toLocaleString()} |\n`;
      });
      report += '\n';
    }
    
    // Recommendations
    report += '## Recommendations\n\n';
    report += this.generateRecommendations(allMetrics);
    
    // Performance Metrics
    report += '\n## Performance Metrics\n\n';
    const avgValidationSpeed = allMetrics.reduce((sum, m) => 
      sum + m.performanceMetrics.recordsPerSecond, 0
    ) / allMetrics.length;
    
    report += `- **Average Validation Speed**: ${avgValidationSpeed.toFixed(0)} records/second\n`;
    report += `- **Total Validation Time**: ${(allMetrics.reduce((sum, m) => 
      sum + m.performanceMetrics.validationDuration, 0
    ) / 1000).toFixed(1)} seconds\n`;
    
    return report;
  }

  /**
   * Check for quality alerts
   */
  private async checkAlerts(metrics: QualityMetrics): Promise<void> {
    const alerts: QualityAlert[] = [];
    
    // Check quality score threshold
    if (metrics.averageQualityScore < this.alertThresholds.qualityScoreMin) {
      alerts.push({
        id: `quality-${metrics.entityType}-${Date.now()}`,
        timestamp: new Date(),
        severity: metrics.averageQualityScore < 50 ? 'HIGH' : 'MEDIUM',
        type: 'QUALITY_DROP',
        entityType: metrics.entityType,
        message: `Data quality score dropped to ${metrics.averageQualityScore}% (threshold: ${this.alertThresholds.qualityScoreMin}%)`,
        details: { score: metrics.averageQualityScore, threshold: this.alertThresholds.qualityScoreMin },
        resolved: false
      });
    }
    
    // Check error rate
    const errorRate = metrics.errorCount / metrics.totalRecords;
    if (errorRate > this.alertThresholds.errorRateMax) {
      alerts.push({
        id: `error-rate-${metrics.entityType}-${Date.now()}`,
        timestamp: new Date(),
        severity: errorRate > 0.10 ? 'CRITICAL' : 'HIGH',
        type: 'HIGH_ERROR_RATE',
        entityType: metrics.entityType,
        message: `Error rate is ${(errorRate * 100).toFixed(2)}% (threshold: ${(this.alertThresholds.errorRateMax * 100).toFixed(0)}%)`,
        details: { 
          errorRate, 
          threshold: this.alertThresholds.errorRateMax,
          commonErrors: metrics.commonErrors.slice(0, 5)
        },
        resolved: false
      });
    }
    
    // Check data completeness
    const missingDataRate = 1 - (metrics.dataCompleteness.percentage / 100);
    if (missingDataRate > this.alertThresholds.missingDataMax) {
      alerts.push({
        id: `missing-data-${metrics.entityType}-${Date.now()}`,
        timestamp: new Date(),
        severity: 'MEDIUM',
        type: 'MISSING_DATA',
        entityType: metrics.entityType,
        message: `${(missingDataRate * 100).toFixed(0)}% of required fields are missing (threshold: ${(this.alertThresholds.missingDataMax * 100).toFixed(0)}%)`,
        details: { 
          missingRate: missingDataRate,
          completeness: metrics.dataCompleteness
        },
        resolved: false
      });
    }
    
    // Emit alerts
    alerts.forEach(alert => {
      this.emit('alert:triggered', alert);
      this.storeAlert(alert);
    });
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: QualityMetrics): Promise<void> {
    // In production, this would store in the DataQualityAudit table
    // For now, we'll just log it
    console.log('Storing quality metrics:', {
      entity: metrics.entityType,
      score: metrics.averageQualityScore,
      errors: metrics.errorCount,
      warnings: metrics.warningCount
    });
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: QualityAlert): Promise<void> {
    // In production, this would store in an alerts table
    console.log('Quality Alert:', alert);
  }

  /**
   * Group metrics by time period
   */
  private groupMetricsByPeriod(
    metrics: QualityMetrics[],
    period: 'daily' | 'weekly' | 'monthly'
  ): Record<string, QualityMetrics[]> {
    const grouped: Record<string, QualityMetrics[]> = {};
    
    metrics.forEach(metric => {
      let key: string;
      const date = new Date(metric.timestamp);
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    });
    
    return grouped;
  }

  /**
   * Get required fields count for entity type
   */
  private getRequiredFieldsCount(entityType: string): number {
    const requiredFields: Record<string, number> = {
      'Organizations': 8, // name, priority, segment, contact info, etc.
      'Contacts': 5, // name, org, contact method
      'Interactions': 6, // type, date, subject, org, outcome
      'Opportunities': 7 // name, org, stage, value, probability
    };
    
    return requiredFields[entityType] || 5;
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: QualityMetrics[]): string {
    const recommendations: string[] = [];
    
    // Analyze overall quality
    const avgQuality = metrics.reduce((sum, m) => sum + m.averageQualityScore, 0) / metrics.length;
    if (avgQuality < 70) {
      recommendations.push('1. **Improve Data Quality**: Average quality score is below 70%. Focus on completing required fields and fixing validation errors.');
    }
    
    // Analyze common errors
    const allErrors: Record<string, number> = {};
    metrics.forEach(m => {
      Object.entries(m.errorsByType).forEach(([type, count]) => {
        allErrors[type] = (allErrors[type] || 0) + count;
      });
    });
    
    const topErrorType = Object.entries(allErrors)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topErrorType) {
      const [errorType, count] = topErrorType;
      switch (errorType) {
        case 'REQUIRED':
          recommendations.push('2. **Complete Required Fields**: Many records are missing required fields. Review data entry processes.');
          break;
        case 'FORMAT':
          recommendations.push('2. **Fix Format Errors**: Many format validation errors. Provide better data entry guidance and validation.');
          break;
        case 'REFERENCE':
          recommendations.push('2. **Resolve References**: Many referential integrity errors. Ensure related records exist before creating dependencies.');
          break;
        case 'DUPLICATE':
          recommendations.push('2. **Remove Duplicates**: Duplicate records detected. Implement deduplication process.');
          break;
      }
    }
    
    // Performance recommendations
    const avgSpeed = metrics.reduce((sum, m) => 
      sum + m.performanceMetrics.recordsPerSecond, 0
    ) / metrics.length;
    
    if (avgSpeed < 100) {
      recommendations.push('3. **Optimize Performance**: Validation speed is below 100 records/second. Consider batch size optimization.');
    }
    
    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('1. **Maintain Quality**: Data quality is good. Continue regular monitoring and validation.');
    }
    
    recommendations.push('\n### Best Practices\n');
    recommendations.push('- Validate data at entry point to prevent bad data from entering the system');
    recommendations.push('- Regularly review and update validation rules based on business changes');
    recommendations.push('- Train users on data quality importance and proper data entry');
    recommendations.push('- Implement automated data quality checks in your workflows');
    
    return recommendations.join('\n');
  }

  /**
   * Get current alert status
   */
  async getActiveAlerts(entityType?: string): Promise<QualityAlert[]> {
    // In production, this would query from database
    // For now, return empty array
    return [];
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    // In production, this would update the alert in database
    this.emit('alert:resolved', { alertId, resolution });
  }

  /**
   * Export metrics for external analysis
   */
  async exportMetrics(
    entityType: string,
    format: 'json' | 'csv',
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const metrics = this.metricsCache.get(entityType) || [];
    const filtered = metrics.filter(m => {
      if (startDate && m.timestamp < startDate) return false;
      if (endDate && m.timestamp > endDate) return false;
      return true;
    });
    
    if (format === 'json') {
      return JSON.stringify(filtered, null, 2);
    } else {
      // CSV format
      let csv = 'Timestamp,Entity,Total Records,Valid Records,Errors,Warnings,Quality Score,Error Rate\n';
      
      filtered.forEach(m => {
        csv += `${m.timestamp.toISOString()},`;
        csv += `${m.entityType},`;
        csv += `${m.totalRecords},`;
        csv += `${m.validRecords},`;
        csv += `${m.errorCount},`;
        csv += `${m.warningCount},`;
        csv += `${m.averageQualityScore},`;
        csv += `${((m.errorCount / m.totalRecords) * 100).toFixed(2)}%\n`;
      });
      
      return csv;
    }
  }
}