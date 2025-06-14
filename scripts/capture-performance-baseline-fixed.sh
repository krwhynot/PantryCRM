#!/bin/bash
# Fixed Performance Baseline Capture Script for PantryCRM
# Creates a comprehensive snapshot of current performance metrics
# Run with: az login && bash capture-performance-baseline-fixed.sh

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP="kitchen-pantry-crm-rg"
APP_SERVICE_NAME="kitchen-pantry-crm"
SQL_SERVER_NAME="kitchen-pantry-crm-sql"
SQL_DB_NAME="kitchen-pantry-crm-db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="performance_baselines"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Capturing performance baseline for PantryCRM - $TIMESTAMP${NC}"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to check if command succeeded
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Verify Azure CLI login
echo "Verifying Azure CLI authentication..."
az account show --query "{subscription:name,id:id}" --output table
check_command "Azure authentication check"

# Discover actual resource group name
echo "Discovering resource group..."
ACTUAL_RG=$(az group list --query "[?contains(name, 'pantry') || contains(name, 'crm')].name" --output tsv | head -1)
if [ -z "$ACTUAL_RG" ]; then
    echo -e "${YELLOW}Warning: Could not find resource group with 'pantry' or 'crm'. Using configured name: $RESOURCE_GROUP${NC}"
    ACTUAL_RG="$RESOURCE_GROUP"
else
    echo -e "${GREEN}Found resource group: $ACTUAL_RG${NC}"
    RESOURCE_GROUP="$ACTUAL_RG"
fi

# Discover Application Insights resource
echo "Discovering Application Insights resource..."
APP_INSIGHTS_NAME=$(az monitor app-insights component list --resource-group "$RESOURCE_GROUP" --query "[0].name" --output tsv 2>/dev/null)
if [ -z "$APP_INSIGHTS_NAME" ]; then
    echo -e "${YELLOW}Warning: No Application Insights found in $RESOURCE_GROUP${NC}"
    echo "Available resources in resource group:"
    az resource list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Type:type}" --output table
else
    echo -e "${GREEN}Found Application Insights: $APP_INSIGHTS_NAME${NC}"
    
    # Get App ID for metrics
    APP_INSIGHTS_ID=$(az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" --query "appId" --output tsv)
    echo -e "${GREEN}Application Insights ID: $APP_INSIGHTS_ID${NC}"
fi

# 1. Application Insights metrics (only if found)
if [ ! -z "$APP_INSIGHTS_NAME" ] && [ ! -z "$APP_INSIGHTS_ID" ]; then
    echo "Capturing Application Insights metrics..."
    az monitor app-insights metrics show \
      --app "$APP_INSIGHTS_ID" \
      --resource-group "$RESOURCE_GROUP" \
      --metrics "requests/count" \
      --interval PT1H \
      --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)" \
      --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      --output json > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json" 2>/dev/null
    check_command "Application Insights metrics capture"
else
    echo -e "${YELLOW}Skipping Application Insights metrics - resource not found${NC}"
    echo '{"error": "Application Insights not found"}' > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json"
fi

# 2. App Service metrics
echo "Capturing App Service performance metrics..."
APP_SERVICE_RESOURCE_ID="/subscriptions/$(az account show --query id --output tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME"

az monitor metrics list \
  --resource "$APP_SERVICE_RESOURCE_ID" \
  --metric "CpuTime,MemoryWorkingSet,HttpResponseTime,Http5xx" \
  --interval PT1H \
  --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output json > "$OUTPUT_DIR/app-service-metrics-$TIMESTAMP.json" 2>/dev/null
check_command "App Service metrics capture"

# 3. SQL Database metrics
echo "Capturing SQL Database performance metrics..."
SQL_RESOURCE_ID="/subscriptions/$(az account show --query id --output tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER_NAME/databases/$SQL_DB_NAME"

az monitor metrics list \
  --resource "$SQL_RESOURCE_ID" \
  --metric "dtu_consumption_percent,cpu_percent,storage_percent" \
  --interval PT1H \
  --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output json > "$OUTPUT_DIR/sql-metrics-$TIMESTAMP.json" 2>/dev/null
check_command "SQL Database metrics capture"

# 4. Resource utilization summary
echo "Generating resource utilization summary..."
cat > "$OUTPUT_DIR/resource-summary-$TIMESTAMP.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "resourceGroup": "$RESOURCE_GROUP",
  "resources": {
    "appService": {
      "name": "$APP_SERVICE_NAME",
      "resourceId": "$APP_SERVICE_RESOURCE_ID"
    },
    "sqlServer": {
      "name": "$SQL_SERVER_NAME",
      "database": "$SQL_DB_NAME",
      "resourceId": "$SQL_RESOURCE_ID"
    },
    "applicationInsights": {
      "name": "$APP_INSIGHTS_NAME",
      "appId": "$APP_INSIGHTS_ID"
    }
  }
}
EOL

# 5. Create consolidated baseline file
echo "Creating consolidated performance baseline..."
cat > "$OUTPUT_DIR/perf-baseline-$TIMESTAMP.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "resourceGroup": "$RESOURCE_GROUP",
  "appServiceName": "$APP_SERVICE_NAME",
  "sqlServerName": "$SQL_SERVER_NAME",
  "sqlDatabaseName": "$SQL_DB_NAME",
  "applicationInsightsName": "$APP_INSIGHTS_NAME",
  "baselineComponents": [
    {
      "name": "AppInsightsMetrics",
      "path": "app-insights-metrics-$TIMESTAMP.json"
    },
    {
      "name": "AppServiceMetrics", 
      "path": "app-service-metrics-$TIMESTAMP.json"
    },
    {
      "name": "SqlDatabaseMetrics",
      "path": "sql-metrics-$TIMESTAMP.json"
    },
    {
      "name": "ResourceSummary",
      "path": "resource-summary-$TIMESTAMP.json"
    }
  ]
}
EOL

# Create symlinks to latest baseline (Linux/WSL compatible)
if command -v ln &> /dev/null; then
    ln -sf "perf-baseline-$TIMESTAMP.json" "$OUTPUT_DIR/perf-baseline-latest.json"
    ln -sf "app-insights-metrics-$TIMESTAMP.json" "$OUTPUT_DIR/app-insights-metrics-latest.json"
    echo -e "${GREEN}Created symlinks to latest files${NC}"
fi

echo ""
echo -e "${GREEN}Performance baseline captured successfully:${NC}"
echo "- Consolidated baseline: $OUTPUT_DIR/perf-baseline-$TIMESTAMP.json"
echo "- Latest symlink: $OUTPUT_DIR/perf-baseline-latest.json"
echo "- Resource summary: $OUTPUT_DIR/resource-summary-$TIMESTAMP.json"
echo ""
echo "Files created:"
ls -la "$OUTPUT_DIR/"*$TIMESTAMP* 2>/dev/null || echo "Check $OUTPUT_DIR directory for output files"
echo ""
echo -e "${YELLOW}Use this baseline for future comparison and performance regression testing.${NC}"