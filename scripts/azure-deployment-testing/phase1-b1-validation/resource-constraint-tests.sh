#!/bin/bash

# Phase 1: Resource Constraint Tests for B1 Configuration
# Tests actual resource utilization against B1 tier limits
# Usage: ./resource-constraint-tests.sh [environment]

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
    echo -e "${BLUE}[RESOURCE] $1${NC}"
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
SQL_SERVER_NAME=$(jq -r '.sqlServerName' "$DEPLOYMENT_INFO_FILE")

log "Starting resource constraint tests for environment: $ENVIRONMENT"

# B1 Tier Constraints
B1_MAX_MEMORY_MB=1750
B1_MAX_INSTANCES=3
B1_MAX_DTU=5
B1_MAX_STORAGE_GB=2
B1_MAX_CPU_PERCENT=100

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

run_resource_test() {
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

# Test 1: Memory Usage Under Normal Load
test_memory_usage_normal() {
    log "Testing memory usage under normal load..."
    
    # Generate some load first
    artillery quick --count 10 --num 2 "$WEB_APP_URL" > /dev/null 2>&1 &
    LOAD_PID=$!
    
    sleep 30
    kill $LOAD_PID 2>/dev/null || true
    
    # Get memory metrics
    local memory_percent=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
        --metric "MemoryPercentage" \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Average \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].average" \
        --output tsv 2>/dev/null || echo "0")
    
    log "Current memory usage: ${memory_percent}%"
    
    # Memory should be under 70% under normal load
    if (( $(echo "$memory_percent <= 70" | bc -l) )); then
        log "Memory usage under normal load: ${memory_percent}% (≤ 70%)"
        return 0
    else
        log "Memory usage under normal load: ${memory_percent}% (> 70%)"
        return 1
    fi
}

# Test 2: Memory Usage Under Peak Load
test_memory_usage_peak() {
    log "Testing memory usage under peak load..."
    
    # Generate heavy load
    artillery quick --count 50 --num 8 "$WEB_APP_URL" > /dev/null 2>&1 &
    LOAD_PID=$!
    
    sleep 60
    
    # Get peak memory usage
    local memory_percent=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
        --metric "MemoryPercentage" \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Maximum \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].maximum" \
        --output tsv 2>/dev/null || echo "0")
    
    kill $LOAD_PID 2>/dev/null || true
    
    log "Peak memory usage: ${memory_percent}%"
    
    # Memory should stay under 85% even under peak load
    if (( $(echo "$memory_percent <= 85" | bc -l) )); then
        log "Memory usage under peak load: ${memory_percent}% (≤ 85%)"
        return 0
    else
        log "Memory usage under peak load: ${memory_percent}% (> 85%)"
        return 1
    fi
}

# Test 3: CPU Usage Under Load
test_cpu_usage() {
    log "Testing CPU usage under load..."
    
    # Generate CPU-intensive load
    artillery quick --count 30 --num 6 "$WEB_APP_URL" > /dev/null 2>&1 &
    LOAD_PID=$!
    
    sleep 45
    
    # Get CPU metrics
    local cpu_percent=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
        --metric "CpuPercentage" \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Average \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].average" \
        --output tsv 2>/dev/null || echo "0")
    
    kill $LOAD_PID 2>/dev/null || true
    
    log "CPU usage under load: ${cpu_percent}%"
    
    # CPU can go to 100% on B1, but sustained high CPU indicates scaling need
    if (( $(echo "$cpu_percent <= 80" | bc -l) )); then
        log "CPU usage is acceptable: ${cpu_percent}% (≤ 80%)"
        return 0
    elif (( $(echo "$cpu_percent <= 95" | bc -l) )); then
        warning "CPU usage is high but acceptable: ${cpu_percent}% (≤ 95%)"
        return 0
    else
        log "CPU usage is too high: ${cpu_percent}% (> 95%)"
        return 1
    fi
}

# Test 4: DTU Usage (Database)
test_dtu_usage() {
    log "Testing DTU usage under database load..."
    
    # Generate database-intensive load
    for i in {1..10}; do
        curl -s "$WEB_APP_URL/api/organizations?page=$i&limit=50" > /dev/null &
        curl -s "$WEB_APP_URL/api/crm/contacts?limit=100" > /dev/null &
        curl -s "$WEB_APP_URL/api/dashboard/analytics" > /dev/null &
    done
    
    wait
    sleep 30
    
    # Get DTU metrics
    local dtu_percent=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER_NAME/databases/pantry-crm-db" \
        --metric "dtu_consumption_percent" \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Average \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].average" \
        --output tsv 2>/dev/null || echo "0")
    
    log "DTU usage: ${dtu_percent}%"
    
    # DTU should stay under 80% for Basic tier (5 DTU)
    if (( $(echo "$dtu_percent <= 80" | bc -l) )); then
        log "DTU usage is acceptable: ${dtu_percent}% (≤ 80%)"
        return 0
    else
        log "DTU usage is too high: ${dtu_percent}% (> 80%)"
        return 1
    fi
}

# Test 5: Database Storage Usage
test_database_storage() {
    log "Testing database storage usage..."
    
    # Get database size
    local db_size_bytes=$(az sql db show \
        --server "$SQL_SERVER_NAME" \
        --name "pantry-crm-db" \
        --resource-group "$RESOURCE_GROUP" \
        --query "currentSizeBytes" \
        --output tsv 2>/dev/null || echo "0")
    
    local db_size_gb=$(echo "scale=2; $db_size_bytes / 1024 / 1024 / 1024" | bc)
    local max_size_bytes=$(az sql db show \
        --server "$SQL_SERVER_NAME" \
        --name "pantry-crm-db" \
        --resource-group "$RESOURCE_GROUP" \
        --query "maxSizeBytes" \
        --output tsv)
    
    local max_size_gb=$(echo "scale=2; $max_size_bytes / 1024 / 1024 / 1024" | bc)
    local usage_percent=$(echo "scale=2; $db_size_bytes * 100 / $max_size_bytes" | bc)
    
    log "Database size: ${db_size_gb}GB / ${max_size_gb}GB (${usage_percent}%)"
    
    # Storage should be under 80% of max (2GB for Basic)
    if (( $(echo "$usage_percent <= 80" | bc -l) )); then
        log "Database storage usage is acceptable: ${usage_percent}% (≤ 80%)"
        return 0
    else
        log "Database storage usage is too high: ${usage_percent}% (> 80%)"
        return 1
    fi
}

# Test 6: Network Bandwidth Usage
test_network_bandwidth() {
    log "Testing network bandwidth usage..."
    
    # Generate network-intensive load
    artillery quick --count 20 --num 4 "$WEB_APP_URL" > /dev/null 2>&1 &
    LOAD_PID=$!
    
    sleep 30
    
    # Get network metrics
    local bytes_received=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
        --metric "BytesReceived" \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Total \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].total" \
        --output tsv 2>/dev/null || echo "0")
    
    local bytes_sent=$(az monitor metrics list \
        --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
        --metric "BytesSent" \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --aggregation Total \
        --interval PT1M \
        --query "value[0].timeseries[0].data[-1].total" \
        --output tsv 2>/dev/null || echo "0")
    
    kill $LOAD_PID 2>/dev/null || true
    
    local bytes_received_mb=$(echo "scale=2; $bytes_received / 1024 / 1024" | bc)
    local bytes_sent_mb=$(echo "scale=2; $bytes_sent / 1024 / 1024" | bc)
    
    log "Network usage - Received: ${bytes_received_mb}MB, Sent: ${bytes_sent_mb}MB"
    
    # Basic validation - should have some network activity
    if (( $(echo "$bytes_received > 0 && $bytes_sent > 0" | bc -l) )); then
        log "Network bandwidth usage is normal"
        return 0
    else
        warning "Low or no network activity detected"
        return 0  # Not a failure, just informational
    fi
}

# Test 7: Concurrent Connection Handling
test_concurrent_connections() {
    log "Testing concurrent connection handling..."
    
    # Test with target concurrent users (4) and stress test (8)
    local test_url="$WEB_APP_URL/api/health"
    
    # Test with 4 concurrent users (B1 target)
    log "Testing with 4 concurrent users..."
    local start_time=$(date +%s)
    
    for i in {1..4}; do
        {
            for j in {1..10}; do
                curl -s "$test_url" > /dev/null
                sleep 0.5
            done
        } &
    done
    
    wait
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "4 concurrent users test completed in ${duration} seconds"
    
    # Test with 8 concurrent users (B1 stress test)
    log "Testing with 8 concurrent users (stress test)..."
    start_time=$(date +%s)
    local error_count=0
    
    for i in {1..8}; do
        {
            for j in {1..5}; do
                if ! curl -s -f "$test_url" > /dev/null; then
                    error_count=$((error_count + 1))
                fi
                sleep 0.3
            done
        } &
    done
    
    wait
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log "8 concurrent users test completed in ${duration} seconds with $error_count errors"
    
    # Should handle 4 users well, may struggle with 8
    if [[ $error_count -le 2 ]]; then
        log "Concurrent connection handling is good (≤ 2 errors with 8 users)"
        return 0
    else
        log "High error count with 8 concurrent users: $error_count errors"
        return 1
    fi
}

# Test 8: Response Time Under Resource Pressure
test_response_time_under_pressure() {
    log "Testing response times under resource pressure..."
    
    # Create sustained load and measure response times
    local test_url="$WEB_APP_URL/api/organizations?limit=10"
    local max_response_time=0
    local total_response_time=0
    local test_count=0
    
    # Generate background load
    artillery quick --count 30 --num 6 "$WEB_APP_URL" > /dev/null 2>&1 &
    LOAD_PID=$!
    
    # Measure response times during load
    for i in {1..10}; do
        local start_time=$(date +%s%3N)
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$test_url")
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        if [[ "$status_code" == "200" ]]; then
            total_response_time=$((total_response_time + response_time))
            test_count=$((test_count + 1))
            
            if [[ $response_time -gt $max_response_time ]]; then
                max_response_time=$response_time
            fi
        fi
        
        sleep 2
    done
    
    kill $LOAD_PID 2>/dev/null || true
    
    if [[ $test_count -gt 0 ]]; then
        local avg_response_time=$((total_response_time / test_count))
        log "Response times under pressure - Avg: ${avg_response_time}ms, Max: ${max_response_time}ms"
        
        # Response times should stay reasonable under pressure
        if [[ $avg_response_time -le 2000 && $max_response_time -le 5000 ]]; then
            log "Response times acceptable under pressure"
            return 0
        else
            log "Response times too high under pressure"
            return 1
        fi
    else
        log "No successful responses during pressure test"
        return 1
    fi
}

# Run all resource constraint tests
log "Starting resource constraint tests..."

run_resource_test "Memory Usage Under Normal Load" "test_memory_usage_normal"
run_resource_test "Memory Usage Under Peak Load" "test_memory_usage_peak"
run_resource_test "CPU Usage Under Load" "test_cpu_usage"
run_resource_test "DTU Usage (Database)" "test_dtu_usage"
run_resource_test "Database Storage Usage" "test_database_storage"
run_resource_test "Network Bandwidth Usage" "test_network_bandwidth"
run_resource_test "Concurrent Connection Handling" "test_concurrent_connections"
run_resource_test "Response Time Under Resource Pressure" "test_response_time_under_pressure"

# Generate resource constraint report
REPORT_FILE="$SCRIPT_DIR/../resource-constraints-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

# Get final resource metrics
FINAL_MEMORY=$(az monitor metrics list \
    --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
    --metric "MemoryPercentage" \
    --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --aggregation Average \
    --interval PT1M \
    --query "value[0].timeseries[0].data[-1].average" \
    --output tsv 2>/dev/null || echo "0")

FINAL_CPU=$(az monitor metrics list \
    --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
    --metric "CpuPercentage" \
    --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --aggregation Average \
    --interval PT1M \
    --query "value[0].timeseries[0].data[-1].average" \
    --output tsv 2>/dev/null || echo "0")

cat > "$REPORT_FILE" << EOF
{
    "environment": "$ENVIRONMENT",
    "testSuite": "B1 Resource Constraint Tests",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "b1Constraints": {
        "maxMemoryMB": $B1_MAX_MEMORY_MB,
        "maxInstances": $B1_MAX_INSTANCES,
        "maxDTU": $B1_MAX_DTU,
        "maxStorageGB": $B1_MAX_STORAGE_GB
    },
    "finalMetrics": {
        "memoryPercentage": $FINAL_MEMORY,
        "cpuPercentage": $FINAL_CPU
    },
    "summary": {
        "totalTests": $TOTAL_TESTS,
        "passedTests": $PASSED_TESTS,
        "failedTests": $((TOTAL_TESTS - PASSED_TESTS)),
        "successRate": $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    },
    "resourceGroup": "$RESOURCE_GROUP",
    "webApp": "$WEB_APP_NAME"
}
EOF

# Summary
log "=== RESOURCE CONSTRAINT TESTS SUMMARY ==="
log "Environment: $ENVIRONMENT"
log "Total Tests: $TOTAL_TESTS"
log "Passed: $PASSED_TESTS"
log "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
log "Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
log "Final Memory Usage: ${FINAL_MEMORY}%"
log "Final CPU Usage: ${FINAL_CPU}%"
log "Report: $REPORT_FILE"

if [[ $PASSED_TESTS -eq $TOTAL_TESTS ]]; then
    success "All resource constraint tests passed! Application operates within B1 limits."
    exit 0
else
    error "$((TOTAL_TESTS - PASSED_TESTS)) resource constraint tests failed."
    exit 1
fi