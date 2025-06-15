# Claude Code Git Workflow

## Mandatory Pre-Work Protocol

### Before Any TODO Task:
1. **Always check git status first**
2. **Always pull latest changes**
3. **Resolve any conflicts immediately**
4. **Verify clean working tree**

```bash
# Execute these commands before starting ANY work:
git status
git pull --rebase origin main
git status  # Verify clean
```

## Task Execution Rules

### 1. Start Task Protocol
- **Update TODO status to in_progress** using TodoWrite tool
- **Use git status** before any file modifications
- **Work on single TODO at a time**

### 2. During Task Execution
- **Check file modifications frequently** with git status
- **Stage files incrementally** as logical units complete
- **Never modify files without checking current state**

### 3. Task Completion Protocol

#### Step A: Pre-Commit Validation
```bash
# Always run before committing:
git status                    # Check what's modified
git diff --name-only         # See which files changed
npm run typecheck            # Verify TypeScript compliance (if applicable)
```

#### Step B: Focused Staging
```bash
# Stage only files related to current TODO:
git add [specific-files-for-this-todo]
# Never use: git add . (too broad)
```

#### Step C: Structured Commit
```bash
git commit -m "$(cat <<'EOF'
[type]: [concise TODO completion description]

- Specific change 1
- Specific change 2  
- Specific change 3

Resolves: TODO-[ID] - [TODO description]


```

#### Step D: Immediate Sync and Push
```bash
# Pull latest changes (rebase for clean history)
git pull --rebase origin main

# Handle conflicts if they occur (see Conflict Resolution)
# Push immediately after successful rebase
git push origin main

# Update TODO status to completed using TodoWrite tool
```

## Conflict Resolution Protocol

### When Merge Conflicts Occur:

#### Step 1: Assess Conflict Scope
```bash
git status                   # See conflicted files
git diff --name-only        # Check conflict extent
```

#### Step 2: Resolve Based on File Type

**Configuration Files (tsconfig.json, package.json):**
- Always resolve by combining both changes
- Remove conflict markers completely
- Ensure valid JSON/configuration syntax

**Code Files:**
- Preserve Windsurf's implementation work
- Preserve Claude Code's architectural patterns
- When in doubt, favor the more complete implementation

**Documentation Files:**
- Combine both sets of changes
- Maintain chronological order of updates

#### Step 3: Complete Conflict Resolution
```bash
# After manually resolving conflicts:
git add [resolved-files]
git rebase --continue
# OR for merge:
git commit -m "merge: resolve conflicts between architectural updates and implementation fixes"

# Then push
git push origin main
```

## File Ownership Guidelines

### Claude Code Primary Responsibility:
- `/lib/performance/**` - Performance optimization
- `/components/food-service/**` - Food service architecture
- `/types/crm.ts` - Core type system
- All `ARCHITECTURE*.md` files
- All `*WORKFLOW*.md` files
- Performance monitoring components

### Claude Code Secondary (Coordinate):
- `/lib/types/validation.ts` - May update for architectural alignment
- `tsconfig.json` - May update for path aliases
- `package.json` - May add architectural dependencies

### Windsurf Territory (Avoid Unless Critical):
- `app/api/*/route.ts` - API implementations
- `src/components/**` - UI component fixes
- Individual TypeScript error fixes
- Form implementations

## Error Prevention Rules

### Mandatory Checks:
1. **Never modify files without git status check first**
2. **Never commit without reviewing diff**
3. **Never push without pull/rebase first**
4. **Always resolve conflicts immediately**
5. **Always update TODO status after completion**

### File Modification Protocol:
```bash
# Before modifying any file:
git status
git diff [file-path]         # See current state

# After modifying file:
git diff [file-path]         # Review changes
git add [file-path]          # Stage when satisfied
```

## Emergency Procedures

### If Severe Git Issues Occur:
1. **STOP all work immediately**
2. **Check git status and log current state**
3. **Create safety backup branch**: `git checkout -b claude-backup-$(date +%Y%m%d-%H%M%S)`
4. **Document issue in TODO system**
5. **Reset to last known good state if needed**

### Recovery Commands:
```bash
# Create backup before any recovery
git checkout -b claude-backup-$(date +%Y%m%d-%H%M%S)
git checkout main

# Option 1: Reset to remote (loses local work)
git reset --hard origin/main

# Option 2: Stash and retry
git stash push -m "Emergency stash before recovery"
git pull --rebase origin main
git stash pop
```

## Daily Session Protocol

### Session Start:
```bash
# Always execute at session start:
git status
git pull --rebase origin main
git status
# Use TodoRead tool to check current tasks
```

### Session End:
```bash
# Complete any partial work:
git add .
git commit -m "wip: [description] - architectural work in progress"
git push origin main
# Update TODO status using TodoWrite tool
```

## Commit Message Standards

### Types:
- `feat:` - New architectural components, frameworks
- `refactor:` - Performance optimizations, architectural improvements  
- `docs:` - Architecture documentation, workflow guides
- `fix:` - Critical architectural fixes, type system corrections
- `chore:` - Dependencies, configuration for architecture

### Required Elements:
1. **Type and description**
2. **Bullet-pointed changes**
3. **TODO resolution reference**
4. **Claude Code signature**

## Validation Checklist

Before every commit, verify:
- [ ] `git status` shows only intended changes
- [ ] All TODO status updates completed
- [ ] Commit message follows standard format
- [ ] No merge conflict markers remain
- [ ] TypeScript compliance maintained (if applicable)
- [ ] Changes align with architectural principles

## Success Metrics

### Per Session:
- ✅ Zero unresolved conflicts
- ✅ All commits properly formatted
- ✅ TODO status synchronized
- ✅ No force pushes required

### Per TODO Completion:
- ✅ Single focused commit per TODO
- ✅ Immediate push after completion
- ✅ Clean git history maintained

This workflow ensures Windsurf maintains clean collaboration with Claude Code while preserving architectural integrity and preventing git conflicts.