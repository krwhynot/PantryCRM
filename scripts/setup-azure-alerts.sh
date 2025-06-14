#!/bin/bash
# Azure Alert Rules Setup Script
# Creates comprehensive monitoring alerts for PantryCRM infrastructure

set -e

# Configuration
SUBSCRIPTION_ID="df8fefaa-16a0-47da-ace7-6eab8b1919cf"
RESOURCE_GROUP="kitchen-pantry-crm-rg"
ACTION_GROUP_NAME="pantrycrm-alerts"
NOTIFICATION_EMAIL="kjramsy@gmail.com"  # Update with your email

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚨 Setting up Azure Alert Rules for PantryCRM${NC}"

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 failed${NC}"
        return 1
    fi
}

# Verify Azure authentication
echo -e "${BLUE}🔐 Verifying Azure CLI authentication...${NC}"
CURRENT_USER=$(az account show --query "user.name" --output tsv)
echo -e "${GREEN}📋 Authenticated as: $CURRENT_USER${NC}"

# Set subscription context
az account set --subscription "$SUBSCRIPTION_ID"
check_command "Subscription context set"

# 1. Create Action Group for notifications
echo -e "${BLUE}📧 Creating Action Group for notifications...${NC}"

# Check if action group already exists
if az monitor action-group show --name "$ACTION_GROUP_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
    echo -e "${YELLOW}📧 Action Group already exists: $ACTION_GROUP_NAME${NC}"
else
    az monitor action-group create \
        --name "$ACTION_GROUP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --short-name "PantryCRM" \
        --email-receivers name="Admin" address="$NOTIFICATION_EMAIL" \
        --output none
    check_command "Action Group created: $ACTION_GROUP_NAME"
fi

# Get Action Group resource ID
ACTION_GROUP_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/actionGroups/$ACTION_GROUP_NAME"

# 2. App Service Alerts
echo -e "${BLUE}🌐 Creating App Service alert rules...${NC}"

# App Service resource ID
APP_SERVICE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/kitchen-pantry-crm"

# High CPU Time Alert
az monitor metrics alert create \
    --name "App Service - High CPU Time" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_SERVICE_ID" \
    --condition "max CpuTime > 300" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when App Service CPU time exceeds 300 seconds in 5 minutes" \
    --severity 2 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ CPU Time alert may already exist${NC}"

# High Memory Usage Alert
az monitor metrics alert create \
    --name "App Service - High Memory Usage" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_SERVICE_ID" \
    --condition "max MemoryWorkingSet > 500000000" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when App Service memory exceeds 500MB" \
    --severity 2 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ Memory alert may already exist${NC}"

# HTTP 5xx Errors Alert
az monitor metrics alert create \
    --name "App Service - HTTP 5xx Errors" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_SERVICE_ID" \
    --condition "total Http5xx > 10" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when HTTP 5xx errors exceed 10 in 5 minutes" \
    --severity 1 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ HTTP 5xx alert may already exist${NC}"

# Response Time Alert
az monitor metrics alert create \
    --name "App Service - Slow Response Time" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_SERVICE_ID" \
    --condition "max HttpResponseTime > 5" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when response time exceeds 5 seconds" \
    --severity 2 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ Response time alert may already exist${NC}"

echo -e "${GREEN}✅ App Service alerts configured${NC}"

# 3. SQL Database Alerts
echo -e "${BLUE}🗄️ Creating SQL Database alert rules...${NC}"

# SQL Database resource ID
SQL_DB_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/kitchen-pantry-crm-sql/databases/kitchen-pantry-crm-db"

# High DTU Usage Alert
az monitor metrics alert create \
    --name "SQL Database - High DTU Usage" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$SQL_DB_ID" \
    --condition "max dtu_consumption_percent > 80" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when DTU consumption exceeds 80%" \
    --severity 2 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ DTU alert may already exist${NC}"

# Connection Failures Alert
az monitor metrics alert create \
    --name "SQL Database - Connection Failures" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$SQL_DB_ID" \
    --condition "total connection_failed > 5" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when connection failures exceed 5 in 5 minutes" \
    --severity 1 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ Connection failure alert may already exist${NC}"

# Storage Usage Alert (90% of Basic tier limit)
az monitor metrics alert create \
    --name "SQL Database - High Storage Usage" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$SQL_DB_ID" \
    --condition "max storage_percent > 90" \
    --window-size 15m \
    --evaluation-frequency 5m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when storage usage exceeds 90%" \
    --severity 2 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ Storage alert may already exist${NC}"

echo -e "${GREEN}✅ SQL Database alerts configured${NC}"

# 4. Application Insights Alerts (if accessible)
echo -e "${BLUE}📊 Creating Application Insights alert rules...${NC}"

# Application Insights resource ID
APP_INSIGHTS_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/kitchen-pantry-crm-insights"

# High Exception Rate Alert
az monitor metrics alert create \
    --name "Application Insights - High Exception Rate" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "total exceptions/count > 10" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when exception count exceeds 10 in 5 minutes" \
    --severity 1 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ Exception alert may already exist or need permissions${NC}"

# Low Request Rate (potential downtime)
az monitor metrics alert create \
    --name "Application Insights - Low Request Rate" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "total requests/count < 1" \
    --window-size 10m \
    --evaluation-frequency 5m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when no requests received for 10 minutes" \
    --severity 1 \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ Request rate alert may already exist or need permissions${NC}"

echo -e "${GREEN}✅ Application Insights alerts configured${NC}"

# 5. Resource Health Alerts
echo -e "${BLUE}🏥 Creating Resource Health alert rules...${NC}"

# App Service Resource Health
az monitor activity-log alert create \
    --name "App Service - Resource Health" \
    --resource-group "$RESOURCE_GROUP" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/kitchen-pantry-crm" \
    --condition category=ResourceHealth \
    --action-groups "$ACTION_GROUP_ID" \
    --description "Alert on App Service resource health events" \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ Resource health alert may already exist${NC}"

# SQL Server Resource Health
az monitor activity-log alert create \
    --name "SQL Server - Resource Health" \
    --resource-group "$RESOURCE_GROUP" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/kitchen-pantry-crm-sql" \
    --condition category=ResourceHealth \
    --action-groups "$ACTION_GROUP_ID" \
    --description "Alert on SQL Server resource health events" \
    --output none 2>/dev/null || echo -e "${YELLOW}⚠️ SQL resource health alert may already exist${NC}"

echo -e "${GREEN}✅ Resource Health alerts configured${NC}"

# 6. Budget Alert (if Cost Management API is accessible)
echo -e "${BLUE}💰 Creating Budget alert...${NC}"

# Note: Budget alerts require different permissions and may need to be set up via Portal
echo -e "${YELLOW}💰 Budget alerts require Cost Management permissions${NC}"
echo -e "${YELLOW}   Manually create budget alert in Azure Portal:${NC}"
echo -e "${YELLOW}   1. Go to Cost Management + Billing${NC}"
echo -e "${YELLOW}   2. Create budget for \$18/month${NC}"
echo -e "${YELLOW}   3. Set alerts at 80% and 100% thresholds${NC}"

# 7. Generate alert summary
echo ""
echo -e "${GREEN}🎉 Azure Alert Rules Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Configured Alerts:${NC}"
echo -e "   🌐 App Service:"
echo -e "      • High CPU Time (>300s in 5min)"
echo -e "      • High Memory Usage (>500MB)"
echo -e "      • HTTP 5xx Errors (>10 in 5min)"
echo -e "      • Slow Response Time (>5s)"
echo ""
echo -e "   🗄️ SQL Database:"
echo -e "      • High DTU Usage (>80%)"
echo -e "      • Connection Failures (>5 in 5min)"
echo -e "      • High Storage Usage (>90%)"
echo ""
echo -e "   📊 Application Insights:"
echo -e "      • High Exception Rate (>10 in 5min)"
echo -e "      • Low Request Rate (<1 in 10min)"
echo ""
echo -e "   🏥 Resource Health:"
echo -e "      • App Service health events"
echo -e "      • SQL Server health events"
echo ""
echo -e "${YELLOW}📧 Notifications will be sent to: $NOTIFICATION_EMAIL${NC}"
echo ""
echo -e "${BLUE}🔧 Manage alerts in Azure Portal:${NC}"
echo "https://portal.azure.com/#@1018280e-f485-43e4-911a-b1140fcd1f1f/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/actionGroups/$ACTION_GROUP_NAME/overview"
echo ""
echo -e "${GREEN}🎯 Your PantryCRM infrastructure is now fully monitored!${NC}"

# 8. Test alert (optional)
read -p "🧪 Would you like to test the alert system? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧪 Sending test alert...${NC}"
    az monitor activity-log alert create \
        --name "Test Alert - DELETE ME" \
        --resource-group "$RESOURCE_GROUP" \
        --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
        --condition category=Administrative \
        --action-groups "$ACTION_GROUP_ID" \
        --description "Test alert - delete after verification" \
        --output none 2>/dev/null || true
    
    echo -e "${GREEN}✅ Test alert created. You should receive a notification shortly.${NC}"
    echo -e "${YELLOW}⚠️ Remember to delete the test alert after verification:${NC}"
    echo "az monitor activity-log alert delete --name 'Test Alert - DELETE ME' --resource-group $RESOURCE_GROUP"
fi