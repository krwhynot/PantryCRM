# PantryCRM Azure Deployment Scripts

This directory contains scripts and tools for deploying and managing PantryCRM on Azure infrastructure.

## 🚀 Quick Start

### 1. Infrastructure Deployment

Deploy the complete Azure infrastructure:

```bash
# Navigate to infrastructure directory
cd infrastructure/

# Make script executable (if needed)
chmod +x deploy.sh

# Deploy infrastructure
./deploy.sh
```

This will create:
- Azure App Service B1 ($13/month)
- Azure SQL Database Basic ($5/month)
- Azure Storage Account (~$0.50/month)
- Azure Key Vault (~$1/month)
- Application Insights (~$2/month)

**Total estimated cost: ~$21.50/month**

### 2. Setup Azure Integrations

Initialize and validate all Azure services:

```bash
# Run integration setup
npm run setup:azure

# Or manually:
npx tsx scripts/setup-azure-integrations.ts
```

### 3. Configure Monitoring

Set up Azure Monitor alerts:

```bash
# Update variables in the script first
vim scripts/azure-monitor-setup.sh

# Run monitoring setup
./scripts/azure-monitor-setup.sh
```

### 4. Setup Automated Backups

Configure automated backup system:

```bash
# Update configuration variables
vim scripts/automated-backup.sh

# Test backup system
./scripts/automated-backup.sh

# Schedule via cron (weekly backups)
echo "0 2 * * 0 /path/to/automated-backup.sh" | crontab -
```

## 📁 Script Directory

### Infrastructure Scripts

- **`infrastructure/main.bicep`** - Complete Azure infrastructure template
- **`infrastructure/deploy.sh`** - Infrastructure deployment script with cost optimization

### Monitoring & Alerts

- **`azure-monitor-setup.sh`** - Sets up Azure Monitor alerts based on B1 optimization thresholds
- **`setup-azure-integrations.ts`** - Validates and initializes all Azure services

### Backup & Recovery

- **`automated-backup.sh`** - Comprehensive backup script for database and application state

### Integration Scripts

- **`setup-azure-integrations.ts`** - Azure services integration and health check

## 🔧 Configuration

### Environment Variables

Copy and configure environment variables:

```bash
cp .env.azure.example .env.azure.prod
```

Update the following variables:
- Database connection strings
- Azure service URLs and keys
- OAuth provider credentials
- Security secrets

### Key Vault Secrets

Store sensitive configuration in Azure Key Vault:

```bash
# Database URL
az keyvault secret set --vault-name "your-keyvault" --name "database-url" --value "your-connection-string"

# JWT Secret
az keyvault secret set --vault-name "your-keyvault" --name "jwt-secret" --value "your-jwt-secret"

# OAuth Credentials
az keyvault secret set --vault-name "your-keyvault" --name "google-oauth-id" --value "your-google-id"
az keyvault secret set --vault-name "your-keyvault" --name "google-oauth-secret" --value "your-google-secret"
```

## 📊 Monitoring & Scaling

### Built-in Monitoring

The deployment includes:

- **Memory usage alerts** (>80% threshold)
- **CPU usage alerts** (>85% threshold)
- **DTU usage alerts** (>80% of 5 DTU limit)
- **Database size alerts** (>90% of 2GB limit)
- **Response time alerts** (>25 seconds)
- **Error rate alerts** (>5% error rate)

### Scaling Triggers

Automatic scaling recommendations based on:

- Memory pressure (>85% = scale up recommendation)
- DTU exhaustion (>85% = database scale up)
- High response times (>20s = performance investigation)
- Connection limits (>25 of 30 connections)

### Cost-Effective Scaling Path

1. **Current**: B1 + SQL Basic ($18/month)
2. **Memory relief**: B2 + SQL Basic ($31/month)
3. **Database boost**: B1 + SQL Standard S0 ($28/month)
4. **Full upgrade**: B2 + SQL Standard S0 ($41/month)

## 🛡️ Security Features

### Implemented Security

- **HTTPS only** enforcement
- **Security headers** (CSP, XSS protection, etc.)
- **Managed Identity** for service-to-service authentication
- **Key Vault integration** for secrets management
- **SQL connection encryption** with certificate validation
- **Storage account private access**

### Security Best Practices

1. **Rotate secrets regularly** (stored in Key Vault)
2. **Monitor access logs** via Application Insights
3. **Review firewall rules** monthly
4. **Update dependencies** regularly
5. **Enable SQL auditing** for compliance

## 🔄 Backup & Recovery

### Automated Backups

- **Database**: 7-day point-in-time restore + weekly exports
- **Application config**: Weekly backup to blob storage
- **Documentation**: Weekly backup of docs and setup
- **Retention**: 30 days for cost optimization

### Recovery Procedures

1. **Database restore**:
   ```bash
   # Point-in-time restore (last 7 days)
   az sql db restore --dest-name pantry-crm-restored --edition Basic --service-objective Basic --source-database pantry-crm --time "2024-01-15T10:00:00Z"
   ```

2. **Application restore**:
   ```bash
   # Download latest backup
   az storage blob download --account-name yourstorageaccount --container-name backups --name "config/config-backup-latest.tar.gz" --file config-restore.tar.gz
   ```

## 📈 Performance Optimization

### Azure B1 Optimizations

- **Memory management**: 1.75GB RAM with 80% usage alerts
- **Connection pooling**: Limited to 3 database connections
- **Garbage collection**: Optimized for single-core performance
- **Cache optimization**: 100MB application cache limit
- **Response optimization**: 30-second timeout limits

### Database Optimizations

- **Index compression**: Reduces storage and improves performance
- **Column statistics**: Auto-update for query optimization
- **Batch operations**: 25 records per batch for DTU efficiency
- **Connection limits**: 3 connections max for 5 DTU tier

## 🚨 Troubleshooting

### Common Issues

1. **Memory pressure**:
   ```bash
   # Check current usage
   npx tsx -e "console.log(require('./lib/azure-b1-optimizations').azureB1Optimizer.getCurrentResourceUsage())"
   ```

2. **DTU throttling**:
   ```bash
   # Check database metrics
   az sql db show-usage --name pantry-crm --server your-server --resource-group your-rg
   ```

3. **Key Vault access**:
   ```bash
   # Test managed identity access
   az keyvault secret show --vault-name your-keyvault --name jwt-secret
   ```

### Scaling Decisions

- **Memory >85%**: Scale to B2 (+$13/month)
- **DTU >85%**: Scale to SQL Standard S0 (+$10/month)
- **Both issues**: Scale to B2 + S0 (+$23/month)
- **High availability needs**: Scale to S1 + S1 (+$52/month)

## 📞 Support

For deployment issues:

1. Check Azure Portal for resource status
2. Review Application Insights for errors
3. Examine scaling manager recommendations
4. Verify Key Vault access and secrets
5. Monitor resource usage patterns

## 💰 Cost Monitoring

Track your Azure spending:

```bash
# Current month usage
az consumption usage list --top 5

# Cost analysis
az costmanagement query --type Usage --dataset-granularity Daily
```

**Budget alerts recommended**:
- Alert at $20/month (90% of budget)
- Alert at $25/month (125% of budget)
- Stop resources at $30/month (emergency limit)

---

**Total setup time**: ~30 minutes  
**Estimated monthly cost**: $18-22  
**Uptime target**: 99.9%  
**Performance target**: <1s search, <10s reports