# Next.js 15 Route Handler Migration Script
# Systematically updates route handler signatures to use async params pattern
Write-Host "Next.js 15 Route Handler Migration Script"
Write-Host "=============================================`n"

# Track statistics
$filesScanned = 0
$filesModified = 0
$errorsFound = 0

# Pattern to find route handlers with old signature pattern
$oldPattern = '(export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*:\s*Promise<Response>\s*{)'

# Function to process a single file
function Process-File {
    param (
        [string]$FilePath
    )

    try {
        $content = Get-Content $FilePath -Raw
        $filesScanned++
        
        # Check if file contains the old pattern
        if ($content -match 'context: \{ params: Record<string, string> \}' -or 
            $content -match 'props: \{ params: Record<string, string> \}' -or
            $content -match '\{ params \}: \{ params: Record<string, string> \}') {
            
            Write-Host "Updating: $FilePath"
            
            # Replace the old patterns with the new ones
            $updatedContent = $content -replace 'context: \{ params: Record<string, string> \}', 'context: { params: Promise<Record<string, string>> }'
            $updatedContent = $updatedContent -replace 'props: \{ params: Record<string, string> \}', 'props: { params: Promise<Record<string, string>> }'
            $updatedContent = $updatedContent -replace '\{ params \}: \{ params: Record<string, string> \}', '{ params }: { params: Promise<Record<string, string>> }'
            
            # Add await if missing after { params }
            if ($updatedContent -match '\{ params: Promise<Record<string, string>> \}' -and 
                -not ($updatedContent -match 'await props\.params' -or $updatedContent -match 'await context\.params')) {
                
                # Add TODO comment to manually check for missing awaits
                $updatedContent = "// TODO: Next.js 15 migration - Verify 'await' is used before accessing 'params'`n" + $updatedContent
                $errorsFound++
            }
            
            # Write the updated content back to the file
            Set-Content -Path $FilePath -Value $updatedContent
            $filesModified++
        }
    }
    catch {
        Write-Host "Error processing $FilePath : $_" -ForegroundColor Red
    }
}

# Main script execution
Write-Host "Scanning app/api directory for route handlers...`n"

# Get all TS files in the api directory
$files = Get-ChildItem -Path "app/api" -Filter "*.ts" -Recurse | Where-Object { -not $_.Name.StartsWith(".") }

foreach ($file in $files) {
    Process-File -FilePath $file.FullName
}

# Display summary
Write-Host "`nRoute Handler Migration Complete!"
Write-Host "============================="
Write-Host "Files Scanned: $filesScanned"
Write-Host "Files Modified: $filesModified"
Write-Host "Files with missing awaits: $errorsFound"

if ($errorsFound -gt 0) {
    Write-Host "`nATTENTION: $errorsFound files may have missing 'await' statements." -ForegroundColor Yellow
    Write-Host "Check for TODO comments added to these files and ensure params are properly awaited." -ForegroundColor Yellow
}

Write-Host "`nNext steps:"
Write-Host "1. Manually verify files with missing awaits"
Write-Host "2. Run 'npx tsc --noEmit' to check for remaining type errors"
Write-Host "3. Run 'npx next build --no-lint' to test the build"
Write-Host "4. Update Prisma model references in utility files"