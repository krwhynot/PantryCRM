#!/bin/bash
# Azure Monitoring Setup Script for PantryCRM
# Creates essential metric alerts and configures monitoring resources
# Run using: az login && bash azure-monitoring-setup.sh

# Set variables (customize as needed)
RESOURCE_GROUP="pantry-crm-prod"
APP_SERVICE_NAME="pantry-crm-prod-app"
SQL_SERVER_NAME="pantry-crm-prod-sql"
SQL_DB_NAME="pantry-crm-db"
STORAGE_ACCOUNT_NAME="pantrycrmprodstorage"

# Create action group for alerts if it doesn't exist
echo "Creating alert action group..."
az monitor action-group create \
  --resource-group $RESOURCE_GROUP \
  --name "pantry-alerts" \
  --short-name "PantryAlrt" \
  --email-receiver name=admin email=admin@pantrycrm.com

# 1. App Service CPU Alert (>80% for 5 minutes)
echo "Creating App Service CPU alert rule..."
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "High-CPU-B1" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME" \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 5m \
  --description "Alert when B1 App Service CPU exceeds 80% for 5 minutes" \
  --auto-mitigate true \
  --action-group "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/actiongroups/pantry-alerts"

# 2. App Service Memory Alert (>80% for 5 minutes)
echo "Creating App Service Memory alert rule..."
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "High-Memory-B1" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME" \
  --condition "avg MemoryPercentage > 80" \
  --window-size 5m \
  --evaluation-frequency 5m \
  --description "Alert when B1 App Service Memory exceeds 80% for 5 minutes" \
  --auto-mitigate true \
  --action-group "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/actiongroups/pantry-alerts"

# 3. SQL Database DTU Alert (>90% for 5 minutes)
echo "Creating SQL DTU alert rule..."
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "SQL-DTU-Limit" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER_NAME/databases/$SQL_DB_NAME" \
  --condition "avg dtu_consumption_percent > 90" \
  --window-size 5m \
  --evaluation-frequency 5m \
  --description "Alert when SQL Basic tier DTU consumption exceeds 90% for 5 minutes" \
  --auto-mitigate true \
  --action-group "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/actiongroups/pantry-alerts"

# 4. HTTP 5xx Errors Alert (>5 in 5 minutes)
echo "Creating HTTP 5xx errors alert rule..."
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "HTTP-5xx-Errors" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME" \
  --condition "count Http5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 5m \
  --description "Alert when more than 5 HTTP 5xx errors occur in 5 minutes" \
  --auto-mitigate true \
  --action-group "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/actiongroups/pantry-alerts"

# 5. Create availability test for the main app
echo "Creating App Service availability test..."
az monitor app-insights web-test create \
  --resource-group $RESOURCE_GROUP \
  --app pantry-insights \
  --location eastus \
  --name "pantry-crm-availability" \
  --web-test-kind ping \
  --web-test-name "PantryCRM-Availability" \
  --test-url "https://$APP_SERVICE_NAME.azurewebsites.net/" \
  --frequency 300 \
  --retry-enabled true \
  --locations eastus westus

# Configure Application Insights to gather performance data
echo "Configuring Application Insights for performance monitoring..."
az monitor app-insights component update \
  --resource-group $RESOURCE_GROUP \
  --app pantry-insights \
  --sampling-percentage 10

echo "Monitoring setup complete! Verify alerts in Azure Portal."
