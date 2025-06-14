#!/bin/bash
# Azure Cost Optimization and Monitoring Script
# Tracks spending against $18/month budget and suggests optimizations

set -e

# Configuration
SUBSCRIPTION_ID="df8fefaa-16a0-47da-ace7-6eab8b1919cf"
RESOURCE_GROUP="kitchen-pantry-crm-rg"
MONTHLY_BUDGET=18.00
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="cost-analysis"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}💰 Azure Cost Optimization Analysis - $TIMESTAMP${NC}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

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

# Function to format currency
format_currency() {
    printf "%.2f" "$1"
}

# Verify Azure authentication
echo -e "${BLUE}🔐 Verifying Azure CLI authentication...${NC}"
CURRENT_USER=$(az account show --query "user.name" --output tsv)
echo -e "${GREEN}📋 Authenticated as: $CURRENT_USER${NC}"

# Set subscription context
az account set --subscription "$SUBSCRIPTION_ID"
check_command "Subscription context set"

# Get current month date range
CURRENT_MONTH=$(date +%Y-%m)
MONTH_START="${CURRENT_MONTH}-01"
NEXT_MONTH=$(date -d "next month" +%Y-%m)
MONTH_END="${NEXT_MONTH}-01"

echo -e "${BLUE}📅 Analyzing costs for: $MONTH_START to $MONTH_END${NC}"

# 1. Get resource costs (using Azure Resource Graph where possible)
echo -e "${BLUE}💰 Analyzing resource costs...${NC}"

# Create cost analysis JSON
cat > "$OUTPUT_DIR/cost-analysis-$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "month": "$CURRENT_MONTH",
  "budget": $MONTHLY_BUDGET,
  "subscription_id": "$SUBSCRIPTION_ID",
  "resource_group": "$RESOURCE_GROUP",
  "resources": {},
  "recommendations": []
}
EOF

# 2. Analyze App Service Plan costs
echo -e "${BLUE}🌐 App Service Plan Analysis...${NC}"
APP_SERVICE_PLAN=$(az appservice plan list --resource-group "$RESOURCE_GROUP" --query "[0].name" --output tsv)
APP_SERVICE_TIER=$(az appservice plan list --resource-group "$RESOURCE_GROUP" --query "[0].sku.tier" --output tsv)
APP_SERVICE_SIZE=$(az appservice plan list --resource-group "$RESOURCE_GROUP" --query "[0].sku.name" --output tsv)

echo -e "${GREEN}📊 App Service Plan: $APP_SERVICE_PLAN ($APP_SERVICE_TIER $APP_SERVICE_SIZE)${NC}"

# Estimated costs based on Azure pricing (as of 2024)
case "$APP_SERVICE_SIZE" in
    "B1")
        APP_SERVICE_MONTHLY_COST=13.14
        echo -e "${GREEN}💲 Estimated App Service cost: \$$(format_currency $APP_SERVICE_MONTHLY_COST)/month${NC}"
        ;;
    "B2")
        APP_SERVICE_MONTHLY_COST=26.28
        echo -e "${YELLOW}💲 Estimated App Service cost: \$$(format_currency $APP_SERVICE_MONTHLY_COST)/month${NC}"
        ;;
    "F1")
        APP_SERVICE_MONTHLY_COST=0.00
        echo -e "${GREEN}💲 Estimated App Service cost: \$$(format_currency $APP_SERVICE_MONTHLY_COST)/month (Free tier)${NC}"
        ;;
    *)
        APP_SERVICE_MONTHLY_COST=13.14
        echo -e "${YELLOW}💲 Estimated App Service cost: \$$(format_currency $APP_SERVICE_MONTHLY_COST)/month (estimated)${NC}"
        ;;
esac

# 3. Analyze SQL Database costs
echo -e "${BLUE}🗄️ SQL Database Analysis...${NC}"
SQL_SERVER="kitchen-pantry-crm-sql"
SQL_DB="kitchen-pantry-crm-db"
SQL_TIER=$(az sql db show --name "$SQL_DB" --server "$SQL_SERVER" --resource-group "$RESOURCE_GROUP" --query "currentServiceObjectiveName" --output tsv)

echo -e "${GREEN}📊 SQL Database: $SQL_DB ($SQL_TIER)${NC}"

# SQL Database pricing (Basic tier)
case "$SQL_TIER" in
    "Basic")
        SQL_MONTHLY_COST=4.99
        echo -e "${GREEN}💲 Estimated SQL Database cost: \$$(format_currency $SQL_MONTHLY_COST)/month${NC}"
        ;;
    "S0")
        SQL_MONTHLY_COST=15.00
        echo -e "${YELLOW}💲 Estimated SQL Database cost: \$$(format_currency $SQL_MONTHLY_COST)/month${NC}"
        ;;
    *)
        SQL_MONTHLY_COST=4.99
        echo -e "${YELLOW}💲 Estimated SQL Database cost: \$$(format_currency $SQL_MONTHLY_COST)/month (estimated)${NC}"
        ;;
esac

# 4. Application Insights costs (usually free for small usage)
INSIGHTS_MONTHLY_COST=0.00
echo -e "${GREEN}💲 Estimated Application Insights cost: \$$(format_currency $INSIGHTS_MONTHLY_COST)/month (within free tier)${NC}"

# 5. Calculate total estimated cost
TOTAL_ESTIMATED_COST=$(echo "$APP_SERVICE_MONTHLY_COST + $SQL_MONTHLY_COST + $INSIGHTS_MONTHLY_COST" | bc -l)
BUDGET_REMAINING=$(echo "$MONTHLY_BUDGET - $TOTAL_ESTIMATED_COST" | bc -l)

echo ""
echo -e "${BLUE}📊 Cost Summary:${NC}"
echo -e "   App Service Plan: \$$(format_currency $APP_SERVICE_MONTHLY_COST)"
echo -e "   SQL Database: \$$(format_currency $SQL_MONTHLY_COST)"
echo -e "   Application Insights: \$$(format_currency $INSIGHTS_MONTHLY_COST)"
echo -e "   ${YELLOW}Total Estimated: \$$(format_currency $TOTAL_ESTIMATED_COST)${NC}"
echo -e "   Monthly Budget: \$$(format_currency $MONTHLY_BUDGET)"

if (( $(echo "$TOTAL_ESTIMATED_COST <= $MONTHLY_BUDGET" | bc -l) )); then
    echo -e "   ${GREEN}Budget Status: \$$(format_currency $BUDGET_REMAINING) remaining ✅${NC}"
    BUDGET_STATUS="within_budget"
else
    BUDGET_OVERAGE=$(echo "$TOTAL_ESTIMATED_COST - $MONTHLY_BUDGET" | bc -l)
    echo -e "   ${RED}Budget Status: \$$(format_currency $BUDGET_OVERAGE) over budget ⚠️${NC}"
    BUDGET_STATUS="over_budget"
fi

# 6. Generate optimization recommendations
echo ""
echo -e "${BLUE}🎯 Cost Optimization Recommendations:${NC}"

RECOMMENDATIONS=()

# App Service recommendations
if [ "$APP_SERVICE_SIZE" != "B1" ] && (( $(echo "$TOTAL_ESTIMATED_COST > $MONTHLY_BUDGET" | bc -l) )); then
    echo -e "${YELLOW}📉 Consider downgrading App Service to B1 tier to save \$$(echo "$APP_SERVICE_MONTHLY_COST - 13.14" | bc -l)/month${NC}"
    RECOMMENDATIONS+=("Downgrade App Service to B1 tier")
fi

# SQL Database recommendations
if [ "$SQL_TIER" != "Basic" ] && (( $(echo "$TOTAL_ESTIMATED_COST > $MONTHLY_BUDGET" | bc -l) )); then
    echo -e "${YELLOW}📉 Consider using SQL Database Basic tier to save \$$(echo "$SQL_MONTHLY_COST - 4.99" | bc -l)/month${NC}"
    RECOMMENDATIONS+=("Use SQL Database Basic tier")
fi

# General recommendations
echo -e "${GREEN}💡 General optimization tips:${NC}"
echo -e "   • Monitor DTU usage - Basic tier may be sufficient for current load"
echo -e "   • Use Application Insights free tier (5GB/month)"
echo -e "   • Consider Azure Functions for background tasks (consumption plan)"
echo -e "   • Implement proper caching to reduce database load"
echo -e "   • Monitor unused resources monthly"

# 7. Resource utilization analysis
echo ""
echo -e "${BLUE}📈 Resource Utilization Analysis:${NC}"

# Get recent CPU and DTU metrics
CPU_AVG=$(az monitor metrics list \
    --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/kitchen-pantry-crm" \
    --metric "CpuTime" \
    --interval PT1H \
    --aggregation Total \
    --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --query "value[0].timeseries[0].data[0].total" \
    --output tsv 2>/dev/null || echo "0")

DTU_AVG=$(az monitor metrics list \
    --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER/databases/$SQL_DB" \
    --metric "dtu_consumption_percent" \
    --interval PT1H \
    --aggregation Average \
    --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --query "value[0].timeseries[0].data[0].average" \
    --output tsv 2>/dev/null || echo "0")

echo -e "   CPU Usage (24h avg): ${CPU_AVG}s"
echo -e "   DTU Usage (24h avg): ${DTU_AVG}%"

# Utilization recommendations
if (( $(echo "$DTU_AVG < 50" | bc -l) )); then
    echo -e "${GREEN}✅ SQL Database utilization is optimal for Basic tier${NC}"
else
    echo -e "${YELLOW}⚠️ SQL Database utilization is high - monitor for performance issues${NC}"
fi

# 8. Generate detailed report
cat > "$OUTPUT_DIR/cost-optimization-$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "month": "$CURRENT_MONTH",
  "budget": {
    "monthly_limit": $MONTHLY_BUDGET,
    "estimated_total": $(format_currency $TOTAL_ESTIMATED_COST),
    "remaining": $(format_currency $BUDGET_REMAINING),
    "status": "$BUDGET_STATUS"
  },
  "resources": {
    "app_service": {
      "name": "$APP_SERVICE_PLAN",
      "tier": "$APP_SERVICE_TIER",
      "size": "$APP_SERVICE_SIZE",
      "estimated_monthly_cost": $(format_currency $APP_SERVICE_MONTHLY_COST)
    },
    "sql_database": {
      "name": "$SQL_DB",
      "tier": "$SQL_TIER",
      "estimated_monthly_cost": $(format_currency $SQL_MONTHLY_COST)
    },
    "application_insights": {
      "estimated_monthly_cost": $(format_currency $INSIGHTS_MONTHLY_COST)
    }
  },
  "utilization": {
    "cpu_time_24h": "$CPU_AVG",
    "dtu_percent_24h": "$DTU_AVG"
  },
  "recommendations": [
    $(printf '%s\n' "${RECOMMENDATIONS[@]}" | sed 's/.*/"&"/' | paste -sd, -)
  ]
}
EOF

# 9. Create cost alert thresholds
ALERT_THRESHOLD_80=$(echo "$MONTHLY_BUDGET * 0.8" | bc -l)
ALERT_THRESHOLD_100=$(echo "$MONTHLY_BUDGET * 1.0" | bc -l)

if (( $(echo "$TOTAL_ESTIMATED_COST >= $ALERT_THRESHOLD_80" | bc -l) )); then
    echo ""
    echo -e "${YELLOW}🚨 Cost Alert: Approaching 80% of monthly budget${NC}"
    if (( $(echo "$TOTAL_ESTIMATED_COST >= $ALERT_THRESHOLD_100" | bc -l) )); then
        echo -e "${RED}🚨 Cost Alert: Exceeded monthly budget!${NC}"
    fi
fi

echo ""
echo -e "${GREEN}💰 Cost analysis complete!${NC}"
echo -e "${YELLOW}📂 Report saved to: $OUTPUT_DIR/cost-optimization-$TIMESTAMP.json${NC}"
echo -e "${YELLOW}🔄 Run this script monthly to track spending trends${NC}"

# 10. Quick commands for cost optimization
echo ""
echo -e "${BLUE}🛠️ Quick optimization commands:${NC}"
echo ""
echo -e "${YELLOW}# Downgrade App Service to B1 (if needed):${NC}"
echo "az appservice plan update --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --sku B1"
echo ""
echo -e "${YELLOW}# Monitor SQL Database DTU usage:${NC}"
echo "az monitor metrics list --resource '/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER/databases/$SQL_DB' --metric 'dtu_consumption_percent' --interval PT1H --output table"
echo ""
echo -e "${YELLOW}# View detailed cost analysis in Azure Portal:${NC}"
echo "https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis"