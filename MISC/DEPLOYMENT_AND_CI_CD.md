# 🚀 Deployment, CI/CD and GitHub Integration

This document consolidates all information related to CI/CD pipelines, GitHub Actions, deployment processes, and testing configurations for PantryCRM.

---

## CI/CD Pipeline Architecture

### Main CI/CD Pipeline

**File**: `.github/workflows/ci-cd-pipeline.yml`

The main pipeline implements a comprehensive CI/CD strategy with the following stages:

1. **Build and Test Stage** - Builds application and runs quality checks
2. **Security Scanning Stage** - Performs SAST and dependency vulnerability scanning
3. **Environment Deployments** - Deploys to development, staging, and production environments
4. **Post-Deployment Monitoring** - Monitors application health and creates deployment markers

**Triggers**:
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Manual workflow dispatch with environment selection

### Pull Request Validation Pipeline

**File**: `.github/workflows/pr-validation.yml`

Comprehensive validation workflow for all pull requests with quality gates:

- **PR Metadata Validation** - Validates PR title format and description quality
- **Code Quality Checks** - ESLint, TypeScript checking, Prettier formatting
- **Security Validation** - CodeQL analysis, secret scanning, dependency audits
- **Performance Analysis** - Bundle size analysis, memory usage testing
- **Test Validation** - Unit tests with coverage reporting

---

## GitHub Secrets Configuration

### Required Secrets

#### 1. AZURE_WEBAPP_PUBLISH_PROFILE
- **Description**: Azure Web App publish profile XML
- **Source**: Azure Portal > App Service > Get publish profile
- **Content**: The entire XML content

#### 2. DATABASE_URL
- **Description**: Azure SQL Database connection string
- **Format**: `sqlserver://SERVER:PORT;database=DATABASE;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;`

#### 3. NEXTAUTH_SECRET
- **Description**: Secret key for NextAuth.js authentication
- **How to generate**: Run `openssl rand -base64 32` or use https://generate-secret.vercel.app/32

#### 4. NEXTAUTH_URL
- **Description**: Application URL for authentication callbacks
- **Value**: `https://kitchen-pantry-crm.azurewebsites.net`

### How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact name and value above

---

## Testing Framework Configuration

### Testing Stack

- **Testing Framework**: Jest (v29.5.0)
- **Testing Libraries**:
  - `@testing-library/react` - For testing React components
  - `@testing-library/jest-dom` - For DOM testing assertions
  - `@testing-library/user-event` - For simulating user events

### Testing Command Reference

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test-file.test.tsx

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### E2E Testing with Playwright

- **Configuration File**: `playwright.config.ts`
- **Test Directory**: `e2e/`
- **Commands**:
  - `npm run test:e2e` - Run all E2E tests
  - `npm run test:e2e:headed` - Run E2E tests in headed mode

---

## Azure Deployment Strategy

### Azure Resources

- **App Service**: Basic B1 ($13/month)
- **SQL Database**: Basic 5 DTU ($5/month)
- **Storage Account**: Standard (~$0.50/month)

### Deployment Process

1. **Build Application**: `npm run build`
2. **Prepare Production Assets**: `npm run prepare:production`
3. **Deploy to Azure**:
   - Via GitHub Actions (preferred)
   - Manual deployment via Azure CLI (`az webapp deployment`)

### Rollback Procedure

1. **Identify Deployment ID**: Check Azure Portal > App Service > Deployment Center
2. **Execute Rollback**: `az webapp deployment source rollback --ids <deployment-id>`
3. **Verify Rollback**: Check application health endpoint

---

## Environment Variables

### Production Environment Variables (Azure App Service)

1. Go to Azure Portal → App Services → kitchen-pantry-crm
2. Click **Configuration** → **Application settings**
3. Add required environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

### Development Environment Variables (.env.local)

```
# Database
DATABASE_URL="sqlserver://localhost:1433;database=PantryCRM;user=sa;password=YourPassword123!;encrypt=true;trustServerCertificate=true;loginTimeout=30;"

# NextAuth
NEXTAUTH_SECRET="your-development-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Health Monitoring

- **Health Check Endpoint**: `/api/health`
- **Expected Response**: HTTP 200 with JSON payload
- **Azure Application Insights**: Configured for real-time monitoring
- **Alert Rules**: CPU >80%, Memory >85%, Response time >2s