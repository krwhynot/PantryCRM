// PantryCRM Azure Infrastructure Template
// Optimized for $18/month budget with B1 App Service and Basic SQL
@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
param environment string = 'prod'

@description('Application name prefix')
param appName string = 'pantry-crm'

@description('SQL Administrator username')
param sqlAdminUsername string = 'pantry_admin'

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

@description('Application Insights workspace location')
param appInsightsLocation string = location

// Variables
var appServicePlanName = '${appName}-${environment}-plan'
var webAppName = '${appName}-${environment}-app'
var sqlServerName = '${appName}-${environment}-sql'
var sqlDatabaseName = '${appName}-db'
var storageAccountName = replace('${appName}${environment}storage', '-', '')
var keyVaultName = '${appName}-${environment}-kv'
var appInsightsName = '${appName}-${environment}-insights'
var logAnalyticsName = '${appName}-${environment}-logs'

// Storage Account for backups (LRS for cost optimization)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS' // Cheapest option for backups
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    accessTier: 'Cool' // Optimize for backup storage (infrequent access)
  }
  
  resource blobService 'blobServices@2023-01-01' = {
    name: 'default'
    properties: {
      deleteRetentionPolicy: {
        enabled: true
        days: 7 // 7-day retention for cost optimization
      }
    }
    
    resource backupContainer 'containers@2023-01-01' = {
      name: 'pantry-crm-backups'
      properties: {
        publicAccess: 'None'
        metadata: {
          purpose: 'automated-backups'
          retention: '30-days'
        }
      }
    }
  }
}

// Log Analytics Workspace for Application Insights
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: appInsightsLocation
  properties: {
    sku: {
      name: 'PerGB2018' // Pay-per-GB pricing
    }
    retentionInDays: 30 // Minimum retention for cost optimization
    features: {
      searchVersion: 1
      legacy: 0
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights for monitoring
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: appInsightsLocation
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    RetentionInDays: 30 // Minimum retention for cost optimization
  }
}

// Key Vault for secrets management
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard' // Standard tier for cost optimization
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true // Use RBAC instead of access policies
    enableSoftDelete: true
    softDeleteRetentionInDays: 7 // Minimum retention
    enablePurgeProtection: false // Disable for cost optimization in non-production
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// SQL Server
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
  
  // Firewall rule to allow Azure services
  resource firewallRuleAzure 'firewallRules@2023-05-01-preview' = {
    name: 'AllowAzureServices'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }
  
  // Firewall rule for App Service (will be updated with actual IPs)
  resource firewallRuleAppService 'firewallRules@2023-05-01-preview' = {
    name: 'AllowAppService'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '255.255.255.255' // Will be restricted in production
    }
  }
}

// SQL Database - Basic tier for cost optimization
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5 // 5 DTUs
  }
  properties: {
    maxSizeBytes: 2147483648 // 2GB
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: false // Disable for cost optimization
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local' // LRS for cost optimization
    isLedgerOn: false
  }
}

// App Service Plan - B1 tier for cost optimization
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    family: 'B'
    capacity: 1
  }
  kind: 'app'
  properties: {
    perSiteScaling: false
    elasticScaleEnabled: false
    maximumElasticWorkerCount: 1
    isSpot: false
    reserved: false // Windows hosting
    isXenon: false
    hyperV: false
    targetWorkerCount: 0
    targetWorkerSizeId: 0
    zoneRedundant: false
  }
}

// App Service
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  kind: 'app'
  identity: {
    type: 'SystemAssigned' // Enable managed identity for Key Vault access
  }
  properties: {
    serverFarmId: appServicePlan.id
    enabled: true
    hostNamesDisabled: false
    httpsOnly: true
    redundancyMode: 'None'
    clientAffinityEnabled: false // Disable for better performance
    clientCertEnabled: false
    hostNameSslStates: [
      {
        name: '${webAppName}.azurewebsites.net'
        sslState: 'Disabled'
        hostType: 'Standard'
      }
    ]
    siteConfig: {
      numberOfWorkers: 1
      acrUseManagedIdentityCreds: false
      alwaysOn: false // Disable for B1 cost optimization
      http20Enabled: true
      functionAppScaleLimit: 0
      minimumElasticInstanceCount: 0
      nodeVersion: '20-lts' // Node.js 20 LTS
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'NEXT_TELEMETRY_DISABLED'
          value: '1'
        }
        {
          name: 'NODE_OPTIONS'
          value: '--max-old-space-size=1400 --optimize-for-size'
        }
        {
          name: 'AZURE_KEYVAULT_URL'
          value: keyVault.properties.vaultUri
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'AZURE_STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
      connectionStrings: [
        {
          name: 'DATABASE_URL'
          connectionString: 'sqlserver://${sqlServer.properties.fullyQualifiedDomainName}:1433;database=${sqlDatabase.name};user=${sqlAdminUsername};password=${sqlAdminPassword};encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net'
          type: 'SQLAzure'
        }
      ]
      metadata: [
        {
          name: 'CURRENT_STACK'
          value: 'node'
        }
      ]
    }
  }
  
  // Deployment slot for staging (optional, can be commented out for cost)
  // resource stagingSlot 'slots@2023-01-01' = {
  //   name: 'staging'
  //   location: location
  //   properties: {
  //     serverFarmId: appServicePlan.id
  //     enabled: true
  //     httpsOnly: true
  //     siteConfig: {
  //       appSettings: [
  //         {
  //           name: 'NODE_ENV'
  //           value: 'staging'
  //         }
  //       ]
  //     }
  //   }
  // }
}

// Grant App Service access to Key Vault
resource keyVaultAccessPolicy 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant App Service access to Storage Account
resource storageAccessPolicy 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, webApp.id, 'Storage Blob Data Contributor')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Action Group for alerts
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${appName}-${environment}-alerts'
  location: 'Global'
  properties: {
    groupShortName: 'PantryCRM'
    enabled: true
    emailReceivers: [
      {
        name: 'Admin'
        emailAddress: 'admin@yourcompany.com' // Update with actual email
        useCommonAlertSchema: true
      }
    ]
  }
}

// Memory usage alert
resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'B1-Memory-Usage-High'
  location: 'Global'
  properties: {
    description: 'Memory usage exceeds 80% threshold (B1 optimization limit)'
    severity: 2
    enabled: true
    scopes: [
      webApp.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'MemoryPercentage'
          metricName: 'MemoryPercentage'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// DTU usage alert
resource dtuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'SQL-DTU-Usage-High'
  location: 'Global'
  properties: {
    description: 'DTU utilization exceeds 80% for Azure SQL Basic (5 DTU limit)'
    severity: 2
    enabled: true
    scopes: [
      sqlDatabase.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'DTUConsumptionPercent'
          metricName: 'dtu_consumption_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Store secrets in Key Vault (will need to be updated with actual values)
resource jwtSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'jwt-secret'
  properties: {
    value: 'placeholder-jwt-secret-change-in-production'
    attributes: {
      enabled: true
    }
  }
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: 'sqlserver://${sqlServer.properties.fullyQualifiedDomainName}:1433;database=${sqlDatabase.name};user=${sqlAdminUsername};password=${sqlAdminPassword};encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net'
    attributes: {
      enabled: true
    }
  }
}

resource storageConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'azure-storage-connection-string'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
    attributes: {
      enabled: true
    }
  }
}

// Outputs
output resourceGroupName string = resourceGroup().name
output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output sqlServerName string = sqlServer.name
output sqlDatabaseName string = sqlDatabase.name
output storageAccountName string = storageAccount.name
output keyVaultName string = keyVault.name
output keyVaultUrl string = keyVault.properties.vaultUri
output applicationInsightsName string = applicationInsights.name
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString

// Cost estimate (as of 2024)
// - App Service B1: ~$13/month
// - SQL Database Basic: ~$5/month  
// - Storage Account LRS: ~$0.50/month
// - Key Vault Standard: ~$1/month
// - Application Insights: ~$2/month (with 30-day retention)
// Total estimated cost: ~$21.50/month