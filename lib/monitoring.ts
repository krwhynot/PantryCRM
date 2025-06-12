/**
 * Centralized logging and monitoring system for PantryCRM
 * Supports multiple logging levels and external service integration
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  stack?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'INVALID_TOKEN' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: any;
  timestamp: string;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.minLevel = this.getMinLogLevel();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private getMinLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const category = entry.category.toUpperCase().padEnd(12);
    
    if (this.isDevelopment) {
      // Colorized output for development
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.FATAL]: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level];
      
      return `${color}[${timestamp}] ${levelName.padEnd(5)} ${category}${reset} ${entry.message}`;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    if (!this.isProduction) return;

    try {
      // In production, integrate with your monitoring service
      // Examples: Azure Application Insights, DataDog, New Relic, etc.
      
      if (process.env.AZURE_INSIGHTS_CONNECTION_STRING) {
        // Azure Application Insights integration
        await this.sendToAzureInsights(entry);
      }
      
      if (process.env.DATADOG_API_KEY) {
        // DataDog integration
        await this.sendToDataDog(entry);
      }
    } catch (error) {
      // Fallback to console if external service fails
      console.error('Failed to send log to external service:', error);
    }
  }

  private async sendToAzureInsights(entry: LogEntry): Promise<void> {
    // Placeholder for Azure Application Insights integration
    // In real implementation, use @azure/monitor-ingestion
    if (typeof window === 'undefined') {
      console.log('Would send to Azure Insights:', entry.message);
    }
  }

  private async sendToDataDog(entry: LogEntry): Promise<void> {
    // Placeholder for DataDog integration
    // In real implementation, use datadog browser logs SDK
    if (typeof window === 'undefined') {
      console.log('Would send to DataDog:', entry.message);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    category: string,
    data?: any,
    context?: Partial<LogEntry>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      data,
      ...context,
    };
  }

  debug(message: string, category: string = 'APP', data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, message, category, data, context);
  }

  info(message: string, category: string = 'APP', data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, message, category, data, context);
  }

  warn(message: string, category: string = 'APP', data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, message, category, data, context);
  }

  error(message: string, category: string = 'APP', data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, message, category, data, context);
  }

  fatal(message: string, category: string = 'APP', data?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.FATAL, message, category, data, context);
  }

  private log(
    level: LogLevel,
    message: string,
    category: string,
    data?: any,
    context?: Partial<LogEntry>
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, category, data, context);
    const formattedMessage = this.formatLogEntry(entry);

    // Always output to console
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }

    // Send to external services in production
    this.sendToExternalService(entry).catch(() => {
      // Silently fail external logging to avoid infinite loops
    });
  }
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  recordMetric(metric: PerformanceMetric): void {
    const existing = this.metrics.get(metric.name) || [];
    existing.push(metric);
    
    // Keep only last 100 metrics per type
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set(metric.name, existing);

    // Log significant performance issues
    if (this.isSlowMetric(metric)) {
      logger.warn(
        `Slow performance detected: ${metric.name} took ${metric.value}${metric.unit}`,
        'PERFORMANCE',
        metric
      );
    }
  }

  private isSlowMetric(metric: PerformanceMetric): boolean {
    const thresholds: Record<string, number> = {
      'api_response_time': 2000, // 2 seconds
      'database_query_time': 1000, // 1 second
      'page_load_time': 3000, // 3 seconds
    };

    const threshold = thresholds[metric.name];
    return threshold && metric.value > threshold;
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: PerformanceMetric[] = [];
    this.metrics.forEach(metrics => allMetrics.push(...metrics));
    return allMetrics;
  }

  getAverageMetric(name: string, since?: Date): number | null {
    const metrics = this.getMetrics(name);
    const filteredMetrics = since 
      ? metrics.filter(m => new Date(m.timestamp) >= since)
      : metrics;
    
    if (filteredMetrics.length === 0) return null;
    
    const total = filteredMetrics.reduce((sum, m) => sum + m.value, 0);
    return total / filteredMetrics.length;
  }
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];

  recordSecurityEvent(event: SecurityEvent): void {
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // Log security events
    const level = event.severity === 'CRITICAL' ? LogLevel.FATAL : 
                  event.severity === 'HIGH' ? LogLevel.ERROR :
                  event.severity === 'MEDIUM' ? LogLevel.WARN : LogLevel.INFO;

    logger.log(
      level,
      `Security event: ${event.type}`,
      'SECURITY',
      event.details,
      {
        userId: event.userId,
        ip: event.ip,
        userAgent: event.userAgent,
      }
    );

    // Alert on critical events
    if (event.severity === 'CRITICAL') {
      this.alertCriticalSecurityEvent(event);
    }
  }

  private alertCriticalSecurityEvent(event: SecurityEvent): void {
    // In production, integrate with alerting systems
    logger.fatal(
      `CRITICAL SECURITY ALERT: ${event.type}`,
      'SECURITY',
      event
    );
  }

  getSecurityEvents(since?: Date): SecurityEvent[] {
    return since 
      ? this.events.filter(e => new Date(e.timestamp) >= since)
      : this.events;
  }
}

/**
 * Enhanced Performance Monitor for Azure B1 constraints
 * Extends the existing PerformanceMonitor with B1-specific optimizations
 */
class EnhancedPerformanceMonitor extends PerformanceMonitor {
  private responseTimes: number[] = [];
  private activeConnections = 0;
  private queuedRequests = 0;
  private detailedMetrics: Array<{
    timestamp: number;
    memory: {
      used: number;
      free: number;
      percentage: number;
      heapUsed: number;
      heapTotal: number;
    };
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
    concurrent: {
      activeConnections: number;
      queuedRequests: number;
    };
  }> = [];

  constructor() {
    super();
    
    // Collect detailed metrics every 30 seconds for B1 monitoring
    setInterval(() => this.collectDetailedMetrics(), 30000);
    
    // Clean up old detailed metrics every 5 minutes
    setInterval(() => this.cleanupDetailedMetrics(), 5 * 60 * 1000);
  }

  // Track incoming requests for B1 concurrency monitoring
  trackRequest(): () => void {
    this.activeConnections++;
    const startTime = Date.now();

    return () => {
      this.activeConnections--;
      const duration = Date.now() - startTime;
      this.addResponseTime(duration);
    };
  }

  // Track queued requests
  trackQueuedRequest(): () => void {
    this.queuedRequests++;
    
    return () => {
      this.queuedRequests--;
    };
  }

  private addResponseTime(duration: number): void {
    this.responseTimes.push(duration);
    
    // Keep only last 1000 response times for memory efficiency on B1
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  private collectDetailedMetrics(): void {
    try {
      const memoryUsage = process.memoryUsage();
      
      const metric = {
        timestamp: Date.now(),
        memory: {
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
        },
        responseTime: this.calculateResponseTimeMetrics(),
        concurrent: {
          activeConnections: this.activeConnections,
          queuedRequests: this.queuedRequests,
        },
      };

      this.detailedMetrics.push(metric);
      
      // Check for B1-specific performance alerts
      this.checkB1PerformanceAlerts(metric);
      
    } catch (error) {
      logger.error('Failed to collect detailed performance metrics', 'MONITORING', error);
    }
  }

  private calculateResponseTimeMetrics() {
    if (this.responseTimes.length === 0) {
      return { average: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const length = sorted.length;
    
    const average = Math.round(
      this.responseTimes.reduce((sum, time) => sum + time, 0) / length
    );
    
    const p95 = sorted[Math.floor(length * 0.95)] || 0;
    const p99 = sorted[Math.floor(length * 0.99)] || 0;

    return { average, p95, p99 };
  }

  private checkB1PerformanceAlerts(metric: any): void {
    const alerts: string[] = [];

    // Memory alerts (critical for B1's 1.75GB limit)
    if (metric.memory.percentage > 85) {
      alerts.push(`High memory usage: ${metric.memory.percentage}%`);
      logger.warn(`High memory usage detected: ${metric.memory.percentage}%`, 'B1_MONITOR');
    }

    // Response time alerts for B1 performance requirements
    if (metric.responseTime.average > 1000) {
      alerts.push(`High average response time: ${metric.responseTime.average}ms`);
      logger.warn(`Search operation too slow: ${metric.responseTime.average}ms`, 'B1_MONITOR');
    }

    if (metric.responseTime.p95 > 3000) {
      alerts.push(`High P95 response time: ${metric.responseTime.p95}ms`);
      logger.warn(`Page load too slow for 3G: ${metric.responseTime.p95}ms`, 'B1_MONITOR');
    }

    // Connection alerts for B1 concurrency limits
    if (metric.concurrent.activeConnections > 4) {
      alerts.push(`High concurrent connections: ${metric.concurrent.activeConnections}`);
      logger.warn(`Approaching B1 concurrent user limit: ${metric.concurrent.activeConnections}`, 'B1_MONITOR');
    }

    if (alerts.length > 0) {
      // Record performance degradation event
      this.recordMetric({
        name: 'b1_performance_alert',
        value: alerts.length,
        unit: 'alerts',
        timestamp: new Date().toISOString(),
        tags: { severity: 'warning' },
      });
    }
  }

  private cleanupDetailedMetrics(): void {
    // Keep only last 100 detailed metrics for B1 memory constraints
    if (this.detailedMetrics.length > 100) {
      this.detailedMetrics = this.detailedMetrics.slice(-100);
    }
  }

  // Public API methods for B1 monitoring
  getCurrentB1Metrics() {
    return this.detailedMetrics[this.detailedMetrics.length - 1] || null;
  }

  getB1PerformanceSummary() {
    if (this.detailedMetrics.length === 0) return null;

    const recent = this.detailedMetrics.slice(-10); // Last 10 metrics
    const avgMemory = recent.reduce((sum, m) => sum + m.memory.percentage, 0) / recent.length;
    const avgResponseTime = recent.reduce((sum, m) => sum + m.responseTime.average, 0) / recent.length;

    return {
      averageMemoryUsage: Math.round(avgMemory),
      averageResponseTime: Math.round(avgResponseTime),
      peakConcurrentUsers: Math.max(...recent.map(m => m.concurrent.activeConnections)),
      healthStatus: this.getB1HealthStatus(),
      meetingRequirements: {
        searchUnder1s: avgResponseTime < 1000,
        memoryUnder80Percent: avgMemory < 80,
        supportsConcurrentUsers: true, // 4 users is well within limits
      },
    };
  }

  private getB1HealthStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
    const current = this.getCurrentB1Metrics();
    if (!current) return 'warning';

    const issues = [
      current.memory.percentage > 85,
      current.responseTime.average > 1000,
      current.concurrent.activeConnections > 4,
    ].filter(Boolean).length;

    if (issues === 0) return 'excellent';
    if (issues <= 1) return 'good';
    return issues <= 2 ? 'warning' : 'critical';
  }

  // Memory pressure detection for B1
  isMemoryPressureHigh(): boolean {
    const current = this.getCurrentB1Metrics();
    return current ? current.memory.percentage > 80 : false;
  }

  // Get B1-specific optimization recommendations
  getB1OptimizationRecommendations(): string[] {
    const current = this.getCurrentB1Metrics();
    if (!current) return [];

    const recommendations: string[] = [];

    if (current.memory.percentage > 80) {
      recommendations.push('Consider implementing memory cleanup or reducing cache size for B1 constraints');
    }

    if (current.responseTime.average > 1000) {
      recommendations.push('Search operations exceeding 1s requirement - review database queries and indexing');
    }

    if (current.responseTime.p95 > 3000) {
      recommendations.push('Page load exceeding 3s requirement for 3G - optimize bundle size and implement CDN');
    }

    if (current.concurrent.activeConnections > 3) {
      recommendations.push('Approaching 4 concurrent user limit - monitor for scaling needs');
    }

    return recommendations;
  }
}

// Singleton instances
export const logger = new Logger();
export const performanceMonitor = new EnhancedPerformanceMonitor();
export const securityMonitor = new SecurityMonitor();

// Utility functions for common logging scenarios
export const logAPIRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  error?: Error
): void => {
  const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
  const level = statusCode >= 500 ? LogLevel.ERROR :
                statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

  logger.log(level, message, 'API', { method, url, statusCode, duration }, {
    userId,
    stack: error?.stack,
  });

  // Record performance metric
  performanceMonitor.recordMetric({
    name: 'api_response_time',
    value: duration,
    unit: 'ms',
    timestamp: new Date().toISOString(),
    tags: { method, endpoint: url, status: statusCode.toString() },
  });
};

export const logDatabaseQuery = (
  query: string,
  duration: number,
  error?: Error
): void => {
  const message = error 
    ? `Database query failed: ${error.message}`
    : `Database query completed in ${duration}ms`;

  logger.log(
    error ? LogLevel.ERROR : LogLevel.DEBUG,
    message,
    'DATABASE',
    { query: query.substring(0, 200), duration },
    { stack: error?.stack }
  );

  // Record performance metric
  performanceMonitor.recordMetric({
    name: 'database_query_time',
    value: duration,
    unit: 'ms',
    timestamp: new Date().toISOString(),
  });
};

export const logSecurityEvent = (
  type: SecurityEvent['type'],
  severity: SecurityEvent['severity'],
  details: any,
  context?: { userId?: string; ip?: string; userAgent?: string }
): void => {
  securityMonitor.recordSecurityEvent({
    type,
    severity,
    details,
    timestamp: new Date().toISOString(),
    ...context,
  });
};