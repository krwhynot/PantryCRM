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