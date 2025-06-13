# Azure B1 Deployment Testing Guide

## Overview

This comprehensive testing suite validates your PantryCRM application deployment on Azure App Service Basic B1 tier. The tests are designed to validate performance, scalability, monitoring, backup/disaster recovery, CI/CD, and Next.js-specific optimizations.

## Prerequisites

Before running the tests, ensure you have:

### Required Tools
- **Azure CLI** (v2.50+): `az --version`
- **Node.js** (v20 LTS): `node --version`
- **Artillery** (load testing): `npm install -g artillery`
- **jq** (JSON processing): `sudo apt-get install jq` or `brew install jq`
- **bc** (basic calculator): Usually pre-installed on Linux/macOS

### Azure Setup
```bash
# Login to Azure
az login

# Set your subscription (replace with your subscription ID)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify you have the correct permissions
az account show
```

### Configuration
1. Update `scripts/azure-deployment-testing/azure-testing-config.json` with your specific values:
   - `subscriptionId`: Your Azure subscription ID
   - `resourceGroupName`: Your resource group name
   - `appName`: Your application name prefix

## Testing Phases

### Phase 1: Azure App Service B1 Configuration Validation

Tests the fundamental B1 configuration and validates it meets requirements.

#### Scripts:
- `deploy-infrastructure.sh` - Deploys Azure infrastructure using Bicep
- `validate-b1-config.sh` - Validates B1-specific configurations
- `performance-validation.sh` - Tests performance against B1 requirements
- `resource-constraint-tests.sh` - Validates resource utilization

#### Usage:
```bash
cd scripts/azure-deployment-testing/phase1-b1-validation

# Deploy infrastructure
./deploy-infrastructure.sh staging

# Validate configuration
./validate-b1-config.sh staging

# Test performance
./performance-validation.sh staging

# Test resource constraints
./resource-constraint-tests.sh staging
```

#### Expected Results:
- ✅ B1 App Service Plan with 1 instance
- ✅ SQL Database Basic tier (5 DTU, 2GB)
- ✅ Memory optimization settings applied
- ✅ Search response times < 1 second
- ✅ Memory usage < 80% under load
- ✅ All security configurations enabled

### Phase 2: Scaling Limitations and Options Assessment

Tests horizontal scaling capabilities and B1 tier limitations.

#### Scripts:
- `horizontal-scaling-tests.sh` - Tests manual scaling up to 3 instances
- `auto-scaling-validation.sh` - Validates auto-scaling limitations
- `scaling-constraint-tests.sh` - Tests B1 scaling constraints
- `scaling-performance-tests.sh` - Performance comparison across instance counts

#### Usage:
```bash
cd scripts/azure-deployment-testing/phase2-scaling

# Test horizontal scaling
./horizontal-scaling-tests.sh staging

# Validate auto-scaling (B1 limitations)
./auto-scaling-validation.sh staging
```

#### Expected Results:
- ✅ Successful scaling from 1→2→3 instances
- ✅ Scaling blocked beyond 3 instances (B1 limit)
- ✅ Application remains responsive during scaling
- ⚠️ Auto-scaling not available (requires Standard tier)

### Phase 3: Monitoring and Logging Implementation Testing

Validates Application Insights, logging, and alerting systems.

#### Scripts:
- `application-insights-setup.sh` - Configures Application Insights
- `log-streaming-tests.sh` - Tests real-time log streaming
- `health-check-validation.sh` - Validates health endpoints
- `alerting-tests.sh` - Tests alert configuration

#### Usage:
```bash
cd scripts/azure-deployment-testing/phase3-monitoring

# Set up Application Insights
./application-insights-setup.sh staging

# Test health checks
./health-check-validation.sh staging
```

### Phase 4: Backup and Disaster Recovery Validation

Tests backup procedures and disaster recovery capabilities.

#### Scripts:
- `backup-validation.sh` - Tests automated backup procedures
- `disaster-recovery-tests.sh` - Validates DR procedures
- `failover-tests.sh` - Tests cross-region failover
- `full-dr-drill.sh` - Complete disaster recovery drill

### Phase 5: CI/CD Pipeline Integration Testing

Validates deployment automation and pipeline integration.

#### Scripts:
- `github-actions-validation.sh` - Tests GitHub Actions integration
- `blue-green-deployment.sh` - Tests deployment slots
- `rollback-validation.sh` - Tests rollback procedures
- `security-scanning-tests.sh` - Validates security scanning

### Phase 6: Next.js Specific Deployment Testing

Tests Next.js-specific optimizations and functionality.

#### Scripts:
- `nodejs-runtime-tests.sh` - Validates Node.js runtime configuration
- `static-asset-tests.sh` - Tests static asset serving
- `ssr-performance-tests.sh` - Tests SSR performance
- `build-optimization-tests.sh` - Validates build optimizations

## Running All Tests

### Complete Test Suite
```bash
# Run all phases
./scripts/azure-deployment-testing/run-all-tests.sh staging all

# Run specific phase
./scripts/azure-deployment-testing/run-all-tests.sh staging phase1
```

### Individual Phase Testing
```bash
# Phase 1 only
./scripts/azure-deployment-testing/run-all-tests.sh staging phase1

# Phase 2 only  
./scripts/azure-deployment-testing/run-all-tests.sh staging phase2
```

## Test Reports and Artifacts

### Generated Reports
Each test phase generates detailed reports:

- **JSON Reports**: Machine-readable test results
- **HTML Reports**: Human-readable performance reports (Artillery)
- **Log Files**: Detailed execution logs
- **Summary Reports**: Aggregated results across all phases

### Report Locations
```
scripts/azure-deployment-testing/
├── test-results-YYYYMMDD-HHMMSS.log
├── test-report-YYYYMMDD-HHMMSS.html
├── deployment-info-{environment}.json
├── b1-validation-report-{environment}-YYYYMMDD-HHMMSS.json
├── performance-report-{environment}-YYYYMMDD-HHMMSS.html
├── horizontal-scaling-report-{environment}-YYYYMMDD-HHMMSS.json
└── auto-scaling-report-{environment}-YYYYMMDD-HHMMSS.json
```

## Performance Targets and Success Criteria

### B1 Tier Requirements
| Metric | Target | Test Coverage |
|--------|--------|---------------|
| Search Response Time | < 1 second | ✅ Phase 1 |
| Report Generation | < 10 seconds | ✅ Phase 1 |
| Page Load (3G) | < 3 seconds | ✅ Phase 1 |
| Concurrent Users | 4 users | ✅ Phase 1 |
| Memory Usage | < 80% of 1.75GB | ✅ Phase 1 |
| CPU Usage | < 95% sustained | ✅ Phase 1 |
| DTU Usage | < 80% of 5 DTU | ✅ Phase 1 |
| Scaling Limit | Max 3 instances | ✅ Phase 2 |

### Success Criteria
- **Phase 1**: 90%+ tests passing, performance targets met
- **Phase 2**: Scaling works within B1 limits
- **Phase 3**: Monitoring alerts configured and responsive
- **Phase 4**: Backup/restore procedures functional
- **Phase 5**: CI/CD pipeline deploys successfully
- **Phase 6**: Next.js optimizations validated

## Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Re-login to Azure
az logout
az login

# Verify subscription
az account show
```

#### Permission Issues
```bash
# Check role assignments
az role assignment list --assignee $(az account show --query user.name -o tsv)

# Required roles: Contributor or Owner on resource group
```

#### Performance Test Failures
```bash
# Check application health first
curl -I https://your-app.azurewebsites.net/api/health

# Verify app is running
az webapp show --name your-app --resource-group your-rg --query "state"
```

#### Memory/CPU Issues
```bash
# Check current metrics
az monitor metrics list \
  --resource /subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/APP \
  --metric "MemoryPercentage" \
  --start-time "$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ)"
```

### Getting Help

1. **Check logs**: Review detailed log files generated by each script
2. **Verify configuration**: Ensure `azure-testing-config.json` is correct
3. **Test prerequisites**: Run `./run-all-tests.sh staging phase1` to validate setup
4. **Azure portal**: Check resource status in Azure portal
5. **Application Insights**: Review telemetry data for application issues

## Environment-Specific Configurations

### Staging Environment
- Resource Group: `pantry-crm-staging-rg`
- App Service: `pantry-crm-staging-app`
- Database: Shared development database
- Cost-optimized settings

### Production Environment
- Resource Group: `pantry-crm-prod-rg`  
- App Service: `pantry-crm-prod-app`
- Database: Dedicated production database
- Performance-optimized settings

## Cost Optimization

### B1 Tier Monthly Costs (Estimated)
- **App Service B1**: ~$13/month
- **SQL Database Basic**: ~$5/month
- **Storage Account**: ~$0.50/month
- **Key Vault**: ~$1/month
- **Application Insights**: ~$2/month
- **Total**: ~$21.50/month

### Cost Monitoring
```bash
# Check current costs
az consumption usage list --output table

# Set up cost alerts
az consumption budget create \
  --budget-name "pantry-crm-monthly-budget" \
  --amount 30 \
  --time-grain Monthly
```

## Scaling Path

### When to Upgrade from B1

#### To Standard S1 (~$55/month)
- **Trigger**: Consistent >4 concurrent users
- **Benefits**: Auto-scaling, deployment slots, custom domains
- **Migration**: Update `main.bicep` SKU and redeploy

#### To Premium P1v2 (~$125/month)
- **Trigger**: Enterprise requirements or >20 concurrent users
- **Benefits**: VNet integration, advanced auto-scaling, higher performance
- **Migration**: Requires infrastructure update

### Upgrade Commands
```bash
# Upgrade to Standard S1
az appservice plan update \
  --name pantry-crm-prod-plan \
  --resource-group pantry-crm-prod-rg \
  --sku S1

# Enable auto-scaling (Standard tier and above)
az monitor autoscale create \
  --resource-group pantry-crm-prod-rg \
  --name pantry-crm-autoscale \
  --resource /subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/serverfarms/PLAN \
  --min-count 1 \
  --max-count 10 \
  --count 2
```

## Security Considerations

### Test Environment Security
- Use separate subscriptions for testing
- Implement least-privilege access
- Regular credential rotation
- Network isolation where possible

### Production Security
- Enable all security headers (implemented)
- Use managed identities (implemented)
- Enable HTTPS only (implemented)
- Regular security scanning (Phase 5)

## Next Steps

After completing all testing phases:

1. **Review Reports**: Analyze all generated reports for insights
2. **Document Findings**: Update documentation with test results
3. **Optimize Application**: Address any performance issues found
4. **Plan Scaling**: Prepare scaling strategy based on test results
5. **Schedule Regular Testing**: Set up recurring validation tests
6. **Monitor Production**: Implement continuous monitoring based on test learnings

## Support and Maintenance

### Regular Testing Schedule
- **Weekly**: Phase 1 (performance validation)
- **Monthly**: Phases 1-3 (full configuration and monitoring)
- **Quarterly**: All phases (comprehensive validation)

### Updating Tests
- Update performance targets as application grows
- Add new test scenarios for new features
- Review B1 tier suitability quarterly
- Update cost estimates regularly