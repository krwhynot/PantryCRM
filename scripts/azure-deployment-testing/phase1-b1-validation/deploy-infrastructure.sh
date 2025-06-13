#!/bin/bash

# Phase 1: Deploy Azure Infrastructure for B1 Testing
# Deploys the complete Azure infrastructure using existing Bicep template
# Usage: ./deploy-infrastructure.sh [environment]

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
    echo -e "${BLUE}[DEPLOY] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Configuration
RESOURCE_GROUP="pantry-crm-${ENVIRONMENT}-rg"
LOCATION="eastus"
BICEP_FILE="$ROOT_DIR/infrastructure/main.bicep"
DEPLOYMENT_NAME="pantry-crm-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

log "Starting Azure infrastructure deployment for environment: $ENVIRONMENT"

# Check if Bicep file exists
if [[ ! -f "$BICEP_FILE" ]]; then
    error "Bicep template not found: $BICEP_FILE"
fi

# Check Azure CLI login
if ! az account show &> /dev/null; then
    error "Not logged into Azure CLI. Run: az login"
fi

# Get subscription info
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)

log "Using subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"
log "Resource Group: $RESOURCE_GROUP"
log "Location: $LOCATION"

# Create resource group if it doesn't exist
log "Creating resource group: $RESOURCE_GROUP"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

# Generate secure SQL password
SQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
echo "Generated SQL password (save this): $SQL_PASSWORD"

# Parameters for deployment
PARAMETERS="{
    \"environment\": {\"value\": \"$ENVIRONMENT\"},
    \"location\": {\"value\": \"$LOCATION\"},
    \"appName\": {\"value\": \"pantry-crm\"},
    \"sqlAdminUsername\": {\"value\": \"pantry_admin\"},
    \"sqlAdminPassword\": {\"value\": \"$SQL_PASSWORD\"}
}"

# Create parameters file
PARAMS_FILE="/tmp/deploy-params-${DEPLOYMENT_NAME}.json"
echo "$PARAMETERS" > "$PARAMS_FILE"

log "Starting Bicep deployment: $DEPLOYMENT_NAME"

# Deploy infrastructure
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$BICEP_FILE" \
    --parameters "@$PARAMS_FILE" \
    --output table

# Check deployment status
DEPLOYMENT_STATUS=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.provisioningState" \
    --output tsv)

if [[ "$DEPLOYMENT_STATUS" == "Succeeded" ]]; then
    success "Infrastructure deployment completed successfully"
else
    error "Infrastructure deployment failed with status: $DEPLOYMENT_STATUS"
fi

# Get deployment outputs
log "Retrieving deployment outputs..."

WEB_APP_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs.webAppName.value" \
    --output tsv)

WEB_APP_URL=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs.webAppUrl.value" \
    --output tsv)

SQL_SERVER_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs.sqlServerName.value" \
    --output tsv)

STORAGE_ACCOUNT_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs.storageAccountName.value" \
    --output tsv)

KEY_VAULT_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs.keyVaultName.value" \
    --output tsv)

APP_INSIGHTS_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs.applicationInsightsName.value" \
    --output tsv)

# Save deployment info
DEPLOYMENT_INFO_FILE="$SCRIPT_DIR/../deployment-info-${ENVIRONMENT}.json"
cat > "$DEPLOYMENT_INFO_FILE" << EOF
{
    "environment": "$ENVIRONMENT",
    "deploymentName": "$DEPLOYMENT_NAME",
    "resourceGroup": "$RESOURCE_GROUP",
    "location": "$LOCATION",
    "webAppName": "$WEB_APP_NAME",
    "webAppUrl": "$WEB_APP_URL",
    "sqlServerName": "$SQL_SERVER_NAME",
    "sqlPassword": "$SQL_PASSWORD",
    "storageAccountName": "$STORAGE_ACCOUNT_NAME",
    "keyVaultName": "$KEY_VAULT_NAME",
    "applicationInsightsName": "$APP_INSIGHTS_NAME",
    "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

log "Deployment information saved to: $DEPLOYMENT_INFO_FILE"

# Validate B1 configuration
log "Validating B1 App Service Plan configuration..."

APP_SERVICE_PLAN_NAME="pantry-crm-${ENVIRONMENT}-plan"
PLAN_SKU=$(az appservice plan show \
    --name "$APP_SERVICE_PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "sku.name" \
    --output tsv)

PLAN_CAPACITY=$(az appservice plan show \
    --name "$APP_SERVICE_PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "sku.capacity" \
    --output tsv)

if [[ "$PLAN_SKU" == "B1" ]]; then
    success "App Service Plan correctly configured as B1"
else
    error "App Service Plan SKU is $PLAN_SKU, expected B1"
fi

if [[ "$PLAN_CAPACITY" == "1" ]]; then
    success "App Service Plan capacity correctly set to 1 instance"
else
    error "App Service Plan capacity is $PLAN_CAPACITY, expected 1"
fi

# Validate SQL Database configuration
log "Validating Azure SQL Database configuration..."

SQL_DB_NAME="pantry-crm-db"
DB_SERVICE_OBJECTIVE=$(az sql db show \
    --server "$SQL_SERVER_NAME" \
    --name "$SQL_DB_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "currentServiceObjectiveName" \
    --output tsv)

DB_EDITION=$(az sql db show \
    --server "$SQL_SERVER_NAME" \
    --name "$SQL_DB_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "edition" \
    --output tsv)

if [[ "$DB_EDITION" == "Basic" ]]; then
    success "SQL Database correctly configured as Basic tier"
else
    error "SQL Database edition is $DB_EDITION, expected Basic"
fi

if [[ "$DB_SERVICE_OBJECTIVE" == "Basic" ]]; then
    success "SQL Database service objective correctly set to Basic (5 DTU)"
else
    error "SQL Database service objective is $DB_SERVICE_OBJECTIVE, expected Basic"
fi

# Test connectivity
log "Testing connectivity to deployed resources..."

# Test App Service health endpoint
log "Testing App Service health endpoint..."
sleep 30 # Wait for app to start

HEALTH_URL="$WEB_APP_URL/api/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [[ "$HTTP_STATUS" == "200" ]]; then
    success "App Service health endpoint responding correctly"
else
    log "App Service health endpoint returned status: $HTTP_STATUS"
    log "Note: This may be expected if application is not yet deployed"
fi

# Test SQL connectivity
log "Testing SQL Server connectivity..."
az sql server show \
    --name "$SQL_SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "fullyQualifiedDomainName" \
    --output tsv > /dev/null

success "SQL Server connectivity verified"

# Test Storage Account
log "Testing Storage Account connectivity..."
az storage account show \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "primaryEndpoints.blob" \
    --output tsv > /dev/null

success "Storage Account connectivity verified"

# Cleanup temporary files
rm -f "$PARAMS_FILE"

log "=== DEPLOYMENT SUMMARY ==="
log "Environment: $ENVIRONMENT"
log "Resource Group: $RESOURCE_GROUP"
log "Web App: $WEB_APP_NAME"
log "Web App URL: $WEB_APP_URL"
log "SQL Server: $SQL_SERVER_NAME"
log "Storage Account: $STORAGE_ACCOUNT_NAME"
log "Key Vault: $KEY_VAULT_NAME"
log "Application Insights: $APP_INSIGHTS_NAME"
log "Deployment Info: $DEPLOYMENT_INFO_FILE"

success "Phase 1 infrastructure deployment completed successfully!"

# Output for next steps
echo ""
echo "Next steps:"
echo "1. Deploy your application code to: $WEB_APP_URL"
echo "2. Run database migrations"
echo "3. Configure environment variables in Key Vault"
echo "4. Run validation tests: ./validate-b1-config.sh $ENVIRONMENT"