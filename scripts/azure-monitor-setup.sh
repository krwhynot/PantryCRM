#!/bin/bash

# Azure Monitor Setup Script for PantryCRM
# Sets up alerts based on existing B1 optimization thresholds

# Configuration variables
RESOURCE_GROUP="your-resource-group"
APP_SERVICE_NAME="your-app-service-name"
SQL_SERVER_NAME="your-sql-server-name"
SQL_DATABASE_NAME="pantry-crm"
SUBSCRIPTION_ID="your-subscription-id"
ACTION_GROUP_NAME="pantry-crm-alerts"
EMAIL_ADDRESS="admin@yourcompany.com"

echo "Setting up Azure Monitor alerts for PantryCRM..."

# Create Action Group for notifications
echo "Creating action group..."
az monitor action-group create \
  --name $ACTION_GROUP_NAME \
  --resource-group $RESOURCE_GROUP \
  --short-name "PantryCRM" \
  --email-receivers name="Admin" email=$EMAIL_ADDRESS

# Get App Service resource ID
APP_SERVICE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME"

# Memory usage alert (80% threshold matching azure-b1-optimizations.ts:126)
echo "Creating memory usage alert..."
az monitor metrics alert create \
  --name "B1-Memory-Usage-High" \
  --resource-group $RESOURCE_GROUP \
  --scopes $APP_SERVICE_ID \
  --condition "avg MemoryPercentage > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action $ACTION_GROUP_NAME \
  --description "Memory usage exceeds 80% threshold (B1 optimization limit)"

# CPU usage alert
echo "Creating CPU usage alert..."
az monitor metrics alert create \
  --name "B1-CPU-Usage-High" \
  --resource-group $RESOURCE_GROUP \
  --scopes $APP_SERVICE_ID \
  --condition "avg CpuPercentage > 85" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action $ACTION_GROUP_NAME \
  --description "CPU usage exceeds 85% threshold"

# HTTP response time alert (matching 30s timeout in azure-b1-optimizations.ts:130)
echo "Creating response time alert..."
az monitor metrics alert create \
  --name "B1-Response-Time-High" \
  --resource-group $RESOURCE_GROUP \
  --scopes $APP_SERVICE_ID \
  --condition "avg HttpResponseTime > 25000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action $ACTION_GROUP_NAME \
  --description "HTTP response time exceeds 25 seconds"

# HTTP error rate alert
echo "Creating error rate alert..."
az monitor metrics alert create \
  --name "B1-Error-Rate-High" \
  --resource-group $RESOURCE_GROUP \
  --scopes $APP_SERVICE_ID \
  --condition "avg Http5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action $ACTION_GROUP_NAME \
  --description "HTTP 5xx error count exceeds 5 per 5-minute window"

# Get SQL Database resource ID
SQL_DB_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER_NAME/databases/$SQL_DATABASE_NAME"

# DTU usage alert (80% of 5 DTU limit from AZURE_SQL_CONFIGURATION.md:123)
echo "Creating DTU usage alert..."
az monitor metrics alert create \
  --name "SQL-DTU-Usage-High" \
  --resource-group $RESOURCE_GROUP \
  --scopes $SQL_DB_ID \
  --condition "avg dtu_consumption_percent > 80" \
  --window-size 15m \
  --evaluation-frequency 5m \
  --action $ACTION_GROUP_NAME \
  --description "DTU utilization exceeds 80% for Azure SQL Basic (5 DTU limit)"

# Database size alert (90% of 2GB limit from AZURE_SQL_CONFIGURATION.md:124)
echo "Creating database size alert..."
az monitor metrics alert create \
  --name "SQL-Database-Size-High" \
  --resource-group $RESOURCE_GROUP \
  --scopes $SQL_DB_ID \
  --condition "avg storage_percent > 90" \
  --window-size 30m \
  --evaluation-frequency 15m \
  --action $ACTION_GROUP_NAME \
  --description "Database size exceeds 90% of 2GB limit"

# Connection count alert (based on 30 max connections from AZURE_SQL_CONFIGURATION.md:13)
echo "Creating connection count alert..."
az monitor metrics alert create \
  --name "SQL-Connection-Count-High" \
  --resource-group $RESOURCE_GROUP \
  --scopes $SQL_DB_ID \
  --condition "avg connection_successful > 25" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action $ACTION_GROUP_NAME \
  --description "Active connections exceed 25 (approaching 30 connection limit)"

echo "Azure Monitor alerts setup completed!"
echo ""
echo "Created alerts:"
echo "- B1-Memory-Usage-High (>80%)"
echo "- B1-CPU-Usage-High (>85%)"
echo "- B1-Response-Time-High (>25s)"
echo "- B1-Error-Rate-High (>5 errors/5min)"
echo "- SQL-DTU-Usage-High (>80%)"
echo "- SQL-Database-Size-High (>90%)"
echo "- SQL-Connection-Count-High (>25)"
echo ""
echo "Action group '$ACTION_GROUP_NAME' will send notifications to: $EMAIL_ADDRESS"
echo ""
echo "To view alerts: az monitor metrics alert list --resource-group $RESOURCE_GROUP"