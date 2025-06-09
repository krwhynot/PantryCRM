# 1. Check API routes
ls .\src\app\api\

# 2. Check components directory
ls .\src\components\

# 3. Check if key files exist
Test-Path ".\src\app\api\settings"
Test-Path ".\src\app\api\organizations" 
Test-Path ".\src\components\ui"
Test-Path ".\src\hooks"

# 4. List all TypeScript files
Get-ChildItem -Path ".\src" -Recurse -Include "*.tsx", "*.ts" | Measure-Object

# 5. Check package.json scripts
Get-Content ".\package.json" | Select-String '"scripts"' -A 10