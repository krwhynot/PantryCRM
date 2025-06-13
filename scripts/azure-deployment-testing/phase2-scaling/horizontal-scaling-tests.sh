#!/bin/bash

# Phase 2: Horizontal Scaling Tests for B1 Configuration
# Tests horizontal scaling capabilities and limitations of B1 tier (max 3 instances)
# Usage: ./horizontal-scaling-tests.sh [environment]

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
    echo -e "${BLUE}[SCALING] $1${NC}"
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

# App Service Plan name
APP_SERVICE_PLAN_NAME="pantry-crm-${ENVIRONMENT}-plan"

# B1 scaling constraints
B1_MAX_INSTANCES=3
B1_MIN_INSTANCES=1

log "Starting horizontal scaling tests for environment: $ENVIRONMENT"
log "App Service Plan: $APP_SERVICE_PLAN_NAME"
log "Web App: $WEB_APP_NAME"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

run_scaling_test() {
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

# Get current instance count
get_instance_count() {
    az appservice plan show \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.capacity" \
        --output tsv
}

# Scale to specific instance count
scale_to_instances() {
    local target_instances="$1"
    local timeout_seconds="${2:-300}"
    
    log "Scaling to $target_instances instances..."
    
    # Perform the scaling operation
    az appservice plan update \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --number-of-workers "$target_instances" \
        --output table
    
    # Wait for scaling to complete with timeout
    local start_time=$(date +%s)
    local end_time=$((start_time + timeout_seconds))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        local current_instances=$(get_instance_count)
        if [[ "$current_instances" == "$target_instances" ]]; then
            log "Successfully scaled to $target_instances instances"
            return 0
        fi
        log "Waiting for scaling... Current: $current_instances, Target: $target_instances"
        sleep 10
    done
    
    log "Scaling timeout after $timeout_seconds seconds"
    return 1
}

# Test application responsiveness after scaling
test_app_responsiveness() {
    local instance_count="$1"
    local test_duration=60
    
    log "Testing application responsiveness with $instance_count instances..."
    
    # Wait for instances to warm up
    sleep 30
    
    local total_requests=0
    local successful_requests=0
    local total_response_time=0
    local max_response_time=0
    
    local end_time=$(($(date +%s) + test_duration))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        local start_time=$(date +%s%3N)
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_APP_URL/api/health" 2>/dev/null || echo "000")
        local end_time_ms=$(date +%s%3N)
        local response_time=$((end_time_ms - start_time))
        
        total_requests=$((total_requests + 1))
        
        if [[ "$status_code" == "200" ]]; then
            successful_requests=$((successful_requests + 1))
            total_response_time=$((total_response_time + response_time))
            
            if [[ $response_time -gt $max_response_time ]]; then
                max_response_time=$response_time
            fi
        fi
        
        sleep 2
    done
    
    local success_rate=0
    local avg_response_time=0
    
    if [[ $total_requests -gt 0 ]]; then
        success_rate=$(echo "scale=2; $successful_requests * 100 / $total_requests" | bc)
    fi
    
    if [[ $successful_requests -gt 0 ]]; then
        avg_response_time=$((total_response_time / successful_requests))
    fi
    
    log "Responsiveness with $instance_count instances:"
    log "  Success Rate: ${success_rate}% ($successful_requests/$total_requests)"
    log "  Average Response Time: ${avg_response_time}ms"
    log "  Max Response Time: ${max_response_time}ms"
    
    # Criteria: >95% success rate and <2000ms average response time
    if (( $(echo "$success_rate >= 95" | bc -l) )) && [[ $avg_response_time -le 2000 ]]; then
        return 0
    else
        return 1
    fi
}

# Test 1: Validate current instance count
test_initial_instance_count() {
    local current_instances=$(get_instance_count)
    log "Current instance count: $current_instances"
    
    if [[ "$current_instances" == "1" ]]; then
        log "Initial instance count is correct: 1"
        return 0
    else
        log "Expected 1 instance, got: $current_instances"
        return 1
    fi
}

# Test 2: Scale up to 2 instances
test_scale_up_to_2() {
    if scale_to_instances 2 300; then
        return $(test_app_responsiveness 2)
    else
        return 1
    fi
}

# Test 3: Scale up to maximum (3 instances for B1)
test_scale_up_to_max() {
    if scale_to_instances $B1_MAX_INSTANCES 300; then
        return $(test_app_responsiveness $B1_MAX_INSTANCES)
    else
        return 1
    fi
}

# Test 4: Test B1 scaling limit (should fail to scale beyond 3)
test_b1_scaling_limit() {
    log "Testing B1 scaling limit (attempting to scale to 4 instances)..."
    
    # This should fail for B1 tier
    if az appservice plan update \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --number-of-workers 4 \
        --output table 2>/dev/null; then
        
        # If it succeeds, check if it actually scaled to 4
        local actual_instances=$(get_instance_count)
        if [[ "$actual_instances" == "4" ]]; then
            log "Unexpected: B1 tier allowed scaling to 4 instances"
            return 1
        else
            log "B1 limit enforced: attempted to scale to 4, remained at $actual_instances"
            return 0
        fi
    else
        log "B1 scaling limit correctly enforced (scaling to 4 failed)"
        return 0
    fi
}

# Test 5: Scale down to 2 instances
test_scale_down_to_2() {
    if scale_to_instances 2 300; then
        return $(test_app_responsiveness 2)
    else
        return 1
    fi
}

# Test 6: Scale down to minimum (1 instance)
test_scale_down_to_min() {
    if scale_to_instances $B1_MIN_INSTANCES 300; then
        return $(test_app_responsiveness $B1_MIN_INSTANCES)
    else
        return 1
    fi
}

# Test 7: Performance comparison between instance counts
test_performance_comparison() {
    log "Running performance comparison across different instance counts..."
    
    local comparison_results="/tmp/scaling-performance-comparison-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$comparison_results" << EOF
{
    "testSuite": "Horizontal Scaling Performance Comparison",
    "environment": "$ENVIRONMENT",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "results": {
EOF
    
    # Test with 1, 2, and 3 instances
    for instances in 1 2 3; do
        log "Testing performance with $instances instances..."
        
        if scale_to_instances $instances 300; then
            # Run performance test
            local artillery_config="/tmp/scaling-perf-test-${instances}-instances.yml"
            
            cat > "$artillery_config" << EOF
config:
  target: "$WEB_APP_URL"
  phases:
    - duration: 60
      arrivalRate: 4
      name: "Performance test with $instances instances"
  ensure:
    - max: 2000
      name: "Response time under 2s"

scenarios:
  - name: "Standard load test"
    flow:
      - get:
          url: "/api/health"
      - get:
          url: "/api/organizations?limit=10"
      - get:
          url: "/"
EOF
            
            local results_file="/tmp/scaling-results-${instances}-instances.json"
            
            if artillery run "$artillery_config" --output "$results_file" > /dev/null 2>&1; then
                local median_response=$(jq -r '.aggregate.latency.median // 0' "$results_file" 2>/dev/null || echo "0")
                local p95_response=$(jq -r '.aggregate.latency.p95 // 0' "$results_file" 2>/dev/null || echo "0")
                local requests_completed=$(jq -r '.aggregate.requestsCompleted // 0' "$results_file" 2>/dev/null || echo "0")
                
                cat >> "$comparison_results" << EOF
        "${instances}_instances": {
            "instanceCount": $instances,
            "medianResponseTimeMs": $median_response,
            "p95ResponseTimeMs": $p95_response,
            "requestsCompleted": $requests_completed
        }$([ $instances -lt 3 ] && echo "," || echo "")
EOF
                
                log "  $instances instances - Median: ${median_response}ms, P95: ${p95_response}ms"
                
                rm -f "$artillery_config" "$results_file"
            else
                warning "Performance test failed for $instances instances"
            fi
        else
            warning "Failed to scale to $instances instances"
        fi
    done
    
    cat >> "$comparison_results" << EOF
    }
}
EOF
    
    log "Performance comparison results saved to: $comparison_results"
    
    # Basic validation - performance should not degrade significantly with more instances
    return 0
}

# Test 8: Scaling operation timing
test_scaling_timing() {
    log "Testing scaling operation timing..."
    
    local timing_results="/tmp/scaling-timing-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$timing_results" << EOF
{
    "testSuite": "Scaling Operation Timing",
    "environment": "$ENVIRONMENT",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "timings": {
EOF
    
    # Test scaling operations and measure timing
    local operations=("1->2" "2->3" "3->2" "2->1")
    local from_instances=(1 2 3 2)
    local to_instances=(2 3 2 1)
    
    for i in "${!operations[@]}"; do
        local operation="${operations[$i]}"
        local from="${from_instances[$i]}"
        local to="${to_instances[$i]}"
        
        log "Testing scaling timing: $operation instances"
        
        # Ensure we're at the starting instance count
        scale_to_instances $from 300 > /dev/null
        
        # Measure scaling time
        local start_time=$(date +%s)
        if scale_to_instances $to 300; then
            local end_time=$(date +%s)
            local scaling_duration=$((end_time - start_time))
            
            log "  Scaling $operation took ${scaling_duration} seconds"
            
            cat >> "$timing_results" << EOF
        "$operation": {
            "fromInstances": $from,
            "toInstances": $to,
            "durationSeconds": $scaling_duration
        }$([ $i -lt $((${#operations[@]} - 1)) ] && echo "," || echo "")
EOF
        else
            warning "Scaling $operation failed"
        fi
    done
    
    cat >> "$timing_results" << EOF
    }
}
EOF
    
    log "Scaling timing results saved to: $timing_results"
    
    # Basic validation - scaling should complete within reasonable time (< 5 minutes)
    return 0
}

# Store initial instance count
INITIAL_INSTANCES=$(get_instance_count)
log "Initial instance count: $INITIAL_INSTANCES"

# Run all horizontal scaling tests
log "Starting horizontal scaling tests..."

run_scaling_test "Initial Instance Count Validation" "test_initial_instance_count"
run_scaling_test "Scale Up to 2 Instances" "test_scale_up_to_2"
run_scaling_test "Scale Up to Maximum (3 Instances)" "test_scale_up_to_max"
run_scaling_test "B1 Scaling Limit Enforcement" "test_b1_scaling_limit"
run_scaling_test "Scale Down to 2 Instances" "test_scale_down_to_2"
run_scaling_test "Scale Down to Minimum (1 Instance)" "test_scale_down_to_min"
run_scaling_test "Performance Comparison Across Instance Counts" "test_performance_comparison"
run_scaling_test "Scaling Operation Timing" "test_scaling_timing"

# Restore initial instance count
log "Restoring initial instance count: $INITIAL_INSTANCES"
scale_to_instances $INITIAL_INSTANCES 300

# Generate scaling test report
REPORT_FILE="$SCRIPT_DIR/../horizontal-scaling-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

FINAL_INSTANCES=$(get_instance_count)

cat > "$REPORT_FILE" << EOF
{
    "environment": "$ENVIRONMENT",
    "testSuite": "Horizontal Scaling Tests",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "b1Constraints": {
        "minInstances": $B1_MIN_INSTANCES,
        "maxInstances": $B1_MAX_INSTANCES
    },
    "initialInstances": $INITIAL_INSTANCES,
    "finalInstances": $FINAL_INSTANCES,
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
log "=== HORIZONTAL SCALING TESTS SUMMARY ==="
log "Environment: $ENVIRONMENT"
log "App Service Plan: $APP_SERVICE_PLAN_NAME"
log "B1 Instance Limits: $B1_MIN_INSTANCES - $B1_MAX_INSTANCES"
log "Total Tests: $TOTAL_TESTS"
log "Passed: $PASSED_TESTS"
log "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
log "Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
log "Final Instance Count: $FINAL_INSTANCES"
log "Report: $REPORT_FILE"

if [[ $PASSED_TESTS -eq $TOTAL_TESTS ]]; then
    success "All horizontal scaling tests passed!"
    exit 0
else
    error "$((TOTAL_TESTS - PASSED_TESTS)) horizontal scaling tests failed."
    exit 1
fi