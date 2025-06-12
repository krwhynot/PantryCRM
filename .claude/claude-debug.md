# Claude Code - Debugging & Troubleshooting Guide

## DEBUGGING PROTOCOL

### Emergency Diagnostic Commands (Use First)
```bash
# System health check (15 tokens)
claude "health?"

# Current error status (20 tokens)  
claude "errors?"

# Tool connectivity check (25 tokens)
claude "tools: status?"

# Token budget check (10 tokens)
claude "tokens?"

# Cache status (15 tokens)
claude "cache: status?"
```

## COMMON ISSUES & SOLUTIONS

### 1. MCP Tool Connection Failures

#### Symptoms
- "MCP server not responding" errors
- Tool timeouts or connection refused
- Missing tool responses

#### Diagnostic Commands
```bash
# Check MCP server status
claude --mcp-status "list all server connections"

# Test individual tools
claude --test-tool "memory"
claude --test-tool "filesystem" 
claude --test-tool "context7"

# View server logs
claude --mcp-logs "show recent connection attempts"
```

#### Solutions
```bash
# Restart MCP servers
claude --restart-mcp "restart all MCP servers"

# Reset specific tool
claude --reset-tool "[tool_name]"

# Clear MCP cache
claude --clear-mcp-cache "reset all MCP connections"

# Rebuild tool connections
claude --rebuild-mcp "reinitialize MCP servers"
```

### 2. Performance Degradation

#### Symptoms
- Response times >10 seconds
- High token consumption
- Slow file operations
- Cache misses

#### Diagnostic Commands
```bash
# Performance analysis
claude --perf-analyze "identify performance bottlenecks"

# Token usage breakdown
claude --token-breakdown "show token consumption by operation"

# Cache effectiveness
claude --cache-stats "show hit/miss ratios"

# Tool efficiency analysis
claude --tool-efficiency "show time/token cost per tool"
```

#### Solutions
```bash
# Clear all caches
claude --clear-all-cache "reset performance caches"

# Optimize tool usage
claude --optimize-tools "use only high-efficiency tools"

# Compress context
claude --compress-context "reduce context size"

# Enable minimal mode
claude --minimal-mode "use emergency efficiency settings"
```

### 3. Context/Memory Issues

#### Symptoms
- Repeated questions about project basics
- Loss of session context
- Incorrect project assumptions
- Missing cached information

#### Diagnostic Commands
```bash
# Memory health check
claude --memory-status "check knowledge graph connectivity"

# Context size analysis
claude --context-size "show current context token usage"

# Cache verification
claude --verify-cache "check cached data integrity"

# Session continuity check
claude --session-check "verify session state persistence"
```

#### Solutions
```bash
# Rebuild memory cache
claude --rebuild-memory "refresh knowledge graph cache"

# Reload project context
claude --reload-context "[project_name]"

# Reset session state
claude --reset-session "clear and reinitialize session"

# Manual context injection
claude --inject-context "[critical_project_info]"
```

### 4. File System Access Issues

#### Symptoms
- "Permission denied" errors
- File not found errors  
- Cannot read/write files
- Directory access failures

#### Diagnostic Commands
```bash
# File system permissions check
claude --fs-permissions "check current directory access"

# Path validation
claude --validate-path "[path]"

# Directory structure verification  
claude --verify-structure "show accessible directories"

# File access test
claude --test-file-access "[specific_file]"
```

#### Solutions
```bash
# Update allowed directories
claude --update-allowed-dirs "add [path] to allowed directories"

# Fix permissions (if possible)
claude --fix-permissions "[path]"

# Use alternative paths
claude --suggest-alt-paths "suggest accessible alternative paths"

# Reset filesystem cache
claude --reset-fs-cache "clear filesystem cache"
```

### 5. Authentication/API Issues

#### Symptoms
- API key errors
- Authentication failures
- Rate limiting errors
- Service unavailable errors

#### Diagnostic Commands
```bash
# API status check
claude --api-status "check all API endpoints"

# Authentication verification
claude --auth-status "verify API key validity"

# Rate limit status
claude --rate-limits "show current rate limit status"

# Service connectivity
claude --ping-services "test connectivity to external services"
```

#### Solutions
```bash
# Refresh API keys
claude --refresh-keys "reload API credentials"

# Reset rate limits
claude --reset-limits "clear rate limit counters"

# Switch to backup services
claude --backup-mode "use alternative service endpoints"

# Retry with exponential backoff
claude --retry-request "[failed_request]"
```

## SYSTEMATIC DEBUGGING WORKFLOW

### Phase 1: Initial Assessment (50 tokens max)
```bash
# 1. Check overall system health
claude "health: system + tools + cache?"

# 2. Identify specific error
claude "error: [error_description] → cause?"

# 3. Check resource status
claude "resources: tokens + memory + filesystem?"
```

### Phase 2: Targeted Diagnosis (100 tokens max)
```bash
# 4. Deep dive into specific issue
claude "diagnose: [specific_component] detailed analysis"

# 5. Check dependencies
claude "dependencies: [failing_component] what needs what?"

# 6. Verify configuration
claude "config: [relevant_settings] current vs expected?"
```

### Phase 3: Solution Application (150 tokens max)
```bash
# 7. Apply most likely fix
claude "fix: [issue] apply [solution_strategy]"

# 8. Validate fix effectiveness
claude "validate: [fix] working as expected?"

# 9. Update logging
claude --log-error "[issue]" "[solution]" "[outcome]"
```

### Phase 4: Prevention (50 tokens max)
```bash
# 10. Implement monitoring
claude "monitor: [component] add health checks"

# 11. Update prevention measures
claude "prevent: [issue_type] future occurrence"
```

## ERROR PATTERN RECOGNITION

### MCP Tool Patterns
```
"server not responding" → Network/connection issue
"tool timeout" → Performance/resource issue  
"invalid response" → Configuration/compatibility issue
"rate limited" → Usage limit/quota issue
```

### File System Patterns
```
"ENOENT" → File/directory doesn't exist
"EACCES" → Permission denied
"EMFILE" → Too many open files
"ENOSPC" → No space left on device
```

### Performance Patterns
```
"slow response" → Context size or tool efficiency
"high token usage" → Inefficient command patterns
"cache miss" → Cache invalidation or sizing issue
"memory pressure" → Large context or memory leaks
```

### API/Network Patterns
```
"401 Unauthorized" → Authentication issue
"429 Too Many Requests" → Rate limiting
"503 Service Unavailable" → Service downtime
"timeout" → Network connectivity issue
```

## PERFORMANCE OPTIMIZATION DEBUGGING

### Token Usage Analysis
```bash
# Identify high-token operations
claude --analyze-tokens "which operations use most tokens?"

# Show token trends
claude --token-trends "usage patterns over time"

# Compare efficiency
claude --compare-efficiency "before vs after optimization"
```

### Response Time Analysis
```bash
# Identify slow operations
claude --slow-ops "operations taking >5 seconds"

# Tool performance comparison
claude --tool-perf "compare response times by tool"

# Cache performance analysis
claude --cache-perf "cache hit rates and impact"
```

### Resource Usage Analysis
```bash
# Memory usage patterns
claude --memory-usage "current usage vs limits"

# CPU usage analysis
claude --cpu-usage "processing time by operation"

# Network usage tracking
claude --network-usage "API calls and data transfer"
```

## DEBUGGING DECISION TREE

```
Issue Detected
│
├── Is it a tool connectivity issue?
│   ├── Yes → Check MCP server status → Restart if needed
│   └── No → Continue
│
├── Is it a performance issue?
│   ├── Yes → Check token usage → Optimize if excessive
│   └── No → Continue
│
├── Is it a file system issue?
│   ├── Yes → Check permissions → Fix access if needed
│   └── No → Continue
│
├── Is it a context/memory issue?
│   ├── Yes → Check cache status → Rebuild if corrupted
│   └── No → Continue
│
├── Is it an API/authentication issue?
│   ├── Yes → Check API status → Refresh keys if needed
│   └── No → Escalate to advanced debugging
│
└── Advanced debugging required
    ├── Collect detailed logs
    ├── Analyze error patterns
    ├── Apply systematic fixes
    └── Monitor results
```

## EMERGENCY PROCEDURES

### Critical System Failure
```bash
# 1. Enable emergency mode
claude --emergency-mode "minimal functionality only"

# 2. Clear all caches
claude --emergency-clear "reset all cached data"

# 3. Restart core services
claude --emergency-restart "restart essential services"

# 4. Validate basic functionality
claude "test: basic commands working?"
```

### Token Budget Exhaustion
```bash
# 1. Switch to ultra-minimal mode
claude --ultra-minimal "absolute minimum token usage"

# 2. Cache critical context
claude --emergency-cache "save only essential context"

# 3. Defer non-critical operations
claude --defer-ops "postpone non-essential tasks"
```

### Data Loss Prevention
```bash
# 1. Immediate backup
claude --emergency-backup "save current session state"

# 2. Log current context
claude --emergency-log "record all current information"

# 3. Save progress
claude --save-progress "persist all work completed"
```

## MONITORING & ALERTING

### Health Check Commands
```bash
# Comprehensive health check
claude --health-full "complete system status report"

# Quick health check
claude --health-quick "critical systems only"

# Continuous monitoring
claude --monitor-continuous "ongoing health monitoring"
```

### Alert Thresholds
```bash
# Set performance alerts
claude --alert-perf "response_time > 10s OR token_usage > 500"

# Set error rate alerts
claude --alert-errors "error_rate > 10% OR critical_errors > 0"

# Set resource alerts
claude --alert-resources "memory_usage > 80% OR cache_misses > 50%"
```

### Automated Recovery
```bash
# Enable auto-recovery for common issues
claude --auto-recovery "enable automatic fix for known issues"

# Set recovery thresholds
claude --recovery-thresholds "when to trigger automatic recovery"

# Configure recovery actions
claude --recovery-actions "define automatic recovery procedures"
```

---

## DEBUGGING CHECKLIST

### Before Starting Any Session
- [ ] Run health check on all systems
- [ ] Verify tool connectivity
- [ ] Check token budget and limits
- [ ] Validate project context cache
- [ ] Confirm file system access

### When Issues Occur
- [ ] Document exact error message
- [ ] Note when/where error occurred  
- [ ] Record what was being attempted
- [ ] Check if error is reproducible
- [ ] Apply systematic debugging workflow

### After Resolving Issues
- [ ] Log the issue and solution
- [ ] Update prevention measures
- [ ] Test to ensure fix works
- [ ] Monitor for recurring issues
- [ ] Update debugging documentation

### Session End
- [ ] Review any issues encountered
- [ ] Update health monitoring
- [ ] Save session state for continuity
- [ ] Plan preventive measures for next session

**Remember**: Systematic debugging saves time and tokens. Always follow the diagnostic workflow before applying solutions.