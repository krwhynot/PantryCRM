# Kitchen Pantry CRM Cleanup Script
# This script backs up and removes unused components to improve performance

# Create backup directories if they don't exist
$backupRoot = "r:\Projects\PantryCRM\backup-removed"
$backupApiDir = "$backupRoot\api"
$backupComponentsDir = "$backupRoot\components"

if (-not (Test-Path $backupRoot)) {
    New-Item -Path $backupRoot -ItemType Directory -Force
}
if (-not (Test-Path $backupApiDir)) {
    New-Item -Path $backupApiDir -ItemType Directory -Force
}
if (-not (Test-Path $backupComponentsDir)) {
    New-Item -Path $backupComponentsDir -ItemType Directory -Force
}

# Function to backup and remove API routes
function Backup-And-Remove-ApiRoute {
    param (
        [string]$routeName
    )
    
    $sourcePath = "r:\Projects\PantryCRM\app\api\$routeName"
    $destPath = "$backupApiDir\$routeName"
    
    if (Test-Path $sourcePath) {
        Write-Host "Backing up and removing $routeName API route..."
        # Use robocopy to copy files
        robocopy $sourcePath $destPath /E /MOVE /NFL /NDL /NJH /NJS /nc /ns /np
        
        # Remove the source directory if it still exists (robocopy with /MOVE should handle this)
        if (Test-Path $sourcePath) {
            Remove-Item -Path $sourcePath -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "✅ $routeName API route backed up and removed"
    } else {
        Write-Host "⚠️ $routeName API route not found, skipping"
    }
}

# Function to backup and remove components
function Backup-And-Remove-Component {
    param (
        [string]$componentName
    )
    
    $sourcePath = "r:\Projects\PantryCRM\components\$componentName"
    $destPath = "$backupComponentsDir\$componentName"
    
    if (Test-Path $sourcePath) {
        Write-Host "Backing up and removing $componentName component..."
        # Copy the file first
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        
        # Then remove the original
        Remove-Item -Path $sourcePath -Force
        
        Write-Host "✅ $componentName component backed up and removed"
    } else {
        Write-Host "⚠️ $componentName component not found, skipping"
    }
}

# 1. Remove unused API routes
$unusedApiRoutes = @(
    "invoice",
    "openai",
    "digitalocean",
    "projects",
    "tasks",
    "secondBrain",
    "boards",
    "sections",
    "documents",
    "upload",
    "uploadthing",
    "databox",
    "temp"
)

Write-Host "=== STARTING API ROUTES CLEANUP ==="
foreach ($route in $unusedApiRoutes) {
    Backup-And-Remove-ApiRoute -routeName $route
}

# 2. Remove unused components
$unusedComponents = @(
    "CommandComponent.tsx",
    "SetLanguage.tsx",
    "support.tsx"
)

Write-Host "=== STARTING COMPONENTS CLEANUP ==="
foreach ($component in $unusedComponents) {
    Backup-And-Remove-Component -componentName $component
}

Write-Host "=== CLEANUP COMPLETED ==="
Write-Host "All unused components have been backed up to $backupRoot"