# Dashboard Test Component Fix Script
Write-Host "Fixing Dashboard Test Props"
Write-Host "=========================="

# Check if the Dashboard.tsx file exists to read the prop types
$dashboardPath = "src/components/dashboard/Dashboard.tsx"
if (-not (Test-Path $dashboardPath)) {
    Write-Host "Dashboard component not found at $dashboardPath" -ForegroundColor Red
    exit 1
}

# Read Dashboard component content to understand prop requirements
$dashboardContent = Get-Content -Path $dashboardPath -Raw
Write-Host "Analyzing Dashboard component props..."

# Path to test file
$testFilePath = "src/components/dashboard/__tests__/Dashboard.test.tsx"
if (-not (Test-Path $testFilePath)) {
    Write-Host "Dashboard test file not found at $testFilePath" -ForegroundColor Red
    exit 1
}

# Read test file content
$testContent = Get-Content -Path $testFilePath -Raw

# Check if mock data is already defined
if ($testContent -match "const mockOrganizationCount") {
    Write-Host "Mock data already defined in test file. No changes needed." -ForegroundColor Green
    exit 0
}

# Create the updated test content
$updatedTestContent = $testContent -replace '<Dashboard\s*/>', '<Dashboard organizationCount={mockOrganizationCount} recentInteractions={mockRecentInteractions} />'

# Define mock data before the first test
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

# Insert mock data before describe block
$updatedTestContent = $updatedTestContent -replace '(describe\(''Dashboard'', \(\) => \{)', "$mockDataBlock`$1"

# Write updated content back to file
Set-Content -Path $testFilePath -Value $updatedTestContent
Write-Host "Updated $testFilePath with required props" -ForegroundColor Green

# Confirm success
Write-Host "`nDashboard test fix complete!"
Write-Host "Dashboard test component now uses proper mock props for all test cases."