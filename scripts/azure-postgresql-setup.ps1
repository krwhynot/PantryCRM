# Azure PostgreSQL Setup Script for PantryCRM Migration (PowerShell)
# 
# This script creates and configures Azure PostgreSQL Flexible Server
# optimized for B1 tier constraints and migration requirements

param(
    [string]$ResourceGroup = "kitchen-pantry-crm-rg",
    [string]$Location = "centralus", 
    [string]$ServerName = "pantrycrm-postgres",
    [string]$AdminUser = "crmadmin",
    [string]$DatabaseName = "pantrycrm",
    [string]$Version = "15",
    [string]$SkuName = "Standard_B1ms"
)

# Colors for output
$colors = @{
    Red = "Red"
    Green = "Green" 
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $colors[$Color]
}

Write-ColorOutput "🚀 Starting Azure PostgreSQL Setup for PantryCRM Migration" "Blue"
Write-ColorOutput "==================================================" "Blue"
Write-Host ""

# Check if user is logged in to Azure
Write-ColorOutput "📋 Checking Azure CLI authentication..." "Yellow"
try {
    $account = az account show | ConvertFrom-Json
    Write-ColorOutput "✅ Authenticated to subscription: $($account.name)" "Green"
    Write-ColorOutput "   Subscription ID: $($account.id)" "Green"
} catch {
    Write-ColorOutput "❌ Not logged in to Azure CLI. Please run 'az login' first." "Red"
    exit 1
}
Write-Host ""

# Check if resource group exists
Write-ColorOutput "🔍 Checking resource group: $ResourceGroup..." "Yellow"
try {
    az group show --name $ResourceGroup --output none
    Write-ColorOutput "✅ Resource group exists" "Green"
} catch {
    Write-ColorOutput "⚠️  Resource group doesn't exist. Creating it..." "Yellow"
    az group create --name $ResourceGroup --location $Location
    Write-ColorOutput "✅ Resource group created" "Green"
}

# Generate secure admin password
Write-ColorOutput "🔐 Generating secure admin password..." "Yellow"
$AdminPassword = -join ((1..25) | ForEach-Object { Get-Random -InputObject ([char[]]([char]'a'..[char]'z') + [char[]]([char]'A'..[char]'Z') + [char[]]([char]'0'..[char]'9')) })
Write-ColorOutput "✅ Admin password generated (will be stored securely)" "Green"
Write-Host ""

# Check if PostgreSQL server already exists
Write-ColorOutput "🔍 Checking if PostgreSQL server exists..." "Yellow"
try {
    az postgres flexible-server show --resource-group $ResourceGroup --name $ServerName --output none
    Write-ColorOutput "⚠️  PostgreSQL server '$ServerName' already exists." "Yellow"
    $response = Read-Host "   Do you want to continue with existing server? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-ColorOutput "❌ Aborted by user" "Red"
        exit 1
    }
    Write-ColorOutput "✅ Using existing PostgreSQL server" "Green"
    $ExistingServer = $true
} catch {
    $ExistingServer = $false
}

# Create PostgreSQL Flexible Server (if not exists)
if (-not $ExistingServer) {
    Write-ColorOutput "🗄️  Creating PostgreSQL Flexible Server..." "Yellow"
    Write-ColorOutput "   Server Name: $ServerName" "Blue"
    Write-ColorOutput "   Location: $Location" "Blue"
    Write-ColorOutput "   SKU: $SkuName (B1 optimized)" "Blue"
    Write-ColorOutput "   Version: PostgreSQL $Version" "Blue"
    Write-Host ""

    az postgres flexible-server create `
        --resource-group $ResourceGroup `
        --name $ServerName `
        --location $Location `
        --admin-user $AdminUser `
        --admin-password $AdminPassword `
        --sku-name $SkuName `
        --tier "Burstable" `
        --version $Version `
        --storage-size 32 `
        --storage-auto-grow Enabled `
        --backup-retention 7 `
        --geo-redundant-backup Disabled `
        --high-availability Disabled `
        --yes

    Write-ColorOutput "✅ PostgreSQL server created successfully" "Green"
} else {
    Write-ColorOutput "✅ Using existing PostgreSQL server" "Green"
}
Write-Host ""

# Configure firewall rules
Write-ColorOutput "🔥 Configuring firewall rules..." "Yellow"

# Allow Azure services
az postgres flexible-server firewall-rule create `
    --resource-group $ResourceGroup `
    --name $ServerName `
    --rule-name "AllowAzureServices" `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    --output none

Write-ColorOutput "✅ Azure services access enabled" "Green"

# Allow current IP for development
Write-ColorOutput "🌐 Getting current public IP for development access..." "Yellow"
try {
    $CurrentIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content.Trim()
    if ($CurrentIP) {
        az postgres flexible-server firewall-rule create `
            --resource-group $ResourceGroup `
            --name $ServerName `
            --rule-name "AllowCurrentIP" `
            --start-ip-address $CurrentIP `
            --end-ip-address $CurrentIP `
            --output none
        Write-ColorOutput "✅ Current IP ($CurrentIP) access enabled" "Green"
    }
} catch {
    Write-ColorOutput "⚠️  Could not determine current IP. Add firewall rule manually if needed." "Yellow"
}

# Create database
Write-ColorOutput "🗃️  Creating application database..." "Yellow"
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $ServerName `
    --database-name $DatabaseName `
    --output none

Write-ColorOutput "✅ Database '$DatabaseName' created" "Green"
Write-Host ""

# Configure server parameters for B1 optimization
Write-ColorOutput "⚙️  Configuring server parameters for B1 optimization..." "Yellow"

$Parameters = @(
    @{name="max_connections"; value="50"},
    @{name="shared_buffers"; value="128MB"},
    @{name="effective_cache_size"; value="512MB"},
    @{name="work_mem"; value="4MB"},
    @{name="maintenance_work_mem"; value="64MB"},
    @{name="checkpoint_completion_target"; value="0.9"},
    @{name="wal_buffers"; value="16MB"},
    @{name="default_statistics_target"; value="100"},
    @{name="random_page_cost"; value="1.1"},
    @{name="effective_io_concurrency"; value="200"},
    @{name="log_min_duration_statement"; value="1000"},
    @{name="log_checkpoints"; value="on"},
    @{name="log_connections"; value="on"},
    @{name="log_disconnections"; value="on"},
    @{name="log_lock_waits"; value="on"}
)

foreach ($param in $Parameters) {
    Write-ColorOutput "   Setting $($param.name) = $($param.value)" "Blue"
    az postgres flexible-server parameter set `
        --resource-group $ResourceGroup `
        --server-name $ServerName `
        --name $param.name `
        --value $param.value `
        --output none
}

Write-ColorOutput "✅ Server parameters configured for B1 optimization" "Green"
Write-Host ""

# Get connection information
Write-ColorOutput "📊 Retrieving connection information..." "Yellow"
$ServerFQDN = az postgres flexible-server show `
    --resource-group $ResourceGroup `
    --name $ServerName `
    --query "fullyQualifiedDomainName" -o tsv

$ConnectionString = "postgresql://${AdminUser}:${AdminPassword}@${ServerFQDN}:5432/${DatabaseName}?sslmode=require"

Write-ColorOutput "✅ PostgreSQL setup completed successfully!" "Green"
Write-Host ""

# Display connection information
Write-ColorOutput "📋 Connection Information:" "Blue"
Write-ColorOutput "=========================" "Blue"
Write-ColorOutput "Server FQDN:    $ServerFQDN" "Green"
Write-ColorOutput "Database:       $DatabaseName" "Green"
Write-ColorOutput "Admin User:     $AdminUser" "Green"
Write-ColorOutput "Admin Password: $AdminPassword" "Green"
Write-ColorOutput "Port:           5432" "Green"
Write-ColorOutput "SSL Mode:       require" "Green"
Write-Host ""

Write-ColorOutput "📋 Connection String:" "Blue"
Write-ColorOutput $ConnectionString "Green"
Write-Host ""

# Save connection info to secure file
Write-ColorOutput "💾 Saving connection information..." "Yellow"
$envContent = @"
# Azure PostgreSQL Connection Configuration
# Generated: $(Get-Date)
# 
# IMPORTANT: Keep this file secure and do not commit to version control

# Database connection
DATABASE_URL="$ConnectionString"
POSTGRES_URL="$ConnectionString"

# Individual components (for reference)
POSTGRES_HOST="$ServerFQDN"
POSTGRES_PORT="5432"
POSTGRES_DB="$DatabaseName"
POSTGRES_USER="$AdminUser"
POSTGRES_PASSWORD="$AdminPassword"

# Azure-specific
AZURE_RESOURCE_GROUP="$ResourceGroup"
AZURE_POSTGRES_SERVER="$ServerName"
AZURE_LOCATION="$Location"

# SSL Configuration
PGSSLMODE="require"
PGCLIENTENCODING="UTF8"
"@

$envContent | Out-File -FilePath ".env.azure.postgresql" -Encoding UTF8
Write-ColorOutput "✅ Connection info saved to .env.azure.postgresql" "Green"

# Add to .gitignore if not already present
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
    if ($gitignoreContent -notcontains ".env.azure.postgresql") {
        Add-Content ".gitignore" -Value ".env.azure.postgresql"
        Write-ColorOutput "✅ Added .env.azure.postgresql to .gitignore" "Green"
    }
} else {
    ".env.azure.postgresql" | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-ColorOutput "✅ Created .gitignore and added .env.azure.postgresql" "Green"
}

# Set backup retention
Write-ColorOutput "🔄 Setting up automated backup retention..." "Yellow"
az postgres flexible-server backup retention set `
    --resource-group $ResourceGroup `
    --server-name $ServerName `
    --backup-retention 7 `
    --output none

Write-ColorOutput "✅ Backup retention set to 7 days" "Green"
Write-Host ""

# Enable performance monitoring
Write-ColorOutput "📊 Setting up performance monitoring..." "Yellow"
az postgres flexible-server parameter set `
    --resource-group $ResourceGroup `
    --server-name $ServerName `
    --name "pg_stat_statements.track" `
    --value "all" `
    --output none

Write-ColorOutput "✅ Performance monitoring enabled" "Green"

# Security recommendations
Write-ColorOutput "🔒 Security Recommendations:" "Blue"
Write-ColorOutput "============================" "Blue"
Write-ColorOutput "1. Store DATABASE_URL in Azure Key Vault for production" "Yellow"
Write-ColorOutput "2. Use Managed Identity for application authentication" "Yellow"
Write-ColorOutput "3. Consider Private Endpoint for production workloads" "Yellow"
Write-ColorOutput "4. Enable Advanced Threat Protection" "Yellow"
Write-ColorOutput "5. Review firewall rules before production deployment" "Yellow"
Write-Host ""

# Next steps
Write-ColorOutput "📋 Next Steps:" "Blue"
Write-ColorOutput "===============" "Blue"
Write-ColorOutput "1. Update your .env files with DATABASE_URL" "Green"
Write-ColorOutput "2. Run: npm run drizzle:push (to create schema)" "Green"
Write-ColorOutput "3. Run: npm run settings:migrate (to migrate data)" "Green"
Write-ColorOutput "4. Test application with PostgreSQL connection" "Green"
Write-ColorOutput "5. Update production environment variables" "Green"
Write-Host ""

# Create monitoring script
$monitorScript = @'
# PostgreSQL Monitoring Script (PowerShell)

$ResourceGroup = "kitchen-pantry-crm-rg"
$ServerName = "pantrycrm-postgres"

Write-Host "📊 PostgreSQL Server Status:" -ForegroundColor Blue
az postgres flexible-server show `
    --resource-group $ResourceGroup `
    --name $ServerName `
    --query "{Name:name,State:state,Tier:sku.tier,Capacity:sku.name,Storage:storage.storageSizeGB}" `
    --output table

Write-Host "`n🔥 Firewall Rules:" -ForegroundColor Blue
az postgres flexible-server firewall-rule list `
    --resource-group $ResourceGroup `
    --name $ServerName `
    --output table

Write-Host "`n⚙️  Server Parameters (Key Settings):" -ForegroundColor Blue
az postgres flexible-server parameter list `
    --resource-group $ResourceGroup `
    --name $ServerName `
    --query "[?name=='max_connections'||name=='shared_buffers'||name=='work_mem'].{Parameter:name,Value:value}" `
    --output table
'@

$monitorScript | Out-File -FilePath "scripts/monitor-postgres.ps1" -Encoding UTF8
Write-ColorOutput "✅ Monitoring script created: scripts/monitor-postgres.ps1" "Green"
Write-Host ""

Write-ColorOutput "🎉 Azure PostgreSQL Infrastructure Setup Complete!" "Blue"
Write-ColorOutput "==================================================" "Blue"
Write-Host ""
Write-ColorOutput "🏁 Setup completed successfully!" "Green"
Write-ColorOutput "   Connection string saved to .env.azure.postgresql" "Green"
Write-ColorOutput "   Ready for Drizzle migration!" "Green"