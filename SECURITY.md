# PantryCRM Security Policy

This document outlines the security policies and procedures for the PantryCRM application, including IP restriction policies, backup retention schedules, and alert response procedures.

## IP Restriction Policies

### API Endpoints Protection

PantryCRM implements a multi-layered approach to securing sensitive API endpoints:

#### Application Layer Protection

The following API routes are protected with IP restrictions:
- `/api/admin/*` - Admin-only endpoints
- `/api/settings/*` - Configuration management endpoints  
- `/api/migration/*` - Data migration endpoints

**Allowed IPs:**
- 203.0.113.42/32 (Office network)
- 127.0.0.1 (Development environment)
- ::1 (IPv6 localhost for development)

#### Infrastructure Layer Protection

Azure App Service IP restrictions are implemented via the `azure-ip-restrictions.sh` script, which creates the following rules:

1. **Admin API Endpoints (`/api/admin/*`):**
   - Allow: 203.0.113.42/32 (Priority 100)
   - Deny: All other IPs (Priority 2147483647)

2. **Settings API Endpoints (`/api/settings/*`):**
   - Allow: 203.0.113.42/32 (Priority 110)
   - Deny: All other IPs (Default deny rule applied)

3. **Migration API Endpoints (`/api/migration/*`):**
   - Allow: 203.0.113.42/32 (Priority 120)
   - Deny: All other IPs (Default deny rule applied)

#### CORS Policy

- **Admin/Settings/Migration Endpoints:** Restricted CORS with `Access-Control-Allow-Origin` set to the application's domain only
- **Public API Endpoints:** Standard CORS allowing `GET` and `POST` requests from any origin

### IP Restriction Management

To update IP restrictions:

1. Modify the `ADMIN_IP_WHITELIST` array in `src/middleware/api-security.ts`
2. Update corresponding IPs in `scripts/azure-ip-restrictions.sh`
3. Run the updated script: `az login && bash scripts/azure-ip-restrictions.sh`

## Backup Retention Schedule

### SQL Database Backups

PantryCRM implements the following backup strategy:

1. **Weekly BACPAC Exports:**
   - Schedule: Every Sunday at 1:00 AM UTC
   - Storage Location: Azure Blob Storage (`pantrycrmprodstorage` account)
   - Container: `sql-backups`
   - Naming Convention: `pantry-crm-db-backup-YYYYMMDD.bacpac`

2. **Retention Policy:**
   - **Duration:** 90 days (enhanced from previous 28 days)
   - **Implementation:** Azure Storage lifecycle management policy
   - **Policy Name:** `sql-backup-retention-policy`

3. **Configuration Files Backup:**
   - Schedule: Alongside SQL backups
   - Files: `.env`, `next.config.js`, `web.config`, and documentation
   - Storage: Same container with `/configs/` prefix

4. **Backup Reports:**
   - Generated after each backup operation
   - Stored in the same container with `/reports/` prefix
   - Contains backup status, size, time taken, and validation results

### Backup Management

The backup process is managed via the `scripts/automated-backup.sh` script, which:
1. Creates SQL BACPAC exports
2. Uploads backups to Azure Blob Storage
3. Creates/maintains the 90-day lifecycle policy
4. Generates backup reports
5. Validates backup integrity

To modify the retention period:
1. Update the `RETENTION_DAYS` variable in `scripts/automated-backup.sh`
2. Update the lifecycle policy rule in the same script
3. Re-run the script to apply changes

## Alert Response Procedures

### Alert Categories

PantryCRM implements the following monitoring alerts:

1. **Performance Alerts:**
   - App Service CPU > 80% for 5 minutes
   - App Service Memory > 80% for 5 minutes
   - SQL DTU consumption > 90% for 10 minutes

2. **Error Alerts:**
   - HTTP 5xx errors > 5 in 5 minutes
   - Failed availability tests

3. **Security Alerts:**
   - Unauthorized admin access attempts
   - Suspicious user agents detected
   - GitHub security scanning issues

### Response Procedures

#### Performance Alert Response

1. **Initial Assessment:**
   - Check Application Insights for current metrics
   - Review `performance_baselines/perf-baseline-latest.json` to compare against baseline
   - Verify if alert coincides with expected high-traffic periods

2. **Mitigation Steps:**
   - For CPU/Memory alerts: Review recent code deployments or database query changes
   - For SQL DTU alerts: Identify and optimize expensive queries using Azure Query Performance Insight
   - Short-term: Apply query hints or increase caching
   - Long-term: Optimize database schema or queries

3. **Escalation:**
   - If issue persists > 30 minutes: Alert tier-2 support
   - If issue affects production functionality: Consider temporary scaling of resources

#### Error Alert Response

1. **Initial Assessment:**
   - Review Application Insights exceptions and failures
   - Check recent deployments or configuration changes
   - Verify error reproduction steps

2. **Mitigation Steps:**
   - For HTTP 5xx: Review server logs and fix server-side issues
   - For availability test failures: Verify network connectivity, certificates, and authentication

3. **Rollback Procedure:**
   - If errors are deployment-related: Use `az webapp deployment slot swap` to revert to last stable deployment
   - Document all issues and resolutions in incident report

#### Security Alert Response

1. **Initial Assessment:**
   - Review security event logs in Application Insights
   - Check IP addresses and user agents involved
   - Verify if access attempts are legitimate

2. **Mitigation Steps:**
   - For unauthorized access: Update IP whitelist if legitimate, or block IPs if malicious
   - For suspicious activity: Investigate potential security breach
   - For GitHub security scanning: Address identified vulnerabilities according to severity

3. **Documentation:**
   - Document all security incidents
   - Update security measures if needed
   - Conduct post-incident review

### Performance Baseline

A performance baseline is established using the `scripts/capture-performance-baseline.sh` script. This baseline should be:

1. Captured weekly during normal operation
2. Used as a reference point for performance degradation
3. Updated after major infrastructure changes or significant application updates

The baseline metrics are stored in the `performance_baselines` directory.

## Security Contacts

For security-related concerns, contact:
- Primary: security@kitchenpantry.com
- Secondary: will@kitchenpantry.com
