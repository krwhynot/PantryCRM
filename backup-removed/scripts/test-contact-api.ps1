# Kitchen Pantry CRM - Contact Management API Testing Script
# Run this after fixing runtime issues to validate Contact Management

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🧪 Testing Contact Management API Endpoints" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor White

# Function to make HTTP requests
function Invoke-ApiTest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "`n📋 Testing: $Description" -ForegroundColor Yellow
    Write-Host "$Method $Endpoint" -ForegroundColor White
    
    try {
        $uri = "$BaseUrl$Endpoint"
        $headers = @{ "Content-Type" = "application/json" }
        
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "Request Body: $($params.Body)" -ForegroundColor Gray
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        
        if ($response) {
            Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
        }
        
        return $response
    }
    catch {
        Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Check if server is running
Write-Host "`n🔍 Step 1: Server Health Check" -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri $BaseUrl -Method HEAD -TimeoutSec 5
    Write-Host "✅ Server is running on $BaseUrl" -ForegroundColor Green
}
catch {
    Write-Host "❌ Server not responding on $BaseUrl" -ForegroundColor Red
    Write-Host "   Make sure to run 'npm run dev' first" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check Settings API (Position dropdown data)
$settings = Invoke-ApiTest -Method "GET" -Endpoint "/api/settings?category=Position" -Description "Position Settings for Dropdown"

if ($settings) {
    $positionCount = ($settings | Measure-Object).Count
    Write-Host "Found $positionCount position settings" -ForegroundColor White
    
    if ($positionCount -lt 5) {
        Write-Host "⚠️  Warning: Expected at least 5 food service positions" -ForegroundColor Yellow
    }
}

# Test 3: Check Organizations API (for Contact form dropdown)
$organizations = Invoke-ApiTest -Method "GET" -Endpoint "/api/organizations" -Description "Organizations for Contact Form"

$testOrgId = $null
if ($organizations -and $organizations.Count -gt 0) {
    $testOrgId = $organizations[0].id
    Write-Host "Using test organization ID: $testOrgId" -ForegroundColor White
} else {
    Write-Host "⚠️  No organizations found. Create an organization first." -ForegroundColor Yellow
}

# Test 4: Get existing contacts
$existingContacts = Invoke-ApiTest -Method "GET" -Endpoint "/api/contacts" -Description "Existing Contacts List"

# Test 5: Create a test contact (if we have an organization)
if ($testOrgId -and $settings -and $settings.Count -gt 0) {
    $testPositionId = $settings[0].id
    
    $testContact = @{
        firstName = "Test"
        lastName = "Contact"
        email = "test.contact.$(Get-Date -Format 'yyyyMMddHHmmss')@restaurant.com"
        phone = "555-0123"
        organizationId = $testOrgId
        positionId = $testPositionId
        isPrimary = $true
    }
    
    $createdContact = Invoke-ApiTest -Method "POST" -Endpoint "/api/contacts" -Body $testContact -Description "Create Test Contact"
    
    if ($createdContact) {
        Write-Host "✅ Contact created with ID: $($createdContact.id)" -ForegroundColor Green
        
        # Test 6: Get the created contact
        $retrievedContact = Invoke-ApiTest -Method "GET" -Endpoint "/api/contacts/$($createdContact.id)" -Description "Retrieve Created Contact"
        
        # Test 7: Try to create duplicate email (should fail)
        $duplicateContact = @{
            firstName = "Duplicate"
            lastName = "Test"
            email = $testContact.email
            organizationId = $testOrgId
            positionId = $testPositionId
            isPrimary = $false
        }
        
        Write-Host "`n📋 Testing: Duplicate Email Prevention" -ForegroundColor Yellow
        $duplicateResult = Invoke-ApiTest -Method "POST" -Endpoint "/api/contacts" -Body $duplicateContact -Description "Create Duplicate Email (Should Fail)"
        
        if ($duplicateResult) {
            Write-Host "❌ Duplicate email was allowed - this should be prevented!" -ForegroundColor Red
        } else {
            Write-Host "✅ Duplicate email properly prevented" -ForegroundColor Green
        }
    }
}

# Test 8: Search functionality
if ($existingContacts -and $existingContacts.Count -gt 0) {
    $searchTerm = $existingContacts[0].firstName.Substring(0, 2)
    $searchResults = Invoke-ApiTest -Method "GET" -Endpoint "/api/contacts?search=$searchTerm" -Description "Contact Search Test"
}

# Test 9: Performance test - measure response times
Write-Host "`n⏱️  Performance Testing" -ForegroundColor Cyan

$performanceTests = @(
    @{ Endpoint = "/api/contacts"; Description = "Contact List Load"; MaxTime = 1000 },
    @{ Endpoint = "/api/organizations"; Description = "Organization Dropdown"; MaxTime = 500 },
    @{ Endpoint = "/api/settings?category=Position"; Description = "Position Dropdown"; MaxTime = 500 }
)

foreach ($test in $performanceTests) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl$($test.Endpoint)" -Method GET
        $stopwatch.Stop()
        $elapsed = $stopwatch.ElapsedMilliseconds
        
        if ($elapsed -lt $test.MaxTime) {
            Write-Host "✅ $($test.Description): ${elapsed}ms (Target: <$($test.MaxTime)ms)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($test.Description): ${elapsed}ms (Slow - Target: <$($test.MaxTime)ms)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($test.Description): Failed" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

$issues = @()

if (-not $settings -or $settings.Count -lt 5) {
    $issues += "Position settings may be incomplete"
}

if (-not $organizations -or $organizations.Count -eq 0) {
    $issues += "No organizations available for testing"
}

if ($issues.Count -eq 0) {
    Write-Host "✅ All Contact Management API tests passed!" -ForegroundColor Green
    Write-Host "📋 Next Steps:" -ForegroundColor White
    Write-Host "   1. Test the UI components in browser" -ForegroundColor White
    Write-Host "   2. Verify touch device compatibility" -ForegroundColor White
    Write-Host "   3. Run the full validation checklist" -ForegroundColor White
} else {
    Write-Host "⚠️  Issues found:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "   - $issue" -ForegroundColor Yellow
    }
}

Write-Host "`n🌐 Open browser to test UI: $BaseUrl/contacts" -ForegroundColor Cyan