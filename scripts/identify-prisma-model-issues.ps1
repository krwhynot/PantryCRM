# Script to identify Prisma model naming inconsistencies
Write-Host "Prisma Model Naming Consistency Checker"
Write-Host "======================================`n"

# Extract model names from Prisma schema
Write-Host "Extracting model names from Prisma schema..."
$prismaSchema = Get-Content -Path "prisma/schema.prisma" -Raw
$modelRegex = [Regex]::new('model\s+(\w+)\s+\{')
$modelMatches = $modelRegex.Matches($prismaSchema)
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
    $content = Get-Content -Path $file.FullName -Raw
    
    # Pattern 1: prismadb.[modelName] (should be singular)
    $prismadbUsage = [Regex]::new('prismadb\.(\w+)')
    $usageMatches = $prismadbUsage.Matches($content)
    
    foreach ($match in $usageMatches) {
        $model = $match.Groups[1].Value
        
        # Skip non-model members like $connect or $transaction
        if ($model -match '^\$') {
            continue
        }
        
        # Check if pluralized or not matching schema
        if (-not ($validModels -contains $model)) {
            $issues += [PSCustomObject]@{
                File = $file.FullName.Replace((Get-Location), '')
                Line = Get-Content $file.FullName | Select-String -Pattern "prismadb\.$model" | Select-Object -First 1 -ExpandProperty LineNumber
                Issue = "Prisma model reference: prismadb.$model"
                Suggestion = if ($validModels -contains ($model -replace 's$', '')) {
                    "Change to: prismadb.$($model -replace 's$', '')"
                } else {
                    "Use valid model name from schema"
                }
            }
        }
    }
    
    # Pattern 2: import from @prisma/client
    $importRegex = [Regex]::new('import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]@prisma/client[''"]')
    $importMatches = $importRegex.Matches($content)
    
    foreach ($match in $importMatches) {
        $importedTypes = $match.Groups[1].Value -split ',\s*'
        
        foreach ($type in $importedTypes) {
            $type = $type.Trim()
            if ($type -and -not ($validModels -contains $type)) {
                $issues += [PSCustomObject]@{
                    File = $file.FullName.Replace((Get-Location), '')
                    Line = Get-Content $file.FullName | Select-String -Pattern "import.*$type.*from.*@prisma/client" | Select-Object -First 1 -ExpandProperty LineNumber
                    Issue = "Import: $type from @prisma/client"
                    Suggestion = if ($validModels -contains ($type -replace 's$', '')) {
                        "Import: $($type -replace 's$', '') from @prisma/client"
                    } else {
                        "Use valid model name from schema"
                    }
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