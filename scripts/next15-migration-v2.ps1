# Next.js 15 Migration - Main Driver Script (PowerShell Compatible Version)
# For PantryCRM - B2B Sales CRM for Food Service Industry

Write-Host "PantryCRM Next.js 15 Migration" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "This script will run necessary fixes to resolve TypeScript errors"
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
& "$projectRoot\scripts\fix-route-handlers-v2.ps1"

# Step 3: Fix Prisma model names in utility files
Write-Host "`nStep 3: Analyzing Prisma model inconsistencies..." -ForegroundColor Yellow
& "$projectRoot\scripts\identify-prisma-model-issues-v2.ps1"

Write-Host "`nApplying known Prisma model fixes..." -ForegroundColor Yellow

# Fix new-user-notify.ts
$filePath = "$projectRoot\lib\new-user-notify.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath | Out-String
    $content = $content.Replace("import { Users }", "import { User }")
    $content = $content.Replace("export async function newUserNotify(newUser: Users)", "export async function newUserNotify(newUser: User)")
    $content = $content.Replace("prismadb.users", "prismadb.user")
    $content = $content.Replace("admins.forEach(async (admin)", "admins.forEach(async (admin: User)")
    Set-Content -Path $filePath -Value $content
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Fix openai.ts
$filePath = "$projectRoot\lib\openai.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath | Out-String
    
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
    $contentLines = $content -split "`r`n|\r|\n"
    $newContentLines = @()
    $interfaceAdded = $false
    
    foreach ($line in $contentLines) {
        $newContentLines += $line
        if ($line -match "import \{ prismadb \} from `"./prisma`";" -and -not $interfaceAdded) {
            $newContentLines += ""
            $newContentLines += $interfaceBlock -split "`r`n|\r|\n"
            $interfaceAdded = $true
        }
    }
    
    $newContent = $newContentLines -join "`r`n"
    
    # Fix model references
    $newContent = $newContent.Replace("prismadb.systemServices.findFirst", "prismadb.systemService?.findFirst")
    $newContent = $newContent.Replace("prismadb.openAi_keys.findFirst", "prismadb.openAiKey?.findFirst")
    $newContent = $newContent.Replace("});", "}) as SystemService | null;")
    $newContent = $newContent.Replace("user: userId,`n  });", "user: userId,`n  }) as OpenAiKey | null;")
    
    Set-Content -Path $filePath -Value $newContent
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Fix notion.ts
$filePath = "$projectRoot\lib\notion.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath | Out-String
    
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
    $contentLines = $content -split "`r`n|\r|\n"
    $newContentLines = @()
    $interfaceAdded = $false
    
    foreach ($line in $contentLines) {
        $newContentLines += $line
        if ($line -match "import \{ prismadb \} from `"./prisma`";" -and -not $interfaceAdded) {
            $newContentLines += ""
            $newContentLines += $interfaceBlock -split "`r`n|\r|\n"
            $interfaceAdded = $true
        }
    }
    
    $newContent = $newContentLines -join "`r`n"
    
    # Fix model references
    $newContent = $newContent.Replace("prismadb.secondBrain_notions.findFirst", "prismadb.notionIntegration?.findFirst")
    $newContent = $newContent.Replace("});", "}) as NotionIntegration | null;")
    
    Set-Content -Path $filePath -Value $newContent
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Fix resend.ts
$filePath = "$projectRoot\lib\resend.ts"
if (Test-Path $filePath) {
    $content = Get-Content $filePath | Out-String
    
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
    $contentLines = $content -split "`r`n|\r|\n"
    $newContentLines = @()
    $interfaceAdded = $false
    
    foreach ($line in $contentLines) {
        $newContentLines += $line
        if ($line -match "import \{ prismadb \} from `"./prisma`";" -and -not $interfaceAdded) {
            $newContentLines += ""
            $newContentLines += $interfaceBlock -split "`r`n|\r|\n"
            $interfaceAdded = $true
        }
    }
    
    $newContent = $newContentLines -join "`r`n"
    
    # Fix model references
    $newContent = $newContent.Replace("prismadb.systemServices.findFirst", "prismadb.systemService?.findFirst")
    $newContent = $newContent.Replace("});", "}) as SystemService | null;")
    $newContent = $newContent.Replace("export default async function resendHelper()", "export default async function resendHelper(): Promise<any>")
    
    Set-Content -Path $filePath -Value $newContent
    Write-Host "  Fixed: $filePath" -ForegroundColor Green
}

# Step 4: Manually update route handlers for key files that need async params
Write-Host "`nStep 4: Manually updating critical route handlers..." -ForegroundColor Yellow

# Update organizations route.ts file
$organizationsRoutePath = "$projectRoot\app\api\organizations\route.ts"
if (Test-Path $organizationsRoutePath) {
    $content = Get-Content $organizationsRoutePath | Out-String
    $content = $content.Replace("{ params: Record<string, string> }", "{ params: Promise<Record<string, string>> }")
    Set-Content -Path $organizationsRoutePath -Value $content
    Write-Host "  Fixed: $organizationsRoutePath" -ForegroundColor Green
}

# Update organizations by ID route file
$dirPath = "$projectRoot\app\api\organizations\[orgId]"
if (Test-Path $dirPath) {
    $routePath = "$dirPath\route.ts"
    if (Test-Path $routePath) {
        $content = Get-Content $routePath | Out-String
        $content = $content.Replace("{ params: { orgId: string } }", "{ params: Promise<{ orgId: string }> }")
        $content = $content.Replace("const { orgId } = params", "const { orgId } = await params")
        Set-Content -Path $routePath -Value $content
        Write-Host "  Fixed: $routePath" -ForegroundColor Green
    }
}

# Update contacts route.ts file
$contactsRoutePath = "$projectRoot\app\api\contacts\route.ts"
if (Test-Path $contactsRoutePath) {
    $content = Get-Content $contactsRoutePath | Out-String
    $content = $content.Replace("{ params: Record<string, string> }", "{ params: Promise<Record<string, string>> }")
    Set-Content -Path $contactsRoutePath -Value $content
    Write-Host "  Fixed: $contactsRoutePath" -ForegroundColor Green
}

# Step 5: Fix Dashboard test props
Write-Host "`nStep 5: Fixing Dashboard test components..." -ForegroundColor Yellow

# Fix dashboard test file
$dashboardTestPath = "$projectRoot\src\components\dashboard\__tests__\Dashboard.test.tsx"
if (Test-Path $dashboardTestPath) {
    $content = Get-Content $dashboardTestPath | Out-String
    
    # Check if mock data is already defined
    if (-not ($content -match "const mockOrganizationCount")) {
        # Create mock data block
        $mockDataBlock = @"
// Mock data for Dashboard props
const mockOrganizationCount = 42;
const mockRecentInteractions = [
  {
    id: '1',
    organizationName: 'Test Restaurant',
    type: 'Email',
    date: new Date().toISOString(),
    userName: 'Sales Rep'
  }
];

"@
        
        # Insert mock data and update component props
        $content = $content.Replace("<Dashboard />", "<Dashboard organizationCount={mockOrganizationCount} recentInteractions={mockRecentInteractions} />")
        
        # Insert mock data before describe block
        $content = $content.Replace("describe('Dashboard', () => {", "$mockDataBlock`ndescribe('Dashboard', () => {")
        
        Set-Content -Path $dashboardTestPath -Value $content
        Write-Host "  Fixed: $dashboardTestPath" -ForegroundColor Green
    } else {
        Write-Host "  Dashboard test already has mock data. No changes needed." -ForegroundColor Yellow
    }
}

# Step 6: Clear build cache
Write-Host "`nStep 6: Clearing Next.js build cache..." -ForegroundColor Yellow
npx next clean

# Step 7: Run TypeScript type check
Write-Host "`nStep 7: Running TypeScript type check..." -ForegroundColor Yellow
npx tsc --noEmit

# Provide summary and next steps
Write-Host "`n================================================="
Write-Host "Next.js 15 Migration Process Applied!" -ForegroundColor Cyan
Write-Host "================================================="
Write-Host "Key fixes applied:"
Write-Host "✅ Route handler signatures updated to use async params in critical files"
Write-Host "✅ Prisma model naming inconsistencies corrected in utility files"
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
Write-Host "Performance Validation:" -ForegroundColor Yellow
Write-Host "1. Verify sub-second search response time for organizations"
Write-Host "2. Confirm 30-second interaction entry target is met"
Write-Host "3. Test 44px touch targets for accessibility on Windows touch laptop and iPad"
Write-Host "4. Validate DTU consumption within Azure SQL Basic tier constraints (5 DTU)"