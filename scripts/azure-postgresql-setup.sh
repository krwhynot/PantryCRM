#!/bin/bash

##############################################################################
# Azure PostgreSQL Setup Script for PantryCRM Migration
# 
# This script creates and configures Azure PostgreSQL Flexible Server
# optimized for B1 tier constraints and migration requirements
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="kitchen-pantry-crm-rg"
LOCATION="centralus"
SERVER_NAME="pantrycrm-postgres"
ADMIN_USER="crmadmin"
DATABASE_NAME="pantrycrm"
VERSION="15"
SKU_NAME="Standard_B1ms"  # B1 tier equivalent

# Derived names
BACKUP_SERVER_NAME="pantrycrm-postgres-backup"
PRIVATE_ENDPOINT_NAME="pantrycrm-postgres-pe"

echo -e "${BLUE}🚀 Starting Azure PostgreSQL Setup for PantryCRM Migration${NC}"
echo -e "${BLUE}=================================================${NC}\n"

# Check if user is logged in
echo -e "${YELLOW}📋 Checking Azure CLI authentication...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Azure CLI. Please run 'az login' first.${NC}"
    exit 1
fi

# Get current subscription info
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Authenticated to subscription: ${SUBSCRIPTION_NAME}${NC}"
echo -e "${GREEN}   Subscription ID: ${SUBSCRIPTION_ID}${NC}\n"

# Check if resource group exists
echo -e "${YELLOW}🔍 Checking resource group: ${RESOURCE_GROUP}...${NC}"
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Resource group doesn't exist. Creating it...${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    echo -e "${GREEN}✅ Resource group created${NC}"
else
    echo -e "${GREEN}✅ Resource group exists${NC}"
fi

# Generate secure admin password
echo -e "${YELLOW}🔐 Generating secure admin password...${NC}"
ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo -e "${GREEN}✅ Admin password generated (will be stored securely)${NC}\n"

# Check if PostgreSQL server already exists
echo -e "${YELLOW}🔍 Checking if PostgreSQL server exists...${NC}"
if az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$SERVER_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL server '$SERVER_NAME' already exists.${NC}"
    echo -e "${YELLOW}   Do you want to continue with existing server? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Aborted by user${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Using existing PostgreSQL server${NC}"
    EXISTING_SERVER=true
else
    EXISTING_SERVER=false
fi

# Create PostgreSQL Flexible Server (if not exists)
if [ "$EXISTING_SERVER" = false ]; then
    echo -e "${YELLOW}🗄️  Creating PostgreSQL Flexible Server...${NC}"
    echo -e "${BLUE}   Server Name: ${SERVER_NAME}${NC}"
    echo -e "${BLUE}   Location: ${LOCATION}${NC}"
    echo -e "${BLUE}   SKU: ${SKU_NAME} (B1 optimized)${NC}"
    echo -e "${BLUE}   Version: PostgreSQL ${VERSION}${NC}\n"

    az postgres flexible-server create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$SERVER_NAME" \
        --location "$LOCATION" \
        --admin-user "$ADMIN_USER" \
        --admin-password "$ADMIN_PASSWORD" \
        --sku-name "$SKU_NAME" \
        --tier "Burstable" \
        --version "$VERSION" \
        --storage-size 32 \
        --storage-auto-grow Enabled \
        --backup-retention 7 \
        --geo-redundant-backup Disabled \
        --high-availability Disabled \
        --yes

    echo -e "${GREEN}✅ PostgreSQL server created successfully${NC}\n"
else
    echo -e "${GREEN}✅ Using existing PostgreSQL server${NC}\n"
fi

# Configure firewall rules for development and Azure services
echo -e "${YELLOW}🔥 Configuring firewall rules...${NC}"

# Allow Azure services
az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --rule-name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none

echo -e "${GREEN}✅ Azure services access enabled${NC}"

# Allow current IP for development (get public IP)
echo -e "${YELLOW}🌐 Getting current public IP for development access...${NC}"
CURRENT_IP=$(curl -s https://api.ipify.org)
if [ -n "$CURRENT_IP" ]; then
    az postgres flexible-server firewall-rule create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$SERVER_NAME" \
        --rule-name "AllowCurrentIP" \
        --start-ip-address "$CURRENT_IP" \
        --end-ip-address "$CURRENT_IP" \
        --output none
    echo -e "${GREEN}✅ Current IP ($CURRENT_IP) access enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Could not determine current IP. Add firewall rule manually if needed.${NC}"
fi

# Create database
echo -e "${YELLOW}🗃️  Creating application database...${NC}"
az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$SERVER_NAME" \
    --database-name "$DATABASE_NAME" \
    --output none

echo -e "${GREEN}✅ Database '${DATABASE_NAME}' created${NC}\n"

# Configure server parameters for B1 optimization
echo -e "${YELLOW}⚙️  Configuring server parameters for B1 optimization...${NC}"

# Connection and memory settings optimized for B1
PARAMETERS=(
    "max_connections=50"                    # Limit connections for B1
    "shared_buffers=128MB"                  # Conservative memory setting
    "effective_cache_size=512MB"            # Memory available for caching
    "work_mem=4MB"                          # Memory for query operations
    "maintenance_work_mem=64MB"             # Memory for maintenance
    "checkpoint_completion_target=0.9"      # Spread checkpoint I/O
    "wal_buffers=16MB"                      # WAL buffer size
    "default_statistics_target=100"         # Statistics target
    "random_page_cost=1.1"                  # SSD optimization
    "effective_io_concurrency=200"          # SSD optimization
    "log_min_duration_statement=1000"       # Log slow queries (1s+)
    "log_checkpoints=on"                    # Monitor checkpoints
    "log_connections=on"                    # Monitor connections
    "log_disconnections=on"                 # Monitor disconnections
    "log_lock_waits=on"                     # Monitor lock waits
)

for param in "${PARAMETERS[@]}"; do
    IFS='=' read -r param_name param_value <<< "$param"
    echo -e "${BLUE}   Setting ${param_name} = ${param_value}${NC}"
    
    az postgres flexible-server parameter set \
        --resource-group "$RESOURCE_GROUP" \
        --server-name "$SERVER_NAME" \
        --name "$param_name" \
        --value "$param_value" \
        --output none
done

echo -e "${GREEN}✅ Server parameters configured for B1 optimization${NC}\n"

# Get connection information
echo -e "${YELLOW}📊 Retrieving connection information...${NC}"
SERVER_FQDN=$(az postgres flexible-server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --query "fullyQualifiedDomainName" -o tsv)

CONNECTION_STRING="postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_FQDN}:5432/${DATABASE_NAME}?sslmode=require"

echo -e "${GREEN}✅ PostgreSQL setup completed successfully!${NC}\n"

# Display connection information
echo -e "${BLUE}📋 Connection Information:${NC}"
echo -e "${BLUE}=========================${NC}"
echo -e "${GREEN}Server FQDN:    ${SERVER_FQDN}${NC}"
echo -e "${GREEN}Database:       ${DATABASE_NAME}${NC}"
echo -e "${GREEN}Admin User:     ${ADMIN_USER}${NC}"
echo -e "${GREEN}Admin Password: ${ADMIN_PASSWORD}${NC}"
echo -e "${GREEN}Port:           5432${NC}"
echo -e "${GREEN}SSL Mode:       require${NC}\n"

echo -e "${BLUE}📋 Connection String:${NC}"
echo -e "${GREEN}${CONNECTION_STRING}${NC}\n"

# Save connection info to secure file
echo -e "${YELLOW}💾 Saving connection information...${NC}"
cat > ".env.azure.postgresql" << EOF
# Azure PostgreSQL Connection Configuration
# Generated: $(date)
# 
# IMPORTANT: Keep this file secure and do not commit to version control

# Database connection
DATABASE_URL="${CONNECTION_STRING}"
POSTGRES_URL="${CONNECTION_STRING}"

# Individual components (for reference)
POSTGRES_HOST="${SERVER_FQDN}"
POSTGRES_PORT="5432"
POSTGRES_DB="${DATABASE_NAME}"
POSTGRES_USER="${ADMIN_USER}"
POSTGRES_PASSWORD="${ADMIN_PASSWORD}"

# Azure-specific
AZURE_RESOURCE_GROUP="${RESOURCE_GROUP}"
AZURE_POSTGRES_SERVER="${SERVER_NAME}"
AZURE_LOCATION="${LOCATION}"

# SSL Configuration
PGSSLMODE="require"
PGCLIENTENCODING="UTF8"
EOF

echo -e "${GREEN}✅ Connection info saved to .env.azure.postgresql${NC}"

# Add to .gitignore if not already present
if ! grep -q ".env.azure.postgresql" .gitignore 2>/dev/null; then
    echo ".env.azure.postgresql" >> .gitignore
    echo -e "${GREEN}✅ Added .env.azure.postgresql to .gitignore${NC}"
fi

# Test connection
echo -e "${YELLOW}🧪 Testing database connection...${NC}"
if command -v psql &> /dev/null; then
    if psql "$CONNECTION_STRING" -c "SELECT version();" &> /dev/null; then
        echo -e "${GREEN}✅ Database connection test successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Connection test failed (may need firewall adjustment)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  psql not installed - skipping connection test${NC}"
fi

# Create backup configuration
echo -e "${YELLOW}🔄 Setting up automated backup retention...${NC}"
az postgres flexible-server backup retention set \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$SERVER_NAME" \
    --backup-retention 7 \
    --output none

echo -e "${GREEN}✅ Backup retention set to 7 days${NC}\n"

# Security recommendations
echo -e "${BLUE}🔒 Security Recommendations:${NC}"
echo -e "${BLUE}============================${NC}"
echo -e "${YELLOW}1. Store DATABASE_URL in Azure Key Vault for production${NC}"
echo -e "${YELLOW}2. Use Managed Identity for application authentication${NC}"
echo -e "${YELLOW}3. Consider Private Endpoint for production workloads${NC}"
echo -e "${YELLOW}4. Enable Advanced Threat Protection${NC}"
echo -e "${YELLOW}5. Review firewall rules before production deployment${NC}\n"

# Next steps
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "${GREEN}1. Update your .env files with DATABASE_URL${NC}"
echo -e "${GREEN}2. Run: npm run drizzle:push (to create schema)${NC}"
echo -e "${GREEN}3. Run: npm run settings:migrate (to migrate data)${NC}"
echo -e "${GREEN}4. Test application with PostgreSQL connection${NC}"
echo -e "${GREEN}5. Update production environment variables${NC}\n"

# Performance monitoring setup
echo -e "${YELLOW}📊 Setting up performance monitoring...${NC}"
az postgres flexible-server parameter set \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$SERVER_NAME" \
    --name "pg_stat_statements.track" \
    --value "all" \
    --output none

echo -e "${GREEN}✅ Performance monitoring enabled${NC}"

echo -e "${BLUE}🎉 Azure PostgreSQL Infrastructure Setup Complete!${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Create monitoring script
cat > "scripts/monitor-postgres.sh" << 'EOF'
#!/bin/bash
# PostgreSQL Monitoring Script

RESOURCE_GROUP="kitchen-pantry-crm-rg"
SERVER_NAME="pantrycrm-postgres"

echo "📊 PostgreSQL Server Status:"
az postgres flexible-server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --query "{Name:name,State:state,Tier:sku.tier,Capacity:sku.name,Storage:storage.storageSizeGB}" \
    --output table

echo -e "\n🔥 Firewall Rules:"
az postgres flexible-server firewall-rule list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --output table

echo -e "\n⚙️  Server Parameters (Key Settings):"
az postgres flexible-server parameter list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --query "[?name=='max_connections'||name=='shared_buffers'||name=='work_mem'].{Parameter:name,Value:value}" \
    --output table
EOF

chmod +x "scripts/monitor-postgres.sh"
echo -e "${GREEN}✅ Monitoring script created: scripts/monitor-postgres.sh${NC}\n"

echo -e "${GREEN}🏁 Setup completed successfully!${NC}"
echo -e "${GREEN}   Connection string saved to .env.azure.postgresql${NC}"
echo -e "${GREEN}   Ready for Drizzle migration!${NC}"