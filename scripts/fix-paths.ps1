# Path Resolution Fix Script for Next.js Build
Write-Host "PantryCRM Path Resolution Fix" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check for app directory structure
Write-Host "Checking directory structure..."
$appExists = Test-Path "app"
$pagesExists = Test-Path "pages"
$srcAppExists = Test-Path "src/app"
$srcPagesExists = Test-Path "src/pages"

Write-Host "Directory Check Results:"
Write-Host "- app/: $appExists"
Write-Host "- pages/: $pagesExists"
Write-Host "- src/app/: $srcAppExists" 
Write-Host "- src/pages/: $srcPagesExists"

# Check Next.js config
Write-Host "`nChecking Next.js configuration..."
$nextConfig = Get-Content "next.config.js" | Out-String

if ($nextConfig -match "distDir:") {
    Write-Host "Custom distDir found in next.config.js" -ForegroundColor Yellow
}

if ($nextConfig -match "pageExtensions:") {
    Write-Host "Custom pageExtensions found in next.config.js" -ForegroundColor Yellow
}

# Check tsconfig.json
Write-Host "`nChecking TypeScript configuration..."
$tsConfig = Get-Content "tsconfig.json" | Out-String

if ($tsConfig -match """baseUrl"":") {
    $baseUrl = [regex]::Match($tsConfig, """baseUrl"":\s*""([^""]+)""").Groups[1].Value
    Write-Host "baseUrl in tsconfig.json: $baseUrl" -ForegroundColor Yellow
}

# Create fix strategy
Write-Host "`nGenerating path fix strategy..."

$needsLink = $false
$sourcePath = ""
$targetPath = ""

if ((-not $appExists) -and $srcAppExists) {
    $needsLink = $true
    $sourcePath = "src/app"
    $targetPath = "app"
}

if ((-not $pagesExists) -and $srcPagesExists) {
    $needsLink = $true
    $sourcePath = "src/pages"
    $targetPath = "pages"
}

if ($needsLink) {
    Write-Host "Creating symbolic link from $sourcePath to $targetPath..." -ForegroundColor Green
    if (Test-Path $targetPath) {
        Remove-Item $targetPath -Force -Recurse
    }
    New-Item -ItemType Junction -Path $targetPath -Target $sourcePath
    Write-Host "Symbolic link created." -ForegroundColor Green
} else {
    Write-Host "No path fixes needed." -ForegroundColor Green
}

# Update next.config.js if needed
if (-not ($nextConfig -match "experimental:\s*\{")) {
    Write-Host "`nUpdating next.config.js to use proper directory structure..." -ForegroundColor Yellow
    $updatedConfig = $nextConfig -replace "module\.exports\s*=\s*\{", "module.exports = {`n  experimental: {`n    typedRoutes: true`n  },`n"
    Set-Content -Path "next.config.js" -Value $updatedConfig
    Write-Host "next.config.js updated." -ForegroundColor Green
}

# Create fix for next clean command
Write-Host "`nCreating fix for next clean command..."
$cleanFix = @"
# Next.js Clean Fix for Next.js 15
Write-Host "Running Next.js clean with proper path resolution..."

# Remove .next directory if it exists
if (Test-Path '.next') {
    Write-Host "Removing .next directory..."
    Remove-Item -Path '.next' -Recurse -Force
    Write-Host ".next directory removed."
}

# Clear TypeScript build info
if (Test-Path 'tsconfig.tsbuildinfo') {
    Write-Host "Removing TypeScript build info..."
    Remove-Item -Path 'tsconfig.tsbuildinfo' -Force
    Write-Host "TypeScript build info removed."
}

# Clear package manager cache for next
npm cache clean --force next

Write-Host "Cache clear complete. You can now run 'npx next build'."
"@

Set-Content -Path "scripts/next-clean.ps1" -Value $cleanFix
Write-Host "Created clean fix script at scripts/next-clean.ps1" -ForegroundColor Green

# Completion message
Write-Host "`nPath Resolution Fix Complete!" -ForegroundColor Cyan
Write-Host "You can now run the Next.js build with correct path resolution:" -ForegroundColor White
Write-Host "1. Run: .\scripts\next-clean.ps1" -ForegroundColor White
Write-Host "2. Run: npx next build --no-lint" -ForegroundColor White