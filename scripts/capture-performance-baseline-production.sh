#!/bin/bash
# Production Performance Baseline Script for PantryCRM
# Uses exact resource names discovered from Azure Portal
# Run with Cloud Shell or after proper Azure CLI authentication

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
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Capturing performance baseline for PantryCRM Production - $TIMESTAMP${NC}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 completed successfully${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        return 1
    fi
}

# Verify Azure authentication
echo "🔐 Verifying Azure CLI authentication..."
az account show --query "{subscription:name,id:id}" --output table
check_command "Azure authentication check"

# Set subscription context
echo "📋 Setting subscription context..."
az account set --subscription "$SUBSCRIPTION_ID"
check_command "Subscription context set"

# Verify resources exist
echo "🔍 Verifying resources exist..."
az group show --name "$RESOURCE_GROUP" --query "name" --output tsv > /dev/null
check_command "Resource group verification"

# 1. Application Insights App ID discovery
echo "🎯 Getting Application Insights App ID..."
APP_INSIGHTS_ID=$(az monitor app-insights component show \
  --app "$APP_INSIGHTS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "appId" \
  --output tsv 2>/dev/null)

if [ ! -z "$APP_INSIGHTS_ID" ]; then
    echo -e "${GREEN}📊 Application Insights ID: $APP_INSIGHTS_ID${NC}"
    
    # Capture Application Insights metrics
    echo "📈 Capturing Application Insights metrics..."
    az monitor app-insights metrics show \
      --app "$APP_INSIGHTS_ID" \
      --resource-group "$RESOURCE_GROUP" \
      --metrics "requests/count,requests/duration,exceptions/count,pageViews/count" \
      --interval PT1H \
      --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
      --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      --output json > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json" 2>/dev/null
    check_command "Application Insights metrics capture"
else
    echo -e "${YELLOW}⚠️ Could not get Application Insights App ID${NC}"
    echo '{"error": "Application Insights App ID not accessible"}' > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json"
fi

# 2. App Service metrics
echo "🌐 Capturing App Service performance metrics..."
APP_SERVICE_RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME"

az monitor metrics list \
  --resource "$APP_SERVICE_RESOURCE_ID" \
  --metric "CpuTime,MemoryWorkingSet,HttpResponseTime,Http5xx,Http4xx,Requests" \
  --interval PT1H \
  --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output json > "$OUTPUT_DIR/app-service-metrics-$TIMESTAMP.json" 2>/dev/null
check_command "App Service metrics capture"

# 3. SQL Database metrics
echo "🗄️ Capturing SQL Database performance metrics..."
SQL_RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER_NAME/databases/$SQL_DB_NAME"

az monitor metrics list \
  --resource "$SQL_RESOURCE_ID" \
  --metric "dtu_consumption_percent,cpu_percent,storage_percent,connection_successful,connection_failed" \
  --interval PT1H \
  --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output json > "$OUTPUT_DIR/sql-metrics-$TIMESTAMP.json" 2>/dev/null
check_command "SQL Database metrics capture"

# 4. Resource health and configuration
echo "🔧 Capturing resource configuration..."
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
echo "⚙️ Capturing App Service configuration..."
az webapp config show \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output json > "$OUTPUT_DIR/app-service-config-$TIMESTAMP.json" 2>/dev/null
check_command "App Service configuration capture"

# 6. SQL Database service tier details
echo "💾 Capturing SQL Database configuration..."
az sql db show \
  --name "$SQL_DB_NAME" \
  --server "$SQL_SERVER_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "{name:name,status:status,serviceObjective:currentServiceObjectiveName,maxSizeBytes:maxSizeBytes,collation:collation}" \
  --output json > "$OUTPUT_DIR/sql-config-$TIMESTAMP.json" 2>/dev/null
check_command "SQL Database configuration capture"

# 7. Create consolidated baseline file
echo "📋 Creating consolidated performance baseline..."
cat > "$OUTPUT_DIR/perf-baseline-$TIMESTAMP.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "subscription": "KR-Azure ($SUBSCRIPTION_ID)",
  "resourceGroup": "$RESOURCE_GROUP",
  "baselineComponents": [
    {
      "name": "AppInsightsMetrics",
      "description": "Application performance and usage metrics",
      "path": "app-insights-metrics-$TIMESTAMP.json"
    },
    {
      "name": "AppServiceMetrics", 
      "description": "Web app resource utilization metrics",
      "path": "app-service-metrics-$TIMESTAMP.json"
    },
    {
      "name": "SqlDatabaseMetrics",
      "description": "Database performance and DTU consumption",
      "path": "sql-metrics-$TIMESTAMP.json"
    },
    {
      "name": "ResourceConfiguration",
      "description": "Current resource configuration snapshot",
      "path": "resource-config-$TIMESTAMP.json"
    },
    {
      "name": "AppServiceConfig",
      "description": "Detailed App Service configuration",
      "path": "app-service-config-$TIMESTAMP.json"
    },
    {
      "name": "SqlDatabaseConfig",
      "description": "SQL Database service tier and settings",
      "path": "sql-config-$TIMESTAMP.json"
    }
  ],
  "summary": {
    "appService": "kitchen-pantry-crm.azurewebsites.net",
    "sqlDatabase": "Basic tier, 5 DTU",
    "applicationInsights": "Enabled",
    "location": "Central US"
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
echo ""
echo -e "${YELLOW}💡 Use this baseline for performance regression testing and monitoring.${NC}"
echo -e "${YELLOW}🔄 Run this script regularly to track performance trends over time.${NC}"