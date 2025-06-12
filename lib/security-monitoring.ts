/**
 * Enhanced Security Monitoring for PantryCRM
 * Implements comprehensive security monitoring, alerting, and incident response
 * 
 * SECURITY: Addresses OWASP A09:2021 - Security Logging and Monitoring Failures
 */

import { NextRequest } from 'next/server';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-logger';

/**
 * Security monitoring configuration
 */
export interface SecurityMonitoringConfig {
  azureInsightsConnectionString?: string;
  securityAlertEmail?: string;
  securityAlertWebhook?: string;
  alertThresholds: {
    failedLoginAttempts: number;
    suspiciousRequestCount: number;
    criticalEventCount: number;
    timeWindowMinutes: number;
  };
}

/**
 * Security incident tracking
 */
interface SecurityIncident {
  id: string;
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedUsers: Set<string>;
  sourceIPs: Set<string>;
  resolved: boolean;
}

/**
 * Security monitoring service
 */
class SecurityMonitoringService {
  private incidents = new Map<string, SecurityIncident>();
  private config: SecurityMonitoringConfig;
  
  constructor(config: SecurityMonitoringConfig) {
    this.config = config;
    
    // Clean up old incidents every hour
    setInterval(() => this.cleanupOldIncidents(), 60 * 60 * 1000);
  }
  
  /**
   * Track security events and trigger alerts if thresholds are exceeded
   */
  async trackSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    // Log the event
    logSecurityEvent(eventType, details, request);
    
    // Track incident patterns
    const incidentKey = this.generateIncidentKey(eventType, details);
    const incident = this.incidents.get(incidentKey);
    
    if (incident) {
      incident.count++;
      incident.lastOccurrence = new Date();
      if (details.userId) incident.affectedUsers.add(details.userId);
      if (details.ip) incident.sourceIPs.add(details.ip);
    } else {
      this.incidents.set(incidentKey, {
        id: incidentKey,
        type: eventType,
        severity: this.determineSeverity(eventType),
        count: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        affectedUsers: new Set(details.userId ? [details.userId] : []),
        sourceIPs: new Set(details.ip ? [details.ip] : []),
        resolved: false
      });
    }
    
    // Check if alert thresholds are exceeded
    await this.checkAlertThresholds(incidentKey);
  }
  
  /**
   * Monitor authentication failures
   */
  async monitorAuthenticationFailures(
    email: string,
    ip: string,
    userAgent: string,
    request?: NextRequest
  ): Promise<void> {
    await this.trackSecurityEvent('authn_fail', {
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    }, request);
  }
  
  /**
   * Monitor suspicious access patterns
   */
  async monitorSuspiciousAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    reason: string,
    request?: NextRequest
  ): Promise<void> {
    await this.trackSecurityEvent('unauthorized_access_attempt', {
      userId,
      resourceType,
      resourceId,
      reason,
      endpoint: request?.nextUrl.pathname
    }, request);
  }
  
  /**
   * Monitor rate limit violations
   */
  async monitorRateLimitViolation(
    identifier: string,
    attempts: number,
    windowMs: number,
    request?: NextRequest
  ): Promise<void> {
    await this.trackSecurityEvent('rate_limit_exceeded', {
      identifier,
      attempts,
      windowMs,
      endpoint: request?.nextUrl.pathname
    }, request);
  }
  
  /**
   * Generate incident key for grouping related events
   */
  private generateIncidentKey(eventType: SecurityEventType, details: Record<string, any>): string {
    switch (eventType) {
      case 'authn_fail':
        return `auth_fail_${details.email || details.ip}`;
      case 'unauthorized_access_attempt':
        return `unauthorized_${details.userId}_${details.resourceType}`;
      case 'rate_limit_exceeded':
        return `rate_limit_${details.identifier}`;
      default:
        return `${eventType}_${details.userId || details.ip || 'unknown'}`;
    }
  }
  
  /**
   * Determine incident severity based on event type
   */
  private determineSeverity(eventType: SecurityEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalEvents: SecurityEventType[] = [
      'unauthorized_access_attempt',
      'malicious_direct',
      'suspicious_header_detected',
      'privilege_escalation'
    ];
    
    const highEvents: SecurityEventType[] = [
      'authz_fail',
      'admin_action'
    ];
    
    const mediumEvents: SecurityEventType[] = [
      'authn_fail',
      'rate_limit_exceeded',
      'input_validation_fail'
    ];
    
    if (criticalEvents.includes(eventType)) return 'CRITICAL';
    if (highEvents.includes(eventType)) return 'HIGH';
    if (mediumEvents.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Check if alert thresholds are exceeded and trigger alerts
   */
  private async checkAlertThresholds(incidentKey: string): Promise<void> {
    const incident = this.incidents.get(incidentKey);
    if (!incident || incident.resolved) return;
    
    const { alertThresholds } = this.config;
    const timeWindow = alertThresholds.timeWindowMinutes * 60 * 1000;
    const timeSinceFirst = Date.now() - incident.firstOccurrence.getTime();
    
    // Check if we're within the alert time window
    if (timeSinceFirst > timeWindow) return;
    
    let shouldAlert = false;
    let alertMessage = '';
    
    // Check specific thresholds based on incident type
    switch (incident.type) {
      case 'authn_fail':
        if (incident.count >= alertThresholds.failedLoginAttempts) {
          shouldAlert = true;
          alertMessage = `${incident.count} failed login attempts detected for the same account/IP in ${Math.round(timeSinceFirst / 60000)} minutes`;
        }
        break;
        
      case 'unauthorized_access_attempt':
      case 'malicious_direct':
      case 'suspicious_header_detected':
        if (incident.count >= alertThresholds.criticalEventCount) {
          shouldAlert = true;
          alertMessage = `${incident.count} critical security events detected: ${incident.type}`;
        }
        break;
        
      case 'rate_limit_exceeded':
        if (incident.count >= alertThresholds.suspiciousRequestCount) {
          shouldAlert = true;
          alertMessage = `Sustained rate limiting detected: ${incident.count} violations from ${incident.sourceIPs.size} IPs`;
        }
        break;
    }
    
    if (shouldAlert) {
      await this.triggerSecurityAlert(incident, alertMessage);
      incident.resolved = true; // Prevent duplicate alerts
    }
  }
  
  /**
   * Trigger security alert via configured channels
   */
  private async triggerSecurityAlert(incident: SecurityIncident, message: string): Promise<void> {
    const alertData = {
      incident: {
        id: incident.id,
        type: incident.type,
        severity: incident.severity,
        count: incident.count,
        duration: incident.lastOccurrence.getTime() - incident.firstOccurrence.getTime(),
        affectedUsers: incident.affectedUsers.size,
        sourceIPs: Array.from(incident.sourceIPs)
      },
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    console.error(`[SECURITY_ALERT] ${incident.severity}: ${message}`, alertData);
    
    try {
      // Send to Azure Application Insights
      if (this.config.azureInsightsConnectionString) {
        await this.sendToAzureInsights(alertData);
      }
      
      // Send email alert
      if (this.config.securityAlertEmail) {
        await this.sendEmailAlert(alertData);
      }
      
      // Send webhook alert (Slack/Teams)
      if (this.config.securityAlertWebhook) {
        await this.sendWebhookAlert(alertData);
      }
    } catch (error) {
      console.error('[SECURITY_MONITORING] Failed to send alert:', error);
    }
  }
  
  /**
   * Send alert to Azure Application Insights
   */
  private async sendToAzureInsights(alertData: any): Promise<void> {
    // Implementation would integrate with Azure SDK
    // For now, just log the structure
    console.log('[AZURE_INSIGHTS] Security alert would be sent:', {
      name: 'SecurityAlert',
      properties: alertData,
      severity: alertData.incident.severity
    });
  }
  
  /**
   * Send email alert
   */
  private async sendEmailAlert(alertData: any): Promise<void> {
    // Implementation would integrate with email service (Resend, SendGrid, etc.)
    console.log('[EMAIL_ALERT] Would send to:', this.config.securityAlertEmail, {
      subject: `🚨 Security Alert: ${alertData.incident.type} (${alertData.incident.severity})`,
      body: `Security incident detected:\n\n${JSON.stringify(alertData, null, 2)}`
    });
  }
  
  /**
   * Send webhook alert (Slack/Teams)
   */
  private async sendWebhookAlert(alertData: any): Promise<void> {
    try {
      const payload = {
        text: `🚨 Security Alert: ${alertData.message}`,
        attachments: [{
          color: alertData.incident.severity === 'CRITICAL' ? 'danger' : 'warning',
          fields: [
            { title: 'Incident Type', value: alertData.incident.type, short: true },
            { title: 'Severity', value: alertData.incident.severity, short: true },
            { title: 'Event Count', value: alertData.incident.count.toString(), short: true },
            { title: 'Affected Users', value: alertData.incident.affectedUsers.toString(), short: true }
          ],
          timestamp: alertData.timestamp
        }]
      };
      
      await fetch(this.config.securityAlertWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('[WEBHOOK_ALERT] Failed to send:', error);
    }
  }
  
  /**
   * Clean up old incidents to prevent memory leaks
   */
  private cleanupOldIncidents(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAge;
    
    for (const [key, incident] of this.incidents.entries()) {
      if (incident.lastOccurrence.getTime() < cutoff) {
        this.incidents.delete(key);
      }
    }
  }
  
  /**
   * Get security metrics for dashboard
   */
  getSecurityMetrics(): any {
    const active = Array.from(this.incidents.values()).filter(i => !i.resolved);
    
    return {
      activeIncidents: active.length,
      criticalIncidents: active.filter(i => i.severity === 'CRITICAL').length,
      topIncidentTypes: this.getTopIncidentTypes(active),
      affectedUsersCount: new Set(active.flatMap(i => Array.from(i.affectedUsers))).size,
      uniqueSourceIPs: new Set(active.flatMap(i => Array.from(i.sourceIPs))).size,
      lastIncidentTime: active.length > 0 ? Math.max(...active.map(i => i.lastOccurrence.getTime())) : null
    };
  }
  
  private getTopIncidentTypes(incidents: SecurityIncident[]): Array<{type: string, count: number}> {
    const typeCounts = new Map<string, number>();
    
    for (const incident of incidents) {
      typeCounts.set(incident.type, (typeCounts.get(incident.type) || 0) + 1);
    }
    
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Default configuration
const defaultConfig: SecurityMonitoringConfig = {
  azureInsightsConnectionString: process.env.AZURE_INSIGHTS_CONNECTION_STRING,
  securityAlertEmail: process.env.SECURITY_ALERT_EMAIL,
  securityAlertWebhook: process.env.SECURITY_ALERT_WEBHOOK,
  alertThresholds: {
    failedLoginAttempts: 5,
    suspiciousRequestCount: 10,
    criticalEventCount: 3,
    timeWindowMinutes: 15
  }
};

// Global security monitoring instance
export const securityMonitoring = new SecurityMonitoringService(defaultConfig);

// Helper functions for easy integration
export async function monitorAuthFailure(email: string, request?: NextRequest): Promise<void> {
  const ip = request?.ip || request?.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';
  
  await securityMonitoring.monitorAuthenticationFailures(email, ip, userAgent, request);
}

export async function monitorUnauthorizedAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  reason: string,
  request?: NextRequest
): Promise<void> {
  await securityMonitoring.monitorSuspiciousAccess(userId, resourceType, resourceId, reason, request);
}

export async function monitorRateLimit(
  identifier: string,
  attempts: number,
  windowMs: number,
  request?: NextRequest
): Promise<void> {
  await securityMonitoring.monitorRateLimitViolation(identifier, attempts, windowMs, request);
}

export function getSecurityDashboardMetrics(): any {
  return securityMonitoring.getSecurityMetrics();
}