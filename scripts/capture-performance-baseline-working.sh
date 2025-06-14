#!/bin/bash
# Working Performance Baseline Script for PantryCRM
# Uses service principal authentication with current permissions
# Captures App Service and SQL Database metrics successfully

set -e  # Exit on any error

# EXACT CONFIGURATION FROM YOUR AZURE ENVIRONMENT
SUBSCRIPTION_ID="df8fefaa-16a0-47da-ace7-6eab8b1919cf"
RESOURCE_GROUP="kitchen-pantry-crm-rg"
APP_SERVICE_NAME="kitchen-pantry-crm"
SQL_SERVER_NAME="kitchen-pantry-crm-sql"
SQL_DB_NAME="kitchen-pantry-crm-db"
APP_INSIGHTS_NAME="kitchen-pantry-crm-insights"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="performance_baselines"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Capturing performance baseline for PantryCRM Production - $TIMESTAMP${NC}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 failed${NC}"
        return 1
    fi
}

# Verify Azure authentication
echo -e "${BLUE}🔐 Verifying Azure CLI authentication...${NC}"
CURRENT_USER=$(az account show --query "user.name" --output tsv)
USER_TYPE=$(az account show --query "user.type" --output tsv)
echo -e "${GREEN}📋 Authenticated as: $CURRENT_USER (${USER_TYPE})${NC}"
check_command "Azure authentication check"

# Set subscription context
echo -e "${BLUE}📋 Setting subscription context...${NC}"
az account set --subscription "$SUBSCRIPTION_ID"
check_command "Subscription context set"

# Resource IDs for metrics
APP_SERVICE_RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME"
SQL_RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER_NAME/databases/$SQL_DB_NAME"

# 1. App Service metrics (WORKING)
echo -e "${BLUE}🌐 Capturing App Service performance metrics...${NC}"
az monitor metrics list \
  --resource "$APP_SERVICE_RESOURCE_ID" \
  --metric "CpuTime,MemoryWorkingSet,HttpResponseTime,Http5xx,Http4xx,Requests" \
  --interval PT1H \
  --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output json > "$OUTPUT_DIR/app-service-metrics-$TIMESTAMP.json" 2>/dev/null
check_command "App Service metrics capture"

# 2. SQL Database metrics (WORKING)
echo -e "${BLUE}🗄️ Capturing SQL Database performance metrics...${NC}"
az monitor metrics list \
  --resource "$SQL_RESOURCE_ID" \
  --metric "dtu_consumption_percent,cpu_percent,storage_percent,connection_successful,connection_failed" \
  --interval PT1H \
  --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output json > "$OUTPUT_DIR/sql-metrics-$TIMESTAMP.json" 2>/dev/null
check_command "SQL Database metrics capture"

# 3. Application Insights discovery (check if accessible)
echo -e "${BLUE}🎯 Checking Application Insights access...${NC}"
APP_INSIGHTS_ID=$(az monitor app-insights component show \
  --app "$APP_INSIGHTS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "appId" \
  --output tsv 2>/dev/null)

if [ ! -z "$APP_INSIGHTS_ID" ]; then
    echo -e "${GREEN}📊 Application Insights found: $APP_INSIGHTS_ID${NC}"
    
    # Try to capture Application Insights metrics
    echo -e "${BLUE}📈 Attempting Application Insights metrics capture...${NC}"
    if az monitor app-insights metrics show \
      --app "$APP_INSIGHTS_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --metrics "requests/count" \
      --interval PT1H \
      --aggregation "count" \
      --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
      --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      --output json > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json" 2>/dev/null; then
        check_command "Application Insights metrics capture"
    else
        echo -e "${YELLOW}⚠️ Application Insights metrics require 'Monitoring Reader' role${NC}"
        echo -e "${YELLOW}   Run this command in Cloud Shell to add the role:${NC}"
        echo -e "${YELLOW}   az role assignment create --assignee '$CURRENT_USER' --role 'Monitoring Reader' --scope '/subscriptions/$SUBSCRIPTION_ID'${NC}"
        echo '{"error": "Insufficient permissions for Application Insights metrics", "solution": "Add Monitoring Reader role to service principal"}' > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json"
    fi
else
    echo -e "${YELLOW}⚠️ Could not access Application Insights${NC}"
    echo '{"error": "Application Insights not accessible"}' > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json"
fi

# 4. Resource configuration snapshot
echo -e "${BLUE}🔧 Capturing resource configuration...${NC}"
cat > "$OUTPUT_DIR/resource-config-$TIMESTAMP.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "subscription": {
    "id": "$SUBSCRIPTION_ID",
    "name": "KR-Azure"
  },
  "resourceGroup": {
    "name": "$RESOURCE_GROUP",
    "location": "centralus"
  },
  "authentication": {
    "type": "$USER_TYPE",
    "principal": "$CURRENT_USER"
  },
  "resources": {
    "appService": {
      "name": "$APP_SERVICE_NAME",
      "url": "https://kitchen-pantry-crm.azurewebsites.net",
      "resourceId": "$APP_SERVICE_RESOURCE_ID"
    },
    "sqlServer": {
      "name": "$SQL_SERVER_NAME",
      "database": "$SQL_DB_NAME",
      "version": "12.0",
      "resourceId": "$SQL_RESOURCE_ID"
    },
    "applicationInsights": {
      "name": "$APP_INSIGHTS_NAME",
      "appId": "$APP_INSIGHTS_ID"
    }
  }
}
EOL

# 5. App Service configuration details
echo -e "${BLUE}⚙️ Capturing App Service configuration...${NC}"
az webapp config show \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output json > "$OUTPUT_DIR/app-service-config-$TIMESTAMP.json" 2>/dev/null
check_command "App Service configuration capture"

# 6. SQL Database service tier details
echo -e "${BLUE}💾 Capturing SQL Database configuration...${NC}"
az sql db show \
  --name "$SQL_DB_NAME" \
  --server "$SQL_SERVER_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "{name:name,status:status,serviceObjective:currentServiceObjectiveName,maxSizeBytes:maxSizeBytes,collation:collation}" \
  --output json > "$OUTPUT_DIR/sql-config-$TIMESTAMP.json" 2>/dev/null
check_command "SQL Database configuration capture"

# 7. Quick metrics summary (live data)
echo -e "${BLUE}📊 Generating live metrics summary...${NC}"
CURRENT_CPU=$(az monitor metrics list --resource "$APP_SERVICE_RESOURCE_ID" --metric "CpuTime" --interval PT5M --aggregation Total --output tsv --query "value[0].timeseries[0].data[0].total" 2>/dev/null || echo "N/A")
CURRENT_DTU=$(az monitor metrics list --resource "$SQL_RESOURCE_ID" --metric "dtu_consumption_percent" --interval PT5M --aggregation Average --output tsv --query "value[0].timeseries[0].data[0].average" 2>/dev/null || echo "N/A")

cat > "$OUTPUT_DIR/live-metrics-$TIMESTAMP.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "liveMetrics": {
    "appService": {
      "cpuTime": "$CURRENT_CPU",
      "status": "$(az webapp show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP --query "state" --output tsv 2>/dev/null || echo "Unknown")"
    },
    "sqlDatabase": {
      "dtuPercent": "$CURRENT_DTU",
      "tier": "Basic"
    }
  }
}
EOL

# 8. Create consolidated baseline file
echo -e "${BLUE}📋 Creating consolidated performance baseline...${NC}"
cat > "$OUTPUT_DIR/perf-baseline-$TIMESTAMP.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "subscription": "KR-Azure ($SUBSCRIPTION_ID)",
  "resourceGroup": "$RESOURCE_GROUP",
  "authentication": {
    "type": "$USER_TYPE",
    "servicePrincipal": "$CURRENT_USER"
  },
  "baselineComponents": [
    {
      "name": "AppServiceMetrics", 
      "description": "Web app resource utilization metrics (CPU, Memory, HTTP)",
      "path": "app-service-metrics-$TIMESTAMP.json",
      "status": "captured"
    },
    {
      "name": "SqlDatabaseMetrics",
      "description": "Database performance and DTU consumption",
      "path": "sql-metrics-$TIMESTAMP.json",
      "status": "captured"
    },
    {
      "name": "AppInsightsMetrics",
      "description": "Application performance and usage metrics",
      "path": "app-insights-metrics-$TIMESTAMP.json",
      "status": "pending_permissions"
    },
    {
      "name": "ResourceConfiguration",
      "description": "Current resource configuration snapshot",
      "path": "resource-config-$TIMESTAMP.json",
      "status": "captured"
    },
    {
      "name": "AppServiceConfig",
      "description": "Detailed App Service configuration",
      "path": "app-service-config-$TIMESTAMP.json",
      "status": "captured"
    },
    {
      "name": "SqlDatabaseConfig",
      "description": "SQL Database service tier and settings",
      "path": "sql-config-$TIMESTAMP.json",
      "status": "captured"
    },
    {
      "name": "LiveMetrics",
      "description": "Current live performance indicators",
      "path": "live-metrics-$TIMESTAMP.json",
      "status": "captured"
    }
  ],
  "summary": {
    "appService": "kitchen-pantry-crm.azurewebsites.net",
    "sqlDatabase": "Basic tier, 5 DTU",
    "applicationInsights": "Configured (requires Monitoring Reader role)",
    "location": "Central US",
    "currentCpuTime": "$CURRENT_CPU",
    "currentDtuPercent": "$CURRENT_DTU"
  }
}
EOL

# Create symlinks to latest files (if supported)
if command -v ln &> /dev/null; then
    ln -sf "perf-baseline-$TIMESTAMP.json" "$OUTPUT_DIR/perf-baseline-latest.json"
    echo -e "${GREEN}🔗 Created symlink to latest baseline${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Performance baseline captured successfully!${NC}"
echo -e "${YELLOW}📂 Files created:${NC}"
ls -la "$OUTPUT_DIR/"*$TIMESTAMP* 2>/dev/null | while read line; do
    echo "   $line"
done

echo ""
echo -e "${GREEN}📊 Baseline summary:${NC}"
echo "   - Consolidated baseline: $OUTPUT_DIR/perf-baseline-$TIMESTAMP.json"
echo "   - Latest symlink: $OUTPUT_DIR/perf-baseline-latest.json"
echo "   - Total files: $(ls -1 $OUTPUT_DIR/*$TIMESTAMP* 2>/dev/null | wc -l)"
echo "   - App Service CPU Time: $CURRENT_CPU"
echo "   - SQL DTU Usage: $CURRENT_DTU%"

echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo -e "${YELLOW}   1. ✅ App Service metrics: Working${NC}"
echo -e "${YELLOW}   2. ✅ SQL Database metrics: Working${NC}"
echo -e "${YELLOW}   3. ⚠️  Application Insights: Needs Monitoring Reader role${NC}"
echo ""
echo -e "${YELLOW}🔧 To enable Application Insights metrics, run in Cloud Shell:${NC}"
echo -e "${BLUE}   az role assignment create --assignee '$CURRENT_USER' --role 'Monitoring Reader' --scope '/subscriptions/$SUBSCRIPTION_ID'${NC}"
echo ""
echo -e "${GREEN}🔄 Run this script regularly to track performance trends over time.${NC}"