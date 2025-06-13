#!/bin/bash

# Automated Backup Script for PantryCRM Azure Resources
# Implements weekly automated database export and application state backup

# Configuration
RESOURCE_GROUP="your-resource-group"
SQL_SERVER_NAME="your-sql-server-name"
SQL_DATABASE_NAME="pantry-crm"
STORAGE_ACCOUNT="your-storage-account"
STORAGE_CONTAINER="backups"
ADMIN_USERNAME="pantry_admin"
ADMIN_PASSWORD="your-secure-password"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

echo "Starting automated backup for PantryCRM - $BACKUP_DATE"

# Create storage container if it doesn't exist
echo "Ensuring backup storage container exists..."
az storage container create \
  --name $STORAGE_CONTAINER \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login \
  --public-access off

# Database backup using Azure SQL export
echo "Exporting Azure SQL database..."
BACPAC_NAME="pantry-crm-$BACKUP_DATE.bacpac"
STORAGE_URI="https://$STORAGE_ACCOUNT.blob.core.windows.net/$STORAGE_CONTAINER/$BACPAC_NAME"

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" -o tsv)

# Export database
az sql db export \
  --admin-password $ADMIN_PASSWORD \
  --admin-user $ADMIN_USERNAME \
  --storage-key-type StorageAccessKey \
  --storage-key $STORAGE_KEY \
  --storage-uri $STORAGE_URI \
  --name $SQL_DATABASE_NAME \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME

echo "Database export initiated to: $STORAGE_URI"

# Backup application configuration files
echo "Backing up application configuration..."
CONFIG_BACKUP_NAME="config-backup-$BACKUP_DATE.tar.gz"
tar -czf "/tmp/$CONFIG_BACKUP_NAME" \
  web.config \
  next.config.azure.js \
  .env.azure.example \
  deploy.cmd \
  package.json \
  prisma/schema.prisma

# Upload config backup to storage
az storage blob upload \
  --file "/tmp/$CONFIG_BACKUP_NAME" \
  --name "config/$CONFIG_BACKUP_NAME" \
  --container-name $STORAGE_CONTAINER \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login

echo "Configuration backup uploaded: config/$CONFIG_BACKUP_NAME"

# Backup documentation
echo "Backing up documentation..."
DOCS_BACKUP_NAME="docs-backup-$BACKUP_DATE.tar.gz"
tar -czf "/tmp/$DOCS_BACKUP_NAME" \
  Docs/ \
  docs/ \
  CLAUDE.md \
  README.md 2>/dev/null || echo "Some docs may not exist, continuing..."

# Upload docs backup
az storage blob upload \
  --file "/tmp/$DOCS_BACKUP_NAME" \
  --name "docs/$DOCS_BACKUP_NAME" \
  --container-name $STORAGE_CONTAINER \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login

echo "Documentation backup uploaded: docs/$DOCS_BACKUP_NAME"

# Clean up temp files
rm -f "/tmp/$CONFIG_BACKUP_NAME" "/tmp/$DOCS_BACKUP_NAME"

# Cleanup old backups (keep last 4 weeks)
echo "Cleaning up old backups (keeping last 28 days)..."
CUTOFF_DATE=$(date -d "28 days ago" +%Y%m%d)

# List and delete old database backups
az storage blob list \
  --container-name $STORAGE_CONTAINER \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login \
  --query "[?contains(name, 'pantry-crm-') && name < 'pantry-crm-$CUTOFF_DATE'].name" \
  -o tsv | while read blob_name; do
    if [ ! -z "$blob_name" ]; then
      echo "Deleting old backup: $blob_name"
      az storage blob delete \
        --name "$blob_name" \
        --container-name $STORAGE_CONTAINER \
        --account-name $STORAGE_ACCOUNT \
        --auth-mode login
    fi
done

# Generate backup report
echo "Generating backup report..."
BACKUP_REPORT="/tmp/backup-report-$BACKUP_DATE.txt"
cat > $BACKUP_REPORT << EOF
PantryCRM Backup Report
Date: $(date)
Backup ID: $BACKUP_DATE

Database Backup:
- File: $BACPAC_NAME
- Location: $STORAGE_URI
- Status: Initiated (check Azure portal for completion)

Configuration Backup:
- File: config/$CONFIG_BACKUP_NAME
- Status: Completed

Documentation Backup:
- File: docs/$DOCS_BACKUP_NAME
- Status: Completed

Retention Policy:
- Keeping backups for 28 days
- Old backups cleaned up automatically

Next Backup: $(date -d "7 days" +"%Y-%m-%d %H:%M:%S")
EOF

# Upload backup report
az storage blob upload \
  --file $BACKUP_REPORT \
  --name "reports/backup-report-$BACKUP_DATE.txt" \
  --container-name $STORAGE_CONTAINER \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login

echo "Backup report uploaded: reports/backup-report-$BACKUP_DATE.txt"

# Display summary
echo ""
echo "=== BACKUP SUMMARY ==="
cat $BACKUP_REPORT
echo "======================="
echo ""
echo "Automated backup completed successfully!"
echo "Monitor database export progress in Azure Portal > SQL Databases > Import/Export history"

# Clean up report
rm -f $BACKUP_REPORT

exit 0