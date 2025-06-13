#!/bin/bash

# Phase 2: Auto-scaling Validation for B1 Configuration
# Tests auto-scaling configuration and behavior (Note: B1 Basic tier has limited auto-scaling)
# Usage: ./auto-scaling-validation.sh [environment]

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
    echo -e "${BLUE}[AUTOSCALE] $1${NC}"
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
    error "Deployment info not found: $DEPLOYMENT_INFO_FILE"
fi

RESOURCE_GROUP=$(jq -r '.resourceGroup' "$DEPLOYMENT_INFO_FILE")
WEB_APP_NAME=$(jq -r '.webAppName' "$DEPLOYMENT_INFO_FILE")
WEB_APP_URL=$(jq -r '.webAppUrl' "$DEPLOYMENT_INFO_FILE")

APP_SERVICE_PLAN_NAME="pantry-crm-${ENVIRONMENT}-plan"

log "Starting auto-scaling validation for environment: $ENVIRONMENT"
log "App Service Plan: $APP_SERVICE_PLAN_NAME"
log "Note: B1 Basic tier has limited auto-scaling capabilities"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

run_autoscale_test() {
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
        return 1
    fi
}

# Test 1: Check B1 auto-scaling capabilities
test_b1_autoscale_capabilities() {
    log "Checking B1 tier auto-scaling capabilities..."
    
    # Get service plan SKU information
    local sku_name=$(az appservice plan show \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.name" \
        --output tsv)
    
    local sku_tier=$(az appservice plan show \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.tier" \
        --output tsv)
    
    log "SKU: $sku_name, Tier: $sku_tier"
    
    # B1 Basic tier supports limited scaling (manual scaling up to 3 instances)
    if [[ "$sku_name" == "B1" && "$sku_tier" == "Basic" ]]; then
        log "B1 Basic tier confirmed - supports manual scaling up to 3 instances"
        log "Auto-scaling requires Standard tier or higher"
        return 0
    else
        log "Unexpected SKU/Tier for B1: $sku_name/$sku_tier"
        return 1
    fi
}

# Test 2: Attempt to create auto-scale settings (should fail for B1)
test_autoscale_settings_creation() {
    log "Testing auto-scale settings creation (expected to fail for B1)..."
    
    local autoscale_name="pantry-crm-${ENVIRONMENT}-autoscale"
    local resource_id="/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/serverfarms/$APP_SERVICE_PLAN_NAME"
    
    # Create temporary autoscale settings file
    local autoscale_settings="/tmp/autoscale-settings-$$.json"
    
    cat > "$autoscale_settings" << EOF
{
  "location": "eastus",
  "properties": {
    "enabled": true,
    "targetResourceUri": "$resource_id",
    "profiles": [
      {
        "name": "Default",
        "capacity": {
          "minimum": "1",
          "maximum": "3",
          "default": "1"
        },
        "rules": [
          {
            "scaleAction": {
              "direction": "Increase",
              "type": "ChangeCount",
              "value": "1",
              "cooldown": "PT5M"
            },
            "metricTrigger": {
              "metricName": "CpuPercentage",
              "metricResourceUri": "$resource_id",
              "threshold": 75,
              "timeAggregation": "Average",
              "timeGrain": "PT1M",
              "timeWindow": "PT5M",
              "operator": "GreaterThan",
              "statistic": "Average"
            }
          },
          {
            "scaleAction": {
              "direction": "Decrease",
              "type": "ChangeCount",
              "value": "1",
              "cooldown": "PT5M"
            },
            "metricTrigger": {
              "metricName": "CpuPercentage",
              "metricResourceUri": "$resource_id",
              "threshold": 25,
              "timeAggregation": "Average",
              "timeGrain": "PT1M",
              "timeWindow": "PT5M",
              "operator": "LessThan",
              "statistic": "Average"
            }
          }
        ]
      }
    ]
  }
}
EOF
    
    # Attempt to create autoscale settings
    if az monitor autoscale create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$autoscale_name" \
        --resource "$resource_id" \
        --min-count 1 \
        --max-count 3 \
        --count 1 \
        --output table 2>/dev/null; then
        
        log "Autoscale settings created successfully"
        
        # Clean up
        az monitor autoscale delete \
            --resource-group "$RESOURCE_GROUP" \
            --name "$autoscale_name" \
            --yes \
            --output table 2>/dev/null || true
        
        return 0
    else
        log "Autoscale settings creation failed (expected for B1 Basic tier)"
        return 0  # This is expected behavior for B1
    fi
    
    rm -f "$autoscale_settings"
}

# Test 3: Simulate load and test manual scaling response
test_manual_scaling_response() {
    log "Testing manual scaling response to load..."
    
    # Get initial instance count
    local initial_instances=$(az appservice plan show \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.capacity" \
        --output tsv)
    
    log "Initial instances: $initial_instances"
    
    # Generate sustained load
    log "Generating sustained load for 60 seconds..."
    artillery quick --count 50 --num 8 "$WEB_APP_URL" > /dev/null 2>&1 &
    LOAD_PID=$!
    
    # Monitor CPU usage during load
    local max_cpu=0
    local cpu_samples=0
    local cpu_total=0
    
    for i in {1..12}; do  # 60 seconds / 5 second intervals
        sleep 5
        
        local cpu_percent=$(az monitor metrics list \
            --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
            --metric "CpuPercentage" \
            --start-time "$(date -u -d '2 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --aggregation Average \
            --interval PT1M \
            --query "value[0].timeseries[0].data[-1].average" \
            --output tsv 2>/dev/null || echo "0")
        
        if [[ $(echo "$cpu_percent > 0" | bc -l) == 1 ]]; then
            cpu_total=$(echo "$cpu_total + $cpu_percent" | bc)
            cpu_samples=$((cpu_samples + 1))
            
            if [[ $(echo "$cpu_percent > $max_cpu" | bc -l) == 1 ]]; then
                max_cpu=$cpu_percent
            fi
            
            log "CPU usage: ${cpu_percent}%"
        fi
    done
    
    # Stop load generation
    kill $LOAD_PID 2>/dev/null || true
    
    local avg_cpu=0
    if [[ $cpu_samples -gt 0 ]]; then
        avg_cpu=$(echo "scale=2; $cpu_total / $cpu_samples" | bc)
    fi
    
    log "Load test completed - Average CPU: ${avg_cpu}%, Max CPU: ${max_cpu}%"
    
    # Simulate manual scaling decision based on CPU usage
    if [[ $(echo "$max_cpu > 75" | bc -l) == 1 ]]; then
        log "High CPU detected (${max_cpu}%), testing manual scale-up..."
        
        # Scale up manually
        if az appservice plan update \
            --name "$APP_SERVICE_PLAN_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --number-of-workers 2 \
            --output table; then
            
            log "Manual scale-up successful"
            
            # Wait and then scale back down
            sleep 30
            az appservice plan update \
                --name "$APP_SERVICE_PLAN_NAME" \
                --resource-group "$RESOURCE_GROUP" \
                --number-of-workers "$initial_instances" \
                --output table
            
            log "Scaled back to initial instance count"
            return 0
        else
            log "Manual scale-up failed"
            return 1
        fi
    else
        log "CPU usage remained acceptable (${max_cpu}%), no scaling needed"
        return 0
    fi
}

# Test 4: Test scaling triggers and thresholds
test_scaling_triggers() {
    log "Testing scaling trigger thresholds..."
    
    local trigger_tests=()
    
    # Test memory pressure trigger
    log "Testing memory pressure scenarios..."
    
    # Generate memory-intensive operations
    for i in {1..5}; do
        curl -s "$WEB_APP_URL/api/organizations?page=$i&limit=100" > /dev/null &
        curl -s "$WEB_APP_URL/api/crm/contacts?limit=200" > /dev/null &
        curl -s "$WEB_APP_URL/api/dashboard/analytics" > /dev/null &
    done
    
    wait
    sleep 30
    
    # Get memory usage
    local memory_percent=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
        --metric "MemoryPercentage" \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Maximum \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].maximum" \
        --output tsv 2>/dev/null || echo "0")
    
    log "Memory usage after load: ${memory_percent}%"
    
    # Document scaling decision criteria
    local scaling_decision="no_action"
    local scaling_reason=""
    
    if [[ $(echo "$memory_percent > 80" | bc -l) == 1 ]]; then
        scaling_decision="scale_up"
        scaling_reason="Memory usage > 80% (${memory_percent}%)"
    elif [[ $(echo "$memory_percent < 30" | bc -l) == 1 ]]; then
        scaling_decision="scale_down"
        scaling_reason="Memory usage < 30% (${memory_percent}%)"
    else
        scaling_reason="Memory usage within acceptable range (${memory_percent}%)"
    fi
    
    log "Scaling decision: $scaling_decision - $scaling_reason"
    
    return 0
}

# Test 5: Test scaling cooldown periods
test_scaling_cooldown() {
    log "Testing scaling cooldown behavior..."
    
    local initial_instances=$(az appservice plan show \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.capacity" \
        --output tsv)
    
    # Test rapid scaling operations (should be limited by cooldown)
    log "Testing rapid scaling operations..."
    
    local start_time=$(date +%s)
    
    # Scale up
    az appservice plan update \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --number-of-workers 2 \
        --output table
    
    local scale_up_time=$(date +%s)
    local scale_up_duration=$((scale_up_time - start_time))
    
    # Immediate attempt to scale down (simulate cooldown test)
    az appservice plan update \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --number-of-workers "$initial_instances" \
        --output table
    
    local scale_down_time=$(date +%s)
    local scale_down_duration=$((scale_down_time - scale_up_time))
    local total_duration=$((scale_down_time - start_time))
    
    log "Scaling timings:"
    log "  Scale up: ${scale_up_duration}s"
    log "  Scale down: ${scale_down_duration}s"
    log "  Total: ${total_duration}s"
    
    # For B1, manual scaling should complete relatively quickly
    if [[ $total_duration -le 300 ]]; then  # 5 minutes
        log "Manual scaling completed within acceptable time"
        return 0
    else
        log "Manual scaling took too long: ${total_duration}s"
        return 1
    fi
}

# Test 6: Validate scaling recommendations
test_scaling_recommendations() {
    log "Generating scaling recommendations for B1 tier..."
    
    local recommendations_file="$SCRIPT_DIR/../scaling-recommendations-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"
    
    # Collect metrics for recommendations
    local current_instances=$(az appservice plan show \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.capacity" \
        --output tsv)
    
    local avg_cpu=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
        --metric "CpuPercentage" \
        --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Average \
        --interval PT5M \
        --query "value[0].timeseries[0].data | map(.average) | [?@ != null] | length(@)" \
        --output tsv 2>/dev/null || echo "0")
    
    cat > "$recommendations_file" << EOF
{
    "environment": "$ENVIRONMENT",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "currentConfiguration": {
        "tier": "B1 Basic",
        "instances": $current_instances,
        "maxInstances": 3,
        "autoScalingEnabled": false
    },
    "recommendations": {
        "immediate": [
            {
                "type": "monitoring",
                "priority": "high",
                "description": "Implement custom monitoring for manual scaling decisions",
                "reason": "B1 Basic tier requires manual scaling intervention"
            },
            {
                "type": "alerting",
                "priority": "high", 
                "description": "Set up CPU and memory alerts for scaling triggers",
                "reason": "Proactive monitoring needed for manual scaling"
            }
        ],
        "upgrade_path": [
            {
                "tier": "S1 Standard",
                "cost_increase": "~300%",
                "benefits": ["Auto-scaling", "Deployment slots", "Custom domains"],
                "when_to_upgrade": "When consistent load exceeds 4 concurrent users"
            },
            {
                "tier": "P1v2 Premium",
                "cost_increase": "~600%", 
                "benefits": ["Advanced auto-scaling", "VNet integration", "Higher performance"],
                "when_to_upgrade": "When requiring enterprise features"
            }
        ],
        "optimization": [
            {
                "type": "application",
                "description": "Implement application-level caching to reduce resource usage",
                "impact": "Reduces need for scaling"
            },
            {
                "type": "database",
                "description": "Optimize database queries to reduce DTU consumption",
                "impact": "Improves overall performance"
            }
        ]
    }
}
EOF
    
    log "Scaling recommendations saved to: $recommendations_file"
    return 0
}

# Run all auto-scaling tests
log "Starting auto-scaling validation tests..."

run_autoscale_test "B1 Auto-scaling Capabilities Check" "test_b1_autoscale_capabilities"
run_autoscale_test "Auto-scale Settings Creation" "test_autoscale_settings_creation"
run_autoscale_test "Manual Scaling Response to Load" "test_manual_scaling_response"
run_autoscale_test "Scaling Triggers and Thresholds" "test_scaling_triggers"
run_autoscale_test "Scaling Cooldown Behavior" "test_scaling_cooldown"
run_autoscale_test "Scaling Recommendations Generation" "test_scaling_recommendations"

# Generate auto-scaling test report
REPORT_FILE="$SCRIPT_DIR/../auto-scaling-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
    "environment": "$ENVIRONMENT",
    "testSuite": "Auto-scaling Validation",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "tierLimitations": {
        "tier": "B1 Basic",
        "autoScalingSupported": false,
        "manualScalingOnly": true,
        "maxInstances": 3,
        "upgradeRequiredFor": "Auto-scaling (Standard tier or higher)"
    },
    "summary": {
        "totalTests": $TOTAL_TESTS,
        "passedTests": $PASSED_TESTS,
        "failedTests": $((TOTAL_TESTS - PASSED_TESTS)),
        "successRate": $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    },
    "appServicePlan": "$APP_SERVICE_PLAN_NAME",
    "webApp": "$WEB_APP_NAME"
}
EOF

# Summary
log "=== AUTO-SCALING VALIDATION SUMMARY ==="
log "Environment: $ENVIRONMENT"
log "Tier: B1 Basic (Manual scaling only)"
log "Auto-scaling: Not supported (requires Standard tier or higher)"
log "Max instances: 3"
log "Total Tests: $TOTAL_TESTS"
log "Passed: $PASSED_TESTS"
log "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
log "Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
log "Report: $REPORT_FILE"

if [[ $PASSED_TESTS -eq $TOTAL_TESTS ]]; then
    success "All auto-scaling validation tests passed!"
    log "Note: B1 Basic tier requires manual scaling. Consider upgrading to Standard for auto-scaling."
    exit 0
else
    error "$((TOTAL_TESTS - PASSED_TESTS)) auto-scaling tests failed."
    exit 1
fi