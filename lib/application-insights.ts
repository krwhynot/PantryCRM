/**
 * Application Insights integration for PantryCRM Azure monitoring
 * Integrates with existing B1 optimization metrics and performance tracking
 */

import * as appInsights from 'applicationinsights';
import { azureB1Optimizer } from './azure-b1-optimizations';

interface AppInsightsConfig {
  instrumentationKey?: string;
  connectionString?: string;
  enableAutoCollection: boolean;
  enableConsoleLogging: boolean;
  enableWebInstrumentation: boolean;
  enablePerformanceCounters: boolean;
  enableDependencyTracking: boolean;
  enableExceptionTracking: boolean;
  samplingPercentage: number;
}

/**
 * Application Insights manager for Azure B1 optimized monitoring
 */
export class ApplicationInsightsManager {
  private client: appInsights.TelemetryClient | null = null;
  private initialized = false;

  constructor() {
    this.setupApplicationInsights();
  }

  /**
   * Initialize Application Insights with B1-optimized configuration
   */
  private setupApplicationInsights(): void {
    const config = this.getOptimizedConfig();
    
    // Only initialize if we have connection info
    if (!config.connectionString && !config.instrumentationKey) {
      console.warn('[APP_INSIGHTS] No connection string or instrumentation key provided');
      return;
    }

    try {
      // Setup Application Insights
      if (config.connectionString) {
        appInsights.setup(config.connectionString);
      } else if (config.instrumentationKey) {
        appInsights.setup(config.instrumentationKey);
      }

      // Configure for Azure B1 constraints
      appInsights.Configuration
        .setAutoCollectRequests(config.enableAutoCollection)
        .setAutoCollectPerformance(config.enablePerformanceCounters, true)
        .setAutoCollectExceptions(config.enableExceptionTracking)
        .setAutoCollectDependencies(config.enableDependencyTracking)
        .setAutoCollectConsole(config.enableConsoleLogging, true)
        .setUseDiskRetryCaching(false) // Disable for B1 storage constraints
        .setSendLiveMetrics(true) // Enable Live Metrics for real-time monitoring
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

      // Optimize sampling for B1 constraints
      appInsights.Configuration.setAutoCollectPerformance(true, false);
      appInsights.defaultClient.config.samplingPercentage = config.samplingPercentage;

      // Set custom properties for B1 identification
      appInsights.defaultClient.commonProperties = {
        'azure.tier': 'B1',
        'app.version': process.env.npm_package_version || '0.0.3-beta',
        'deployment.environment': process.env.NODE_ENV || 'production',
        'optimization.level': 'azure-b1'
      };

      // Start Application Insights
      appInsights.start();
      
      this.client = appInsights.defaultClient;
      this.initialized = true;

      console.log('[APP_INSIGHTS] Application Insights initialized for Azure B1');
      
      // Send initial telemetry
      this.trackEvent('application_started', {
        tier: 'Azure B1',
        optimizations: 'enabled'
      });

      // Setup periodic B1 metrics reporting
      this.setupB1MetricsReporting();

    } catch (error) {
      console.error('[APP_INSIGHTS] Failed to initialize Application Insights:', error);
    }
  }

  /**
   * Get optimized configuration for Azure B1
   */
  private getOptimizedConfig(): AppInsightsConfig {
    return {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
      instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
      enableAutoCollection: true,
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableWebInstrumentation: true,
      enablePerformanceCounters: true,
      enableDependencyTracking: true,
      enableExceptionTracking: true,
      samplingPercentage: 50 // Reduce sampling for cost optimization
    };
  }

  /**
   * Setup periodic reporting of B1 optimization metrics
   */
  private setupB1MetricsReporting(): void {
    if (!this.client) return;

    // Report B1 resource usage every 60 seconds
    setInterval(() => {
      try {
        const usage = azureB1Optimizer.getCurrentResourceUsage();
        const health = azureB1Optimizer.getHealthStatus();

        // Memory metrics
        this.trackMetric('b1.memory.percentage', usage.memory.percentage);
        this.trackMetric('b1.memory.heap_mb', usage.memory.heap / 1024 / 1024);
        this.trackMetric('b1.memory.external_mb', usage.memory.external / 1024 / 1024);

        // Connection metrics
        this.trackMetric('b1.connections.database', usage.connections.database);
        this.trackMetric('b1.connections.redis', usage.connections.redis);
        this.trackMetric('b1.connections.total', usage.connections.database + usage.connections.redis);

        // Health status
        this.trackEvent('b1.health_check', {
          status: health.status,
          memoryUsage: health.memoryUsage.toString(),
          connections: health.connections.toString(),
          issueCount: health.issues.length.toString()
        });

        // Alert on critical issues
        if (health.status === 'critical') {
          this.trackException(new Error(`B1 Critical Status: ${health.issues.join(', ')}`), {
            severity: 'high',
            category: 'b1_optimization'
          });
        }

      } catch (error) {
        console.error('[APP_INSIGHTS] Error reporting B1 metrics:', error);
      }
    }, 60000); // Every 60 seconds
  }

  /**
   * Track custom events
   */
  trackEvent(name: string, properties?: Record<string, string>, measurements?: Record<string, number>): void {
    if (!this.client || !this.initialized) return;

    try {
      this.client.trackEvent({
        name,
        properties: {
          ...properties,
          timestamp: new Date().toISOString()
        },
        measurements
      });
    } catch (error) {
      console.error('[APP_INSIGHTS] Error tracking event:', error);
    }
  }

  /**
   * Track custom metrics
   */
  trackMetric(name: string, value: number, properties?: Record<string, string>): void {
    if (!this.client || !this.initialized) return;

    try {
      this.client.trackMetric({
        name,
        value,
        properties
      });
    } catch (error) {
      console.error('[APP_INSIGHTS] Error tracking metric:', error);
    }
  }

  /**
   * Track exceptions with context
   */
  trackException(error: Error, properties?: Record<string, string>): void {
    if (!this.client || !this.initialized) return;

    try {
      const usage = azureB1Optimizer.getCurrentResourceUsage();
      
      this.client.trackException({
        exception: error,
        properties: {
          ...properties,
          'b1.memory.percentage': usage.memory.percentage.toString(),
          'b1.connections.total': (usage.connections.database + usage.connections.redis).toString(),
          'b1.timestamp': new Date().toISOString()
        }
      });
    } catch (trackingError) {
      console.error('[APP_INSIGHTS] Error tracking exception:', trackingError);
    }
  }

  /**
   * Track API request performance
   */
  trackRequest(name: string, url: string, duration: number, statusCode: number, success: boolean, properties?: Record<string, string>): void {
    if (!this.client || !this.initialized) return;

    try {
      this.client.trackRequest({
        name,
        url,
        duration,
        resultCode: statusCode.toString(),
        success,
        properties: {
          ...properties,
          'b1.optimized': 'true'
        }
      });

      // Track slow requests for B1 optimization
      if (duration > 25000) { // 25 seconds (near B1 timeout limit)
        this.trackEvent('b1.slow_request', {
          endpoint: name,
          duration: duration.toString(),
          statusCode: statusCode.toString()
        });
      }

    } catch (error) {
      console.error('[APP_INSIGHTS] Error tracking request:', error);
    }
  }

  /**
   * Track dependency calls (database, Redis, external APIs)
   */
  trackDependency(name: string, commandName: string, startTime: Date, duration: number, success: boolean, resultCode?: string): void {
    if (!this.client || !this.initialized) return;

    try {
      this.client.trackDependency({
        dependencyTypeName: name,
        name: commandName,
        data: commandName,
        startTime,
        duration,
        success,
        resultCode
      });

      // Track slow database queries (B1 optimization concern)
      if (name.includes('database') && duration > 1000) { // 1 second
        this.trackEvent('b1.slow_database_query', {
          query: commandName,
          duration: duration.toString(),
          success: success.toString()
        });
      }

    } catch (error) {
      console.error('[APP_INSIGHTS] Error tracking dependency:', error);
    }
  }

  /**
   * Track page views with B1 performance context
   */
  trackPageView(name: string, url?: string, duration?: number, properties?: Record<string, string>): void {
    if (!this.client || !this.initialized) return;

    try {
      const usage = azureB1Optimizer.getCurrentResourceUsage();
      
      this.client.trackPageView({
        name,
        url,
        duration,
        properties: {
          ...properties,
          'b1.memory.status': usage.memory.percentage > 80 ? 'high' : 'normal',
          'b1.performance.tier': 'basic'
        }
      });
    } catch (error) {
      console.error('[APP_INSIGHTS] Error tracking page view:', error);
    }
  }

  /**
   * Flush all telemetry data
   */
  flush(): void {
    if (!this.client || !this.initialized) return;

    try {
      this.client.flush();
    } catch (error) {
      console.error('[APP_INSIGHTS] Error flushing telemetry:', error);
    }
  }

  /**
   * Get Application Insights client for custom telemetry
   */
  getClient(): appInsights.TelemetryClient | null {
    return this.client;
  }

  /**
   * Check if Application Insights is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }
}

// Global Application Insights instance
export const appInsights = new ApplicationInsightsManager();

/**
 * Middleware factory for Application Insights integration
 */
export function createApplicationInsightsMiddleware() {
  return {
    /**
     * Request tracking middleware
     */
    requestTracking: (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const originalSend = res.send;

      res.send = function(body: any) {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;

        // Track the request
        appInsights.trackRequest(
          `${req.method} ${req.route?.path || req.path}`,
          req.url,
          duration,
          res.statusCode,
          success,
          {
            method: req.method,
            userAgent: req.get('User-Agent') || 'unknown',
            userId: req.user?.id || 'anonymous'
          }
        );

        return originalSend.call(this, body);
      };

      next();
    },

    /**
     * Exception tracking middleware
     */
    exceptionTracking: (error: Error, req: any, res: any, next: any) => {
      appInsights.trackException(error, {
        endpoint: req.url,
        method: req.method,
        userId: req.user?.id || 'anonymous',
        stack: error.stack || 'no stack trace'
      });

      next(error);
    }
  };
}

/**
 * Environment setup for Application Insights
 */
export function setupApplicationInsightsEnvironment(): void {
  // Validate environment variables
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  const instrumentationKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

  if (!connectionString && !instrumentationKey) {
    console.warn('[APP_INSIGHTS] Environment variables not set:');
    console.warn('  - APPLICATIONINSIGHTS_CONNECTION_STRING (recommended)');
    console.warn('  - APPINSIGHTS_INSTRUMENTATIONKEY (legacy)');
    console.warn('Application Insights will not be enabled.');
    return;
  }

  // Set additional environment variables for optimal B1 performance
  if (!process.env.APPINSIGHTS_NO_DIAGNOSTIC_CHANNEL) {
    process.env.APPINSIGHTS_NO_DIAGNOSTIC_CHANNEL = 'true'; // Reduce overhead
  }

  if (!process.env.APPINSIGHTS_NO_PATCH_MODULES) {
    process.env.APPINSIGHTS_NO_PATCH_MODULES = 'bunyan,winston'; // Reduce patching overhead
  }

  console.log('[APP_INSIGHTS] Environment configured for Azure B1 optimization');
}