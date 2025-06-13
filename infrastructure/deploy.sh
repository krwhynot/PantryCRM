#!/bin/bash

# PantryCRM Infrastructure Deployment Script
# Deploys Azure infrastructure using Bicep templates

set -e

# Configuration
RESOURCE_GROUP_NAME="pantry-crm-prod"
LOCATION="East US"
DEPLOYMENT_NAME="pantry-crm-$(date +%Y%m%d-%H%M%S)"
BICEP_FILE="main.bicep"
ENVIRONMENT="prod"
APP_NAME="pantry-crm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}PantryCRM Infrastructure Deployment${NC}"
echo "======================================"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Location: $LOCATION"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Please install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo "Checking Azure authentication..."
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Please log in:${NC}"
    az login
fi

# Display current subscription
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Current subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"
echo ""

# Confirm deployment
read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Prompt for SQL admin password
echo ""
echo -e "${YELLOW}SQL Database Configuration${NC}"
read -p "SQL Admin Username (default: pantry_admin): " SQL_ADMIN_USERNAME
SQL_ADMIN_USERNAME=${SQL_ADMIN_USERNAME:-pantry_admin}

while true; do
    read -s -p "SQL Admin Password: " SQL_ADMIN_PASSWORD
    echo
    read -s -p "Confirm SQL Admin Password: " SQL_ADMIN_PASSWORD_CONFIRM
    echo
    
    if [ "$SQL_ADMIN_PASSWORD" = "$SQL_ADMIN_PASSWORD_CONFIRM" ]; then
        if [ ${#SQL_ADMIN_PASSWORD} -lt 8 ]; then
            echo -e "${RED}Password must be at least 8 characters long${NC}"
            continue
        fi
        break
    else
        echo -e "${RED}Passwords do not match${NC}"
    fi
done

# Create resource group if it doesn't exist
echo ""
echo "Creating resource group if it doesn't exist..."
az group create \
    --name $RESOURCE_GROUP_NAME \
    --location "$LOCATION" \
    --output table

# Validate Bicep template
echo ""
echo "Validating Bicep template..."
az deployment group validate \
    --resource-group $RESOURCE_GROUP_NAME \
    --template-file $BICEP_FILE \
    --parameters \
        environment=$ENVIRONMENT \
        appName=$APP_NAME \
        sqlAdminUsername=$SQL_ADMIN_USERNAME \
        sqlAdminPassword=$SQL_ADMIN_PASSWORD \
    --output table

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Template validation successful${NC}"
else
    echo -e "${RED}✗ Template validation failed${NC}"
    exit 1
fi

# Deploy infrastructure
echo ""
echo "Deploying infrastructure..."
echo "This may take 10-15 minutes..."

DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group $RESOURCE_GROUP_NAME \
    --name $DEPLOYMENT_NAME \
    --template-file $BICEP_FILE \
    --parameters \
        environment=$ENVIRONMENT \
        appName=$APP_NAME \
        sqlAdminUsername=$SQL_ADMIN_USERNAME \
        sqlAdminPassword=$SQL_ADMIN_PASSWORD \
    --output json)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Infrastructure deployment successful${NC}"
else
    echo -e "${RED}✗ Infrastructure deployment failed${NC}"
    exit 1
fi

# Extract outputs
echo ""
echo "Extracting deployment outputs..."

WEB_APP_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.webAppName.value')
WEB_APP_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.webAppUrl.value')
SQL_SERVER_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.sqlServerName.value')
SQL_DATABASE_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.sqlDatabaseName.value')
STORAGE_ACCOUNT_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.storageAccountName.value')
KEY_VAULT_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.keyVaultName.value')
KEY_VAULT_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.keyVaultUrl.value')
APP_INSIGHTS_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.applicationInsightsName.value')
APP_INSIGHTS_CONNECTION_STRING=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.applicationInsightsConnectionString.value')

# Create environment file
echo ""
echo "Creating environment configuration file..."

ENV_FILE=".env.azure.prod"
cat > $ENV_FILE << EOF
# PantryCRM Production Environment Configuration
# Generated: $(date)

# Database Configuration
DATABASE_URL="sqlserver://${SQL_SERVER_NAME}.database.windows.net:1433;database=${SQL_DATABASE_NAME};user=${SQL_ADMIN_USERNAME};password=${SQL_ADMIN_PASSWORD};encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net"

# Azure Services
AZURE_KEYVAULT_URL="${KEY_VAULT_URL}"
APPLICATIONINSIGHTS_CONNECTION_STRING="${APP_INSIGHTS_CONNECTION_STRING}"
AZURE_STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME}"

# Application Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS="--max-old-space-size=1400 --optimize-for-size"

# Security (update these with actual values)
JWT_SECRET="change-this-in-production"
NEXTAUTH_URL="${WEB_APP_URL}"
NEXTAUTH_SECRET="change-this-in-production"

# OAuth Configuration (update with actual values)
# GOOGLE_ID="your-google-oauth-id"
# GOOGLE_SECRET="your-google-oauth-secret"
# GITHUB_ID="your-github-oauth-id"
# GITHUB_SECRET="your-github-oauth-secret"
EOF

echo -e "${GREEN}✓ Environment file created: $ENV_FILE${NC}"

# Set up Key Vault secrets
echo ""
echo "Setting up initial Key Vault secrets..."

# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "jwt-secret" \
    --value "$JWT_SECRET" \
    --output none

echo -e "${GREEN}✓ JWT secret stored in Key Vault${NC}"

# Display deployment summary
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "===================="
echo ""
echo "Resource Details:"
echo "  Resource Group: $RESOURCE_GROUP_NAME"
echo "  Web App: $WEB_APP_NAME"
echo "  Web App URL: $WEB_APP_URL"
echo "  SQL Server: $SQL_SERVER_NAME"
echo "  SQL Database: $SQL_DATABASE_NAME"
echo "  Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  Key Vault: $KEY_VAULT_NAME"
echo "  Application Insights: $APP_INSIGHTS_NAME"
echo ""
echo "Environment Configuration:"
echo "  Configuration file: $ENV_FILE"
echo "  Key Vault URL: $KEY_VAULT_URL"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update the environment file with your OAuth credentials"
echo "2. Deploy your application code to the App Service"
echo "3. Run database migrations"
echo "4. Configure custom domain (optional)"
echo "5. Set up monitoring alerts (already configured)"
echo ""
echo -e "${YELLOW}Cost Estimate:${NC}"
echo "  App Service B1: ~\$13/month"
echo "  SQL Database Basic: ~\$5/month"
echo "  Storage Account: ~\$0.50/month"
echo "  Key Vault: ~\$1/month"
echo "  Application Insights: ~\$2/month"
echo "  Total: ~\$21.50/month"
echo ""
echo -e "${YELLOW}Security Reminders:${NC}"
echo "1. Update JWT_SECRET in Key Vault with a secure value"
echo "2. Configure OAuth providers and store secrets in Key Vault"
echo "3. Review SQL Server firewall rules"
echo "4. Enable additional security features as needed"
echo ""
echo "Deployment completed successfully! 🚀"