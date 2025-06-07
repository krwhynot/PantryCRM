param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Email = "will@kitchenpantry.com",
    [string]$Password = "Welcome123!"
)

Write-Host "Testing Contact Management API Endpoints" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor White

# Test 1: Check if server is running
Write-Host "`nStep 1: Server Health Check" -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri "$BaseUrl/sign-in" -Method HEAD -TimeoutSec 5
    Write-Host "SUCCESS: Server is running on $BaseUrl" -ForegroundColor Green
}
catch {
    Write-Host "FAILED: Server not responding on $BaseUrl" -ForegroundColor Red
    Write-Host "Make sure to run 'npm run dev' first" -ForegroundColor Yellow
    exit 1
}

# Test 2: Authenticate and get session cookie
Write-Host "`nStep 2: Authentication" -ForegroundColor Cyan
try {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    
    # First, get CSRF token from sign-in page
    $signInPage = Invoke-WebRequest -Uri "$BaseUrl/sign-in" -Method GET -SessionVariable session
    
    # Authenticate with credentials
    $authBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $authResponse = Invoke-WebRequest -Uri "$BaseUrl/api/auth/callback/credentials" -Method POST -Body $authBody -ContentType "application/json" -WebSession $session
    
    Write-Host "SUCCESS: Authentication completed" -ForegroundColor Green
}
catch {
    Write-Host "FAILED: Authentication failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}