# Script to update Next.js 15 API routes with correct return types
# Created for PantryCRM Azure SQL integration
# For Phase 1 Week 2 deliverables

Write-Host "🔄 Updating Next.js 15.3.3 API routes with correct return types..."
$apiRoutes = Get-ChildItem -Path "app\api" -Recurse -Include "route.ts" 
$updatedCount = 0
$errorCount = 0

foreach ($file in $apiRoutes) {
    try {
        $content = Get-Content -Path $file.FullName -Raw
        
        # Pattern 1: Update GET handlers
        if ($content -match "export\s+async\s+function\s+GET\s*\([^)]*\)\s*{") {
            $pattern = "export\s+async\s+function\s+GET\s*\([^)]*\)\s*{"
            $replacement = "export async function GET(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {"
            $content = $content -replace $pattern, $replacement
            $updatedCount++
        }
        
        # Pattern 2: Update POST handlers
        if ($content -match "export\s+async\s+function\s+POST\s*\([^)]*\)\s*{") {
            $pattern = "export\s+async\s+function\s+POST\s*\([^)]*\)\s*{"
            $replacement = "export async function POST(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {"
            $content = $content -replace $pattern, $replacement
            $updatedCount++
        }
        
        # Pattern 3: Update DELETE handlers
        if ($content -match "export\s+async\s+function\s+DELETE\s*\([^)]*\)\s*{") {
            $pattern = "export\s+async\s+function\s+DELETE\s*\([^)]*\)\s*{"
            $replacement = "export async function DELETE(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {"
            $content = $content -replace $pattern, $replacement
            $updatedCount++
        }
        
        # Pattern 4: Update PUT handlers
        if ($content -match "export\s+async\s+function\s+PUT\s*\([^)]*\)\s*{") {
            $pattern = "export\s+async\s+function\s+PUT\s*\([^)]*\)\s*{"
            $replacement = "export async function PUT(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {"
            $content = $content -replace $pattern, $replacement
            $updatedCount++
        }
        
        # Pattern 5: Update PATCH handlers
        if ($content -match "export\s+async\s+function\s+PATCH\s*\([^)]*\)\s*{") {
            $pattern = "export\s+async\s+function\s+PATCH\s*\([^)]*\)\s*{"
            $replacement = "export async function PATCH(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {"
            $content = $content -replace $pattern, $replacement
            $updatedCount++
        }
        
        # Add NextRequest/NextResponse import if not already present
        if (-not ($content -match "import.*NextRequest.*from.*next/server") -and 
            -not ($content -match "import.*NextResponse.*from.*next/server")) {
            $content = "import { NextRequest, NextResponse } from 'next/server';" + "`r`n" + $content
        }
        # If NextResponse exists but not NextRequest, update it to include both
        elseif ($content -match "import.*NextResponse.*from.*next/server" -and -not ($content -match "import.*NextRequest.*from.*next/server")) {
            $content = $content -replace "import\s*\{\s*NextResponse\s*\}\s*from\s*['\"]next/server['\"];", "import { NextRequest, NextResponse } from 'next/server';"
        }
        
        # Save the updated content
        Set-Content -Path $file.FullName -Value $content
        Write-Host "✅ Updated: $($file.FullName)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error updating $($file.FullName): $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "🎉 API route update complete!"
Write-Host "📊 Updated $updatedCount handlers across $($apiRoutes.Count) files"
if ($errorCount -gt 0) {
    Write-Host "⚠️ $errorCount errors encountered" -ForegroundColor Yellow
}

Write-Host "`r`n📋 Next steps:"
Write-Host "1. Run 'npm run build' to verify fixed compilation"
Write-Host "2. Check for any remaining type errors"
Write-Host "3. Verify API functionality after build"