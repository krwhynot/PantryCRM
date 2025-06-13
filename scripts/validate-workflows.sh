#!/bin/bash
# PantryCRM GitHub Actions Workflow Validation Script
# This script validates all GitHub Actions workflows locally before pushing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKFLOWS_DIR=".github/workflows"
ACT_VERSION="0.2.65"
VALIDATION_RESULTS=()

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

# Function to check if act is installed
check_act_installed() {
    if ! command -v act &> /dev/null; then
        print_status "warning" "act is not installed. Installing..."
        
        # Install act based on OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash -s -- -b /usr/local/bin v${ACT_VERSION}
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install act
        else
            print_status "error" "Unsupported OS for automatic act installation"
            echo "Please install act manually: https://github.com/nektos/act"
            exit 1
        fi
    fi
    
    print_status "success" "act is installed ($(act --version))"
}

# Function to validate YAML syntax
validate_yaml_syntax() {
    local workflow=$1
    local workflow_name=$(basename "$workflow")
    
    print_status "info" "Validating YAML syntax for $workflow_name"
    
    # Check if file exists
    if [ ! -f "$workflow" ]; then
        print_status "error" "Workflow file not found: $workflow"
        return 1
    fi
    
    # Basic YAML validation using Python
    if command -v python3 &> /dev/null; then
        python3 -c "
import yaml
import sys
try:
    with open('$workflow', 'r') as f:
        yaml.safe_load(f)
    sys.exit(0)
except yaml.YAMLError as e:
    print(f'YAML Error: {e}')
    sys.exit(1)
" && print_status "success" "YAML syntax is valid" || {
            print_status "error" "YAML syntax validation failed"
            return 1
        }
    else
        print_status "warning" "Python not found, skipping YAML syntax validation"
    fi
    
    return 0
}

# Function to validate workflow with act
validate_workflow_with_act() {
    local workflow=$1
    local workflow_name=$(basename "$workflow")
    local event_type=${2:-push}
    
    print_status "info" "Validating $workflow_name with act (event: $event_type)"
    
    # Create temporary directory for act artifacts
    local temp_dir=$(mktemp -d)
    
    # Run act in dry-run mode
    if act -W "$workflow" -n -P ubuntu-latest=catthehacker/ubuntu:act-latest \
           --artifact-server-path "$temp_dir" \
           --env-file .env.act \
           --eventpath ".github/act-events/${event_type}.json" \
           list 2>&1 | grep -E "(Job|Stage)" > /dev/null; then
        print_status "success" "Workflow structure is valid"
        
        # List all jobs in the workflow
        echo "  Jobs found:"
        act -W "$workflow" -n list 2>&1 | grep -E "Job|Stage" | sed 's/^/    /'
        
        return 0
    else
        print_status "error" "Workflow validation failed"
        return 1
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Function to check for common workflow issues
check_workflow_issues() {
    local workflow=$1
    local workflow_name=$(basename "$workflow")
    
    print_status "info" "Checking for common issues in $workflow_name"
    
    local issues_found=0
    
    # Check for hardcoded secrets
    if grep -E "(password|secret|token|key)\\s*[:=]\\s*[\"'][^\"']+[\"']" "$workflow" > /dev/null; then
        print_status "error" "Potential hardcoded secrets found"
        issues_found=1
    fi
    
    # Check for missing checkout action
    if grep -q "runs-on:" "$workflow" && ! grep -q "actions/checkout" "$workflow"; then
        print_status "warning" "Missing checkout action - this might be intentional"
    fi
    
    # Check for outdated action versions
    if grep -E "uses:\\s*[^@]+@(master|main)($|\\s)" "$workflow" > /dev/null; then
        print_status "warning" "Using branch references instead of version tags"
    fi
    
    # Check for proper permissions
    if ! grep -q "permissions:" "$workflow"; then
        print_status "warning" "No explicit permissions defined - using default permissions"
    fi
    
    # Check for timeout settings
    if ! grep -q "timeout-minutes:" "$workflow"; then
        print_status "warning" "No timeout defined for jobs"
    fi
    
    if [ $issues_found -eq 0 ]; then
        print_status "success" "No critical issues found"
    fi
    
    return $issues_found
}

# Function to validate all workflows
validate_all_workflows() {
    print_status "info" "Starting workflow validation..."
    
    local total_workflows=0
    local passed_workflows=0
    local failed_workflows=0
    
    # Find all workflow files
    for workflow in $WORKFLOWS_DIR/*.yml $WORKFLOWS_DIR/*.yaml; do
        [ -f "$workflow" ] || continue
        
        total_workflows=$((total_workflows + 1))
        echo ""
        echo "========================================="
        echo "Validating: $(basename "$workflow")"
        echo "========================================="
        
        local workflow_passed=true
        
        # Run all validations
        if ! validate_yaml_syntax "$workflow"; then
            workflow_passed=false
        fi
        
        if ! check_workflow_issues "$workflow"; then
            workflow_passed=false
        fi
        
        # Determine event type based on workflow triggers
        local event_type="push"
        if grep -q "pull_request:" "$workflow"; then
            event_type="pull_request"
        elif grep -q "workflow_dispatch:" "$workflow"; then
            event_type="workflow_dispatch"
        fi
        
        if ! validate_workflow_with_act "$workflow" "$event_type"; then
            workflow_passed=false
        fi
        
        # Update counters
        if [ "$workflow_passed" = true ]; then
            passed_workflows=$((passed_workflows + 1))
            VALIDATION_RESULTS+=("✓ $(basename "$workflow")")
        else
            failed_workflows=$((failed_workflows + 1))
            VALIDATION_RESULTS+=("✗ $(basename "$workflow")")
        fi
    done
    
    # Print summary
    echo ""
    echo "========================================="
    echo "Validation Summary"
    echo "========================================="
    echo "Total workflows: $total_workflows"
    echo "Passed: $passed_workflows"
    echo "Failed: $failed_workflows"
    echo ""
    echo "Results:"
    for result in "${VALIDATION_RESULTS[@]}"; do
        echo "  $result"
    done
    
    return $failed_workflows
}

# Function to run specific workflow locally
run_workflow_locally() {
    local workflow=$1
    local event_type=${2:-push}
    
    print_status "info" "Running $workflow locally with act..."
    
    act -W "$workflow" \
        --env-file .env.act \
        --eventpath ".github/act-events/${event_type}.json" \
        --container-options "--memory=1750m --cpus=1" \
        -P ubuntu-latest=catthehacker/ubuntu:act-latest \
        --artifact-server-path /tmp/act-artifacts \
        --verbose
}

# Main execution
main() {
    echo "PantryCRM GitHub Actions Workflow Validator"
    echo "=========================================="
    
    # Check prerequisites
    check_act_installed
    
    # Check if .env.act exists
    if [ ! -f ".env.act" ]; then
        print_status "warning" ".env.act not found. Creating from template..."
        cp .env.act.example .env.act 2>/dev/null || {
            print_status "error" "Could not create .env.act. Please create it manually."
            exit 1
        }
    fi
    
    # Parse command line arguments
    case "${1:-validate}" in
        "validate")
            validate_all_workflows
            exit_code=$?
            ;;
        "run")
            if [ -z "$2" ]; then
                print_status "error" "Please specify a workflow file to run"
                echo "Usage: $0 run <workflow-file> [event-type]"
                exit 1
            fi
            run_workflow_locally "$2" "${3:-push}"
            exit_code=$?
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  validate    - Validate all workflows (default)"
            echo "  run         - Run a specific workflow locally"
            echo "  help        - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Validate all workflows"
            echo "  $0 validate                           # Validate all workflows"
            echo "  $0 run .github/workflows/ci.yml       # Run CI workflow"
            echo "  $0 run .github/workflows/ci.yml pull_request  # Run with PR event"
            exit 0
            ;;
        *)
            print_status "error" "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    # Exit with appropriate code
    if [ $exit_code -eq 0 ]; then
        print_status "success" "All validations passed!"
    else
        print_status "error" "Validation failed!"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"