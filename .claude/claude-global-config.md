# Claude Code - Universal Performance Configuration

## GLOBAL PERFORMANCE PROTOCOLS

### 1. Universal Token Optimization
**Apply to ALL projects regardless of technology stack**

#### Standard Command Abbreviations
```bash
# Status checks (10-20 tokens)
claude "status?"          # Project health check
claude "next?"           # Next priority task
claude "issues?"         # Current blockers/errors
claude "progress?"       # Implementation progress

# Quick implementations (50-100 tokens)
claude "fix: [issue]"    # Bug resolution
claude "add: [feature]"  # Feature implementation  
claude "test: [component]" # Testing
claude "deploy: [target]" # Deployment steps

# Research queries (30-80 tokens)
claude "docs: [tech] [topic]"     # Documentation lookup
claude "examples: [pattern]"      # Code examples
claude "best: [approach]"         # Best practices
claude "debug: [error]"          # Troubleshooting
```

#### Universal Project References
```
PROJ = Current project name
TECH = Primary technology stack
ENV = Environment (dev/staging/prod)
BUDGET = Cost constraints
PERF = Performance requirements
DEADLINE = Timeline constraints
```

### 2. Cross-Platform Development Patterns

#### Technology Stack Abbreviations
```
# Frontend Frameworks
RCT = React
VUE = Vue.js  
ANG = Angular
SV = Svelte
NXT = Next.js

# Backend Frameworks  
EXP = Express
FST = Fastify
NJS = Node.js
PY = Python
GO = Go
RS = Rust

# Databases
PG = PostgreSQL
MY = MySQL
MG = MongoDB
RD = Redis
SQ = SQLite

# Cloud Platforms
AWS = Amazon Web Services
AZ = Microsoft Azure
GCP = Google Cloud Platform
VRC = Vercel
NFY = Netlify
```

#### Universal Performance Targets
```
# Response Time Targets (Adjust per project)
API_FAST = <100ms response
API_NORMAL = <500ms response  
API_SLOW = <2s response
SEARCH = <1s response
BUILD = <30s completion
DEPLOY = <5min completion

# Resource Constraints (Adjust per budget)
BUDGET_LOW = <$20/month
BUDGET_MED = <$100/month
BUDGET_HIGH = <$500/month
```

### 3. Tool Usage Optimization (Universal)

#### Tier 1: Always Use First (Free/Low Cost)
```
Memory → Filesystem → Sequential Thinking
```

#### Tier 2: Use When Needed (Moderate Cost)
```
Context7 (official docs) → Tavily (current info)
```

#### Tier 3: Use Sparingly (Higher Cost)
```
Exa Research → Perplexity → Multiple research tools
```

#### Smart Tool Selection Logic
```
Code Issues → Filesystem + Memory
Documentation → Context7 single query  
Current Events → Tavily single query
Planning → Memory + Sequential Thinking
Research → Choose ONE research tool maximum
```

### 4. Universal Caching Strategy

#### Session Cache (2-4 hours)
```bash
# Cache project context at session start
claude --cache "PROJ: TECH stack, ENV status, current phase"

# Cache working directory structure
claude --cache-dir "Project structure + key file locations"

# Cache recent decisions
claude --cache-recent "Last 3 major implementation decisions"
```

#### Persistent Cache (Weekly reset)
```bash
# Save common patterns
claude --save-pattern "[framework] [pattern_type]"

# Cache API documentation
claude --save-docs "[technology] common operations"

# Cache troubleshooting solutions
claude --save-fixes "Common [framework] issues + solutions"
```

## UNIVERSAL WORKFLOW OPTIMIZATION

### 1. Project Onboarding (Any Technology)
```bash
# Step 1: Quick analysis (50 tokens)
claude "analyze: codebase structure + tech stack"

# Step 2: Status assessment (30 tokens)  
claude "status: build health + critical issues"

# Step 3: Priority identification (40 tokens)
claude "priorities: next 3 tasks by importance"

# Step 4: Context caching (20 tokens)
claude --cache "Project analysis + priority tasks"
```

### 2. Development Session Workflow
```bash
# Session start (20 tokens)
claude "session: load cache + current status"

# Task execution (100-200 tokens per task)
claude "implement: [task] using [pattern]"

# Validation (30 tokens)
claude "validate: [component] functionality + tests"

# Session end (10 tokens)
claude "save: session decisions + next priorities"
```

### 3. Debugging Workflow (Universal)
```bash
# Error identification (40 tokens)
claude "debug: [error_message] → root cause"

# Solution research (60 tokens)
claude "fix: [error] → fastest solution"

# Implementation (80 tokens)
claude "apply: [solution] → code changes"

# Verification (30 tokens)
claude "test: fix effectiveness + side effects"
```

## PERFORMANCE MONITORING

### 1. Token Usage Tracking
```bash
# Daily usage monitoring
claude --token-stats "today"

# Weekly optimization review
claude --analyze-efficiency "past week"

# Tool cost analysis
claude --tool-costs "which tools consume most tokens?"
```

### 2. Response Time Optimization
```bash
# Measure response times
claude --timing "enable response time tracking"

# Identify slow operations
claude --slow-ops "which commands take >10s?"

# Cache hit rate analysis
claude --cache-effectiveness "cache performance stats"
```

### 3. Quality Metrics
```bash
# Implementation success rate
claude --success-rate "how many implementations work first try?"

# Error reduction tracking
claude --error-trends "debugging session frequency"

# Productivity measurement
claude --productivity "tasks completed per session"
```

## EMERGENCY PROTOCOLS

### 1. Critical Token Budget (<100 tokens remaining)
```bash
claude "emergency: status?"     # 15 tokens
claude "emergency: fix?"        # 15 tokens  
claude "emergency: deploy?"     # 15 tokens
claude "emergency: next?"       # 15 tokens
```

### 2. System Performance Issues
```bash
# Clear all caches
claude --clear-cache "reset all cached data"

# Minimal tool mode
claude --tools=memory,filesystem "essential tools only"

# Compress context
claude --compress "reduce context to essentials"
```

### 3. Critical Deployment Issues
```bash
# Immediate status
claude "deploy: status + blockers?"

# Fast fix identification  
claude "deploy: critical issues + solutions?"

# Emergency deployment
claude "deploy: fastest path to production?"
```

## CROSS-PROJECT TEMPLATES

### 1. New Project Setup
```markdown
## Project: [NAME]
- **Tech Stack**: [TECH]
- **Environment**: [ENV] 
- **Budget**: [BUDGET]
- **Performance**: [PERF]
- **Deadline**: [DEADLINE]

## Cached Context
- Architecture decisions
- Key file locations
- Common patterns used
- Performance constraints
```

### 2. Sprint Planning Template
```markdown
## Sprint: [WEEK_OF]
- **Priority 1**: [CRITICAL_TASK]
- **Priority 2**: [IMPORTANT_TASK]  
- **Priority 3**: [ENHANCEMENT_TASK]

## Token Budget
- Allocated: [AMOUNT] tokens
- Used: [AMOUNT] tokens
- Remaining: [AMOUNT] tokens
```

### 3. Performance Review Template
```markdown
## Performance Review: [DATE]
- **Token Efficiency**: [PERCENTAGE] improvement
- **Response Time**: [AVERAGE] seconds
- **Cache Hit Rate**: [PERCENTAGE]
- **Implementation Success**: [PERCENTAGE] first-try success
- **Issues Resolved**: [COUNT] debugging sessions

## Optimization Opportunities
1. [IMPROVEMENT_1]
2. [IMPROVEMENT_2]
3. [IMPROVEMENT_3]
```

## CONFIGURATION FILES

### 1. Global Claude Code Config
```json
{
  "performance": {
    "tokenOptimization": true,
    "responseCompression": true,
    "cachingEnabled": true,
    "toolLimitation": true
  },
  "limits": {
    "maxTokensPerQuery": 1500,
    "maxResponseTokens": 800,
    "maxToolsPerQuery": 2,
    "sessionCacheDuration": "4h"
  },
  "tools": {
    "priorityOrder": ["memory", "filesystem", "context7", "tavily"],
    "costThreshold": "medium",
    "parallelExecution": false
  },
  "logging": {
    "tokenUsage": true,
    "responseTime": true,
    "toolEffectiveness": true,
    "errorRate": true
  }
}
```

### 2. Command Aliases
```bash
# Add to shell profile (.bashrc, .zshrc, etc.)
alias cs="claude 'status?'"
alias cn="claude 'next?'"
alias cf="claude 'fix:'"
alias ca="claude 'add:'"
alias ct="claude 'test:'"
alias cd="claude 'deploy:'"
alias cr="claude 'docs:'"
alias ce="claude 'examples:'"
alias cb="claude 'best:'"
alias cg="claude 'debug:'"
```

## SUCCESS METRICS (Universal)

### Token Efficiency Targets
- **70-85% reduction** in tokens per development session
- **<50 tokens** for status and quick queries
- **<200 tokens** for implementation requests  
- **<30 tokens** for validation and testing

### Performance Targets
- **<1 second** for cached status queries
- **<3 seconds** for research operations
- **<8 seconds** for implementation requests
- **4+ hour** cache persistence for session efficiency

### Quality Targets
- **90%+ first-try success** rate for implementations
- **<2 debugging sessions** per feature implementation
- **100% functionality** preservation despite optimization
- **<5% error rate** in generated code

---

## UNIVERSAL IMPLEMENTATION CHECKLIST

### Initial Setup (One-Time Per Development Environment)
- [ ] Configure global Claude Code performance settings
- [ ] Set up universal command aliases
- [ ] Initialize tool priority configuration
- [ ] Establish token usage monitoring

### Project Onboarding (Per New Project)
- [ ] Run project analysis workflow
- [ ] Cache project-specific context
- [ ] Set performance targets for project
- [ ] Configure project-specific abbreviations

### Session Management (Daily)
- [ ] Load cached context at session start
- [ ] Monitor token usage throughout session
- [ ] Save session decisions and next priorities
- [ ] Review session performance metrics

### Optimization Review (Weekly)
- [ ] Analyze token usage patterns across all projects
- [ ] Identify universal efficiency opportunities
- [ ] Update cached context and command patterns
- [ ] Refine tool usage strategies

**Goal**: Achieve universal 70-85% token reduction while maintaining 90%+ first-try implementation success across all development projects.