# PantryCRM Validation Runner Script
# This script helps run the validation process for Contact Management features

# Configuration
$projectRoot = "r:\Projects\PantryCRM"
$devServerPort = 3000
$devServerProcess = $null

# Helper function for formatted output
function Write-Step {
    param (
        [string]$stepName,
        [string]$description
    )
    
    Write-Host ""
    Write-Host "===== $stepName =====" -ForegroundColor Cyan
    Write-Host "$description" -ForegroundColor Gray
    Write-Host ""
}

# Main menu function
function Show-MainMenu {
    Clear-Host
    Write-Host "===== PantryCRM Contact Management Validation =====" -ForegroundColor Cyan
    Write-Host "Select an option to proceed:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Start Development Server" -ForegroundColor Green
    Write-Host "2. Run API Validation Tests" -ForegroundColor Yellow
    Write-Host "3. Open Browser for UI Testing" -ForegroundColor Yellow
    Write-Host "4. View Validation Guide" -ForegroundColor Magenta
    Write-Host "5. Exit" -ForegroundColor Red
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        "1" { Start-DevServer }
        "2" { Run-ApiValidation }
        "3" { Open-BrowserForTesting }
        "4" { View-ValidationGuide }
        "5" { Exit-Script }
        default { 
            Write-Host "Invalid choice. Press any key to continue..." -ForegroundColor Red
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            Show-MainMenu
        }
    }
}

# Function to start the development server
function Start-DevServer {
    Write-Step "Starting Development Server" "Launching Next.js development server on port $devServerPort"
    
    # Check if server is already running
    $existingProcess = Get-NetTCPConnection -LocalPort $devServerPort -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-Host "Development server already running on port $devServerPort" -ForegroundColor Yellow
        Write-Host "Press any key to continue..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Show-MainMenu
        return
    }
    
    # Start the server
    Set-Location $projectRoot
    Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
    
    Write-Host "Development server starting..." -ForegroundColor Green
    Write-Host "Waiting for server to be ready..." -ForegroundColor Gray
    
    # Wait for server to be ready
    $ready = $false
    $attempts = 0
    $maxAttempts = 30
    
    while (-not $ready -and $attempts -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$devServerPort" -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $ready = $true
            }
        } catch {
            Start-Sleep -Seconds 1
            $attempts++
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    
    if ($ready) {
        Write-Host "Development server is running on http://localhost:$devServerPort" -ForegroundColor Green
    } else {
        Write-Host "Timed out waiting for development server to start" -ForegroundColor Red
    }
    
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-MainMenu
}# Function to run API validation tests
function Run-ApiValidation {
    Write-Step "Running API Validation Tests" "Executing test-contacts-with-auth.ps1 script"
    
    # Check if development server is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$devServerPort" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -ne 200) {
            Write-Host "Development server not responding. Please start the server first." -ForegroundColor Red
            Write-Host "Press any key to continue..." -ForegroundColor Gray
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            Show-MainMenu
            return
        }
    } catch {
        Write-Host "Development server not running. Please start the server first." -ForegroundColor Red
        Write-Host "Press any key to continue..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Show-MainMenu
        return
    }
    
    # Run the validation script
    Set-Location $projectRoot
    try {
        & "$projectRoot\validation\test-contacts-with-auth.ps1"
    } catch {
        Write-Host "Error running validation script: $_" -ForegroundColor Red
    }
    
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-MainMenu
}

# Function to open browser for UI testing
function Open-BrowserForTesting {
    Write-Step "Opening Browser for UI Testing" "Launching browser with validation tools"
    
    # Check if development server is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$devServerPort" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -ne 200) {
            Write-Host "Development server not responding. Please start the server first." -ForegroundColor Red
            Write-Host "Press any key to continue..." -ForegroundColor Gray
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            Show-MainMenu
            return
        }
    } catch {
        Write-Host "Development server not running. Please start the server first." -ForegroundColor Red
        Write-Host "Press any key to continue..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Show-MainMenu
        return
    }
    
    # Open browser to contacts page
    Start-Process "http://localhost:$devServerPort/contacts"
    
    # Show instructions
    Write-Host "Browser opened to contacts page." -ForegroundColor Green
    Write-Host "To validate touch targets:" -ForegroundColor White
    Write-Host "1. Open browser developer tools (F12)" -ForegroundColor Gray
    Write-Host "2. Paste the contents of validation/ui-touch-validation.js into the console" -ForegroundColor Gray
    Write-Host "3. Press Enter to run the validation" -ForegroundColor Gray
    
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-MainMenu
}# Function to view validation guide
function View-ValidationGuide {
    Write-Step "Viewing Validation Guide" "Opening contact-management-validation-guide.md"
    
    $guidePath = "$projectRoot\validation\contact-management-validation-guide.md"
    
    if (Test-Path $guidePath) {
        # Try to open with default markdown viewer
        try {
            Invoke-Item $guidePath
        } catch {
            # If that fails, just output the content to console
            Get-Content $guidePath | Out-Host
        }
    } else {
        Write-Host "Validation guide not found at: $guidePath" -ForegroundColor Red
    }
    
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-MainMenu
}

# Function to exit the script
function Exit-Script {
    Write-Step "Exiting Validation Runner" "Thank you for using the PantryCRM Validation Runner"
    
    # Ask if user wants to stop the development server
    $stopServer = Read-Host "Do you want to stop the development server? (y/n)"
    
    if ($stopServer -eq "y") {
        # Find and stop the Node.js process for the dev server
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        
        foreach ($process in $nodeProcesses) {
            $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($process.Id)" | Select-Object CommandLine
            
            if ($processInfo.CommandLine -like "*next*dev*") {
                Write-Host "Stopping development server (PID: $($process.Id))..." -ForegroundColor Yellow
                Stop-Process -Id $process.Id -Force
                Write-Host "Development server stopped." -ForegroundColor Green
                break
            }
        }
    }
    
    Write-Host "Goodbye!" -ForegroundColor Cyan
    exit
}

# Start the script
Show-MainMenu