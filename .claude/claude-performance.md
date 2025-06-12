# Claude Code Performance Optimization Configuration

## TOKEN EFFICIENCY PROTOCOLS

### 1. Context Compression Strategy
**Objective**: Reduce context overhead by 60-80% while maintaining project understanding

#### Abbreviated Project References
Instead of full descriptions, use compressed project identifiers:
```
KP-CRM = Kitchen Pantry CRM project
NX-BASE = NextCRM foundation  
AZ-SQL = Azure SQL Basic tier constraints
P2-95% = Phase 2 95% complete status
TOUCH-44 = 44px touch target requirement
BUDGET-18 = $18/month Azure budget limit
```

#### Context Caching Commands
```bash
# Cache current status (run once per session)
claude --cache "KP-CRM P2-95% status: QuickEntry integrated, APIs functional, ESLint+EPERM blocking deploy"

# Reference cached context
claude --ref-cache "Check cached KP-CRM status and implement ESLint fix"
```

### 2. Tool Usage Optimization Matrix

#### High-ROI Tools (Use First)
```
Memory (free) → Filesystem (free) → Context7 (targeted docs)
```

#### Medium-ROI Tools (Use Selectively)  
```
Tavily (current info) → Exa Research (specific code examples)
```

#### Low-ROI Tools (Avoid Unless Critical)
```
Perplexity → Brave Search → Multiple overlapping research tools
```

#### Tool Selection Logic (Token-Efficient)
```
Code Issue → Filesystem + Memory only
Documentation → Context7 single query
Research → Tavily OR Exa (not both)
Planning → Memory + cached context
```

### 3. Response Format Optimization

#### Compressed Communication Patterns
```
Standard Response (100+ tokens):
"I'll research the Next.js deployment best practices for Azure App Service, check the current configuration files, and provide a comprehensive implementation guide with all necessary steps."

Optimized Response (25 tokens):
"Researching Next.js Azure deploy → checking config → providing implementation steps"
```

#### Abbreviated Status Updates
```
Long Form: "The implementation has been completed successfully and all tests are passing"
Short Form: "✅ Implemented, tests pass"

Long Form: "I need to check the memory for previous project decisions before proceeding"  
Short Form: "Checking memory → proceeding"
```

### 4. Memory Efficiency Patterns

#### Smart Memory Queries
```
# Inefficient (broad search)
claude "Tell me about the Kitchen Pantry CRM project"

# Efficient (targeted search)  
claude "KP-CRM current blockers: ESLint+EPERM fixes needed?"
```

#### Batched Memory Updates
```
# Instead of multiple create_entities calls
# Batch related information into single operations

# Save multiple related observations at once
# Group related project decisions
# Minimize individual memory operations
```

### 5. Performance-First Development Commands

#### Quick Status Checks
```bash
# Project health check (minimal tokens)
claude "KP-CRM: status + next task?"

# Build status (targeted)
claude "Check build errors → fastest fix?"

# Performance check (specific)
claude "Search API performance: current + optimization needed?"
```

#### Efficient Implementation Requests
```bash
# Standard request (high token count)
claude "I need to implement user authentication with proper error handling, validation, and integration with the existing NextCRM components following all the established patterns"

# Optimized request (low token count)
claude "Implement auth: NextCRM pattern + validation. Show code only."
```

## PERFORMANCE OPTIMIZATION SETTINGS

### 1. Claude Code Configuration
```json
{
  "performance": {
    "contextWindow": "minimal",
    "responseFormat": "concise", 
    "toolCaching": true,
    "memoryOptimization": true,
    "batchOperations": true
  },
  "tokenLimits": {
    "maxContextPerQuery": 2000,
    "maxResponseTokens": 1000,
    "toolUsageLimit": 2,
    "memoryQueryLimit": 1
  },
  "caching": {
    "projectContext": true,
    "frequentQueries": true,
    "toolResults": true,
    "sessionDuration": "2h"
  }
}
```

### 2. MCP Tool Configuration (Optimized)
```json
{
  "mcpServers": {
    "memory": {
      "priority": 1,
      "caching": true,
      "queryOptimization": true
    },
    "filesystem": {
      "priority": 2, 
      "pathCaching": true,
      "selectiveReading": true
    },
    "context7": {
      "priority": 3,
      "resultLimit": 3,
      "tokenLimit": 1500
    },
    "tavily": {
      "priority": 4,
      "maxResults": 3,
      "searchDepth": "basic"
    }
  }
}
```

### 3. Development Workflow (Token-Optimized)

#### Phase 1: Quick Assessment (50 tokens max)
```bash
claude "KP-CRM + task → plan?"
```

#### Phase 2: Targeted Research (200 tokens max)
```bash  
claude "Research [specific_tech] → implementation pattern"
```

#### Phase 3: Implementation (500 tokens max)
```bash
claude "Implement [feature]: code only, NX-BASE patterns"
```

#### Phase 4: Validation (100 tokens max)
```bash
claude "Test + validate → status"
```

## ABBREVIATED COMMAND LIBRARY

### Project Status Commands
```bash
# Full system status
claude "KP-CRM: P2 status + blockers + next?"

# Build health
claude "Build status → errors → fixes?"

# Performance check  
claude "Performance: current vs targets?"

# Deployment readiness
claude "Deploy ready? → remaining tasks?"
```

### Development Commands
```bash
# Feature implementation
claude "Add [feature]: NX-BASE + TOUCH-44 + code"

# Bug fix
claude "Fix [issue]: fastest solution + code"

# Testing
claude "Test [component]: touch + functional + results"

# Optimization
claude "Optimize [area]: AZ-SQL constraints + implementation"
```

### Research Commands (Minimal Tokens)
```bash
# Technology research
claude "Research [tech] → best practice → code pattern"

# Documentation lookup
claude "Docs: [framework] [topic] → implementation"

# Code examples
claude "Examples: [pattern] → working code"

# Troubleshooting
claude "Debug [error] → root cause → fix"
```

## CACHING STRATEGIES

### 1. Session-Level Caching
```bash
# Cache project context at session start
claude --init-cache "KP-CRM: NX-BASE, AZ-SQL, P2-95%, TOUCH-44, BUDGET-18"

# Cache current working directory context
claude --cache-dir "Cache R:\Projects\PantryCRM structure + key files"

# Cache recent decisions
claude --cache-decisions "Last 5 implementation decisions + rationales"
```

### 2. Persistent Caching
```bash
# Save frequently used patterns
claude --save-pattern "QuickEntry implementation pattern" 

# Cache API endpoints
claude --save-endpoints "KP-CRM API routes + response formats"

# Cache test patterns
claude --save-tests "Touch target test patterns + validation"
```

## MONITORING & OPTIMIZATION

### 1. Token Usage Tracking
```bash
# Monitor session usage
claude --token-usage "Show current session token consumption"

# Identify high-cost operations
claude --analyze-costs "Which commands use most tokens?"

# Optimization suggestions
claude --optimize "Suggest token reduction strategies"
```

### 2. Performance Metrics
```bash
# Response time tracking
claude --timing "Track response times for optimization"

# Tool efficiency analysis  
claude --tool-efficiency "Which MCP tools provide best ROI?"

# Cache hit rate
claude --cache-stats "Show cache effectiveness metrics"
```

## EMERGENCY EFFICIENCY MODE

When token budget is critically low:

### 1. Ultra-Minimal Commands
```bash
claude "status?"           # Project status check
claude "next?"            # Next task identification  
claude "fix?"             # Current issue resolution
claude "deploy?"          # Deployment readiness
```

### 2. Code-Only Responses
```bash
claude "code: [feature]"   # Implementation without explanation
claude "fix: [error]"      # Bug fix without analysis
claude "test: [component]" # Test code without commentary
```

### 3. Single-Tool Operations
```bash
claude --tool=memory "quick status"
claude --tool=filesystem "key files"  
claude --tool=context7 "next.js deploy"
```

## SUCCESS METRICS

### Token Efficiency Targets
- **60-80% reduction** in tokens per development session
- **<100 tokens** for status checks and quick queries
- **<500 tokens** for implementation requests
- **<50 tokens** for validation and testing

### Performance Targets  
- **<2 seconds** response time for cached queries
- **<5 seconds** for research operations
- **<10 seconds** for complex implementation requests
- **2+ hour** cache persistence for session efficiency

### Quality Maintenance
- **100% functionality** preservation despite optimization
- **Complete implementations** in compressed responses
- **Accurate project context** with abbreviated references
- **Effective development workflow** with minimal token overhead

---

## IMPLEMENTATION CHECKLIST

### Initial Setup (One-Time)
- [ ] Configure performance settings in Claude Code
- [ ] Set up MCP tool optimization
- [ ] Initialize project context cache
- [ ] Establish abbreviated command aliases

### Session Workflow (Every Session)
- [ ] Load cached project context
- [ ] Set token efficiency mode
- [ ] Use abbreviated command patterns
- [ ] Monitor token usage

### Optimization Review (Weekly)
- [ ] Analyze token usage patterns  
- [ ] Identify efficiency opportunities
- [ ] Update cached context
- [ ] Refine command abbreviations

**Remember**: The goal is 60-80% token reduction while maintaining 100% development effectiveness for Kitchen Pantry CRM project completion.