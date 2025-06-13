#!/bin/bash
# PantryCRM Performance Validation Script for Azure B1 Optimization
# This script validates performance metrics for CI/CD pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Azure B1 Constraints
AZURE_B1_MEMORY_MB=1750
AZURE_B1_CPU_CORES=1

# Performance thresholds
MEMORY_THRESHOLD_MB=1536  # ~87% of B1 memory
BUILD_TIME_THRESHOLD_SEC=300  # 5 minutes
BUNDLE_SIZE_THRESHOLD_MB=50
STARTUP_TIME_THRESHOLD_SEC=30
RESPONSE_TIME_THRESHOLD_MS=1000

# Results storage
RESULTS_DIR="performance-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/performance-report-$TIMESTAMP.json"

# Initialize results directory
mkdir -p "$RESULTS_DIR"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✓${NC} $message" ;;
        "error") echo -e "${RED}✗${NC} $message" ;;
        "warning") echo -e "${YELLOW}⚠${NC} $message" ;;
        "info") echo -e "${BLUE}ℹ${NC} $message" ;;
    esac
}

# Function to measure command execution time
measure_time() {
    local start_time=$(date +%s)
    "$@"
    local end_time=$(date +%s)
    echo $((end_time - start_time))
}

# Function to get memory usage in MB
get_memory_usage() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ps aux | grep -E "node|next" | grep -v grep | awk '{sum+=$6} END {print sum/1024}'
    else
        # Linux
        ps aux | grep -E "node|next" | grep -v grep | awk '{sum+=$6} END {print sum/1024}'
    fi
}

# Function to check Node.js memory settings
check_node_memory_settings() {
    print_status "info" "Checking Node.js memory settings..."
    
    local current_max_old_space=$(node -e "console.log(process.env.NODE_OPTIONS)" | grep -oE "max-old-space-size=[0-9]+" | cut -d= -f2)
    
    if [ -z "$current_max_old_space" ]; then
        print_status "warning" "NODE_OPTIONS not set for memory limit"
        echo "export NODE_OPTIONS='--max-old-space-size=$MEMORY_THRESHOLD_MB'" >> performance-recommendations.txt
    else
        if [ "$current_max_old_space" -gt "$MEMORY_THRESHOLD_MB" ]; then
            print_status "warning" "NODE_OPTIONS memory limit ($current_max_old_space MB) exceeds Azure B1 recommendation"
        else
            print_status "success" "NODE_OPTIONS memory limit is appropriate: $current_max_old_space MB"
        fi
    fi
}

# Function to validate build performance
validate_build_performance() {
    print_status "info" "Validating build performance..."
    
    # Set memory constraint for build
    export NODE_OPTIONS="--max-old-space-size=$MEMORY_THRESHOLD_MB"
    
    # Measure build time
    local build_time=$(measure_time npm run build:azure)
    
    print_status "info" "Build completed in ${build_time}s"
    
    if [ "$build_time" -lt "$BUILD_TIME_THRESHOLD_SEC" ]; then
        print_status "success" "Build time is within threshold"
    else
        print_status "error" "Build time exceeds threshold ($BUILD_TIME_THRESHOLD_SEC s)"
    fi
    
    # Check memory usage during build
    local peak_memory=$(get_memory_usage)
    
    if (( $(echo "$peak_memory < $MEMORY_THRESHOLD_MB" | bc -l) )); then
        print_status "success" "Memory usage during build: ${peak_memory}MB"
    else
        print_status "error" "Memory usage exceeds limit: ${peak_memory}MB"
    fi
    
    # Store results
    echo "{\"build_time_seconds\": $build_time, \"peak_memory_mb\": $peak_memory}" > "$RESULTS_DIR/build-performance.json"
}

# Function to check bundle sizes
check_bundle_sizes() {
    print_status "info" "Checking bundle sizes..."
    
    if [ ! -d ".next" ]; then
        print_status "error" "Build directory .next not found. Run build first."
        return 1
    fi
    
    # Calculate total bundle size
    local total_size_kb=$(find .next -name "*.js" -o -name "*.css" | xargs du -k | awk '{sum+=$1} END {print sum}')
    local total_size_mb=$((total_size_kb / 1024))
    
    print_status "info" "Total bundle size: ${total_size_mb}MB"
    
    # Find large bundles
    print_status "info" "Largest bundles:"
    find .next -name "*.js" -size +500k -exec ls -lh {} \; | head -10
    
    # Check against threshold
    if [ "$total_size_mb" -lt "$BUNDLE_SIZE_THRESHOLD_MB" ]; then
        print_status "success" "Bundle size is within threshold"
    else
        print_status "warning" "Bundle size exceeds recommendation"
        echo "Consider code splitting and dynamic imports" >> performance-recommendations.txt
    fi
    
    # Analyze chunks
    local chunk_count=$(find .next/static/chunks -name "*.js" | wc -l)
    print_status "info" "Total chunks: $chunk_count"
    
    # Store results
    echo "{\"total_size_mb\": $total_size_mb, \"chunk_count\": $chunk_count}" > "$RESULTS_DIR/bundle-analysis.json"
}

# Function to test startup performance
test_startup_performance() {
    print_status "info" "Testing startup performance..."
    
    # Kill any existing Next.js process
    pkill -f "next start" || true
    
    # Measure startup time
    local start_time=$(date +%s)
    
    # Start the application in background
    NODE_OPTIONS="--max-old-space-size=$MEMORY_THRESHOLD_MB" npm run start > /dev/null 2>&1 &
    local app_pid=$!
    
    # Wait for app to be ready
    local ready=false
    local elapsed=0
    
    while [ "$elapsed" -lt "$STARTUP_TIME_THRESHOLD_SEC" ] && [ "$ready" == "false" ]; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            ready=true
        else
            sleep 1
            elapsed=$(($(date +%s) - start_time))
        fi
    done
    
    if [ "$ready" == "true" ]; then
        print_status "success" "Application started in ${elapsed}s"
    else
        print_status "error" "Application failed to start within ${STARTUP_TIME_THRESHOLD_SEC}s"
    fi
    
    # Check memory usage after startup
    sleep 5
    local startup_memory=$(get_memory_usage)
    print_status "info" "Memory usage after startup: ${startup_memory}MB"
    
    # Kill the process
    kill $app_pid 2>/dev/null || true
    
    # Store results
    echo "{\"startup_time_seconds\": $elapsed, \"startup_memory_mb\": $startup_memory}" > "$RESULTS_DIR/startup-performance.json"
}

# Function to run load testing
run_load_test() {
    print_status "info" "Running load test for Azure B1 capacity..."
    
    # Start application if not running
    if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        NODE_OPTIONS="--max-old-space-size=$MEMORY_THRESHOLD_MB" npm run start > /dev/null 2>&1 &
        sleep 10
    fi
    
    # Run autocannon with B1-appropriate settings
    # 4 concurrent connections (matching B1 worker count)
    print_status "info" "Running load test with 4 concurrent connections..."
    
    npx autocannon \
        -c 4 \
        -d 30 \
        -r 10 \
        --json \
        http://localhost:3000/api/organizations > "$RESULTS_DIR/load-test-results.json"
    
    # Parse results
    local avg_latency=$(cat "$RESULTS_DIR/load-test-results.json" | jq '.requests.average')
    local p99_latency=$(cat "$RESULTS_DIR/load-test-results.json" | jq '.requests.p99')
    local errors=$(cat "$RESULTS_DIR/load-test-results.json" | jq '.errors')
    local rps=$(cat "$RESULTS_DIR/load-test-results.json" | jq '.requests.sent / .duration * 1000')
    
    print_status "info" "Load test results:"
    echo "  - Average latency: ${avg_latency}ms"
    echo "  - P99 latency: ${p99_latency}ms"
    echo "  - Errors: $errors"
    echo "  - Requests/sec: $rps"
    
    # Check against thresholds
    if (( $(echo "$avg_latency < $RESPONSE_TIME_THRESHOLD_MS" | bc -l) )); then
        print_status "success" "Response time is within threshold"
    else
        print_status "error" "Response time exceeds threshold"
    fi
}

# Function to check caching effectiveness
check_caching() {
    print_status "info" "Checking caching effectiveness..."
    
    # Check Next.js cache
    if [ -d ".next/cache" ]; then
        local cache_size=$(du -sh .next/cache | awk '{print $1}')
        print_status "info" "Next.js cache size: $cache_size"
    fi
    
    # Check for cache headers in responses
    local cache_headers=$(curl -I -s http://localhost:3000/ | grep -i "cache-control")
    if [ -n "$cache_headers" ]; then
        print_status "success" "Cache headers found: $cache_headers"
    else
        print_status "warning" "No cache headers found"
    fi
    
    # Check npm cache
    local npm_cache_size=$(npm cache verify 2>&1 | grep "Content verified" | awk '{print $4}')
    print_status "info" "npm cache size: $npm_cache_size"
}

# Function to generate performance report
generate_report() {
    print_status "info" "Generating performance report..."
    
    # Combine all results
    jq -s '.[0] * .[1] * .[2] * .[3]' \
        "$RESULTS_DIR/build-performance.json" \
        "$RESULTS_DIR/bundle-analysis.json" \
        "$RESULTS_DIR/startup-performance.json" \
        "$RESULTS_DIR/load-test-results.json" \
        > "$REPORT_FILE" 2>/dev/null || echo "{}" > "$REPORT_FILE"
    
    # Add metadata
    local report=$(cat "$REPORT_FILE")
    echo "$report" | jq \
        --arg timestamp "$TIMESTAMP" \
        --arg memory_limit "$MEMORY_THRESHOLD_MB" \
        --arg cpu_cores "$AZURE_B1_CPU_CORES" \
        '. + {
            "metadata": {
                "timestamp": $timestamp,
                "constraints": {
                    "memory_limit_mb": $memory_limit,
                    "cpu_cores": $cpu_cores
                }
            }
        }' > "$REPORT_FILE"
    
    print_status "success" "Performance report generated: $REPORT_FILE"
    
    # Generate summary
    echo "## Performance Validation Summary" > "$RESULTS_DIR/summary.md"
    echo "" >> "$RESULTS_DIR/summary.md"
    echo "**Date:** $(date)" >> "$RESULTS_DIR/summary.md"
    echo "**Environment:** Azure B1 Optimization" >> "$RESULTS_DIR/summary.md"
    echo "" >> "$RESULTS_DIR/summary.md"
    echo "### Results" >> "$RESULTS_DIR/summary.md"
    cat "$REPORT_FILE" | jq -r 'to_entries | .[] | "- **\(.key)**: \(.value)"' >> "$RESULTS_DIR/summary.md"
}

# Function to check GitHub Actions cache
check_github_actions_cache() {
    print_status "info" "Checking GitHub Actions cache configuration..."
    
    # Check for cache actions in workflows
    local cache_usage=$(grep -r "actions/cache" .github/workflows/*.yml | wc -l)
    
    if [ "$cache_usage" -gt 0 ]; then
        print_status "success" "Found $cache_usage cache configurations in workflows"
        
        # List cache keys
        grep -r "key:" .github/workflows/*.yml | grep -E "(node|npm|yarn|pnpm)" | head -5
    else
        print_status "warning" "No cache actions found in workflows"
        echo "Consider adding dependency caching to speed up builds" >> performance-recommendations.txt
    fi
}

# Main execution
main() {
    echo "==================================="
    echo "PantryCRM Performance Validator"
    echo "Azure B1 Optimization Testing"
    echo "==================================="
    echo ""
    
    # Initialize recommendations file
    > performance-recommendations.txt
    
    # Run all checks
    check_node_memory_settings
    echo ""
    
    validate_build_performance
    echo ""
    
    check_bundle_sizes
    echo ""
    
    test_startup_performance
    echo ""
    
    run_load_test
    echo ""
    
    check_caching
    echo ""
    
    check_github_actions_cache
    echo ""
    
    generate_report
    echo ""
    
    # Show recommendations if any
    if [ -s performance-recommendations.txt ]; then
        print_status "warning" "Performance Recommendations:"
        cat performance-recommendations.txt
    fi
    
    print_status "success" "Performance validation completed!"
    echo "Full report available at: $REPORT_FILE"
}

# Parse command line arguments
case "${1:-all}" in
    "build")
        validate_build_performance
        ;;
    "bundle")
        check_bundle_sizes
        ;;
    "startup")
        test_startup_performance
        ;;
    "load")
        run_load_test
        ;;
    "cache")
        check_caching
        check_github_actions_cache
        ;;
    "all")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  all      - Run all performance tests (default)"
        echo "  build    - Test build performance only"
        echo "  bundle   - Check bundle sizes only"
        echo "  startup  - Test startup performance only"
        echo "  load     - Run load tests only"
        echo "  cache    - Check caching effectiveness"
        echo "  help     - Show this help message"
        exit 0
        ;;
    *)
        print_status "error" "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac