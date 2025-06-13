#!/bin/bash

# Azure B1 Deployment Testing Master Script
# Executes comprehensive Azure deployment validation across all 6 phases
# Usage: ./run-all-tests.sh [environment] [phase]
# Example: ./run-all-tests.sh prod all
# Example: ./run-all-tests.sh staging phase1

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="$SCRIPT_DIR/azure-testing-config.json"
ENVIRONMENT=${1:-staging}
PHASE=${2:-all}
LOG_FILE="$SCRIPT_DIR/test-results-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Prerequisites check
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        error "Azure CLI not found. Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    fi
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        error "Not logged into Azure CLI. Run: az login"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not found. Install Node.js 20 LTS"
    fi
    
    # Check Artillery (for load testing)
    if ! command -v artillery &> /dev/null; then
        warning "Artillery not found. Installing..."
        npm install -g artillery
    fi
    
    # Check configuration file
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error "Configuration file not found: $CONFIG_FILE"
    fi
    
    success "Prerequisites check completed"
}

# Phase 1: Azure App Service B1 Configuration Validation
run_phase1() {
    log "Phase 1: Azure App Service B1 Configuration Validation"
    
    # Deploy infrastructure
    "$SCRIPT_DIR/phase1-b1-validation/deploy-infrastructure.sh" "$ENVIRONMENT"
    
    # Validate B1 configuration
    "$SCRIPT_DIR/phase1-b1-validation/validate-b1-config.sh" "$ENVIRONMENT"
    
    # Run performance tests
    "$SCRIPT_DIR/phase1-b1-validation/performance-validation.sh" "$ENVIRONMENT"
    
    # Verify resource constraints
    "$SCRIPT_DIR/phase1-b1-validation/resource-constraint-tests.sh" "$ENVIRONMENT"
    
    success "Phase 1 completed"
}

# Phase 2: Scaling Limitations and Options Assessment
run_phase2() {
    log "Phase 2: Scaling Limitations and Options Assessment"
    
    # Test horizontal scaling
    "$SCRIPT_DIR/phase2-scaling/horizontal-scaling-tests.sh" "$ENVIRONMENT"
    
    # Test auto-scaling
    "$SCRIPT_DIR/phase2-scaling/auto-scaling-validation.sh" "$ENVIRONMENT"
    
    # Validate scaling constraints
    "$SCRIPT_DIR/phase2-scaling/scaling-constraint-tests.sh" "$ENVIRONMENT"
    
    # Performance benchmarking
    "$SCRIPT_DIR/phase2-scaling/scaling-performance-tests.sh" "$ENVIRONMENT"
    
    success "Phase 2 completed"
}

# Phase 3: Monitoring and Logging Implementation Testing
run_phase3() {
    log "Phase 3: Monitoring and Logging Implementation Testing"
    
    # Configure Application Insights
    "$SCRIPT_DIR/phase3-monitoring/application-insights-setup.sh" "$ENVIRONMENT"
    
    # Test log streaming
    "$SCRIPT_DIR/phase3-monitoring/log-streaming-tests.sh" "$ENVIRONMENT"
    
    # Validate health checks
    "$SCRIPT_DIR/phase3-monitoring/health-check-validation.sh" "$ENVIRONMENT"
    
    # Test alerting
    "$SCRIPT_DIR/phase3-monitoring/alerting-tests.sh" "$ENVIRONMENT"
    
    success "Phase 3 completed"
}

# Phase 4: Backup and Disaster Recovery Validation
run_phase4() {
    log "Phase 4: Backup and Disaster Recovery Validation"
    
    # Test automated backups
    "$SCRIPT_DIR/phase4-backup-dr/backup-validation.sh" "$ENVIRONMENT"
    
    # Test disaster recovery
    "$SCRIPT_DIR/phase4-backup-dr/disaster-recovery-tests.sh" "$ENVIRONMENT"
    
    # Cross-region failover
    "$SCRIPT_DIR/phase4-backup-dr/failover-tests.sh" "$ENVIRONMENT"
    
    # Full DR drill
    "$SCRIPT_DIR/phase4-backup-dr/full-dr-drill.sh" "$ENVIRONMENT"
    
    success "Phase 4 completed"
}

# Phase 5: CI/CD Pipeline Integration Testing
run_phase5() {
    log "Phase 5: CI/CD Pipeline Integration Testing"
    
    # Test GitHub Actions
    "$SCRIPT_DIR/phase5-cicd/github-actions-validation.sh" "$ENVIRONMENT"
    
    # Blue-green deployment
    "$SCRIPT_DIR/phase5-cicd/blue-green-deployment.sh" "$ENVIRONMENT"
    
    # Rollback validation
    "$SCRIPT_DIR/phase5-cicd/rollback-validation.sh" "$ENVIRONMENT"
    
    # Security scanning
    "$SCRIPT_DIR/phase5-cicd/security-scanning-tests.sh" "$ENVIRONMENT"
    
    success "Phase 5 completed"
}

# Phase 6: Next.js Specific Deployment Testing
run_phase6() {
    log "Phase 6: Next.js Specific Deployment Testing"
    
    # Node.js runtime validation
    "$SCRIPT_DIR/phase6-nextjs/nodejs-runtime-tests.sh" "$ENVIRONMENT"
    
    # Static asset serving
    "$SCRIPT_DIR/phase6-nextjs/static-asset-tests.sh" "$ENVIRONMENT"
    
    # SSR performance
    "$SCRIPT_DIR/phase6-nextjs/ssr-performance-tests.sh" "$ENVIRONMENT"
    
    # Build optimization
    "$SCRIPT_DIR/phase6-nextjs/build-optimization-tests.sh" "$ENVIRONMENT"
    
    success "Phase 6 completed"
}

# Generate summary report
generate_report() {
    log "Generating test summary report..."
    
    REPORT_FILE="$SCRIPT_DIR/test-report-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Azure B1 Deployment Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .phase { margin: 20px 0; padding: 15px; border-left: 4px solid #007acc; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        .warn { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Azure B1 Deployment Test Report</h1>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Test Date:</strong> $(date)</p>
        <p><strong>Application:</strong> PantryCRM</p>
    </div>
    
    <h2>Test Results Summary</h2>
    <div id="summary">
        <!-- Summary will be populated by individual test scripts -->
    </div>
    
    <h2>Detailed Results</h2>
    <pre>$(cat "$LOG_FILE")</pre>
    
    <h2>Performance Metrics</h2>
    <div id="metrics">
        <!-- Metrics will be populated by monitoring scripts -->
    </div>
    
    <h2>Recommendations</h2>
    <div id="recommendations">
        <!-- Recommendations will be populated based on test results -->
    </div>
</body>
</html>
EOF
    
    success "Test report generated: $REPORT_FILE"
}

# Main execution
main() {
    log "Starting Azure B1 Deployment Testing Suite"
    log "Environment: $ENVIRONMENT"
    log "Phase: $PHASE"
    log "Log file: $LOG_FILE"
    
    check_prerequisites
    
    case $PHASE in
        "all")
            run_phase1
            run_phase2
            run_phase3
            run_phase4
            run_phase5
            run_phase6
            ;;
        "phase1")
            run_phase1
            ;;
        "phase2")
            run_phase2
            ;;
        "phase3")
            run_phase3
            ;;
        "phase4")
            run_phase4
            ;;
        "phase5")
            run_phase5
            ;;
        "phase6")
            run_phase6
            ;;
        *)
            error "Unknown phase: $PHASE. Valid options: all, phase1, phase2, phase3, phase4, phase5, phase6"
            ;;
    esac
    
    generate_report
    
    success "Azure B1 Deployment Testing completed successfully!"
    log "Full test log: $LOG_FILE"
}

# Run main function
main "$@"