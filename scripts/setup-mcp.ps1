# MCP Setup Script for PantryCRM
# Ensures all required MCP servers are installed and configured

Write-Host "Setting up MCP servers for PantryCRM..." -ForegroundColor Green

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH"
    exit 1
}

# List of required MCP servers
$mcpServers = @(
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-sequential-thinking", 
    "@modelcontextprotocol/server-filesystem",
    "@upstash/context7-mcp",
    "tavily-mcp",
    "exa-mcp-server",
    "@jschuller/perplexity-mcp",
    "@modelcontextprotocol/server-brave-search",
    "@modelcontextprotocol/server-postgres",
    "@modelcontextprotocol/server-google-maps"
)

Write-Host "Installing MCP servers..." -ForegroundColor Yellow

foreach ($server in $mcpServers) {
    Write-Host "Installing $server..." -ForegroundColor Cyan
    try {
        npm install -g $server 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $server installed successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $server may already be installed or failed" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Failed to install $server" -ForegroundColor Red
    }
}

Write-Host "`nVerifying installed MCP servers..." -ForegroundColor Yellow
$installed = npm list -g --depth=0 2>$null | Select-String -Pattern "(mcp|tavily|exa|perplexity|context7)"

if ($installed) {
    Write-Host "`n✅ Installed MCP packages:" -ForegroundColor Green
    $installed | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
} else {
    Write-Host "❌ No MCP packages found" -ForegroundColor Red
}

# Check Claude Desktop config
$claudeConfigPath = "$env:USERPROFILE\.claude\claude_desktop_config.json"
if (Test-Path $claudeConfigPath) {
    Write-Host "`n✅ Claude Desktop config found at: $claudeConfigPath" -ForegroundColor Green
    Write-Host "   Restart Claude Desktop to activate MCP servers" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  Claude Desktop config not found at: $claudeConfigPath" -ForegroundColor Yellow
    Write-Host "   You may need to configure Claude Desktop manually" -ForegroundColor Yellow
}

Write-Host "`n🎉 MCP setup complete!" -ForegroundColor Green
Write-Host "   Available tools: Memory, Sequential Thinking, Filesystem, Context7, Tavily, Exa, Perplexity, Brave Search" -ForegroundColor White