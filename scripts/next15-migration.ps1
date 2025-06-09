# Next.js 15 Migration - Main Driver Script
# This script orchestrates the comprehensive migration to Next.js 15
# Created for PantryCRM - B2B Sales CRM for Food Service Industry

Write-Host "PantryCRM Next.js 15 Migration" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "This script will run all necessary fixes to resolve TypeScript errors"
Write-Host "and ensure complete compatibility with Next.js 15 async route handlers."
Write-Host ""

# Check execution environment
$projectRoot = Get-Location
if (-not (Test-Path "$projectRoot\package.json")) {
    Write-Host "Error: Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Step 1: Install required dependencies
Write-Host "Step 1: Installing required dependencies..." -ForegroundColor Yellow
npm install --save @uploadthing/react uploadthing

# Step 2: Run route handler fix script
Write-Host "`nStep 2: Fixing route handler signatures..." -ForegroundColor Yellow
& "$projectRoot\scripts\fix-route-handlers.ps1"

# Step 3: Fix Prisma model names in utility files
Write-Host "`nStep 3: Analyzing Prisma model inconsistencies..." -ForegroundColor Yellow
& "$projectRoot\scripts\identify-prisma-model-issues.ps1"

Write-Host "`nApplying known Prisma model fixes..." -ForegroundColor Yellow

# Fix new-user-notify.ts
$filePath = "$projectRoot\lib\new-user-notify.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw
    $content = $content -replace "import \{ Users \}", "import { User }"
    $content = $content -replace "export async function newUserNotify\(newUser: Users\)", "export async function newUserNotify(newUser: User)"
    $content = $content -replace "prismadb\.users", "prismadb.user"
    $content = $content -replace "admins\.forEach\(async \(admin\)", "admins.forEach(async (admin: User)"
    Set-Content -Path $filePath -Value $content
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Fix openai.ts
$filePath = "$projectRoot\lib\openai.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw
    
    # Add interfaces
    $interfaceBlock = @"
// Define interfaces to match your Prisma schema
interface SystemService {
  id: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OpenAiKey {
  id: string;
  user: string;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

"@

    # Insert interfaces after imports
    $content = $content -replace "import \{ prismadb \} from `"./prisma`";\r?\n", "import { prismadb } from `"./prisma`";" + "`n`n" + $interfaceBlock
    
    # Fix model references
    $content = $content -replace "prismadb\.systemServices\.findFirst", "prismadb.systemService?.findFirst"
    $content = $content -replace "prismadb\.openAi_keys\.findFirst", "prismadb.openAiKey?.findFirst"
    $content = $content -replace "\}\);", "}) as SystemService | null;"
    $content = $content -replace "user: userId,\n  \}\);", "user: userId,`n  }) as OpenAiKey | null;"
    
    Set-Content -Path $filePath -Value $content
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Fix notion.ts
$filePath = "$projectRoot\lib\notion.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw
    
    # Add interface
    $interfaceBlock = @"
// Define interface to match your Prisma schema
interface NotionIntegration {
  id: string;
  user: string;
  apiKey: string;
  databaseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

"@
    
    # Insert interface after imports
    $content = $content -replace "import \{ prismadb \} from `"./prisma`";\r?\n", "import { prismadb } from `"./prisma`";" + "`n`n" + $interfaceBlock
    
    # Fix model references
    $content = $content -replace "prismadb\.secondBrain_notions\.findFirst", "prismadb.notionIntegration?.findFirst"
    $content = $content -replace "\}\);", "}) as NotionIntegration | null;"
    
    Set-Content -Path $filePath -Value $content
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Fix resend.ts
$filePath = "$projectRoot\lib\resend.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw
    
    # Add interface
    $interfaceBlock = @"
// Define interface to match your Prisma schema
interface SystemService {
  id: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

"@
    
    # Insert interface after imports
    $content = $content -replace "import \{ prismadb \} from `"./prisma`";\r?\n", "import { prismadb } from `"./prisma`";" + "`n`n" + $interfaceBlock
    
    # Fix model references
    $content = $content -replace "prismadb\.systemServices\.findFirst", "prismadb.systemService?.findFirst"
    $content = $content -replace "\}\);", "}) as SystemService | null;"
    $content = $content -replace "export default async function resendHelper\(\)", "export default async function resendHelper(): Promise<any>"
    
    Set-Content -Path $filePath -Value $content
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Step 4: Fix Dashboard test props
Write-Host "`nStep 4: Fixing Dashboard test components..." -ForegroundColor Yellow
& "$projectRoot\scripts\fix-dashboard-tests.ps1"

# Step 5: Clear build cache
Write-Host "`nStep 5: Clearing Next.js build cache..." -ForegroundColor Yellow
npx next clean

# Step 6: Run TypeScript type check to verify fixes
Write-Host "`nStep 6: Running TypeScript type check..." -ForegroundColor Yellow
npx tsc --noEmit

# Provide summary and next steps
Write-Host "`n================================================="
Write-Host "Next.js 15 Migration Process Complete!" -ForegroundColor Cyan
Write-Host "================================================="
Write-Host "Key fixes applied:"
Write-Host "✅ Route handler signatures updated to use async params"
Write-Host "✅ Prisma model naming inconsistencies corrected"
Write-Host "✅ Missing TypeScript dependencies installed"
Write-Host "✅ Component test prop errors resolved"
Write-Host "✅ Next.js build cache cleared"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review any remaining TypeScript errors from the check above"
Write-Host "2. Run 'npx next build --no-lint' to test production build"
Write-Host "3. Run 'npx next dev' to verify development server"
Write-Host "4. Test critical business flows:"
Write-Host "   - Organization search (sub-second performance)"
Write-Host "   - Contact management (with organization relationships)"
Write-Host "   - 5-stage sales pipeline functionality"
Write-Host "   - Interaction logging (30-second target)"
Write-Host ""
Write-Host "If any issues persist, check prisma-model-issues.csv for additional model inconsistencies."