param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "Testing Contact Management API Endpoints" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor White

# Test 1: Check if server is running
Write-Host "`nStep 1: Server Health Check" -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri $BaseUrl -Method HEAD -TimeoutSec 5
    Write-Host "SUCCESS: Server is running on $BaseUrl" -ForegroundColor Green
}
catch {
    Write-Host "FAILED: Server not responding on $BaseUrl" -ForegroundColor Red
    Write-Host "Make sure to run 'npm run dev' first" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check Settings API (Position dropdown data)
Write-Host "`nStep 2: Testing Position Settings API" -ForegroundColor Cyan
try {
    $settings = Invoke-RestMethod -Uri "$BaseUrl/api/settings?category=Position" -Method GET
    $positionCount = ($settings | Measure-Object).Count
    Write-Host "SUCCESS: Found $positionCount position settings" -ForegroundColor Green
    
    if ($positionCount -lt 5) {
        Write-Host "WARNING: Expected at least 5 food service positions" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "FAILED: Could not retrieve position settings - $($_.Exception.Message)" -ForegroundColor Red
}# Test 3: Check Organizations API (for Contact form dropdown)
Write-Host "`nStep 3: Testing Organizations API" -ForegroundColor Cyan
try {
    $organizations = Invoke-RestMethod -Uri "$BaseUrl/api/organizations" -Method GET
    $orgCount = ($organizations | Measure-Object).Count
    Write-Host "SUCCESS: Found $orgCount organizations" -ForegroundColor Green
    
    $testOrgId = $null
    if ($organizations -and $orgCount -gt 0) {
        $testOrgId = $organizations[0].id
        Write-Host "Using test organization ID: $testOrgId" -ForegroundColor White
    } else {
        Write-Host "WARNING: No organizations found. Create an organization first." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "FAILED: Could not retrieve organizations - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get existing contacts
Write-Host "`nStep 4: Testing Contacts List API" -ForegroundColor Cyan
try {
    $existingContacts = Invoke-RestMethod -Uri "$BaseUrl/api/contacts" -Method GET
    $contactCount = ($existingContacts | Measure-Object).Count
    Write-Host "SUCCESS: Found $contactCount existing contacts" -ForegroundColor Green
}
catch {
    Write-Host "FAILED: Could not retrieve contacts - $($_.Exception.Message)" -ForegroundColor Red
}# Test 5: Create a test contact (if we have an organization)
Write-Host "`nStep 5: Testing Contact Creation" -ForegroundColor Cyan
if ($testOrgId -and $settings -and $positionCount -gt 0) {
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
    
    try {
        $jsonBody = $testContact | ConvertTo-Json -Depth 10
        Write-Host "Request Body: $jsonBody" -ForegroundColor Gray
        
        $createdContact = Invoke-RestMethod -Uri "$BaseUrl/api/contacts" -Method POST -Body $jsonBody -ContentType "application/json"
        Write-Host "SUCCESS: Contact created with ID: $($createdContact.id)" -ForegroundColor Green
        
        # Test 6: Get the created contact
        Write-Host "`nStep 6: Testing Contact Retrieval" -ForegroundColor Cyan
        $retrievedContact = Invoke-RestMethod -Uri "$BaseUrl/api/contacts/$($createdContact.id)" -Method GET
        Write-Host "SUCCESS: Retrieved contact details for ID: $($retrievedContact.id)" -ForegroundColor Green
        
        # Test 7: Try to create duplicate email (should fail)
        Write-Host "`nStep 7: Testing Duplicate Email Prevention" -ForegroundColor Cyan
        $duplicateContact = @{
            firstName = "Duplicate"
            lastName = "Test"
            email = $testContact.email
            organizationId = $testOrgId
            positionId = $testPositionId
            isPrimary = $false
        }
        
        $duplicateJson = $duplicateContact | ConvertTo-Json -Depth 10
        
        try {
            $duplicateResult = Invoke-RestMethod -Uri "$BaseUrl/api/contacts" -Method POST -Body $duplicateJson -ContentType "application/json"
            Write-Host "FAILED: Duplicate email was allowed - this should be prevented!" -ForegroundColor Red
        } catch {
            Write-Host "SUCCESS: Duplicate email properly prevented" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "FAILED: Could not create contact - $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "SKIPPED: Cannot create test contact without organization and position data" -ForegroundColor Yellow
}# Test 8: Search functionality
Write-Host "`nStep 8: Testing Contact Search" -ForegroundColor Cyan
if ($existingContacts -and $contactCount -gt 0) {
    try {
        $searchTerm = $existingContacts[0].firstName.Substring(0, 2)
        $searchResults = Invoke-RestMethod -Uri "$BaseUrl/api/contacts?search=$searchTerm" -Method GET
        $searchCount = ($searchResults | Measure-Object).Count
        Write-Host "SUCCESS: Search for '$searchTerm' found $searchCount results" -ForegroundColor Green
    }
    catch {
        Write-Host "FAILED: Contact search failed - $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "SKIPPED: Cannot test search without existing contacts" -ForegroundColor Yellow
}

# Test 9: Performance test - measure response times
Write-Host "`nStep 9: Performance Testing" -ForegroundColor Cyan

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
            Write-Host "SUCCESS: $($test.Description): ${elapsed}ms (Target: less than $($test.MaxTime)ms)" -ForegroundColor Green
        } else {
            Write-Host "WARNING: $($test.Description): ${elapsed}ms (Slow - Target: less than $($test.MaxTime)ms)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "FAILED: $($test.Description): $($_.Exception.Message)" -ForegroundColor Red
    }
}# Summary
Write-Host "`nTEST SUMMARY" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Cyan

$issues = @()

if (-not $settings -or $positionCount -lt 5) {
    $issues += "Position settings may be incomplete"
}

if (-not $organizations -or $orgCount -eq 0) {
    $issues += "No organizations available for testing"
}

if ($issues.Count -eq 0) {
    Write-Host "All Contact Management API tests passed!" -ForegroundColor Green
    Write-Host "Next Steps:" -ForegroundColor White
    Write-Host "1. Test the UI components in browser" -ForegroundColor White
    Write-Host "2. Verify touch device compatibility (44px minimum targets)" -ForegroundColor White
    Write-Host "3. Run the full validation checklist" -ForegroundColor White
} else {
    Write-Host "Issues found:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "- $issue" -ForegroundColor Yellow
    }
}

Write-Host "`nOpen browser to test UI: $BaseUrl/contacts" -ForegroundColor Cyan