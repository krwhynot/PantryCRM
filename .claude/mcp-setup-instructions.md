# MCP Setup Instructions for PantryCRM

This document provides instructions for setting up Model Context Protocol (MCP) servers for the PantryCRM project.

## Quick Setup

### Automatic Installation
Run one of these commands from the project root:

**Linux/Mac/WSL:**
```bash
npm run setup:mcp
```

**Windows PowerShell:**
```powershell
npm run setup:mcp:windows
```

### Manual Verification
Check if MCP servers are installed:
```bash
npm list -g | grep -E "(mcp|tavily|exa|perplexity|context7)"
```

## Required MCP Servers

The following MCP servers are automatically installed:

### Core Development Tools
- **@modelcontextprotocol/server-memory** - Project memory and context tracking
- **@modelcontextprotocol/server-sequential-thinking** - Complex problem solving
- **@modelcontextprotocol/server-filesystem** - File operations and navigation

### Research & Search Tools  
- **@upstash/context7-mcp** - Official documentation search (Next.js, React, etc.)
- **tavily-mcp** - Real-time web search and current information
- **exa-mcp-server** - Academic research and GitHub code examples
- **@jschuller/perplexity-mcp** - AI-powered search and validation

### Database & Integration Tools
- **@modelcontextprotocol/server-postgres** - Database operations
- **@modelcontextprotocol/server-brave-search** - Alternative web search
- **@modelcontextprotocol/server-google-maps** - Maps and location services

## Configuration

### Claude Desktop Configuration
The MCP servers are configured in:
```
/mnt/r/Projects/PantryCRM/.claude/claude_desktop_config.json
```

### Memory Configuration
Project memory is stored in:
```
R:/Projects/PantryCRM/.windsurf/memory.json
```

## API Keys Required

The following MCP servers require API keys (already configured in claude_desktop_config.json):

- **Tavily**: `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`
- **Exa**: `a9b28749-adac-4675-ac21-b6d6afbb65f1`  
- **Perplexity**: `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`

## Usage in Development

When working on PantryCRM:

1. **Always start with memory check** - Use memory MCP to recall project context
2. **Research before coding** - Use Context7 for official docs, Tavily for current info
3. **Database operations** - Use Postgres MCP for schema changes
4. **File operations** - Use Filesystem MCP for code navigation

## Troubleshooting

### MCP Servers Not Working
1. Restart Claude Desktop after installation
2. Check if servers are globally installed: `npm list -g`
3. Re-run setup script: `npm run setup:mcp`

### Permission Issues (Windows)
Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm run setup:mcp:windows
```

### Missing API Keys
Update the API keys in `.claude/claude_desktop_config.json` if any services stop working.

## Development Workflow Integration

The MCP servers integrate with the PantryCRM development workflow:

1. **Memory-First Protocol** - Always check project memory before starting work
2. **Research-First Development** - Use MCP tools for evidence-based decisions  
3. **Settings-Driven Architecture** - Use database MCP for schema management
4. **Performance Monitoring** - Track decisions and optimizations in memory

## Files Created

- `scripts/setup-mcp.sh` - Linux/Mac setup script
- `scripts/setup-mcp.ps1` - Windows PowerShell setup script
- `package.json` - Added npm scripts for MCP setup
- `.claude/mcp-setup-instructions.md` - This documentation file

## Next Steps

1. Run the setup script for your platform
2. Restart Claude Desktop
3. Test MCP connectivity by asking Claude to check project memory
4. Begin development with full MCP tool access

The MCP tools will remember your project context and provide intelligent assistance throughout the PantryCRM development process.