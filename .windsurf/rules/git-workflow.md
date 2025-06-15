---
trigger: always_on
---

Core Principles

  1. One task, one commit - Complete TODO tasks individually with focused commits
  2. Always sync before starting - Pull latest changes before beginning new work
  3. Communicate through commits - Use descriptive commit messages to coordinate
  4. Preserve each other's work - Never force push without coordination

  ---
  Pre-Work Sync Protocol

  Before Starting Any TODO:

  # 1. Check current status
  git status

  # 2. Stash any WIP if needed
  git stash push -m "WIP: [brief description]"

  # 3. Pull latest changes
  git pull --rebase origin main

  # 4. Apply stash if needed
  git stash pop

  # 5. Verify clean state
  git status

  ---
  Task Completion Workflow

  Upon Completing a TODO:

  Step 1: Pre-Commit Validation

  # Verify changes work
  npm run typecheck
  npm run build  # if applicable

  # Stage only related files
  git add [specific-files-for-this-todo]

  Step 2: Commit with Standard Format

  git commit -m "$(cat <<'EOF'
  [type]: [concise description of TODO completion]

  - Specific change 1
  - Specific change 2
  - Specific change 3

  Resolves: TODO-[ID] - [TODO description]

  🤖 Generated with [Claude Code](https://claude.ai/code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  EOF
  )"

  Step 3: Immediate Sync and Push

  # Pull any new changes (rebase to keep history clean)
  git pull --rebase origin main

  # Push immediately
  git push origin main

  # Update TODO status
  # (Claude Code: Use TodoWrite tool)
  # (Windsurf: Update TODO tracking)

  ---
  Commit Message Standards

  Format:

  [type]: [description]

  - Detailed change 1
  - Detailed change 2

  Resolves: TODO-[ID] - [TODO description]

  🤖 Generated with [Claude Code](https://claude.ai/code)
  Co-Authored-By: Claude <noreply@anthropic.com>

  Types:

  - fix: - TypeScript errors, bugs, validation issues
  - feat: - New components, API routes, features
  - refactor: - Code restructuring, optimization
  - docs: - Documentation, architecture guides
  - chore: - Dependencies, configuration, cleanup

  ---
  Conflict Resolution Rules

  When Conflicts Occur:

  Option 1: Auto-Resolve (Preferred)

  # For minor conflicts in different areas
  git pull origin main
  # Resolve conflicts manually
  git add .
  git commit -m "merge: resolve conflicts between [your-work] and [other-work]"
  git push origin main

  Option 2: Coordinate via TODO Comments

  # If major conflicts in same files
  git stash push -m "CONFLICT: TODO-[ID] needs coordination"
  # Update TODO with conflict note
  # Wait for coordination

  Option 3: Emergency Reset (Last Resort)

  # Only if work can be easily recreated
  git reset --hard origin/main
  # Restart the TODO task

  ---
  File Ownership Guidelines

  Claude Code Primary:

  - /lib/performance/** - Performance optimization
  - /components/food-service/** - Food service components
  - /types/crm.ts - Core type definitions
  - ARCHITECTURE.md, DEVELOPMENT_WORKFLOW.md - Documentation

  Windsurf Primary:

  - app/api/*/route.ts - API implementations
  - src/components/** - UI component fixes
  - Individual component TypeScript fixes
  - Form validation implementations

  Shared (Coordinate Required):

  - /lib/types/validation.ts - Validation schemas
  - tsconfig.json - Configuration
  - package.json - Dependencies

  ---
  Daily Sync Protocol

  Start of Work Session:

  # 1. Sync with remote
  git pull --rebase origin main

  # 2. Check TODO status alignment
  # Claude Code: TodoRead tool
  # Windsurf: Review TODO tracking

  # 3. Announce work plan in commit
  git commit --allow-empty -m "work: starting session on TODO-[IDs]"
  git push origin main

  End of Work Session:

  # 1. Complete any partial work
  git add .
  git commit -m "wip: [description] - will continue in next session"

  # 2. Push for coordination
  git push origin main

  # 3. Update TODO status
  # Mark in_progress or completed as appropriate

  ---
  Emergency Procedures

  If Repository Gets Severely Diverged:

  1. Stop all work immediately
  2. Create backup branch: git checkout -b backup-[timestamp]
  3. Coordinate via TODO system about reset strategy
  4. Choose lead: One person resets, other re-applies changes
  5. Force push once: git push --force-with-lease origin main

  If Major Architecture Changes Needed:

  1. Create feature branch: git checkout -b arch-[feature-name]
  2. Complete architecture work
  3. Coordinate merge timing
  4. Merge with explicit coordination

  ---
  Automation Hooks (Optional)

  Pre-commit Hook:

  #!/bin/sh
  # Ensure builds pass before commit
  npm run typecheck || exit 1

  Pre-push Hook:

  #!/bin/sh
  # Ensure sync is current
  git fetch origin
  LOCAL=$(git rev-parse @)
  REMOTE=$(git rev-parse @{u})
  if [ $LOCAL != $REMOTE ]; then
      echo "Branch not up to date. Run git pull first."
      exit 1
  fi

  ---
  Success Metrics

  Daily:

  - ✅ Zero merge conflicts
  - ✅ All commits have proper format
  - ✅ TODO status stays synchronized

  Weekly:

  - ✅ Linear git history (minimal merge commits)
  - ✅ All TypeScript errors resolved systematically
  - ✅ No force pushes needed

  This workflow ensures both Claude Code and Windsurf can work efficiently in parallel while maintaining clean git history and
  avoiding conflicts.