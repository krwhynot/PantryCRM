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
