# PantryCRM Contact Management API Validation Script
# This script tests the Contact Management API with proper authentication handling

# Configuration
$baseUrl = "http://localhost:3000"
$loginEmail = "will@kitchenpantry.com"
$loginPassword = "Welcome123!"
$testResults = @()
$totalTests = 0
$passedTests = 0

# Helper function for formatted output
function Write-TestResult {
    param (
        [string]$testName,
        [bool]$passed,
        [string]$message,
        [object]$data = $null,
        [int]$responseTime = 0
    )
    
    $color = if ($passed) { "Green" } else { "Red" }
    $status = if ($passed) { "PASS" } else { "FAIL" }
    
    Write-Host "[$status] $testName" -ForegroundColor $color
    Write-Host "  $message" -ForegroundColor Gray
    
    if ($responseTime -gt 0) {
        $timeColor = if ($responseTime -lt 500) { "Green" } else { "Yellow" }
        Write-Host "  Response time: $responseTime ms" -ForegroundColor $timeColor
    }
    
    if ($data) {
        Write-Host "  Data: $($data | ConvertTo-Json -Depth 1 -Compress)" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    $global:totalTests++
    if ($passed) { $global:passedTests++ }
    
    $global:testResults += [PSCustomObject]@{
        TestName = $testName
        Status = $status
        Message = $message
        ResponseTime = $responseTime
    }
}

# Function to handle authentication and maintain session
function Get-AuthenticatedSession {
    Write-Host "Authenticating with test user credentials..." -ForegroundColor Cyan
    
    try {
        # First, get the CSRF token from the login page
        $loginPageResponse = Invoke-WebRequest -Uri "$baseUrl/sign-in" -SessionVariable webSession
        
        # Extract CSRF token (this pattern may need adjustment based on your actual implementation)
        if ($loginPageResponse.Content -match 'name="csrfToken"\s+value="([^"]+)"') {
            $csrfToken = $matches[1]
            Write-Host "  CSRF token obtained: $($csrfToken.Substring(0, 10))..." -ForegroundColor Gray
        } else {
            Write-Host "  Could not extract CSRF token from login page" -ForegroundColor Red
            return $null
        }
        
        # Prepare login form data
        $formData = @{
            csrfToken = $csrfToken
            email = $loginEmail
            password = $loginPassword
            callbackUrl = "$baseUrl"
        }
        
        # Submit login form
        $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/callback/credentials" -Method POST -Body $formData -WebSession $webSession -MaximumRedirection 0 -ErrorAction SilentlyContinue
        
        # Check if we got a redirect (302) which indicates successful login
        if ($loginResponse.StatusCode -eq 302) {
            Write-Host "  Login successful! Following redirect..." -ForegroundColor Green
            
            # Follow the redirect to get the session cookie
            $redirectUrl = $loginResponse.Headers.Location
            $homePageResponse = Invoke-WebRequest -Uri $redirectUrl -WebSession $webSession
            
            Write-Host "  Authentication completed successfully" -ForegroundColor Green
            return $webSession
        } else {
            Write-Host "  Login failed: Unexpected status code $($loginResponse.StatusCode)" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "  Authentication error: $_" -ForegroundColor Red
        return $null
    }
}

# Main test execution
Write-Host "===== PantryCRM Contact Management API Validation =====" -ForegroundColor Cyan
Write-Host "Starting validation at $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

# Step 1: Authenticate and get session
$session = Get-AuthenticatedSession
if (-not $session) {
    Write-Host "Authentication failed. Cannot proceed with tests." -ForegroundColor Red
    exit 1
}

# Step 2: Test server health
try {
    $startTime = (Get-Date).Ticks / 10000
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/api/health" -WebSession $session
    $endTime = (Get-Date).Ticks / 10000
    $responseTime = $endTime - $startTime
    
    $passed = $healthResponse.StatusCode -eq 200
    Write-TestResult -testName "Server Health Check" -passed $passed -message "Server is responding with status code $($healthResponse.StatusCode)" -responseTime $responseTime
} catch {
    Write-TestResult -testName "Server Health Check" -passed $false -message "Error: $_"
}

# Step 3: Test position settings API
try {
    $startTime = (Get-Date).Ticks / 10000
    $positionsResponse = Invoke-WebRequest -Uri "$baseUrl/api/settings?type=position" -WebSession $session
    $endTime = (Get-Date).Ticks / 10000
    $responseTime = $endTime - $startTime
    
    $positions = $positionsResponse.Content | ConvertFrom-Json
    $passed = $positions -and $positions.Count -gt 0
    Write-TestResult -testName "Position Settings API" -passed $passed -message "Retrieved $($positions.Count) positions" -data $positions[0..2] -responseTime $responseTime
} catch {
    Write-TestResult -testName "Position Settings API" -passed $false -message "Error: $_"
}

# Step 4: Test organizations API
try {
    $startTime = (Get-Date).Ticks / 10000
    $orgsResponse = Invoke-WebRequest -Uri "$baseUrl/api/organizations" -WebSession $session
    $endTime = (Get-Date).Ticks / 10000
    $responseTime = $endTime - $startTime
    
    $organizations = $orgsResponse.Content | ConvertFrom-Json
    $passed = $organizations -and $organizations.Count -gt 0
    Write-TestResult -testName "Organizations API" -passed $passed -message "Retrieved $($organizations.Count) organizations" -data $organizations[0..2] -responseTime $responseTime
    
    # Save first organization for contact creation test
    if ($passed) {
        $testOrgId = $organizations[0].id
    }
} catch {
    Write-TestResult -testName "Organizations API" -passed $false -message "Error: $_"
}# Step 5: Test contacts list API
try {
    $startTime = (Get-Date).Ticks / 10000
    $contactsResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts" -WebSession $session
    $endTime = (Get-Date).Ticks / 10000
    $responseTime = $endTime - $startTime
    
    $contacts = $contactsResponse.Content | ConvertFrom-Json
    $passed = $null -ne $contacts
    Write-TestResult -testName "Contacts List API" -passed $passed -message "Retrieved $($contacts.Count) contacts" -data $contacts[0..2] -responseTime $responseTime
} catch {
    Write-TestResult -testName "Contacts List API" -passed $false -message "Error: $_"
}

# Step 6: Test contact creation
try {
    # Only proceed if we have an organization to work with
    if ($testOrgId) {
        # Generate a unique email to avoid duplicates
        $uniqueEmail = "test-$((Get-Date).Ticks)@example.com"
        
        $newContact = @{
            firstName = "Test"
            lastName = "Contact"
            email = $uniqueEmail
            phone = "555-123-4567"
            organizationId = $testOrgId
            isPrimary = $false
            positionId = $positions[0].id
            notes = "Created by automated test script"
        }
        
        $startTime = (Get-Date).Ticks / 10000
        $createResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts" -Method POST -Body ($newContact | ConvertTo-Json) -ContentType "application/json" -WebSession $session
        $endTime = (Get-Date).Ticks / 10000
        $responseTime = $endTime - $startTime
        
        $createdContact = $createResponse.Content | ConvertFrom-Json
        $passed = $createResponse.StatusCode -eq 200 -and $createdContact.id
        Write-TestResult -testName "Contact Creation" -passed $passed -message "Created contact with ID: $($createdContact.id)" -data $createdContact -responseTime $responseTime
        
        # Save contact ID for later tests
        $testContactId = $createdContact.id
    } else {
        Write-TestResult -testName "Contact Creation" -passed $false -message "Skipped: No organization available for testing"
    }
} catch {
    Write-TestResult -testName "Contact Creation" -passed $false -message "Error: $_"
}

# Step 7: Test duplicate email prevention
try {
    # Only proceed if we successfully created a contact
    if ($testContactId) {
        $duplicateContact = @{
            firstName = "Duplicate"
            lastName = "Contact"
            email = $uniqueEmail  # Same email as previous test
            phone = "555-987-6543"
            organizationId = $testOrgId
            isPrimary = $false
            positionId = $positions[0].id
            notes = "This should fail due to duplicate email"
        }
        
        try {
            $duplicateResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts" -Method POST -Body ($duplicateContact | ConvertTo-Json) -ContentType "application/json" -WebSession $session -ErrorAction Stop
            # If we get here, the duplicate was allowed (test failed)
            Write-TestResult -testName "Duplicate Email Prevention" -passed $false -message "API accepted duplicate email" -data $duplicateResponse
        } catch {
            # We expect a 400 Bad Request or similar error
            $errorResponse = $_.Exception.Response
            $passed = $errorResponse -and $errorResponse.StatusCode.value__ -ge 400
            Write-TestResult -testName "Duplicate Email Prevention" -passed $passed -message "API correctly rejected duplicate email with status $($errorResponse.StatusCode.value__)"
        }
    } else {
        Write-TestResult -testName "Duplicate Email Prevention" -passed $false -message "Skipped: No contact was created in previous test"
    }
} catch {
    Write-TestResult -testName "Duplicate Email Prevention" -passed $false -message "Error: $_"
}

# Step 8: Test primary contact enforcement
try {
    # Only proceed if we have an organization to work with
    if ($testOrgId) {
        # Create a primary contact
        $primaryContact = @{
            firstName = "Primary"
            lastName = "Contact"
            email = "primary-$((Get-Date).Ticks)@example.com"
            phone = "555-PRIMARY"
            organizationId = $testOrgId
            isPrimary = $true
            positionId = $positions[0].id
            notes = "This should be set as primary"
        }
        
        $primaryResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts" -Method POST -Body ($primaryContact | ConvertTo-Json) -ContentType "application/json" -WebSession $session
        $createdPrimary = $primaryResponse.Content | ConvertFrom-Json
        
        # Now create another primary contact for the same organization
        $secondPrimary = @{
            firstName = "Second"
            lastName = "Primary"
            email = "second-primary-$((Get-Date).Ticks)@example.com"
            phone = "555-SECOND"
            organizationId = $testOrgId
            isPrimary = $true
            positionId = $positions[0].id
            notes = "This should replace the first primary contact"
        }
        
        $secondPrimaryResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts" -Method POST -Body ($secondPrimary | ConvertTo-Json) -ContentType "application/json" -WebSession $session
        $createdSecondPrimary = $secondPrimaryResponse.Content | ConvertFrom-Json
        
        # Now check if the first contact is no longer primary
        $verifyResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts/$($createdPrimary.id)" -WebSession $session
        $verifiedContact = $verifyResponse.Content | ConvertFrom-Json
        
        $passed = $verifiedContact -and $verifiedContact.isPrimary -eq $false
        Write-TestResult -testName "Primary Contact Enforcement" -passed $passed -message "First primary contact was correctly updated to non-primary" -data $verifiedContact
    } else {
        Write-TestResult -testName "Primary Contact Enforcement" -passed $false -message "Skipped: No organization available for testing"
    }
} catch {
    Write-TestResult -testName "Primary Contact Enforcement" -passed $false -message "Error: $_"
}# Step 9: Test search functionality
try {
    # Use a search term that should match at least some contacts
    $searchTerm = "test"
    
    $startTime = (Get-Date).Ticks / 10000
    $searchResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts?search=$searchTerm" -WebSession $session
    $endTime = (Get-Date).Ticks / 10000
    $responseTime = $endTime - $startTime
    
    $searchResults = $searchResponse.Content | ConvertFrom-Json
    $passed = $null -ne $searchResults
    Write-TestResult -testName "Contact Search API" -passed $passed -message "Search for '$searchTerm' returned $($searchResults.Count) results" -data $searchResults[0..2] -responseTime $responseTime
    
    # Performance check
    $searchPerformancePassed = $responseTime -lt 1000  # Less than 1 second
    Write-TestResult -testName "Search Performance" -passed $searchPerformancePassed -message "Search response time: $responseTime ms (target: <1000ms)" -responseTime $responseTime
} catch {
    Write-TestResult -testName "Contact Search API" -passed $false -message "Error: $_"
    Write-TestResult -testName "Search Performance" -passed $false -message "Could not test performance due to API error"
}

# Step 10: Test organization filter
try {
    if ($testOrgId) {
        $startTime = (Get-Date).Ticks / 10000
        $filterResponse = Invoke-WebRequest -Uri "$baseUrl/api/contacts?organizationId=$testOrgId" -WebSession $session
        $endTime = (Get-Date).Ticks / 10000
        $responseTime = $endTime - $startTime
        
        $filteredContacts = $filterResponse.Content | ConvertFrom-Json
        $passed = $null -ne $filteredContacts
        
        # Verify all contacts belong to the specified organization
        $correctOrg = $true
        foreach ($contact in $filteredContacts) {
            if ($contact.organization.id -ne $testOrgId) {
                $correctOrg = $false
                break
            }
        }
        
        Write-TestResult -testName "Organization Filter" -passed ($passed -and $correctOrg) -message "Filter returned $($filteredContacts.Count) contacts for organization $testOrgId" -data $filteredContacts[0..2] -responseTime $responseTime
    } else {
        Write-TestResult -testName "Organization Filter" -passed $false -message "Skipped: No organization available for testing"
    }
} catch {
    Write-TestResult -testName "Organization Filter" -passed $false -message "Error: $_"
}

# Step 11: Test dropdown performance (positions)
try {
    $startTime = (Get-Date).Ticks / 10000
    $positionsResponse = Invoke-WebRequest -Uri "$baseUrl/api/settings?type=position" -WebSession $session
    $endTime = (Get-Date).Ticks / 10000
    $responseTime = $endTime - $startTime
    
    $performancePassed = $responseTime -lt 500  # Less than 500ms
    Write-TestResult -testName "Position Dropdown Performance" -passed $performancePassed -message "Position dropdown data loaded in $responseTime ms (target: <500ms)" -responseTime $responseTime
} catch {
    Write-TestResult -testName "Position Dropdown Performance" -passed $false -message "Error: $_"
}

# Step 12: Test dropdown performance (organizations)
try {
    $startTime = (Get-Date).Ticks / 10000
    $orgsResponse = Invoke-WebRequest -Uri "$baseUrl/api/organizations" -WebSession $session
    $endTime = (Get-Date).Ticks / 10000
    $responseTime = $endTime - $startTime
    
    $performancePassed = $responseTime -lt 500  # Less than 500ms
    Write-TestResult -testName "Organization Dropdown Performance" -passed $performancePassed -message "Organization dropdown data loaded in $responseTime ms (target: <500ms)" -responseTime $responseTime
} catch {
    Write-TestResult -testName "Organization Dropdown Performance" -passed $false -message "Error: $_"
}

# Print test summary
Write-Host "===== Test Summary =====" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor $(if ($totalTests - $passedTests -gt 0) { "Red" } else { "Green" })
Write-Host "Pass Rate: $(if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 })%" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })
Write-Host ""

# Export results to CSV
$testResults | Export-Csv -Path "contact-api-validation-results.csv" -NoTypeInformation
Write-Host "Results exported to contact-api-validation-results.csv" -ForegroundColor Cyan