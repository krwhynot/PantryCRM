#!/bin/bash
# Azure IP Restrictions Script for PantryCRM
# Applies IP restrictions to admin API routes at the Azure App Service level
# Run with: az login && bash azure-ip-restrictions.sh

# Configuration
RESOURCE_GROUP="kitchen-pantry-crm-rg"
APP_SERVICE_NAME="kitchen-pantry-crm"

echo "Applying IP restrictions for admin API routes..."

# Create rule for admin endpoints - restrict to specific IP(s)
az webapp config access-restriction add -g $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --rule-name allow-admin-ips \
  --action Allow \
  --ip-address 203.0.113.42/32 \
  --priority 100

echo "Adding IP restriction for settings API..."
  
# Create rule for settings endpoints
az webapp config access-restriction add -g $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --rule-name allow-settings-ips \
  --action Allow \
  --ip-address 203.0.113.42/32 \
  --priority 110

echo "Adding IP restriction for migration API..."

# Create rule for migration endpoints
az webapp config access-restriction add -g $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --rule-name allow-migration-ips \
  --action Allow \
  --ip-address 203.0.113.42/32 \
  --priority 120

# Set default rule to deny access to all other IPs for admin routes
echo "Setting default deny rule for admin endpoints..."

az webapp config access-restriction add -g $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --rule-name deny-all-admin \
  --action Deny \
  --ip-address 0.0.0.0/0 \
  --priority 2147483647

# List all restrictions to verify configuration
echo "Listing all IP restrictions..."
az webapp config access-restriction show -g $RESOURCE_GROUP --name $APP_SERVICE_NAME

echo "IP restrictions successfully applied to Azure App Service."
echo "Important: These restrictions complement the middleware checks but provide protection at the infrastructure level."
