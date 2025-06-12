#!/usr/bin/env node

/**
 * Automated Security Maintenance Script
 * Runs daily security tasks, data retention, and monitoring
 */

import { runDailyRetentionCleanup } from '../lib/data-retention-policies';
import { securityMonitoring } from '../lib/security-monitoring';

async function runSecurityMaintenance(): Promise<void> {
  console.log('[SECURITY_MAINTENANCE] Starting daily security maintenance...');
  
  try {
    // Run data retention cleanup
    console.log('[SECURITY_MAINTENANCE] Running data retention cleanup...');
    await runDailyRetentionCleanup();
    
    // Get security metrics for daily report
    const securityMetrics = securityMonitoring.getSecurityMetrics();
    
    console.log('[SECURITY_MAINTENANCE] Security metrics:', {
      activeIncidents: securityMetrics.activeIncidents,
      criticalIncidents: securityMetrics.criticalIncidents,
      affectedUsers: securityMetrics.affectedUsersCount,
      uniqueSourceIPs: securityMetrics.uniqueSourceIPs
    });
    
    // Alert if there are critical incidents
    if (securityMetrics.criticalIncidents > 0) {
      console.warn('[SECURITY_MAINTENANCE] CRITICAL: Active security incidents detected!');
    }
    
    console.log('[SECURITY_MAINTENANCE] Daily maintenance completed successfully');
    
  } catch (error) {
    console.error('[SECURITY_MAINTENANCE] Error during maintenance:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSecurityMaintenance();
}

export { runSecurityMaintenance };