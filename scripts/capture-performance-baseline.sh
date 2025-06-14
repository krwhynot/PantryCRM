#!/bin/bash
# Performance Baseline Capture Script for PantryCRM
# Creates a comprehensive snapshot of current performance metrics
# Run with: az login && bash capture-performance-baseline.sh

# Configuration
RESOURCE_GROUP="kitchen-pantry-crm-rg"
APP_SERVICE_NAME="kitchen-pantry-crm"
SQL_SERVER_NAME="kitchen-pantry-crm-sql"
SQL_DB_NAME="kitchen-pantry-crm-db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="performance_baselines"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Capturing performance baseline for PantryCRM - $TIMESTAMP"

# 1. Application Insights metrics (requests & duration)
echo "Capturing Application Insights metrics..."
az monitor app-insights metrics show \
  --app "$APP_INSIGHTS" \
  --resource-group "$RESOURCE_GROUP" \
  --metrics requests/count,requestDuration \
  --interval PT5M \
  --output json > "$OUTPUT_DIR/app-insights-metrics-$TIMESTAMP.json"

# 2. App Service metrics
echo "Capturing App Service performance metrics..."
az monitor metrics list \
  --resource "$APP_SERVICE_NAME" \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Web/sites" \
  --metric "CpuTime,MemoryWorkingSet,HttpResponseTime,Http5xx" \
  --interval 5m \
  --output json > "$OUTPUT_DIR/app-service-metrics-$TIMESTAMP.json"

# 3. SQL Database metrics
echo "Capturing SQL Database performance metrics..."
az monitor metrics list \
  --resource "$SQL_DB_NAME" \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Sql/servers/databases" \
  --resource-parent "$SQL_SERVER_NAME" \
  --metric "dtu_consumption_percent,cpu_percent,storage_percent" \
  --interval 5m \
  --output json > "$OUTPUT_DIR/sql-metrics-$TIMESTAMP.json"

# 5. Create consolidated baseline file
echo "Creating consolidated performance baseline..."
cat > "$OUTPUT_DIR/perf-baseline-$TIMESTAMP.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "appServiceName": "$APP_SERVICE_NAME",
  "sqlServerName": "$SQL_SERVER_NAME",
  "sqlDatabaseName": "$SQL_DB_NAME",
  "baselineComponents": [
    {
      "name": "AppInsightsLiveMetrics",
      "path": "app-insights-live-metrics-$TIMESTAMP.json"
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
      "name": "AvailabilityTests",
      "path": "availability-tests-$TIMESTAMP.json"
    }
  ]
}
EOL

# Create symlink to latest baseline
ln -sf "$OUTPUT_DIR/perf-baseline-$TIMESTAMP.json" "$OUTPUT_DIR/perf-baseline-latest.json"
ln -sf "$OUTPUT_DIR/app-insights-live-metrics-$TIMESTAMP.json" "$OUTPUT_DIR/app-insights-live-metrics-latest.json"

echo "Performance baseline captured successfully:"
echo "- Consolidated baseline: $OUTPUT_DIR/perf-baseline-$TIMESTAMP.json"
echo "- Latest symlink: $OUTPUT_DIR/perf-baseline-latest.json"
echo ""
echo "Use this baseline for future comparison and performance regression testing."
