# Script to identify Prisma model naming inconsistencies - Compatible with older PowerShell versions
Write-Host "Prisma Model Naming Consistency Checker"
Write-Host "======================================`n"

# Extract model names from Prisma schema
Write-Host "Extracting model names from Prisma schema..."
$prismaSchemaContent = Get-Content -Path "prisma/schema.prisma" | Out-String
$modelMatches = [regex]::Matches($prismaSchemaContent, 'model\s+(\w+)\s+\{')
$validModels = @()

foreach ($match in $modelMatches) {
    $validModels += $match.Groups[1].Value
}

Write-Host "Found $($validModels.Count) models in Prisma schema."
Write-Host "Valid model names: $($validModels -join ', ')`n"

# Find inconsistent references
Write-Host "Scanning for inconsistent Prisma model references..."
$issues = @()

# Check lib directory for model references
$libFiles = Get-ChildItem -Path "lib" -Filter "*.ts" -Recurse
foreach ($file in $libFiles) {
    $content = Get-Content -Path $file.FullName | Out-String
    
    # Pattern 1: prismadb.[modelName] (should be singular)
    $prismadbUsageMatches = [regex]::Matches($content, 'prismadb\.(\w+)')
    
    foreach ($match in $prismadbUsageMatches) {
        $model = $match.Groups[1].Value
        
        # Skip non-model members like $connect or $transaction
        if ($model -match '^\$') {
            continue
        }
        
        # Check if pluralized or not matching schema
        if (-not ($validModels -contains $model)) {
            $suggestion = if ($validModels -contains ($model -replace 's$', '')) {
                "Change to: prismadb.$($model -replace 's$', '')"
            } else {
                "Use valid model name from schema"
            }
            
            $issues += New-Object PSObject -Property @{
                File = $file.FullName.Replace((Get-Location).Path, '')
                Line = (Select-String -Path $file.FullName -Pattern "prismadb\.$model" | Select-Object -First 1).LineNumber
                Issue = "Prisma model reference: prismadb.$model"
                Suggestion = $suggestion
            }
        }
    }
    
    # Pattern 2: import from @prisma/client
    $importMatches = [regex]::Matches($content, 'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]@prisma/client[''"]')
    
    foreach ($match in $importMatches) {
        $importedTypes = $match.Groups[1].Value -split ',\s*'
        
        foreach ($type in $importedTypes) {
            $type = $type.Trim()
            if ($type -and -not ($validModels -contains $type)) {
                $suggestion = if ($validModels -contains ($type -replace 's$', '')) {
                    "Import: $($type -replace 's$', '') from @prisma/client"
                } else {
                    "Use valid model name from schema"
                }
                
                $lineNumber = 0
                $lineMatch = Select-String -Path $file.FullName -Pattern "import.*$type.*from.*@prisma/client" | Select-Object -First 1
                if ($lineMatch) {
                    $lineNumber = $lineMatch.LineNumber
                }
                
                $issues += New-Object PSObject -Property @{
                    File = $file.FullName.Replace((Get-Location).Path, '')
                    Line = $lineNumber
                    Issue = "Import: $type from @prisma/client"
                    Suggestion = $suggestion
                }
            }
        }
    }
}

# Display results
Write-Host "Found $($issues.Count) potential Prisma model inconsistencies.`n"

if ($issues.Count -gt 0) {
    $issues | Format-Table -AutoSize -Property File, Line, Issue, Suggestion
    
    # Output to CSV for easier reference
    $issues | Export-Csv -Path "prisma-model-issues.csv" -NoTypeInformation
    Write-Host "Issues exported to prisma-model-issues.csv"
    
    Write-Host "`nCommon fixes needed:"
    Write-Host "1. Change prismadb.users to prismadb.user"
    Write-Host "2. Change import { Users } to import { User }"
    Write-Host "3. Change prismadb.systemServices to prismadb.systemService"
    Write-Host "4. Change prismadb.secondBrain_notions to prismadb.notionIntegration"
    Write-Host "5. Change prismadb.openAi_keys to prismadb.openAiKey"
} else {
    Write-Host "No issues found. All Prisma model references appear consistent."
}