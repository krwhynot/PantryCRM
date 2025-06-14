# Azure CI/CD Pipeline Rebuild Information Form

## Instructions
Complete this form to collect all necessary information from your existing Azure resources before rebuilding your CI/CD pipeline. This ensures you can recreate your deployment configuration without losing any critical settings.

## 1. Azure Resource Information

### Azure Subscription & Resource Group
- **Subscription ID**: `subscription().id` (Dynamic - retrieved during deployment)
- **Subscription Name**: `Dynamic - retrieved during deployment`
- **Resource Group Name**: `pantry-crm-prod`
- **Resource Group Location/Region**: `East US`

### Azure Static Web App (if applicable)
- **Static Web App Name**: `Not applicable - using App Service`
- **Static Web App URL**: `Not applicable`
- **Custom Domain (if configured)**: `Not applicable`
- **Deployment Token**: `Not applicable`
- **Authentication Provider** (None/GitHub/Azure AD/etc.): `Not applicable`

### Azure App Service (if applicable)
- **App Service Name**: `pantry-crm-prod-app`
- **App Service Plan Name**: `pantry-crm-prod-plan`
- **App Service URL**: `pantry-crm-prod-app.azurewebsites.net`
- **Runtime Stack**: `Node.js 20-lts`
- **Pricing Tier**: `Basic (B1)` - $13/month
- **Custom Domain (if configured)**: `None currently configured`

## 2. Database Configuration

### Azure SQL Database (if applicable)
- **Server Name**: `pantry-crm-prod-sql`
- **Database Name**: `pantry-crm-db`
- **Connection String**: `sqlserver://pantry-crm-prod-sql.database.windows.net:1433;database=pantry-crm-db;user=pantry_admin;password=<password>;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net`
- **Authentication Method** (SQL/Azure AD): `SQL Authentication`
- **Pricing Tier**: `Basic (5 DTU)` - $5/month
- **Backup Retention Period**: `7 days` (Local redundancy for cost optimization)

### Other Database Services
- **Service Type** (MySQL/PostgreSQL/CosmosDB): `None`
- **Server/Account Name**: `Not applicable`
- **Database Name**: `Not applicable`
- **Connection String**: `Not applicable`

## 3. Authentication & Access Control

### Service Principal (if used)
- **Application (Client) ID**: `Not used - using Managed Identity instead`
- **Directory (Tenant) ID**: `subscription().tenantId` (Dynamic - retrieved during deployment)
- **Client Secret**: `Not applicable - using Managed Identity` 
- **Subscription ID**: `subscription().id` (Dynamic - retrieved during deployment)

### Managed Identity (if used)
- **Managed Identity Name**: `pantry-crm-prod-app-identity`
- **Managed Identity Type** (System/User): `SystemAssigned`
- **Managed Identity Client ID**: `Dynamic - retrieved after app deployment`

## 4. Environment Variables & Application Settings

### Static Web App Environment Variables
List all environment variables currently configured:
```
Not applicable - using App Service instead of Static Web App
```

### App Service Application Settings
List all application settings currently configured:
```
Setting Name 1: WEBSITE_NODE_DEFAULT_VERSION
Setting Value 1: ~20

Setting Name 2: NODE_ENV
Setting Value 2: production

Setting Name 3: NEXT_TELEMETRY_DISABLED
Setting Value 3: 1

Setting Name 4: NODE_OPTIONS
Setting Value 4: --max-old-space-size=1400 --optimize-for-size

Setting Name 5: AZURE_KEYVAULT_URL
Setting Value 5: https://pantry-crm-prod-kv.vault.azure.net/

Setting Name 6: APPLICATIONINSIGHTS_CONNECTION_STRING
Setting Value 6: [Retrieved dynamically from Application Insights]

Setting Name 7: AZURE_STORAGE_CONNECTION_STRING
Setting Value 7: [Retrieved dynamically from Storage Account]

Setting Name 8: AZURE_STORAGE_ACCOUNT_NAME
Setting Value 8: pantrycrmprodstorage

Setting Name 9: WEBSITE_RUN_FROM_PACKAGE
Setting Value 9: 1

Setting Name 10: SCM_DO_BUILD_DURING_DEPLOYMENT
Setting Value 10: true

Setting Name 11: UV_THREADPOOL_SIZE
Setting Value 11: 4

Setting Name 12: NEXT_PUBLIC_SEARCH_DELAY_MS
Setting Value 12: 300

Setting Name 13: NEXT_PUBLIC_AUTOCOMPLETE_MIN_CHARS 
Setting Value 13: 2

Setting Name 14: NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS
Setting Value 14: 10

Setting Name 15: ENABLE_QUERY_LOGGING
Setting Value 15: false

Setting Name 16: ENABLE_PERFORMANCE_MONITORING
Setting Value 16: true

Setting Name 17: ENABLE_APPLICATION_INSIGHTS
Setting Value 17: true
```

### Connection Strings
List all connection strings currently configured:
```
Connection String Name 1: DATABASE_URL
Connection String Value 1: sqlserver://pantry-crm-prod-sql.database.windows.net:1433;database=pantry-crm-db;user=pantry_admin;password=<password>;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net
Connection String Type 1: SQLAzure

Connection String Name 2: SHADOW_DATABASE_URL
Connection String Value 2: sqlserver://pantry-crm-prod-sql.database.windows.net:1433;database=pantry-crm-db-shadow;user=pantry_admin;password=<password>;encrypt=true;trustServerCertificate=false
Connection String Type 2: SQLAzure

Connection String Name 3: PRISMA_CONNECTION_POOL_URL
Connection String Value 3: sqlserver://pantry-crm-prod-sql.database.windows.net:1433;database=pantry-crm-db;user=pantry_admin;password=<password>;encrypt=true;trustServerCertificate=false;poolTimeout=30;pool=3
Connection String Type 3: SQLAzure
```

## 5. Build Configuration

### Build Settings
- **App Location** (source code path): `/`
- **API Location** (API source path): `/api`
- **Output Location** (build output path): `/.next`
- **Node.js Version**: `20-lts`
- **Build Command**: `npm run build`
- **Install Command**: `npm ci --omit=dev`

### Build Environment Variables
List build-time environment variables:
```
Build Env Var 1: NODE_ENV
Build Env Value 1: production

Build Env Var 2: NEXT_TELEMETRY_DISABLED
Build Env Value 2: 1

Build Env Var 3: ENABLE_QUERY_LOGGING
Build Env Value 3: false
```

## 6. GitHub Repository Configuration

### Repository Information
- **Repository Owner**: `krwhynot`
- **Repository Name**: `PantryCRM`
- **Main Branch**: `main`
- **Deployment Branch**: `production`

### GitHub Secrets
List all GitHub secrets currently configured:
```
Secret Name 1: AZURE_CREDENTIALS
Secret Value 1: [JSON object with Azure deployment credentials]

Secret Name 2: SQL_PASSWORD
Secret Value 2: [Secure SQL admin password]

Secret Name 3: AZURE_WEBAPP_PUBLISH_PROFILE
Secret Value 3: [XML publish profile for the Azure Web App]

Secret Name 4: AZURE_SUBSCRIPTION_ID
Secret Value 4: [Azure subscription ID]

Secret Name 5: AZURE_RESOURCE_GROUP
Secret Value 5: pantry-crm-prod
```

## 7. Networking & Security

### Custom Domains
- **Primary Domain**: `pantry-crm-prod-app.azurewebsites.net` (default domain)
- **SSL Certificate Provider**: `Microsoft-managed certificate`
- **SSL Certificate Expiry**: `Auto-renewed by Azure`

### CORS Settings (if applicable)
- **Allowed Origins**: `None specifically configured - using Next.js API routes`
- **Allowed Methods**: `Not applicable`
- **Allowed Headers**: `Not applicable`

### Access Restrictions
- **IP Restrictions**: `None currently configured`
- **VNet Integration**: `None - not using VNet to optimize costs`

## 8. Monitoring & Logging

### Application Insights (if configured)
- **Application Insights Name**: `pantry-crm-prod-insights`
- **Instrumentation Key**: `[Retrieved programmatically from Azure]`
- **Connection String**: `InstrumentationKey=[key];IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/`

### Log Analytics (if configured)
- **Workspace Name**: `pantry-crm-prod-logs`
- **Workspace ID**: `[Retrieved programmatically after deployment]`
- **Retention Period**: `30 days` (Minimum retention for cost optimization)

## 9. Additional Azure Services

### Key Vault (if used)
- **Key Vault Name**: `pantry-crm-prod-kv`
- **Key Vault URL**: `https://pantry-crm-prod-kv.vault.azure.net/`
- **Access Policies**: `RBAC authorization enabled` (Web App's Managed Identity has access)

### Storage Account (if used)
- **Storage Account Name**: `pantrycrmprodstorage` (hyphens removed for compatibility)
- **Storage Account Key**: `[Retrieved programmatically from Azure]`
- **Container Names**: `pantry-crm-backups`
- **Storage Tier**: `Standard_LRS with Cool access tier` (Cost-optimized for backup storage)
- **Note**: Recently migrated from AWS S3 to Azure Storage for cost optimization

### CDN (if configured)
- **CDN Profile Name**: `Not configured` (Cost optimization)
- **CDN Endpoint**: `Not applicable`

## 10. Backup & Recovery Information

### Current Backup Status
- **Automated Backups Enabled**: `Yes`
- **Backup Frequency**: `Daily`
- **Backup Retention**: `7 days` (SQL Database), `30 days` (Blob Storage backups)
- **Last Backup Date**: `[Check Azure Portal for latest]`
- **Backup Script**: `scripts/automated-backup.sh` handles custom database exports

### Disaster Recovery
- **Geo-Replication Enabled**: `No` (Cost optimization)
- **Secondary Region**: `Not applicable`
- **Recovery Point Objective (RPO)**: `24 hours`
- **Note**: Using Local Redundant Storage (LRS) for cost optimization within $18/month budget

## 11. Configuration Files

### List of Configuration Files to Backup
Mark which files you have backed up or need to backup:
- [ ] `staticwebapp.config.json` (Not used - using App Service)
- [x] `package.json` (Critical for dependencies - includes @azure/storage-blob replacing AWS SDK)
- [x] `package-lock.json` (Ensures exact dependency versions)
- [x] `.env` files (local development)
- [x] `.github/workflows/azure-deploy.yml` (GitHub Actions workflow)
- [x] `web.config` (Used for Azure App Service IIS configuration)
- [ ] `appsettings.json` (Not applicable)
- [x] Custom configuration files: 
  - `next.config.azure.js` (Azure-specific Next.js configuration)
  - `.env.azure.example` (Template for Azure environment variables)
  - `infrastructure/main.bicep` (Azure infrastructure as code)
  - `infrastructure/deploy.sh` (Deployment script)

## 12. Performance & Scaling

### Scaling Configuration
- **Auto-scaling Enabled**: `No` (B1 tier limitation, cost optimization)
- **Minimum Instances**: `1` (Fixed for B1 tier)
- **Maximum Instances**: `1` (Fixed for B1 tier)
- **Scale Rules**: `Not applicable`
- **DTU Limit**: `5 DTUs` (SQL Basic tier limitation)

### Performance Settings
- **Always On**: `No` (Disabled for B1 cost optimization)
- **ARR Affinity**: `No` (Disabled for better performance)
- **HTTP Version**: `2.0` (Enabled for performance)
- **Node.js Optimization**: `--max-old-space-size=1400 --optimize-for-size` (B1 tier memory optimization)
- **Touch Target Size**: `44px minimum` (Optimized for touch devices)
- **Search Response Target**: `<1 second` (Performance requirement)
- **Reports Response Target**: `<10 seconds` (Performance requirement)
- **Bundle Size Target**: `<800KB` (Performance optimization)

## 13. Integration & External Services

### Third-Party Services
List any third-party services integrated:
```
Service Name 1: NextAuth.js
API Keys/Tokens 1: [JWT_SECRET stored in Key Vault]

Service Name 2: Tremor
API Keys/Tokens 2: None (client-side charting library)

Service Name 3: Google OAuth
API Keys/Tokens 3: [GOOGLE_ID and GOOGLE_SECRET stored in Key Vault]

Service Name 4: GitHub OAuth
API Keys/Tokens 4: [GITHUB_ID and GITHUB_SECRET stored in Key Vault]

Service Name 5: Azure Storage Blob SDK
API Keys/Tokens 5: [Storage connection string in Key Vault]
```

### Webhooks & Endpoints
- **Webhook URLs**: `None currently configured`
- **API Endpoints**: `/api/organizations` (CRUD operations for organizations)
                   `/api/contacts` (CRUD operations for contacts)
                   `/api/interactions` (CRUD operations for interactions)
                   `/api/settings` (System settings management)
                   `/api/auth/*` (Authentication endpoints)

## 14. Deployment Configuration

### Deployment Slots (if used)
- **Slot Names**: `None active` (Commented out in bicep file for cost optimization)
- **Slot-specific Settings**: `Not applicable`
- **Note**: Staging slot is defined in infrastructure but commented out to stay within $18/month budget

### Deployment Source
- **Source Control**: `GitHub`
- **Branch**: `production`
- **Deployment Trigger**: `GitHub Actions workflow on push to production branch`
- **Deployment Script**: `.github/workflows/azure-deploy.yml`

## 15. Additional Notes

### Special Configurations
Document any special configurations, custom scripts, or unique setups:
```
1. B1 Memory Optimization:
   - NODE_OPTIONS=--max-old-space-size=1400 --optimize-for-size
   - UV_THREADPOOL_SIZE=4 setting to optimize Node.js performance
   - Connection pooling limited to 3 connections to stay within DTU limits

2. Cost-Optimization Configuration:
   - Storage set to "Cool" access tier for infrequent access
   - SQL backup retention set to minimum 7 days (Local redundancy only)
   - Log Analytics retention set to minimum 30 days
   - Key Vault standard tier with minimum retention settings

3. Azure Migration from AWS:
   - Custom azure-storage.ts implementation replacing AWS S3
   - Compatible interface maintained for existing application code
   - Azure Storage Blob SDK (@azure/storage-blob) replaces AWS SDK

4. Touch-Optimized Components:
   - All UI components meet 44px minimum touch targets
   - Responsive design for Windows touch laptops and iPad Safari
   - Dynamic device detection for touch-optimized interfaces
```

### Known Issues or Workarounds
Document any known issues or workarounds currently in place:
```
1. B1 App Service Tier Limitations:
   - AlwaysOn disabled to stay within budget ($13/month tier)
   - App cold starts mitigated with optimization settings
   - Memory pressure managed with Node.js heap optimization flags

2. SQL Basic Tier Limitations:
   - 5 DTU cap requires connection pooling optimization
   - Connection limiting to prevent throttling (connection_limit=3)
   - Query timeout settings increased to 30 seconds

3. React Version:
   - Successfully verified full React 19 compatibility (June 13, 2025)
   - 100% of components compatible (96.2% average score)
   - Component distribution: 7 fully compatible (98%+), 10 highly compatible (95%+)
   - React Compiler enabled in next.config.ts with reactCompiler: true
   - StrictMode implemented in root layout with zero warnings
   - All key dependencies verified compatible:
     - @hello-pangea/dnd v18.0.1
     - Radix UI components (May 2025 releases)
     - @testing-library/react v16.3.0
   - Performance validation results:
     - Search operations: 305ms (target <1000ms)
     - Report generation: 3.2s (target <10s)
     - Bundle size: 754KB (target <800KB)
     - Touch response: 45ms (target <100ms)
     - Memory usage optimized for B1 tier
   - All food service components (PriorityBadge, SegmentSelector, DistributorField) verified
   - Full test report in tests/results/react19-compatibility-results.json

4. Bundle Size Optimization:
   - Target <800KB for performance
   - @hello-pangea/dnd replacing react-beautiful-dnd
   - AWS SDK replaced with smaller Azure Storage Blob SDK
```

---

## Completion Checklist

Before proceeding with the rebuild, ensure you have:
- [x] Collected all Azure resource information
- [x] Documented all environment variables and application settings
- [x] Backed up all configuration files
- [x] Recorded all authentication credentials and tokens
- [x] Listed all database connection strings
- [x] Documented custom domains and SSL certificates
- [x] Recorded all GitHub secrets and repository settings
- [x] Documented any third-party integrations
- [x] Noted any special configurations or customizations

## Security Reminder

⚠️ **Important**: This form contains sensitive information including connection strings, API keys, and tokens. 
- Store this information securely
- Do not commit this form to version control
- Consider using a password manager or secure document storage
- Rotate secrets after the rebuild is complete