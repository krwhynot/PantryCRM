# Claude Code - Automated Change Logging System

## CHANGE LOG PROTOCOL

**CRITICAL**: Claude Code must log ALL changes, decisions, and implementations using this system. Every session must be fully traceable and auditable.

### Auto-Log Commands (Use for EVERY change)
```bash
# Log any file changes
claude --log-change "file: [filename] | action: [created/modified/deleted] | reason: [purpose]"

# Log implementation decisions
claude --log-decision "decision: [what] | rationale: [why] | impact: [consequences]"

# Log research findings
claude --log-research "query: [what researched] | source: [tool used] | result: [key finding]"

# Log performance impacts
claude --log-performance "operation: [what] | before: [metric] | after: [metric] | improvement: [percentage]"

# Log errors and fixes
claude --log-error "error: [description] | cause: [root cause] | fix: [solution applied]"
```

## CHANGE LOG TEMPLATE

### Session Header (Required for each session)
```markdown
# CLAUDE CODE SESSION LOG
**Date**: [YYYY-MM-DD]
**Time**: [HH:MM] - [HH:MM] 
**Project**: [PROJECT_NAME]
**Objective**: [SESSION_GOAL]
**Token Budget**: [ALLOCATED] tokens
**Tools Used**: [LIST_OF_MCP_TOOLS]

---
```

### Change Entry Template (Use for EVERY change)
```markdown
## CHANGE #[INCREMENT]
**Timestamp**: [HH:MM:SS]
**Type**: [FILE_CHANGE | IMPLEMENTATION | RESEARCH | DECISION | ERROR_FIX | PERFORMANCE]
**Impact Level**: [LOW | MEDIUM | HIGH | CRITICAL]

### What Changed
- **Files Affected**: [list all files]
- **Lines Changed**: [specific line numbers or ranges]
- **Change Type**: [added | modified | deleted | refactored]

### Why Changed  
- **Trigger**: [what prompted this change]
- **Business Reason**: [why it was necessary]
- **Technical Reason**: [implementation details]

### How Changed
- **Method**: [manual edit | tool generation | copy from source]
- **Tools Used**: [which MCP tools were involved]
- **Token Cost**: [approximate tokens consumed]

### Validation
- **Testing**: [how change was verified]
- **Side Effects**: [any unexpected impacts]
- **Rollback Plan**: [how to undo if needed]

### Next Actions
- **Dependencies**: [what depends on this change]
- **Follow-up Tasks**: [what needs to happen next]
- **Monitoring**: [what to watch for issues]

---
```

## SPECIALIZED LOG TEMPLATES

### 1. File Operation Log
```markdown
## FILE OPERATION #[N]
**File**: `[path/to/file]`
**Operation**: [CREATE | MODIFY | DELETE | MOVE | COPY]
**Size**: [before] → [after] bytes
**Reason**: [why this file operation was needed]

### Content Changes
```diff
- [removed lines]
+ [added lines]
~ [modified lines]
```

### Dependencies
- **Imports**: [new imports added/removed]
- **Exports**: [new exports added/removed]  
- **References**: [other files that reference this]

### Testing Required
- [ ] Compile/build test
- [ ] Unit tests  
- [ ] Integration tests
- [ ] Performance tests
```

### 2. Implementation Decision Log
```markdown
## DECISION #[N]
**Context**: [what situation required a decision]
**Options Considered**:
1. [Option 1] - Pros: [benefits] | Cons: [drawbacks]
2. [Option 2] - Pros: [benefits] | Cons: [drawbacks]
3. [Option 3] - Pros: [benefits] | Cons: [drawbacks]

**Decision**: [chosen option]
**Rationale**: [why this option was selected]
**Trade-offs**: [what was sacrificed for what benefit]

### Implementation Plan
- **Steps**: [numbered list of implementation steps]
- **Timeline**: [estimated completion time]
- **Resources**: [tools/time/tokens required]

### Success Criteria
- [ ] [measurable outcome 1]
- [ ] [measurable outcome 2]
- [ ] [measurable outcome 3]

### Review Date
- **When**: [date to review this decision]
- **Criteria**: [what would trigger a review]
```

### 3. Research Activity Log
```markdown
## RESEARCH #[N]
**Query**: [what was researched]
**Motivation**: [why research was needed]
**Tools Used**: [Context7 | Tavily | Exa | etc.]
**Token Cost**: [estimated tokens spent]

### Sources Consulted
1. **[Source Name]** - [URL or reference] - [key findings]
2. **[Source Name]** - [URL or reference] - [key findings]
3. **[Source Name]** - [URL or reference] - [key findings]

### Key Findings
- **Primary Finding**: [most important discovery]
- **Supporting Evidence**: [corroborating information]
- **Conflicting Information**: [any contradictions found]
- **Confidence Level**: [HIGH | MEDIUM | LOW]

### Actionable Insights
1. [Specific action based on research]
2. [Specific action based on research]
3. [Specific action based on research]

### Knowledge Gaps
- [What still needs to be researched]
- [Questions that remain unanswered]
```

### 4. Error and Fix Log
```markdown
## ERROR FIX #[N]
**Error**: [exact error message or description]
**Context**: [when/where error occurred]
**Severity**: [BLOCKING | CRITICAL | MAJOR | MINOR]

### Root Cause Analysis
- **Immediate Cause**: [what directly caused the error]
- **Contributing Factors**: [what made it possible]
- **Root Cause**: [fundamental underlying issue]

### Resolution Applied
- **Fix Description**: [what was done to resolve]
- **Files Modified**: [list of changed files]
- **Code Changes**: [specific changes made]

### Verification
- **Testing**: [how fix was verified]
- **Regression Testing**: [what was tested to ensure no new issues]
- **Performance Impact**: [any performance changes]

### Prevention
- **Future Prevention**: [how to avoid this error in future]
- **Monitoring**: [what to watch to detect similar issues]
- **Documentation**: [what needs to be documented]
```

### 5. Performance Optimization Log
```markdown
## PERFORMANCE #[N]
**Target**: [what was being optimized]
**Baseline**: [performance before optimization]
**Goal**: [target performance metrics]

### Optimization Strategy
- **Approach**: [method used for optimization]
- **Tools**: [performance measurement tools used]
- **Hypothesis**: [expected improvement]

### Changes Made
1. [Change 1] - Expected impact: [prediction]
2. [Change 2] - Expected impact: [prediction]
3. [Change 3] - Expected impact: [prediction]

### Results
- **Before**: [baseline metrics]
- **After**: [optimized metrics]
- **Improvement**: [percentage/absolute improvement]
- **Side Effects**: [any unexpected consequences]

### Validation
- [ ] Performance targets met
- [ ] No functionality regression
- [ ] No security issues introduced
- [ ] Resource usage acceptable
```

## AUTOMATED LOGGING COMMANDS

### Session Management
```bash
# Start new session log
claude --start-log "[PROJECT_NAME]" "[SESSION_OBJECTIVE]"

# End session and summarize
claude --end-log "summary: [achievements] | tokens_used: [count] | next_session: [priorities]"

# Add quick log entry
claude --quick-log "[TYPE]" "[BRIEF_DESCRIPTION]"
```

### File Change Tracking
```bash
# Auto-log before making changes
claude --pre-change "[filename]" "[planned_changes]"

# Auto-log after changes complete
claude --post-change "[filename]" "[actual_changes]" "[validation_results]"

# Log file operations
claude --log-file-op "[operation]" "[filename]" "[reason]"
```

### Decision Tracking
```bash
# Log architectural decisions
claude --log-arch-decision "[decision]" "[rationale]" "[alternatives_considered]"

# Log technology choices
claude --log-tech-choice "[technology]" "[reason]" "[alternatives]"

# Log design decisions
claude --log-design-decision "[design_choice]" "[justification]"
```

## LOG ANALYSIS COMMANDS

### Daily Review
```bash
# Generate daily summary
claude --daily-summary "[date]"

# Show token usage analysis
claude --token-analysis "today"

# List all changes made
claude --changes-summary "today"
```

### Weekly Review
```bash
# Generate weekly report
claude --weekly-report "[week_start_date]"

# Show productivity metrics
claude --productivity-report "this_week"

# Identify patterns and trends
claude --trend-analysis "past_week"
```

### Project Review
```bash
# Generate project change history
claude --project-history "[project_name]"

# Show decision audit trail
claude --decision-history "[project_name]"

# Performance improvement tracking
claude --performance-history "[project_name]"
```

## LOG FILE STRUCTURE

### Directory Organization
```
project_root/
├── .claude/
│   ├── logs/
│   │   ├── 2024-06-11-session-01.md
│   │   ├── 2024-06-11-session-02.md
│   │   └── 2024-06-12-session-01.md
│   ├── summaries/
│   │   ├── 2024-06-11-daily.md
│   │   ├── 2024-06-week24-weekly.md
│   │   └── project-history.md
│   └── config/
│       ├── log-settings.json
│       └── templates/
```

### Naming Conventions
```
Session Logs: YYYY-MM-DD-session-NN.md
Daily Summaries: YYYY-MM-DD-daily.md
Weekly Reports: YYYY-MM-weekNN-weekly.md
Project History: [project-name]-history.md
```

## LOG SEARCH AND FILTERING

### Search Commands
```bash
# Find specific changes
claude --search-logs "file: [filename]"
claude --search-logs "error: [error_type]"
claude --search-logs "decision: [keyword]"

# Filter by date range
claude --filter-logs "date: [start_date] to [end_date]"

# Filter by change type
claude --filter-logs "type: [FILE_CHANGE | DECISION | ERROR_FIX]"

# Filter by impact level
claude --filter-logs "impact: [CRITICAL | HIGH]"
```

### Analytics Commands
```bash
# Show most changed files
claude --top-changes "files"

# Show most common errors
claude --top-changes "errors"

# Show decision frequency
claude --decision-stats

# Show token usage patterns
claude --token-patterns
```

## INTEGRATION WITH MCP TOOLS

### Memory Integration
```bash
# Save important decisions to memory
claude --log-to-memory "decision: [decision] | project: [name]"

# Save error patterns to memory
claude --log-to-memory "error_pattern: [pattern] | solution: [fix]"
```

### Filesystem Integration
```bash
# Auto-detect file changes
claude --watch-files "auto-log file modifications"

# Compare with git history
claude --git-compare "show differences from git log"
```

### Performance Integration
```bash
# Log performance measurements
claude --perf-log "operation: [name] | duration: [time] | resources: [usage]"

# Track optimization results
claude --opt-log "optimization: [description] | improvement: [metrics]"
```

## QUALITY ASSURANCE

### Log Validation
```bash
# Verify log completeness
claude --validate-logs "check for missing entries"

# Check log consistency
claude --check-consistency "verify log format and data"

# Audit decision trail
claude --audit-decisions "verify all decisions logged"
```

### Automated Alerts
```bash
# Alert on unlogged changes
claude --alert-unlogged "notify if changes not logged"

# Alert on high-impact changes
claude --alert-impact "notify on CRITICAL impact changes"

# Alert on error patterns
claude --alert-patterns "notify on repeated error types"
```

---

## MANDATORY LOGGING CHECKLIST

### Every Session Must Include
- [ ] Session header with objective and token budget
- [ ] All file changes with before/after states
- [ ] All implementation decisions with rationale
- [ ] All research activities with sources and findings
- [ ] All errors encountered with fixes applied
- [ ] Session summary with achievements and next steps

### Every Change Must Include
- [ ] Timestamp and change type
- [ ] Complete list of affected files
- [ ] Clear rationale for the change
- [ ] Validation methods used
- [ ] Token cost estimate
- [ ] Next actions and dependencies

### Every Decision Must Include
- [ ] Context that triggered the decision
- [ ] All options considered with pros/cons
- [ ] Final decision and rationale
- [ ] Implementation plan
- [ ] Success criteria and review date

**Remember**: Complete audit trail is essential for project success and debugging. Every action must be logged for accountability and learning.