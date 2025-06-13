# Emergency TypeScript Fix Guide for Kitchen Pantry CRM

## Current Status
✅ **Good News**: All `requireAuth` syntax errors have been fixed in the codebase.
⚠️ **Action Required**: Other TypeScript errors need fixing to restore CI/CD pipeline.

## Quick Verification Commands

```bash
# 1. Run TypeScript type checking
npm run typecheck

# 2. Check specific patterns (should return 0 results)
grep -r "requireAuth.*:.*Request" app/api/

# 3. Quick build test
npm run build:safe
```

## Find & Replace Patterns (For Future Reference)

### 1. Fix requireAuth Syntax Errors
**Find Pattern (Regex):**
```regex
requireAuth\s*\(\s*(\w+)\s*:\s*(?:Request|NextRequest)\s*\)
```

**Replace Pattern:**
```
requireAuth($1)
```

### 2. VS Code Search & Replace Instructions
1. Press `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac)
2. Enable regex mode (.*icon)
3. Enter find pattern above
4. Enter replace pattern above
5. Review each match before replacing
6. Click "Replace All" after verification

## Current TypeScript Errors to Fix

### 1. Test File Errors (Priority: HIGH)
- **Location**: `__tests__/api/auth.test.ts`
- **Status**: ✅ FIXED
- **Issue**: Jest mock type errors

### 2. Playwright Test Errors (Priority: MEDIUM)
- **Location**: `tests/e2e/*.spec.ts`
- **Issues**: 
  - `setOffline` method doesn't exist
  - `setGeolocation` method doesn't exist
  - `performanceMarks` property errors

### 3. Validation Service Errors (Priority: MEDIUM)
- **Location**: `src/lib/excel-migration/validation/validation-service.ts`
- **Issue**: Missing `input` property on ZodIssue type

## Prevention Setup for VS Code

### 1. Install Required Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-tslint-plugin",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### 2. Add to `.vscode/settings.json`
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includeInlayParameterNameHints": "all",
  "typescript.preferences.includeInlayFunctionParameterTypeHints": true,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

### 3. Pre-commit Hook Setup
```bash
# Install husky
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Add pre-commit hook
echo 'npm run typecheck && npm run lint' > .husky/pre-commit
```

## Azure B1 Performance Optimizations

### 1. Build Optimization
```json
// next.config.js additions
{
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  experimental: {
    optimizeCss: true
  }
}
```

### 2. Memory-Conscious Build
```bash
# Use for Azure B1 (1.75GB RAM)
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

## Quick ESLint Fix Commands

```bash
# Auto-fix common issues
npm run lint -- --fix

# Fix specific directories
npm run lint -- --fix app/api/

# Ignore specific warnings temporarily
npm run lint -- --quiet
```

## Validation Checklist

- [ ] Run `npm run typecheck` - should pass with 0 errors
- [ ] Run `npm run lint` - warnings OK, errors must be 0
- [ ] Run `npm test` - all 31 tests must pass
- [ ] Run `npm run build:safe` - should complete successfully
- [ ] Check GitHub Actions - all workflows should be green

## Emergency Contacts & Resources

- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Project Docs: /workspaces/PantryCRM/docs/
- Migration Plan: /workspaces/PantryCRM/docs/migration-plan.md
- Azure Monitor: Check deployment logs in Azure Portal

## Quick Fix Script

```bash
#!/bin/bash
# emergency-fix.sh

echo "🚨 Running Emergency TypeScript Fix..."

# 1. Clear caches
rm -rf .next
rm -rf node_modules/.cache

# 2. Run type check
echo "📝 Checking TypeScript..."
npm run typecheck

# 3. Auto-fix linting
echo "🔧 Fixing ESLint issues..."
npm run lint -- --fix

# 4. Run tests
echo "🧪 Running tests..."
npm test

# 5. Test build
echo "🏗️ Testing build..."
npm run build:safe

echo "✅ Emergency fix complete!"
```

---

**Last Updated**: June 13, 2025
**Status**: requireAuth errors FIXED, other TypeScript errors pending