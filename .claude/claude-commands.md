# Claude Code - Command Reference & Cheat Sheet

## QUICK REFERENCE COMMANDS

### ⚡ Ultra-Fast Status (10-20 tokens)
```bash
claude "status?"          # Project health check
claude "next?"           # Next priority task  
claude "issues?"         # Current blockers
claude "progress?"       # Implementation status
claude "tokens?"         # Token budget check
claude "health?"         # System health
```

### 🔧 Quick Implementation (50-100 tokens)
```bash
claude "fix: [issue]"           # Bug resolution
claude "add: [feature]"         # Feature implementation
claude "test: [component]"      # Testing
claude "deploy: [target]"       # Deployment
claude "optimize: [area]"       # Performance optimization
claude "refactor: [code]"       # Code improvement
```

### 📚 Research & Documentation (30-80 tokens)
```bash
claude "docs: [tech] [topic]"     # Documentation lookup
claude "examples: [pattern]"      # Code examples
claude "best: [approach]"         # Best practices
claude "debug: [error]"          # Troubleshooting
claude "compare: [options]"      # Technology comparison
claude "guide: [task]"           # Implementation guide
```

## PROJECT MANAGEMENT COMMANDS

### 🚀 Project Initialization
```bash
# Quick project analysis
claude "analyze: codebase + tech stack + status"

# Set up project context
claude "setup: [project_name] [tech_stack] [constraints]"

# Cache project information
claude --cache "project: [name] context + structure"

# Initialize logging
claude --start-log "[project_name]" "[session_objective]"
```

### 📋 Task Management
```bash
# List current tasks
claude "tasks: current + priorities"

# Add new task
claude "task: add [description] priority:[high/med/low]"

# Complete task
claude "task: complete [task_id] result:[outcome]"

# Show task dependencies
claude "dependencies: [task] what blocks/enables what?"
```

### 📈 Progress Tracking
```bash
# Sprint status
claude "sprint: status + completion + remaining"

# Milestone progress
claude "milestone: [name] progress + blockers"

# Performance metrics
claude "metrics: speed + quality + efficiency"

# Resource usage
claude "resources: time + tokens + tools used"
```

## DEVELOPMENT WORKFLOW COMMANDS

### 🔍 Code Analysis
```bash
# Code review
claude "review: [file/component] quality + issues"

# Security analysis
claude "security: [code] vulnerabilities + fixes"

# Performance analysis
claude "performance: [code] bottlenecks + optimizations"

# Architecture review
claude "architecture: [component] design + improvements"
```

### 🛠️ Implementation Commands
```bash
# Create new component
claude "create: [type] [name] following [pattern]"

# Modify existing code
claude "modify: [file] change [description]"

# Integrate feature
claude "integrate: [feature] into [target]"

# Configure setup
claude "configure: [tool/service] for [purpose]"
```

### ✅ Testing & Validation
```bash
# Run tests
claude "test: [scope] run + results"

# Create tests
claude "test: create for [component] coverage:[unit/integration]"

# Validate functionality
claude "validate: [feature] works as expected?"

# Performance testing
claude "perf-test: [component] load + response times"
```

## MCP TOOL COMMANDS

### 🧠 Memory Operations
```bash
# Search memory
claude --memory-search "[topic/entity]"

# Add to memory
claude --memory-add "entity:[name] type:[type] info:[details]"

# Update memory
claude --memory-update "entity:[name] new:[information]"

# Memory status
claude --memory-status "knowledge graph health"
```

### 📁 File System Operations
```bash
# List directory
claude --fs-list "[path]"

# Read file
claude --fs-read "[filepath]"

# Write file
claude --fs-write "[filepath]" "[content]"

# File info
claude --fs-info "[filepath]"
```

### 🔍 Research Operations
```bash
# Context7 documentation
claude --context7 "[library]" "[topic]"

# Tavily current search
claude --tavily "[query]" depth:[basic/advanced]

# Exa research
claude --exa "[topic]" type:[web/academic/github]

# Multiple source research
claude --research "[topic]" sources:[tools_list]
```

## PERFORMANCE OPTIMIZATION COMMANDS

### ⚡ Speed Optimization
```bash
# Enable minimal mode
claude --minimal-mode "fastest response settings"

# Optimize tool usage
claude --optimize-tools "use only high-efficiency tools"

# Compress context
claude --compress-context "reduce context overhead"

# Cache frequently used data
claude --smart-cache "auto-cache common queries"
```

### 💰 Token Optimization
```bash
# Token analysis
claude --token-analyze "usage patterns + optimization"

# Set token limits
claude --token-limit "[max_per_query]"

# Batch operations
claude --batch "[operation1,operation2,operation3]"

# Emergency token mode
claude --emergency-tokens "ultra-minimal usage"
```

### 📊 Performance Monitoring
```bash
# Performance dashboard
claude --perf-dashboard "current metrics + trends"

# Tool efficiency
claude --tool-efficiency "ROI analysis by tool"

# Response time tracking
claude --timing "enable response time monitoring"

# Resource usage
claude --resource-usage "memory + CPU + network"
```

## DEBUGGING & TROUBLESHOOTING COMMANDS

### 🔧 Quick Diagnostics
```bash
# System health
claude --health-check "all systems status"

# Error analysis
claude --analyze-error "[error_message]"

# Tool connectivity
claude --test-tools "connectivity + responsiveness"

# Configuration validation
claude --validate-config "settings + permissions"
```

### 🚨 Emergency Commands
```bash
# Emergency mode
claude --emergency "minimal functionality only"

# Clear all caches
claude --emergency-clear "reset all cached data"

# Restart services
claude --emergency-restart "core services only"

# Backup current state
claude --emergency-backup "save session state"
```

### 📋 Logging & Tracking
```bash
# Quick log entry
claude --log "[type]" "[description]"

# Session summary
claude --session-summary "achievements + issues + next"

# Change history
claude --changes "recent modifications + impact"

# Decision trail
claude --decisions "recent choices + rationale"
```

## PROJECT-SPECIFIC SHORTCUTS

### 🏪 Kitchen Pantry CRM
```bash
# Project status
claude "KP-CRM: P2 status + blockers + next?"

# Performance check
claude "KP-CRM: search speed + touch targets + Azure DTU?"

# Build status
claude "KP-CRM: build health + ESLint + EPERM status?"

# Deployment readiness
claude "KP-CRM: deploy ready? remaining tasks?"
```

### ⚙️ General Web Development
```bash
# Next.js projects
claude "NXT: [task] following best practices"

# React development
claude "RCT: [component] with hooks + TypeScript"

# API development
claude "API: [endpoint] with validation + error handling"

# Database operations
claude "DB: [operation] optimized for performance"
```

### ☁️ Cloud & DevOps
```bash
# Azure operations
claude "AZ: [service] setup + configuration"

# AWS operations
claude "AWS: [service] deployment + scaling"

# Docker operations
claude "DOCKER: [task] optimize for production"

# CI/CD operations
claude "CICD: [pipeline] setup + automation"
```

## AUTOMATION & SHORTCUTS

### 🔄 Workflow Automation
```bash
# Auto-setup new features
claude --auto-feature "[name]" "[type]" "[requirements]"

# Auto-test implementations
claude --auto-test "[component]" "[test_types]"

# Auto-deploy pipeline
claude --auto-deploy "[environment]" "[validation_steps]"

# Auto-optimize performance
claude --auto-optimize "[target]" "[metrics]"
```

### ⌨️ Command Aliases (Add to shell profile)
```bash
# Ultra-short aliases
alias cs="claude 'status?'"
alias cn="claude 'next?'"
alias ci="claude 'issues?'"
alias cp="claude 'progress?'"
alias ct="claude 'tokens?'"
alias ch="claude 'health?'"

# Implementation aliases  
alias cf="claude 'fix:'"
alias ca="claude 'add:'"
alias cte="claude 'test:'"
alias cd="claude 'deploy:'"
alias co="claude 'optimize:'"
alias cr="claude 'refactor:'"

# Research aliases
alias cdocs="claude 'docs:'"
alias cex="claude 'examples:'"
alias cbest="claude 'best:'"
alias cdebug="claude 'debug:'"
alias ccomp="claude 'compare:'"
alias cguide="claude 'guide:'"
```

## CONTEXT MANAGEMENT

### 📝 Context Compression
```bash
# Project abbreviations
KP-CRM = Kitchen Pantry CRM
NX-BASE = NextCRM foundation
AZ-SQL = Azure SQL constraints
P2-95% = Phase 2 95% complete
TOUCH-44 = 44px touch targets
BUDGET-18 = $18/month limit

# Technology abbreviations
RCT = React
NXT = Next.js
TS = TypeScript
PRI = Prisma
AZ = Azure
SQL = SQL Server
```

### 🗃️ Session Management
```bash
# Start session
claude --session-start "[project]" "[objective]" "[token_budget]"

# Load context
claude --load-context "[project]" "[phase]"

# Save session
claude --session-save "decisions + progress + next_steps"

# End session
claude --session-end "summary + token_usage + next_priorities"
```

## QUALITY ASSURANCE COMMANDS

### ✅ Validation Workflows
```bash
# Code quality check
claude "quality: [code] standards + best practices"

# Security validation
claude "security: [implementation] vulnerabilities + mitigations"

# Performance validation
claude "performance: [feature] speed + resource usage"

# Accessibility check
claude "a11y: [component] compliance + improvements"
```

### 🧪 Testing Workflows
```bash
# Comprehensive testing
claude "test-all: [component] unit + integration + e2e"

# Touch target testing (mobile)
claude "touch-test: [component] 44px compliance"

# Performance testing
claude "perf-test: [feature] load + response times"

# Cross-browser testing
claude "browser-test: [feature] compatibility"
```

## EMERGENCY REFERENCE

### 🚨 Critical Issues
```bash
# System failure
claude --emergency-mode "core functionality only"

# Token exhaustion
claude --ultra-minimal "absolute minimum usage"

# Tool failures
claude --tools=memory,filesystem "essential tools only"

# Performance crisis
claude --performance-mode "optimize everything"
```

### 🔄 Recovery Commands
```bash
# Full system reset
claude --full-reset "clear cache + restart tools + reload context"

# Selective reset
claude --reset "[component]"

# Rollback changes
claude --rollback "undo last [n] changes"

# Restore from backup
claude --restore "session state from backup"
```

---

## USAGE PATTERNS

### 📊 Token Efficiency Targets
- **Status checks**: <50 tokens
- **Implementation**: <500 tokens  
- **Research**: <200 tokens
- **Validation**: <100 tokens
- **Emergency**: <25 tokens

### ⏱️ Response Time Targets
- **Cached queries**: <2 seconds
- **File operations**: <3 seconds
- **Research**: <5 seconds
- **Implementation**: <10 seconds
- **Complex tasks**: <15 seconds

### 🎯 Success Metrics
- **90%+ first-try success** rate
- **70-85% token reduction** vs standard usage
- **<2 debugging sessions** per feature
- **<5% error rate** in generated code

**Remember**: Use the shortest command that accomplishes your goal. Combine operations when possible. Always monitor token usage and performance.