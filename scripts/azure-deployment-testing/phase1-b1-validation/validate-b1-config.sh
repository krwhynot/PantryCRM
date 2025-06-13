#!/bin/bash

# Phase 1: Validate Azure B1 Configuration
# Comprehensive validation of B1 tier constraints and optimizations
# Usage: ./validate-b1-config.sh [environment]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENVIRONMENT=${1:-staging}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[VALIDATE] $1${NC}"
}

error() {
    echo -e "${RED}[FAIL] $1${NC}"
    return 1
}

success() {
    echo -e "${GREEN}[PASS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

# Load deployment info
DEPLOYMENT_INFO_FILE="$SCRIPT_DIR/../deployment-info-${ENVIRONMENT}.json"
if [[ ! -f "$DEPLOYMENT_INFO_FILE" ]]; then
    error "Deployment info not found: $DEPLOYMENT_INFO_FILE. Run deploy-infrastructure.sh first."
fi

# Parse deployment info
RESOURCE_GROUP=$(jq -r '.resourceGroup' "$DEPLOYMENT_INFO_FILE")
WEB_APP_NAME=$(jq -r '.webAppName' "$DEPLOYMENT_INFO_FILE")
WEB_APP_URL=$(jq -r '.webAppUrl' "$DEPLOYMENT_INFO_FILE")
SQL_SERVER_NAME=$(jq -r '.sqlServerName' "$DEPLOYMENT_INFO_FILE")
APP_INSIGHTS_NAME=$(jq -r '.applicationInsightsName' "$DEPLOYMENT_INFO_FILE")

log "Starting B1 configuration validation for environment: $ENVIRONMENT"
log "Resource Group: $RESOURCE_GROUP"
log "Web App: $WEB_APP_NAME"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Running test: $test_name"
    
    if eval "$test_command"; then
        success "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        error "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test 1: Validate App Service Plan B1 Configuration
test_app_service_plan() {
    local plan_name="pantry-crm-${ENVIRONMENT}-plan"
    local sku=$(az appservice plan show --name "$plan_name" --resource-group "$RESOURCE_GROUP" --query "sku.name" -o tsv)
    local capacity=$(az appservice plan show --name "$plan_name" --resource-group "$RESOURCE_GROUP" --query "sku.capacity" -o tsv)
    local tier=$(az appservice plan show --name "$plan_name" --resource-group "$RESOURCE_GROUP" --query "sku.tier" -o tsv)
    
    if [[ "$sku" == "B1" && "$capacity" == "1" && "$tier" == "Basic" ]]; then
        return 0
    else
        echo "Expected: B1, Basic, 1 instance. Got: $sku, $tier, $capacity instances"
        return 1
    fi
}

# Test 2: Validate SQL Database Basic Tier
test_sql_database_config() {
    local db_name="pantry-crm-db"
    local edition=$(az sql db show --server "$SQL_SERVER_NAME" --name "$db_name" --resource-group "$RESOURCE_GROUP" --query "edition" -o tsv)
    local service_objective=$(az sql db show --server "$SQL_SERVER_NAME" --name "$db_name" --resource-group "$RESOURCE_GROUP" --query "currentServiceObjectiveName" -o tsv)
    local max_size=$(az sql db show --server "$SQL_SERVER_NAME" --name "$db_name" --resource-group "$RESOURCE_GROUP" --query "maxSizeBytes" -o tsv)
    
    # Basic tier should be 2GB (2147483648 bytes)
    if [[ "$edition" == "Basic" && "$service_objective" == "Basic" && "$max_size" == "2147483648" ]]; then
        return 0
    else
        echo "Expected: Basic, Basic, 2GB. Got: $edition, $service_objective, $max_size bytes"
        return 1
    fi
}

# Test 3: Validate Memory Optimization Settings
test_memory_optimization() {
    local app_settings=$(az webapp config appsettings list --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" -o json)
    
    # Check NODE_OPTIONS for memory optimization
    local node_options=$(echo "$app_settings" | jq -r '.[] | select(.name=="NODE_OPTIONS") | .value')
    
    if [[ "$node_options" == *"--max-old-space-size=1400"* && "$node_options" == *"--optimize-for-size"* ]]; then
        return 0
    else
        echo "NODE_OPTIONS not optimized for B1. Got: $node_options"
        return 1
    fi
}

# Test 4: Validate Application Insights Configuration
test_application_insights() {
    local connection_string=$(az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" --query "connectionString" -o tsv)
    local retention=$(az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" --query "retentionInDays" -o tsv)
    
    # Should have connection string and 30-day retention for cost optimization
    if [[ -n "$connection_string" && "$retention" == "30" ]]; then
        return 0
    else
        echo "Application Insights not properly configured. Retention: $retention days"
        return 1
    fi
}

# Test 5: Validate Always On is Disabled (B1 Cost Optimization)
test_always_on_disabled() {
    local always_on=$(az webapp config show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "alwaysOn" -o tsv)
    
    if [[ "$always_on" == "false" ]]; then
        return 0
    else
        echo "Always On should be disabled for B1 cost optimization. Got: $always_on"
        return 1
    fi
}

# Test 6: Validate HTTP 2.0 Enabled
test_http20_enabled() {
    local http20=$(az webapp config show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "http20Enabled" -o tsv)
    
    if [[ "$http20" == "true" ]]; then
        return 0
    else
        echo "HTTP 2.0 should be enabled for performance. Got: $http20"
        return 1
    fi
}

# Test 7: Validate Node.js Version
test_nodejs_version() {
    local node_version=$(az webapp config show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "nodeVersion" -o tsv)
    
    # Should be Node.js 20 LTS
    if [[ "$node_version" == "~20" || "$node_version" == "20-lts" ]]; then
        return 0
    else
        echo "Node.js version should be 20 LTS. Got: $node_version"
        return 1
    fi
}

# Test 8: Validate Platform Architecture
test_platform_architecture() {
    local use32bit=$(az webapp config show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "use32BitWorkerProcess" -o tsv)
    
    # Should use 64-bit for better memory management
    if [[ "$use32bit" == "false" ]]; then
        return 0
    else
        echo "Should use 64-bit worker process for B1. Got 32-bit: $use32bit"
        return 1
    fi
}

# Test 9: Validate Managed Identity is Enabled
test_managed_identity() {
    local identity_type=$(az webapp identity show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "type" -o tsv)
    
    if [[ "$identity_type" == "SystemAssigned" ]]; then
        return 0
    else
        echo "System-assigned managed identity should be enabled. Got: $identity_type"
        return 1
    fi
}

# Test 10: Validate HTTPS Only
test_https_only() {
    local https_only=$(az webapp show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "httpsOnly" -o tsv)
    
    if [[ "$https_only" == "true" ]]; then
        return 0
    else
        echo "HTTPS Only should be enabled for security. Got: $https_only"
        return 1
    fi
}

# Test 11: Validate Health Check Endpoint Responsiveness
test_health_endpoint() {
    local health_url="$WEB_APP_URL/api/health/b1-performance"
    local status_code
    
    # Try multiple times as the app might be warming up
    for i in {1..3}; do
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null || echo "000")
        if [[ "$status_code" == "200" ]]; then
            return 0
        fi
        sleep 10
    done
    
    echo "Health endpoint not responding. Status: $status_code"
    return 1
}

# Test 12: Validate Environment Variables
test_environment_variables() {
    local app_settings=$(az webapp config appsettings list --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" -o json)
    
    # Check for critical environment variables
    local node_env=$(echo "$app_settings" | jq -r '.[] | select(.name=="NODE_ENV") | .value')
    local telemetry_disabled=$(echo "$app_settings" | jq -r '.[] | select(.name=="NEXT_TELEMETRY_DISABLED") | .value')
    
    if [[ "$node_env" == "production" && "$telemetry_disabled" == "1" ]]; then
        return 0
    else
        echo "Environment variables not optimized. NODE_ENV: $node_env, TELEMETRY_DISABLED: $telemetry_disabled"
        return 1
    fi
}

# Test 13: Validate Connection Strings
test_connection_strings() {
    local conn_strings=$(az webapp config connection-string list --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" -o json)
    local db_conn=$(echo "$conn_strings" | jq -r '.[] | select(.name=="DATABASE_URL") | .value')
    
    if [[ -n "$db_conn" && "$db_conn" == *"$SQL_SERVER_NAME"* ]]; then
        return 0
    else
        echo "Database connection string not properly configured"
        return 1
    fi
}

# Test 14: Validate Auto-Heal Settings
test_auto_heal() {
    local auto_heal=$(az webapp config show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "autoHealEnabled" -o tsv)
    
    # Auto-heal should be disabled for B1 to avoid resource overhead
    if [[ "$auto_heal" == "false" || "$auto_heal" == "null" ]]; then
        return 0
    else
        echo "Auto-heal should be disabled for B1 optimization. Got: $auto_heal"
        return 1
    fi
}

# Test 15: Validate Remote Debugging is Disabled
test_remote_debugging() {
    local remote_debug=$(az webapp config show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "remoteDebuggingEnabled" -o tsv)
    
    if [[ "$remote_debug" == "false" ]]; then
        return 0
    else
        echo "Remote debugging should be disabled in production. Got: $remote_debug"
        return 1
    fi
}

# Run all tests
log "Starting B1 configuration validation tests..."

run_test "App Service Plan B1 Configuration" "test_app_service_plan"
run_test "SQL Database Basic Tier Configuration" "test_sql_database_config"
run_test "Memory Optimization Settings" "test_memory_optimization"
run_test "Application Insights Configuration" "test_application_insights"
run_test "Always On Disabled (Cost Optimization)" "test_always_on_disabled"
run_test "HTTP 2.0 Enabled" "test_http20_enabled"
run_test "Node.js Version" "test_nodejs_version"
run_test "64-bit Platform Architecture" "test_platform_architecture"
run_test "Managed Identity Enabled" "test_managed_identity"
run_test "HTTPS Only Enabled" "test_https_only"
run_test "Health Endpoint Responsiveness" "test_health_endpoint"
run_test "Environment Variables Configuration" "test_environment_variables"
run_test "Connection Strings Configuration" "test_connection_strings"
run_test "Auto-Heal Disabled (B1 Optimization)" "test_auto_heal"
run_test "Remote Debugging Disabled" "test_remote_debugging"

# Generate test report
REPORT_FILE="$SCRIPT_DIR/../b1-validation-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
    "environment": "$ENVIRONMENT",
    "testSuite": "B1 Configuration Validation",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "summary": {
        "totalTests": $TOTAL_TESTS,
        "passedTests": $PASSED_TESTS,
        "failedTests": $FAILED_TESTS,
        "successRate": $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    },
    "resourceGroup": "$RESOURCE_GROUP",
    "webApp": "$WEB_APP_NAME",
    "webAppUrl": "$WEB_APP_URL",
    "sqlServer": "$SQL_SERVER_NAME"
}
EOF

# Summary
log "=== B1 VALIDATION SUMMARY ==="
log "Environment: $ENVIRONMENT"
log "Total Tests: $TOTAL_TESTS"
log "Passed: $PASSED_TESTS"
log "Failed: $FAILED_TESTS"
log "Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
log "Report: $REPORT_FILE"

if [[ $FAILED_TESTS -eq 0 ]]; then
    success "All B1 configuration tests passed!"
    exit 0
else
    error "$FAILED_TESTS tests failed. Review the output above."
    exit 1
fi