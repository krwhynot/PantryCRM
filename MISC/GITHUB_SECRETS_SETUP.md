# GitHub Secrets Configuration

This document outlines the required GitHub repository secrets for Azure deployment.

## Required Secrets

### 1. AZURE_WEBAPP_PUBLISH_PROFILE
- **Description**: Azure App Service publish profile for deployment
- **How to get**: 
  1. Go to Azure Portal → App Services → kitchen-pantry-crm
  2. Click "Get publish profile" in the overview section
  3. Copy the entire XML content
- **Value**: Complete XML publish profile content

### 2. DATABASE_URL
- **Description**: Azure SQL Database connection string
- **Format**: `sqlserver://SERVER:PORT;database=DATABASE;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;`
- **Example**: `sqlserver://kitchen-pantry-crm-server.database.windows.net:1433;database=kitchen-pantry-crm-db;user=dbadmin;password=YourSecurePassword123!;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;`

### 3. NEXTAUTH_SECRET
- **Description**: Secret key for NextAuth.js authentication
- **How to generate**: Run `openssl rand -base64 32` or use https://generate-secret.vercel.app/32
- **Example**: `your-32-character-secret-key-here`

### 4. NEXTAUTH_URL
- **Description**: Application URL for authentication callbacks
- **Value**: `https://kitchen-pantry-crm.azurewebsites.net`

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact name and value above

## Environment Variables in Azure App Service

After deployment, also configure these in Azure App Service:

1. Go to Azure Portal → App Services → kitchen-pantry-crm
2. Click **Configuration** → **Application settings**
3. Add the same secrets as environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

## Health Check Endpoint

The deployment includes a health check at:
- URL: `https://kitchen-pantry-crm.azurewebsites.net/api/health`
- Should return HTTP 200 when working properly

## Deployment Trigger

The workflow triggers on:
- Push to `main` branch
- Pull request merge to `main` branch
- Manual workflow dispatch

## Monitoring

Monitor deployment status at:
- GitHub Actions: Repository → Actions tab
- Azure App Service: Portal → App Services → kitchen-pantry-crm → Deployment Center