# 🧪 Comprehensive Testing & Debugging Guide

This document consolidates all testing, debugging, and emergency fix documentation for PantryCRM.

---

## Azure Deployment Testing

### Prerequisites

- **Azure CLI** (v2.50+): `az --version`
- **Node.js** (v20 LTS): `node --version`
- **Artillery** (load testing): `npm install -g artillery`
- **jq** (JSON processing): `sudo apt-get install jq` or `brew install jq`

### Azure B1 Configuration Validation

Tests the fundamental B1 configuration and validates it meets requirements.

#### Scripts:
- `deploy-infrastructure.sh` - Deploys Azure infrastructure using Bicep
- `validate-b1-config.sh` - Validates B1-specific configurations
- `performance-validation.sh` - Tests performance against B1 requirements

#### Performance Tests:
```bash
# Load test within B1 constraints (max 4 concurrent users)
artillery run azure-b1-load-test.yml

# Memory consumption test
node scripts/azure-testing/memory-usage-test.js

# Database connection test (max 3 connections)
node scripts/azure-testing/connection-pool-test.js
```

### Automated Infrastructure Tests

```bash
# Full infrastructure validation suite
./scripts/azure-testing/run-all-tests.sh

# Specific tests
./scripts/azure-testing/validate-cdn-config.sh
./scripts/azure-testing/validate-sql-config.sh
./scripts/azure-testing/validate-storage-config.sh
```

---

## E2E Testing with Playwright

### Setup

```bash
# Install Playwright
npx playwright install

# Install browsers
npx playwright install chromium firefox webkit
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/authentication.spec.ts

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Run on specific browser
npx playwright test --project=webkit
```

### Key Test Suites

1. **Authentication Flow**
   - Sign in with valid credentials
   - Invalid credential handling
   - Password reset flow
   - Account lockout after failed attempts

2. **Organization Management**
   - Create new organization
   - Search functionality (<1s response)
   - Edit organization details
   - Delete organization

3. **Contact Management**
   - Create new contact
   - Associate with organization
   - Edit contact information
   - Delete contact

4. **Mobile Responsiveness**
   - iPad Safari rendering
   - Touch target validation (44px minimum)
   - Form usability on touch devices

---

## Performance Testing

### Tools

- **Lighthouse**: Web performance, accessibility, SEO
- **WebPageTest**: Real browser testing across devices
- **Next.js Analytics**: Build-time and runtime metrics

### Key Performance Metrics

| Metric | Target | Testing Method |
|--------|--------|---------------|
| Search Response | <1s | Artillery + Browser DevTools |
| Report Generation | <10s | End-to-end test with timer |
| Page Load | <3s | Lighthouse + WebPageTest |
| First Input Delay | <100ms | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |

### Automated Performance Testing

```bash
# Run Lighthouse CI
npm run lighthouse

# Bundle size analysis
npm run analyze

# Memory usage profiling
npm run profile:memory

# API response time testing
npm run test:api-performance
```

### Performance Test Scenarios

1. **Search Performance Test**
   - Search with 1000+ organizations
   - Measure response time under load
   - Validate <1s target is met

2. **Report Generation Test**
   - Generate reports with varying data sizes
   - Measure time to completion
   - Validate <10s target with pagination

3. **Concurrent User Test**
   - Simulate 4 concurrent users
   - Measure system responsiveness
   - Validate resource utilization

---

## Debugging Checklist

### Common Issues and Solutions

#### Authentication Issues
- **Error:** "User not found"
  - **Check:** Verify user exists in database
  - **Fix:** Run user seed script if needed

#### Database Connection Issues
- **Error:** "Too many connections"
  - **Check:** Monitor connection pool with `getConnectionPoolStatus()`
  - **Fix:** Fix connection leaks, implement connection pooling

#### Performance Degradation
- **Symptom:** Slow API responses
  - **Check:** Run `analyzeDatabaseQueries()` to find slow queries
  - **Fix:** Implement query optimization, add missing indexes

#### Memory Issues
- **Symptom:** B1 instance crashing
  - **Check:** Run `getMemoryUsage()` to monitor consumption
  - **Fix:** Implement memory optimizations, check for memory leaks

### Debugging Tools

```bash
# TypeScript error checking
npm run typecheck

# ESLint checking
npm run lint

# Runtime error logging
npm run dev:debug

# Database query logging
NODE_OPTIONS='-r dotenv/config' DEBUG="prisma:*" npm run dev
```

### Development Environment Setup

```json
// Recommended VSCode settings
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

---

## Emergency Fix Guide

### Quick Fix Script

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

### Production Rollback Procedure

1. **Identify Issue**
   - Check Azure Monitor alerts
   - Review Application Insights logs
   - Verify user reports

2. **Access Deployment Center**
   - Azure Portal > App Service > Deployment Center
   - Identify the last stable deployment

3. **Execute Rollback**
   ```bash
   az webapp deployment source rollback --name pantry-crm --resource-group pantry-crm-rg --slot production --target-id [DEPLOYMENT_ID]
   ```

4. **Verify Rollback**
   - Check application health endpoint
   - Verify critical functionality
   - Monitor for errors

### Data Recovery Procedures

1. **Database Restore**
   ```bash
   # List available backups
   az sql db list-backups --resource-group pantry-crm-rg --server pantry-crm-server --name pantry-crm-db
   
   # Restore from backup
   az sql db restore --resource-group pantry-crm-rg --server pantry-crm-server --name pantry-crm-db --dest-name pantry-crm-db-restore --time "2025-06-10T13:59:59Z"
   ```

2. **Manual Data Fix**
   - Use database console in Azure Portal
   - Execute data correction scripts
   - Verify data integrity after fix

---

## Validation Checklist

- [ ] Run `npm run typecheck` - should pass with 0 errors
- [ ] Run `npm run lint` - warnings OK, errors must be 0
- [ ] Run `npm test` - all 31 tests must pass
- [ ] Run `npm run build:safe` - should complete successfully
- [ ] Check GitHub Actions - all workflows should be green

---

**Last Updated**: June 13, 2025
**Status**: All critical issues resolved, regular testing enabled