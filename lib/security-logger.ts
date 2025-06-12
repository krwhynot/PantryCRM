/**
 * Security Event Logging for Kitchen Pantry CRM
 * Implements comprehensive security monitoring and incident tracking
 * 
 * SECURITY: Addresses OWASP A09:2021 - Security Logging and Monitoring Failures
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html
 */

import { NextRequest } from 'next/server';

/**
 * Security event types based on OWASP Logging Vocabulary
 */
export type SecurityEventType = 
  | 'authn_fail'              // Authentication failure
  | 'authn_success'           // Authentication success  
  | 'authz_fail'              // Authorization failure
  | 'authz_change'            // Authorization change
  | 'unauthorized_access_attempt' // IDOR/unauthorized access
  | 'insufficient_permissions'    // Permission denied
  | 'invalid_session_user'        // Invalid session
  | 'suspicious_header_detected'  // CVE-2025-29927 protection
  | 'malicious_direct'           // Direct object manipulation
  | 'input_validation_fail'      // Input validation failure
  | 'rate_limit_exceeded'        // Rate limiting triggered
  | 'security_config_change'     // Security configuration change
  | 'data_access'               // Sensitive data access
  | 'admin_action'              // Administrative action
  | 'password_change'           // Password modification
  | 'account_lockout'           // Account locked
  | 'privilege_escalation'      // Privilege escalation attempt;

/**
 * Security event severity levels
 */
export enum SecurityEventLevel {
  INFO = 'INFO',
  WARN = 'WARN', 
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Security event log entry structure
 */
export interface SecurityLogEntry {
  datetime: string;
  appid: string;
  event: string;
  level: SecurityEventLevel;
  description: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  resourceId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Format security event according to OWASP logging standards
 */
function formatSecurityEvent(
  eventType: SecurityEventType,
  details: Record<string, any>
): string {
  const userId = details.userId || 'anonymous';
  const resourceId = details.resourceId || details.attemptedResourceUserId || '';
  
  switch (eventType) {
    case 'authn_fail':
      return `authn_fail:${userId}`;
    case 'authn_success':
      return `authn_success:${userId}`;
    case 'authz_fail':
      return `authz_fail:${userId},${resourceId}`;
    case 'authz_change':
      return `authz_change:${userId},${details.oldRole || ''},${details.newRole || ''}`;
    case 'unauthorized_access_attempt':
      return `unauthorized_access:${userId},${resourceId}`;
    case 'malicious_direct':
      return `malicious_direct:${userId},${details.userAgent || ''}`;
    case 'suspicious_header_detected':
      return `suspicious_header:${details.header},${details.url || ''}`;
    default:
      return `${eventType}:${userId}`;
  }
}

/**
 * Determine event severity based on event type
 */
function getEventSeverity(eventType: SecurityEventType): SecurityEventLevel {
  const criticalEvents: SecurityEventType[] = [
    'unauthorized_access_attempt',
    'malicious_direct', 
    'suspicious_header_detected',
    'privilege_escalation'
  ];
  
  const warnEvents: SecurityEventType[] = [
    'authn_fail',
    'authz_fail',
    'insufficient_permissions',
    'rate_limit_exceeded',
    'input_validation_fail'
  ];

  if (criticalEvents.includes(eventType)) {
    return SecurityEventLevel.CRITICAL;
  } else if (warnEvents.includes(eventType)) {
    return SecurityEventLevel.WARN;
  } else {
    return SecurityEventLevel.INFO;
  }
}

/**
 * Generate human-readable description for security events
 */
function generateDescription(
  eventType: SecurityEventType,
  details: Record<string, any>
): string {
  const userId = details.userId || 'anonymous';
  
  switch (eventType) {
    case 'unauthorized_access_attempt':
      return `User ${userId} attempted to access resource ${details.attemptedResourceUserId || details.resourceId} without authorization at ${details.endpoint}`;
    case 'authn_fail':
      return `Authentication failed for user ${details.email || userId}`;
    case 'authz_fail':
      return `User ${userId} attempted to access a resource without entitlement`;
    case 'insufficient_permissions':
      return `User ${userId} with role ${details.userRole} lacks permission ${details.requiredPermission}`;
    case 'suspicious_header_detected':
      return `Suspicious x-middleware-subrequest header detected: ${details.header}`;
    case 'malicious_direct':
      return `User ${userId} attempted to access an object to which they are not authorized`;
    case 'rate_limit_exceeded':
      return `Rate limit exceeded for ${details.identifier} - ${details.attempts} attempts in ${details.windowMs}ms`;
    default:
      return `Security event ${eventType} for user ${userId}`;
  }
}

/**
 * Extract request metadata for logging
 */
function extractRequestMetadata(request?: NextRequest): Partial<SecurityLogEntry> {
  if (!request) {
    return {};
  }

  return {
    ip: request.ip || 
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: request.nextUrl?.pathname || request.url || 'unknown',
    method: request.method || 'unknown'
  };
}

/**
 * Main security event logging function
 */
export function logSecurityEvent(
  eventType: SecurityEventType,
  details: Record<string, any>,
  request?: NextRequest
): void {
  const timestamp = new Date().toISOString();
  const level = getEventSeverity(eventType);
  const requestMeta = extractRequestMetadata(request);
  
  const logEntry: SecurityLogEntry = {
    datetime: timestamp,
    appid: 'kitchen-pantry-crm',
    event: formatSecurityEvent(eventType, details),
    level,
    description: generateDescription(eventType, details),
    ...requestMeta,
    ...details,
    additionalData: {
      timestamp,
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || 'unknown'
    }
  };

  // Log to console with structured format
  const logMethod = level === SecurityEventLevel.CRITICAL ? console.error :
                   level === SecurityEventLevel.ERROR ? console.error :
                   level === SecurityEventLevel.WARN ? console.warn :
                   console.info;

  logMethod('[SECURITY_EVENT]', JSON.stringify(logEntry, null, 2));

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToSecurityMonitoring(logEntry);
  }

  // For critical events, trigger immediate alerts
  if (level === SecurityEventLevel.CRITICAL) {
    triggerSecurityAlert(logEntry);
  }
}

/**
 * Send security events to external monitoring service
 * This would integrate with Azure Monitor, Splunk, or other SIEM tools
 */
async function sendToSecurityMonitoring(logEntry: SecurityLogEntry): Promise<void> {
  try {
    // Azure Application Insights integration
    if (process.env.AZURE_MONITOR_CONNECTION_STRING) {
      // Implementation would go here
      // await applicationInsights.trackTrace({
      //   message: logEntry.description,
      //   severity: logEntry.level,
      //   properties: logEntry
      // });
    }

    // Alternative: Send to external SIEM
    if (process.env.SIEM_WEBHOOK_URL) {
      await fetch(process.env.SIEM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    }
  } catch (error) {
    console.error('[SECURITY_LOGGER] Failed to send to monitoring service:', error);
  }
}

/**
 * Trigger immediate security alerts for critical events
 */
async function triggerSecurityAlert(logEntry: SecurityLogEntry): Promise<void> {
  try {
    // Email notification for critical security events
    if (process.env.SECURITY_ALERT_EMAIL) {
      // Implementation would integrate with email service
      console.error('[CRITICAL_SECURITY_ALERT]', {
        to: process.env.SECURITY_ALERT_EMAIL,
        subject: `🚨 Critical Security Event - ${logEntry.event}`,
        body: `Critical security event detected:\n\n${JSON.stringify(logEntry, null, 2)}`
      });
    }

    // Slack/Teams webhook for immediate notification
    if (process.env.SECURITY_ALERT_WEBHOOK) {
      await fetch(process.env.SECURITY_ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Security Event: ${logEntry.description}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Event', value: logEntry.event, short: true },
              { title: 'User', value: logEntry.userId || 'anonymous', short: true },
              { title: 'IP', value: logEntry.ip || 'unknown', short: true },
              { title: 'Endpoint', value: logEntry.endpoint || 'unknown', short: true }
            ]
          }]
        })
      });
    }
  } catch (error) {
    console.error('[SECURITY_LOGGER] Failed to send alert:', error);
  }
}

/**
 * Log authentication events
 */
export function logAuthenticationEvent(
  success: boolean,
  userId: string,
  details: Record<string, any> = {},
  request?: NextRequest
): void {
  logSecurityEvent(
    success ? 'authn_success' : 'authn_fail',
    { userId, ...details },
    request
  );
}

/**
 * Log authorization events
 */
export function logAuthorizationEvent(
  success: boolean,
  userId: string,
  resource: string,
  details: Record<string, any> = {},
  request?: NextRequest
): void {
  logSecurityEvent(
    success ? 'authz_change' : 'authz_fail',
    { userId, resource, ...details },
    request
  );
}

/**
 * Log data access events for audit trail
 */
export function logDataAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  request?: NextRequest
): void {
  logSecurityEvent(
    'data_access',
    { 
      userId, 
      resourceType, 
      resourceId, 
      action,
      description: `User ${userId} performed ${action} on ${resourceType} ${resourceId}`
    },
    request
  );
}