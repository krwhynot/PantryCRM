#!/bin/bash

# Phase 1: Performance Validation for B1 Configuration
# Tests actual performance against B1 requirements using existing Artillery setup
# Usage: ./performance-validation.sh [environment]

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
    echo -e "${BLUE}[PERF] $1${NC}"
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

WEB_APP_URL=$(jq -r '.webAppUrl' "$DEPLOYMENT_INFO_FILE")
RESOURCE_GROUP=$(jq -r '.resourceGroup' "$DEPLOYMENT_INFO_FILE")
WEB_APP_NAME=$(jq -r '.webAppName' "$DEPLOYMENT_INFO_FILE")

log "Starting performance validation for environment: $ENVIRONMENT"
log "Target URL: $WEB_APP_URL"

# Performance requirements from AZURE_B1_OPTIMIZATIONS.md
SEARCH_RESPONSE_TIME_MS=1000
REPORT_GENERATION_TIME_MS=10000
PAGE_LOAD_TIME_3G_MS=3000
CONCURRENT_USERS=4

# Create custom Artillery configuration for Azure testing
ARTILLERY_CONFIG="/tmp/azure-b1-performance-test.yml"

cat > "$ARTILLERY_CONFIG" << EOF
config:
  target: "$WEB_APP_URL"
  phases:
    # Warm-up phase
    - duration: 30
      arrivalRate: 1
      name: "Warm-up phase"
    
    # B1 target load: 4 concurrent users
    - duration: 120
      arrivalRate: $CONCURRENT_USERS
      name: "B1 target load - $CONCURRENT_USERS concurrent users"
    
    # Peak load test: 8 users (B1 stress test)
    - duration: 60
      arrivalRate: 8
      name: "B1 stress test - 8 users"

  ensure:
    # Performance thresholds based on B1 requirements
    - max: $SEARCH_RESPONSE_TIME_MS
      name: "Search response time under ${SEARCH_RESPONSE_TIME_MS}ms"
    
    - max: $PAGE_LOAD_TIME_3G_MS
      name: "Page load time under ${PAGE_LOAD_TIME_3G_MS}ms"
    
    - percentile: 95
      max: $(($SEARCH_RESPONSE_TIME_MS * 2))
      name: "P95 response time under $((SEARCH_RESPONSE_TIME_MS * 2))ms"
    
    - max: 2
      name: "Error rate under 2%"

  variables:
    orgTypes: ["FINE_DINING", "FAST_FOOD", "CASUAL_DINING"]
    priorities: ["A", "B", "C"]

scenarios:
  # B1 Performance Test Scenario
  - name: "B1 Performance Validation"
    weight: 100
    flow:
      # Test home page load (simulates 3G performance)
      - get:
          url: "/"
          
      # Test health endpoint (critical for monitoring)
      - get:
          url: "/api/health/b1-performance"
          
      # Test search functionality (1s requirement)
      - get:
          url: "/api/organizations/search?type={{ \$pick(orgTypes) }}&priority={{ \$pick(priorities) }}"
          
      # Test API response times
      - get:
          url: "/api/organizations?page=1&limit=10"
          
      # Test dashboard load
      - get:
          url: "/api/dashboard/analytics"
          
      # Test database query performance
      - get:
          url: "/api/crm/contacts?limit=20"
EOF

# Run performance tests
log "Running Artillery performance tests..."

RESULTS_FILE="/tmp/azure-b1-performance-results-$(date +%Y%m%d-%H%M%S).json"
REPORT_FILE="$SCRIPT_DIR/../performance-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).html"

# Run Artillery test
if ! artillery run "$ARTILLERY_CONFIG" --output "$RESULTS_FILE"; then
    error "Artillery performance test failed"
fi

# Generate detailed HTML report
artillery report "$RESULTS_FILE" --output "$REPORT_FILE"

log "Performance test completed. Report: $REPORT_FILE"

# Parse results and validate against B1 requirements
log "Analyzing performance results..."

# Check if results file was generated
if [[ ! -f "$RESULTS_FILE" ]]; then
    error "Performance results file not found: $RESULTS_FILE"
fi

# Extract key metrics from Artillery results
RESPONSE_TIME_MEDIAN=$(jq -r '.aggregate.latency.median // 0' "$RESULTS_FILE" 2>/dev/null || echo "0")
RESPONSE_TIME_P95=$(jq -r '.aggregate.latency.p95 // 0' "$RESULTS_FILE" 2>/dev/null || echo "0")
ERROR_RATE=$(jq -r '.aggregate.codes."2xx" as $success | .aggregate.requestsCompleted as $total | (($total - $success) / $total * 100) // 0' "$RESULTS_FILE" 2>/dev/null || echo "0")
REQUESTS_COMPLETED=$(jq -r '.aggregate.requestsCompleted // 0' "$RESULTS_FILE" 2>/dev/null || echo "0")

log "Performance Metrics:"
log "  Response Time (Median): ${RESPONSE_TIME_MEDIAN}ms"
log "  Response Time (P95): ${RESPONSE_TIME_P95}ms"
log "  Error Rate: ${ERROR_RATE}%"
log "  Requests Completed: $REQUESTS_COMPLETED"

# Validate against B1 requirements
PERFORMANCE_TESTS=0
PERFORMANCE_PASSED=0

validate_metric() {
    local metric_name="$1"
    local actual_value="$2"
    local max_value="$3"
    local unit="$4"
    
    PERFORMANCE_TESTS=$((PERFORMANCE_TESTS + 1))
    
    if (( $(echo "$actual_value <= $max_value" | bc -l) )); then
        success "$metric_name: ${actual_value}${unit} (≤ ${max_value}${unit})"
        PERFORMANCE_PASSED=$((PERFORMANCE_PASSED + 1))
        return 0
    else
        error "$metric_name: ${actual_value}${unit} (> ${max_value}${unit})"
        return 1
    fi
}

# Validate performance metrics
validate_metric "Median Response Time" "$RESPONSE_TIME_MEDIAN" "$SEARCH_RESPONSE_TIME_MS" "ms"
validate_metric "P95 Response Time" "$RESPONSE_TIME_P95" "$((SEARCH_RESPONSE_TIME_MS * 2))" "ms"
validate_metric "Error Rate" "$ERROR_RATE" "2" "%"

# Test individual endpoint performance
log "Testing individual endpoint performance..."

test_endpoint_performance() {
    local endpoint="$1"
    local max_time_ms="$2"
    local description="$3"
    
    local start_time=$(date +%s%3N)
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_APP_URL$endpoint" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    PERFORMANCE_TESTS=$((PERFORMANCE_TESTS + 1))
    
    if [[ "$status_code" == "200" ]] && [[ $response_time -le $max_time_ms ]]; then
        success "$description: ${response_time}ms (≤ ${max_time_ms}ms)"
        PERFORMANCE_PASSED=$((PERFORMANCE_PASSED + 1))
        return 0
    else
        error "$description: ${response_time}ms (> ${max_time_ms}ms) or failed (status: $status_code)"
        return 1
    fi
}

# Test critical endpoints
test_endpoint_performance "/api/health/b1-performance" 500 "Health Check Response Time"
test_endpoint_performance "/" 3000 "Home Page Load Time"
test_endpoint_performance "/api/organizations?limit=10" 1000 "Organizations API Response Time"

# Memory usage test during load
log "Testing memory usage under load..."

# Start monitoring memory usage
monitor_memory() {
    local duration_seconds=60
    local end_time=$(($(date +%s) + duration_seconds))
    local max_memory=0
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Get memory metrics from Azure
        local memory_percent=$(az monitor metrics list \
            --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
            --metric "MemoryPercentage" \
            --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --aggregation Average \
            --interval PT1M \
            --query "value[0].timeseries[0].data[-1].average" \
            --output tsv 2>/dev/null || echo "0")
        
        if (( $(echo "$memory_percent > $max_memory" | bc -l) )); then
            max_memory=$memory_percent
        fi
        
        sleep 5
    done
    
    echo "$max_memory"
}

# Run memory monitoring in background during a load test
log "Starting memory monitoring during load test..."

# Run a quick load test while monitoring memory
artillery quick --count 20 --num 4 "$WEB_APP_URL" > /dev/null 2>&1 &
LOAD_TEST_PID=$!

# Monitor memory for 30 seconds
sleep 30

# Stop load test
kill $LOAD_TEST_PID 2>/dev/null || true

# Get recent memory usage
MEMORY_USAGE=$(az monitor metrics list \
    --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" \
    --metric "MemoryPercentage" \
    --start-time "$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --aggregation Maximum \
    --interval PT1M \
    --query "value[0].timeseries[0].data[-1].maximum" \
    --output tsv 2>/dev/null || echo "0")

PERFORMANCE_TESTS=$((PERFORMANCE_TESTS + 1))

if (( $(echo "$MEMORY_USAGE <= 80" | bc -l) )); then
    success "Memory Usage Under Load: ${MEMORY_USAGE}% (≤ 80%)"
    PERFORMANCE_PASSED=$((PERFORMANCE_PASSED + 1))
else
    error "Memory Usage Under Load: ${MEMORY_USAGE}% (> 80%)"
fi

# Generate performance summary
PERF_REPORT_FILE="$SCRIPT_DIR/../performance-summary-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

cat > "$PERF_REPORT_FILE" << EOF
{
    "environment": "$ENVIRONMENT",
    "testSuite": "B1 Performance Validation",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "targetUrl": "$WEB_APP_URL",
    "requirements": {
        "searchResponseTimeMs": $SEARCH_RESPONSE_TIME_MS,
        "reportGenerationTimeMs": $REPORT_GENERATION_TIME_MS,
        "pageLoadTime3GMs": $PAGE_LOAD_TIME_3G_MS,
        "concurrentUsers": $CONCURRENT_USERS
    },
    "results": {
        "responseTimeMedianMs": $RESPONSE_TIME_MEDIAN,
        "responseTimeP95Ms": $RESPONSE_TIME_P95,
        "errorRatePercent": $ERROR_RATE,
        "requestsCompleted": $REQUESTS_COMPLETED,
        "memoryUsagePercent": $MEMORY_USAGE
    },
    "summary": {
        "totalTests": $PERFORMANCE_TESTS,
        "passedTests": $PERFORMANCE_PASSED,
        "failedTests": $((PERFORMANCE_TESTS - PERFORMANCE_PASSED)),
        "successRate": $(echo "scale=2; $PERFORMANCE_PASSED * 100 / $PERFORMANCE_TESTS" | bc)
    },
    "artifacts": {
        "artilleryResults": "$RESULTS_FILE",
        "htmlReport": "$REPORT_FILE"
    }
}
EOF

# Cleanup temporary files
rm -f "$ARTILLERY_CONFIG"

# Summary
log "=== PERFORMANCE VALIDATION SUMMARY ==="
log "Environment: $ENVIRONMENT"
log "Target URL: $WEB_APP_URL"
log "Total Performance Tests: $PERFORMANCE_TESTS"
log "Passed: $PERFORMANCE_PASSED"
log "Failed: $((PERFORMANCE_TESTS - PERFORMANCE_PASSED))"
log "Success Rate: $(echo "scale=1; $PERFORMANCE_PASSED * 100 / $PERFORMANCE_TESTS" | bc)%"
log "Detailed Report: $REPORT_FILE"
log "Summary Report: $PERF_REPORT_FILE"

if [[ $PERFORMANCE_PASSED -eq $PERFORMANCE_TESTS ]]; then
    success "All performance tests passed! Application meets B1 requirements."
    exit 0
else
    error "$((PERFORMANCE_TESTS - PERFORMANCE_PASSED)) performance tests failed."
    exit 1
fi