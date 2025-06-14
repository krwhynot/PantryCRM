# 🔐 GitHub Secrets Setup for Azure Automation

This document provides step-by-step instructions for setting up GitHub repository secrets to enable automated Azure monitoring and deployment.

## 📋 Required Secrets

### 1. AZURE_CREDENTIALS (Required for all workflows)

**Value format:**
```json
{
  "clientId": "2669d57d-dacd-41f6-a897-50edb2ca6c04",
  "clientSecret": "YOUR_SERVICE_PRINCIPAL_SECRET",
  "subscriptionId": "df8fefaa-16a0-47da-ace7-6eab8b1919cf",
  "tenantId": "1018280e-f485-43e4-911a-b1140fcd1f1f"
}
```

**How to get this:**
1. You already have the service principal: `2669d57d-dacd-41f6-a897-50edb2ca6c04`
2. Use the password from when you created the service principal
3. Create this JSON with your actual values

### 2. Optional Notification Secrets

- **TEAMS_WEBHOOK_URL**: Microsoft Teams webhook for alerts
- **SLACK_WEBHOOK_URL**: Slack webhook for notifications
- **EMAIL_ALERTS**: Email addresses for critical alerts

## 🛠️ Setup Instructions

### Step 1: Add AZURE_CREDENTIALS to GitHub

1. **Go to your GitHub repository**: https://github.com/YOUR_USERNAME/PantryCRM
2. **Click "Settings"** tab
3. **Click "Secrets and variables"** → **"Actions"**
4. **Click "New repository secret"**
5. **Name**: `AZURE_CREDENTIALS`
6. **Value**: Paste the JSON above with your actual values
7. **Click "Add secret"**

### Step 2: Verify Service Principal Permissions

Run this command to ensure your service principal has the required roles:

```bash
# Check current role assignments
az role assignment list --assignee 2669d57d-dacd-41f6-a897-50edb2ca6c04 --output table

# Add Monitoring Reader role (if not already assigned)
az role assignment create \
  --assignee '2669d57d-dacd-41f6-a897-50edb2ca6c04' \
  --role 'Monitoring Reader' \
  --scope '/subscriptions/df8fefaa-16a0-47da-ace7-6eab8b1919cf'

# Add Cost Management Reader role (for cost analysis)
az role assignment create \
  --assignee '2669d57d-dacd-41f6-a897-50edb2ca6c04' \
  --role 'Cost Management Reader' \
  --scope '/subscriptions/df8fefaa-16a0-47da-ace7-6eab8b1919cf'
```

### Step 3: Test the Setup

Create a simple test workflow to verify the setup:

```yaml
# .github/workflows/test-azure-auth.yml
name: 🧪 Test Azure Authentication

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    - run: |
        az account show
        az group show --name kitchen-pantry-crm-rg
```

## 🔒 Security Best Practices

### Service Principal Security

1. **Least Privilege**: Only assign necessary roles
2. **Regular Rotation**: Rotate the client secret every 90 days
3. **Monitoring**: Monitor service principal usage in Azure AD logs

### GitHub Secrets Security

1. **Never log secrets**: Ensure workflows don't output secret values
2. **Use environment protection**: For production workflows
3. **Regular audit**: Review who has access to repository secrets

## 📊 Available Workflows

Once secrets are configured, these workflows will run automatically:

### 🔍 Performance Monitoring (`performance-monitoring.yml`)
- **Schedule**: Every 6 hours
- **Purpose**: Captures App Service, SQL, and Application Insights metrics
- **Alerts**: Sends notifications if performance thresholds exceeded
- **Output**: Performance baseline files and trend analysis

### 🏥 Health Check (`azure-health-check.yml`)
- **Schedule**: Every 4 hours  
- **Purpose**: Monitors resource health and connectivity
- **Alerts**: Immediate notification if any service is unhealthy
- **Output**: Comprehensive health reports

### 💰 Cost Analysis (Manual script)
- **Schedule**: Run manually monthly
- **Purpose**: Tracks spending against $18/month budget
- **Alerts**: Warns when approaching budget limits
- **Output**: Cost optimization recommendations

## 🛠️ Troubleshooting

### Common Issues

1. **Authentication Fails**
   ```
   Error: AADSTS700016: Application with identifier 'xxx' was not found
   ```
   **Solution**: Verify the service principal exists and clientId is correct

2. **Permission Denied**
   ```
   Error: Insufficient privileges to complete the operation
   ```
   **Solution**: Add required roles to service principal (see Step 2)

3. **Subscription Not Found**
   ```
   Error: The subscription 'xxx' could not be found
   ```
   **Solution**: Verify subscription ID in AZURE_CREDENTIALS

### Debugging Commands

```bash
# Test service principal authentication locally
az login --service-principal \
  --username 2669d57d-dacd-41f6-a897-50edb2ca6c04 \
  --password YOUR_SECRET \
  --tenant 1018280e-f485-43e4-911a-b1140fcd1f1f

# Check permissions
az role assignment list --assignee 2669d57d-dacd-41f6-a897-50edb2ca6c04

# Test resource access
az group show --name kitchen-pantry-crm-rg
az webapp show --name kitchen-pantry-crm --resource-group kitchen-pantry-crm-rg
```

## 🚀 Next Steps

1. **Set up GitHub secrets** following Step 1
2. **Verify permissions** using Step 2 commands
3. **Run test workflow** to validate setup
4. **Enable automatic monitoring** by merging the workflow files
5. **Configure notification webhooks** (optional)

## 📞 Support

If you encounter issues:

1. **Check GitHub Actions logs** for detailed error messages
2. **Verify Azure CLI access** using the debugging commands above
3. **Review service principal roles** in Azure Portal
4. **Test authentication locally** before troubleshooting workflows

---

**🔒 Security Note**: Never commit secrets to Git. Always use GitHub repository secrets for sensitive information.