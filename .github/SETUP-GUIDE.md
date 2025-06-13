# CI/CD Setup Guide for Kitchen Pantry CRM

This guide will walk you through setting up the complete CI/CD pipeline for your Next.js application.

## Prerequisites

- GitHub repository with admin access
- Azure subscription with appropriate permissions
- Node.js 20.x installed locally
- Azure CLI installed (`az --version`)

## Step 1: Azure Infrastructure Setup

### 1.1 Create Resource Groups

```bash
# Login to Azure
az login

# Create staging resource group
az group create --name pantrycrm-staging-rg --location eastus

# Create production resource group
az group create --name pantrycrm-production-rg --location eastus
```

### 1.2 Create App Service Plans

```bash
# Staging - B1 tier (suitable for testing)
az appservice plan create \
  --name pantrycrm-staging-plan \
  --resource-group pantrycrm-staging-rg \
  --sku B1 \
  --is-linux

# Production - B2 tier or higher recommended
az appservice plan create \
  --name pantrycrm-production-plan \
  --resource-group pantrycrm-production-rg \
  --sku B2 \
  --is-linux
```

### 1.3 Create Web Apps

```bash
# Staging web app
az webapp create \
  --name pantrycrm-staging \
  --resource-group pantrycrm-staging-rg \
  --plan pantrycrm-staging-plan \
  --runtime "NODE:20-lts"

# Production web app with staging slot
az webapp create \
  --name pantrycrm-production \
  --resource-group pantrycrm-production-rg \
  --plan pantrycrm-production-plan \
  --runtime "NODE:20-lts"

# Create staging slot for production
az webapp deployment slot create \
  --name pantrycrm-production \
  --resource-group pantrycrm-production-rg \
  --slot staging
```

### 1.4 Create Databases

```bash
# Create Azure SQL Database for staging
az sql server create \
  --name pantrycrm-staging-sql \
  --resource-group pantrycrm-staging-rg \
  --admin-user sqladmin \
  --admin-password 'YourSecurePassword123!'

az sql db create \
  --resource-group pantrycrm-staging-rg \
  --server pantrycrm-staging-sql \
  --name pantrycrm-staging-db \
  --service-objective Basic

# Create Azure SQL Database for production
az sql server create \
  --name pantrycrm-production-sql \
  --resource-group pantrycrm-production-rg \
  --admin-user sqladmin \
  --admin-password 'YourVerySecurePassword123!'

az sql db create \
  --resource-group pantrycrm-production-rg \
  --server pantrycrm-production-sql \
  --name pantrycrm-production-db \
  --service-objective S1
```

### 1.5 Create Service Principal for GitHub Actions

```bash
# Create service principal for staging
az ad sp create-for-rbac \
  --name "github-actions-staging" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/pantrycrm-staging-rg \
  --sdk-auth > azure-credentials-staging.json

# Create service principal for production
az ad sp create-for-rbac \
  --name "github-actions-production" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/pantrycrm-production-rg \
  --sdk-auth > azure-credentials-production.json
```

## Step 2: GitHub Repository Setup

### 2.1 Create Environments

1. Go to Settings → Environments in your GitHub repository
2. Create the following environments:
   - `staging` - No protection rules
   - `production-approval` - Add required reviewers
   - `production` - Add required reviewers and restrict to `main` branch
   - `production-rollback` - Add required reviewers

### 2.2 Add Secrets

Go to Settings → Secrets and variables → Actions, then add these secrets:

```bash
# Copy the template
cp .github/secrets.template .github/secrets.env

# Fill in the values
nano .github/secrets.env

# Add each secret to GitHub (do not commit the filled file!)
```

Required secrets:
- `DATABASE_URL_TEST`
- `DATABASE_URL_STAGING`
- `DATABASE_URL_PRODUCTION`
- `GOOGLE_ID`
- `GOOGLE_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `JWT_SECRET`
- `AZURE_CREDENTIALS_STAGING` (from azure-credentials-staging.json)
- `AZURE_CREDENTIALS_PRODUCTION` (from azure-credentials-production.json)
- `AZURE_WEBAPP_NAME_STAGING`
- `AZURE_WEBAPP_NAME_PRODUCTION`
- `AZURE_RESOURCE_GROUP_STAGING`
- `AZURE_RESOURCE_GROUP_PRODUCTION`
- `SNYK_TOKEN` (optional but recommended)
- `CODECOV_TOKEN` (optional but recommended)

### 2.3 Update Dependabot Configuration

Edit `.github/dependabot.yml` and replace `your-github-username` with actual GitHub usernames for reviewers and assignees.

## Step 3: Security Tools Setup

### 3.1 Snyk Setup

1. Sign up at https://app.snyk.io
2. Connect your GitHub repository
3. Copy your authentication token
4. Add as `SNYK_TOKEN` secret in GitHub

### 3.2 Codecov Setup

1. Sign up at https://app.codecov.io
2. Add your repository
3. Copy the upload token
4. Add as `CODECOV_TOKEN` secret in GitHub

### 3.3 Enable GitHub Security Features

1. Go to Settings → Security & analysis
2. Enable:
   - Dependency graph
   - Dependabot security updates
   - Code scanning alerts
   - Secret scanning

## Step 4: Local Development Setup

### 4.1 Install Dependencies

```bash
npm ci --legacy-peer-deps
```

### 4.2 Setup Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Add pre-commit hook
echo 'npm run typecheck && npm run lint' > .husky/pre-commit
chmod +x .husky/pre-commit
```

### 4.3 Create Local Environment

```bash
# Copy environment template
cp .env.example .env.local

# Fill in your local development values
nano .env.local
```

## Step 5: Initial Deployment

### 5.1 Test the Pipeline Locally

```bash
# Run all checks
npm run typecheck
npm run lint
npm test
npm run build
```

### 5.2 Push to GitHub

```bash
git add .
git commit -m "feat: add comprehensive CI/CD pipeline"
git push origin main
```

### 5.3 Monitor the Workflows

1. Go to Actions tab in GitHub
2. Watch the CI pipeline run
3. Once passed, deployment to staging should start automatically
4. For production deployment, use the manual workflow dispatch

## Step 6: Configure Monitoring

### 6.1 Application Insights (Recommended)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app pantrycrm-production \
  --location eastus \
  --resource-group pantrycrm-production-rg

# Get the instrumentation key
az monitor app-insights component show \
  --app pantrycrm-production \
  --resource-group pantrycrm-production-rg \
  --query instrumentationKey
```

### 6.2 Set Up Alerts

```bash
# CPU usage alert
az monitor metrics alert create \
  --name high-cpu-alert \
  --resource-group pantrycrm-production-rg \
  --scopes /subscriptions/{sub-id}/resourceGroups/pantrycrm-production-rg/providers/Microsoft.Web/sites/pantrycrm-production \
  --condition "avg Percentage CPU > 80" \
  --description "Alert when CPU usage is over 80%"

# Response time alert
az monitor metrics alert create \
  --name slow-response-alert \
  --resource-group pantrycrm-production-rg \
  --scopes /subscriptions/{sub-id}/resourceGroups/pantrycrm-production-rg/providers/Microsoft.Web/sites/pantrycrm-production \
  --condition "avg Response Time > 2000" \
  --description "Alert when response time exceeds 2 seconds"
```

## Step 7: Test the Complete Pipeline

### 7.1 Test CI Pipeline

1. Create a feature branch
2. Make a small change
3. Create a pull request
4. Verify all checks pass

### 7.2 Test Deployment

1. Merge PR to main
2. Watch staging deployment
3. Trigger production deployment manually
4. Verify health endpoint: `curl https://your-app.azurewebsites.net/api/health`

### 7.3 Test Rollback

1. Go to Actions → Emergency Rollback
2. Run workflow with staging environment
3. Verify rollback completes successfully

## Maintenance

### Weekly Tasks
- Review Dependabot PRs
- Check security alerts
- Review performance metrics

### Monthly Tasks
- Update Azure credentials if needed
- Review and optimize costs
- Update documentation

### Quarterly Tasks
- Disaster recovery test
- Security audit
- Performance baseline update

## Troubleshooting

### Common Issues

1. **Deployment fails with "App Service plan not found"**
   - Ensure the service principal has correct permissions
   - Verify resource names match exactly

2. **Database connection fails**
   - Check firewall rules allow Azure services
   - Verify connection string format
   - Ensure SSL is enabled

3. **Build runs out of memory**
   - Increase `NODE_OPTIONS` in build script
   - Optimize build process
   - Consider larger App Service plan

4. **Secrets not available in workflow**
   - Check secret names match exactly (case-sensitive)
   - Verify secrets are in correct environment
   - Ensure no trailing spaces in secret values

### Getting Help

1. Check workflow logs in Actions tab
2. Review Azure App Service logs
3. Consult the [CI/CD Documentation](.github/CI-CD-DOCUMENTATION.md)
4. Create an issue in the repository

## Next Steps

1. Customize workflows for your specific needs
2. Add additional security scanning tools
3. Implement advanced deployment strategies (canary, feature flags)
4. Set up performance monitoring dashboards
5. Create runbooks for common operations

Remember to keep all credentials secure and rotate them regularly!