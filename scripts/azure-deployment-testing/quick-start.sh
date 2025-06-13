#!/bin/bash

# Azure B1 Deployment Testing - Quick Start Script
# Validates prerequisites and runs essential tests
# Usage: ./quick-start.sh [environment]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT=${1:-staging}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[QUICKSTART] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log "Azure B1 Deployment Testing - Quick Start"
log "Environment: $ENVIRONMENT"

# Step 1: Check prerequisites
log "Step 1: Checking prerequisites..."

# Check Azure CLI
if ! command -v az &> /dev/null; then
    error "Azure CLI not found. Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
fi

AZURE_CLI_VERSION=$(az version --query '."azure-cli"' -o tsv)
log "✓ Azure CLI version: $AZURE_CLI_VERSION"

# Check if logged in
if ! az account show &> /dev/null; then
    error "Not logged into Azure CLI. Run: az login"
fi

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
log "✓ Azure subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js not found. Install Node.js 20 LTS"
fi

NODE_VERSION=$(node --version)
log "✓ Node.js version: $NODE_VERSION"

# Check Artillery
if ! command -v artillery &> /dev/null; then
    warning "Artillery not found. Installing globally..."
    npm install -g artillery
fi

ARTILLERY_VERSION=$(artillery version 2>/dev/null || echo "unknown")
log "✓ Artillery version: $ARTILLERY_VERSION"

# Check jq
if ! command -v jq &> /dev/null; then
    error "jq not found. Install with: apt-get install jq (Ubuntu) or brew install jq (macOS)"
fi

JQ_VERSION=$(jq --version)
log "✓ jq version: $JQ_VERSION"

# Check bc
if ! command -v bc &> /dev/null; then
    error "bc not found. Install with: apt-get install bc (Ubuntu) or brew install bc (macOS)"
fi

log "✓ bc calculator available"

success "All prerequisites check passed!"

# Step 2: Validate configuration
log "Step 2: Validating configuration..."

CONFIG_FILE="$SCRIPT_DIR/azure-testing-config.json"
if [[ ! -f "$CONFIG_FILE" ]]; then
    error "Configuration file not found: $CONFIG_FILE"
fi

# Parse and validate config
RESOURCE_GROUP=$(jq -r '.azureConfig.resourceGroupName' "$CONFIG_FILE")
LOCATION=$(jq -r '.azureConfig.location' "$CONFIG_FILE")
APP_NAME=$(jq -r '.azureConfig.appName' "$CONFIG_FILE")

if [[ "$RESOURCE_GROUP" == "null" || "$LOCATION" == "null" || "$APP_NAME" == "null" ]]; then
    error "Invalid configuration. Please update $CONFIG_FILE with your Azure details"
fi

log "✓ Resource Group: $RESOURCE_GROUP"
log "✓ Location: $LOCATION"  
log "✓ App Name: $APP_NAME"

# Step 3: Check Azure permissions
log "Step 3: Checking Azure permissions..."

# Check if resource group exists or can be created
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    log "✓ Resource group exists: $RESOURCE_GROUP"
else
    log "Resource group does not exist. Testing creation permissions..."
    if az group create --name "${RESOURCE_GROUP}-test" --location "$LOCATION" --dry-run &> /dev/null; then
        log "✓ Permission to create resource groups"
    else
        error "No permission to create resource groups. Contact your Azure administrator."
    fi
fi

# Check role assignments
USER_PRINCIPAL=$(az account show --query user.name -o tsv)
ROLES=$(az role assignment list --assignee "$USER_PRINCIPAL" --query "[].roleDefinitionName" -o tsv | tr '\n' ',' | sed 's/,$//')

log "✓ Current roles: $ROLES"

if [[ "$ROLES" == *"Owner"* || "$ROLES" == *"Contributor"* ]]; then
    log "✓ Sufficient permissions for deployment"
else
    warning "May have insufficient permissions. Ensure you have Contributor or Owner role."
fi

# Step 4: Quick connectivity test
log "Step 4: Testing Azure connectivity..."

# Test basic Azure operations
if az account list-locations --query "[?name=='$LOCATION'].displayName" -o tsv &> /dev/null; then
    log "✓ Azure API connectivity working"
else
    error "Cannot connect to Azure APIs. Check your network connection."
fi

# Step 5: Run essential tests
log "Step 5: Running essential validation tests..."

RESULTS_SUMMARY="/tmp/quickstart-results-$(date +%Y%m%d-%H%M%S).txt"

echo "Azure B1 Deployment Testing - Quick Start Results" > "$RESULTS_SUMMARY"
echo "=================================================" >> "$RESULTS_SUMMARY"
echo "Environment: $ENVIRONMENT" >> "$RESULTS_SUMMARY"
echo "Timestamp: $(date)" >> "$RESULTS_SUMMARY"
echo "User: $USER_PRINCIPAL" >> "$RESULTS_SUMMARY"
echo "Subscription: $SUBSCRIPTION_NAME" >> "$RESULTS_SUMMARY"
echo "" >> "$RESULTS_SUMMARY"

# Test 1: Infrastructure deployment (if not exists)
DEPLOYMENT_INFO_FILE="$SCRIPT_DIR/deployment-info-${ENVIRONMENT}.json"

if [[ -f "$DEPLOYMENT_INFO_FILE" ]]; then
    log "✓ Deployment info found - infrastructure already exists"
    WEB_APP_URL=$(jq -r '.webAppUrl' "$DEPLOYMENT_INFO_FILE")
    echo "Infrastructure: EXISTS" >> "$RESULTS_SUMMARY"
    echo "Web App URL: $WEB_APP_URL" >> "$RESULTS_SUMMARY"
else
    log "No existing deployment found. Run infrastructure deployment:"
    log "  ./phase1-b1-validation/deploy-infrastructure.sh $ENVIRONMENT"
    echo "Infrastructure: NOT_DEPLOYED" >> "$RESULTS_SUMMARY"
    echo "Next step: Run infrastructure deployment" >> "$RESULTS_SUMMARY"
fi

# Test 2: Basic configuration validation
log "Running basic configuration validation..."

if [[ -f "$DEPLOYMENT_INFO_FILE" ]]; then
    if "$SCRIPT_DIR/phase1-b1-validation/validate-b1-config.sh" "$ENVIRONMENT" > /dev/null 2>&1; then
        success "✓ B1 configuration validation passed"
        echo "B1 Configuration: VALID" >> "$RESULTS_SUMMARY"
    else
        warning "⚠ B1 configuration validation failed"
        echo "B1 Configuration: ISSUES_FOUND" >> "$RESULTS_SUMMARY"
    fi
else
    log "⏸ Skipping configuration validation (no deployment found)"
    echo "B1 Configuration: SKIPPED" >> "$RESULTS_SUMMARY"
fi

# Test 3: Basic performance check
if [[ -f "$DEPLOYMENT_INFO_FILE" ]]; then
    WEB_APP_URL=$(jq -r '.webAppUrl' "$DEPLOYMENT_INFO_FILE")
    
    log "Testing application responsiveness..."
    
    START_TIME=$(date +%s%3N)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_APP_URL" 2>/dev/null || echo "000")
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    
    if [[ "$HTTP_STATUS" == "200" ]]; then
        success "✓ Application responding (${RESPONSE_TIME}ms)"
        echo "Application Status: HEALTHY (${RESPONSE_TIME}ms)" >> "$RESULTS_SUMMARY"
    else
        warning "⚠ Application not responding (status: $HTTP_STATUS)"
        echo "Application Status: UNHEALTHY (status: $HTTP_STATUS)" >> "$RESULTS_SUMMARY"
    fi
else
    log "⏸ Skipping application test (no deployment found)"
    echo "Application Status: NOT_DEPLOYED" >> "$RESULTS_SUMMARY"
fi

# Step 6: Generate recommendations
log "Step 6: Generating recommendations..."

echo "" >> "$RESULTS_SUMMARY"
echo "RECOMMENDATIONS:" >> "$RESULTS_SUMMARY"
echo "=================" >> "$RESULTS_SUMMARY"

if [[ ! -f "$DEPLOYMENT_INFO_FILE" ]]; then
    echo "1. Deploy infrastructure: ./phase1-b1-validation/deploy-infrastructure.sh $ENVIRONMENT" >> "$RESULTS_SUMMARY"
    echo "2. Validate configuration: ./phase1-b1-validation/validate-b1-config.sh $ENVIRONMENT" >> "$RESULTS_SUMMARY"
    echo "3. Run performance tests: ./phase1-b1-validation/performance-validation.sh $ENVIRONMENT" >> "$RESULTS_SUMMARY"
else
    echo "1. Run full Phase 1 validation: ./run-all-tests.sh $ENVIRONMENT phase1" >> "$RESULTS_SUMMARY"
    echo "2. Test scaling capabilities: ./run-all-tests.sh $ENVIRONMENT phase2" >> "$RESULTS_SUMMARY"
    echo "3. Set up monitoring: ./run-all-tests.sh $ENVIRONMENT phase3" >> "$RESULTS_SUMMARY"
fi

echo "4. Review documentation: docs/azure-testing-guide.md" >> "$RESULTS_SUMMARY"
echo "5. Set up continuous testing schedule" >> "$RESULTS_SUMMARY"

# Display results summary
echo ""
log "=== QUICK START SUMMARY ==="
cat "$RESULTS_SUMMARY"

# Save results
FINAL_RESULTS_FILE="$SCRIPT_DIR/quickstart-results-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).txt"
cp "$RESULTS_SUMMARY" "$FINAL_RESULTS_FILE"

log "Results saved to: $FINAL_RESULTS_FILE"

# Next steps
echo ""
log "=== NEXT STEPS ==="
if [[ ! -f "$DEPLOYMENT_INFO_FILE" ]]; then
    log "1. Deploy infrastructure:"
    log "   cd $SCRIPT_DIR/phase1-b1-validation"
    log "   ./deploy-infrastructure.sh $ENVIRONMENT"
    log ""
    log "2. Run complete validation:"
    log "   cd $SCRIPT_DIR"
    log "   ./run-all-tests.sh $ENVIRONMENT phase1"
else
    log "1. Run complete test suite:"
    log "   cd $SCRIPT_DIR"
    log "   ./run-all-tests.sh $ENVIRONMENT all"
    log ""
    log "2. Review detailed documentation:"
    log "   docs/azure-testing-guide.md"
fi

success "Quick start completed successfully!"

# Cleanup temp files
rm -f "$RESULTS_SUMMARY"