#!/bin/bash
# MCP Setup Script for PantryCRM (Linux/Mac)
# Ensures all required MCP servers are installed and configured

echo "🚀 Setting up MCP servers for PantryCRM..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed or not in PATH"
    exit 1
fi

# List of required MCP servers
MCP_SERVERS=(
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-sequential-thinking" 
    "@modelcontextprotocol/server-filesystem"
    "@upstash/context7-mcp"
    "tavily-mcp"
    "exa-mcp-server"
    "@jschuller/perplexity-mcp"
    "@modelcontextprotocol/server-brave-search"
    "@modelcontextprotocol/server-postgres"
    "@modelcontextprotocol/server-google-maps"
)

echo "📦 Installing MCP servers..."

for server in "${MCP_SERVERS[@]}"; do
    echo "Installing $server..."
    if npm install -g "$server" &>/dev/null; then
        echo "✅ $server installed successfully"
    else
        echo "⚠️  $server may already be installed or failed"
    fi
done

echo ""
echo "🔍 Verifying installed MCP servers..."
INSTALLED=$(npm list -g --depth=0 2>/dev/null | grep -E "(mcp|tavily|exa|perplexity|context7)")

if [ -n "$INSTALLED" ]; then
    echo "✅ Installed MCP packages:"
    echo "$INSTALLED" | sed 's/^/   /'
else
    echo "❌ No MCP packages found"
fi

# Check Claude Desktop config paths
CLAUDE_CONFIG_PATHS=(
    "$HOME/.claude/claude_desktop_config.json"
    "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    "/mnt/r/Projects/PantryCRM/.claude/claude_desktop_config.json"
)

echo ""
echo "🔧 Checking Claude Desktop configuration..."
CONFIG_FOUND=false

for config_path in "${CLAUDE_CONFIG_PATHS[@]}"; do
    if [ -f "$config_path" ]; then
        echo "✅ Claude Desktop config found at: $config_path"
        CONFIG_FOUND=true
        break
    fi
done

if [ "$CONFIG_FOUND" = false ]; then
    echo "⚠️  Claude Desktop config not found in common locations"
    echo "   You may need to configure Claude Desktop manually"
fi

echo ""
echo "🎉 MCP setup complete!"
echo "   Available tools: Memory, Sequential Thinking, Filesystem, Context7, Tavily, Exa, Perplexity, Brave Search"
echo "   💡 Restart Claude Desktop to activate MCP servers"