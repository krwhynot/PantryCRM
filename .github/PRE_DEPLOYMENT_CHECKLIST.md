# 📋 Pre-Deployment Validation Checklist

**Project**: PantryCRM  
**Environment**: Azure App Service B1 Tier  
**Date**: _______________  
**Validated By**: _______________  

## 🔍 Automated Validation

Run these commands before any deployment:

```bash
# 1. Validate all workflows
./scripts/validate-workflows.sh

# 2. Run performance tests
./scripts/performance-validation.sh

# 3. Run security scan
npm audit --production

# 4. Test build locally
NODE_OPTIONS="--max-old-space-size=1536" npm run build:azure
```

## ✅ Workflow Configuration

### GitHub Actions Setup
- [ ] All workflow files pass YAML validation
  ```bash
  yamllint .github/workflows/*.yml
  ```
- [ ] All workflows pass actionlint validation
  ```bash
  actionlint
  ```
- [ ] Act is installed and configured for local testing
  ```bash
  act --version
  ```
- [ ] `.env.act` contains all required secrets (with dummy values)
- [ ] Event files exist in `.github/act-events/`

### Permissions & Security
- [ ] Workflows use minimal required permissions
- [ ] No hardcoded secrets in workflow files
- [ ] All action versions are pinned with SHA
- [ ] Secret scanning is enabled and passing

## ✅ Build and Test Validation

### Multi-Version Testing
- [ ] Node.js 18.x builds successfully
  ```bash
  act -W .github/workflows/enhanced-ci-cd.yml --matrix node-version:18.x
  ```
- [ ] Node.js 20.x builds successfully
  ```bash
  act -W .github/workflows/enhanced-ci-cd.yml --matrix node-version:20.x
  ```
- [ ] Latest Node.js builds successfully
  ```bash
  act -W .github/workflows/enhanced-ci-cd.yml --matrix node-version:latest
  ```

### Test Coverage
- [ ] Unit test coverage >= 80%
  ```bash
  npm run test:ci
  ```
- [ ] Critical components have >= 90% coverage
- [ ] E2E tests pass
  ```bash
  npm run test:e2e
  ```
- [ ] Smoke tests defined and passing
  ```bash
  npm run test:e2e tests/e2e/smoke.spec.ts
  ```

### TypeScript & Linting
- [ ] TypeScript compilation succeeds with no errors
  ```bash
  npm run typecheck
  ```
- [ ] ESLint passes with no errors
  ```bash
  npm run lint
  ```
- [ ] No `any` types in critical code paths

## ✅ Performance Optimization

### Azure B1 Constraints
- [ ] Memory usage stays under 1536MB during build
  ```bash
  ./scripts/performance-validation.sh build
  ```
- [ ] Application starts within 30 seconds
  ```bash
  ./scripts/performance-validation.sh startup
  ```
- [ ] Bundle size is under 50MB
  ```bash
  ./scripts/performance-validation.sh bundle
  ```
- [ ] No memory leaks detected
- [ ] NODE_OPTIONS configured correctly
  ```bash
  echo $NODE_OPTIONS  # Should show: --max-old-space-size=1536
  ```

### Build Performance
- [ ] Build completes in under 5 minutes
- [ ] Dependencies are cached effectively
- [ ] Prisma client generation is optimized
- [ ] Next.js build cache is utilized

### Runtime Performance
- [ ] Average response time < 1000ms under load
- [ ] P99 latency < 3000ms
- [ ] Can handle 4 concurrent users (B1 limit)
- [ ] No errors under standard load

## ✅ Security Scanning

### Dependency Security
- [ ] No high or critical npm vulnerabilities
  ```bash
  npm audit --production --audit-level=high
  ```
- [ ] All dependencies are from trusted sources
- [ ] License compliance checked
- [ ] No outdated dependencies with security issues

### Code Security
- [ ] CodeQL analysis passes
- [ ] No secrets detected in codebase
  ```bash
  trufflehog filesystem . --only-verified
  ```
- [ ] Authentication properly implemented
- [ ] API endpoints have proper authorization

### Infrastructure Security
- [ ] Environment variables properly configured
- [ ] Database connection strings are secure
- [ ] HTTPS enforced in production
- [ ] CORS properly configured

## ✅ Deployment Validation

### Pre-Deployment Checks
- [ ] Azure resources are healthy
  ```bash
  az webapp show --name pantry-crm-prod --resource-group pantry-crm-prod-rg
  ```
- [ ] Database migrations are ready
- [ ] Environment variables are set correctly
- [ ] Deployment slots are configured

### Deployment Process
- [ ] Deployment scripts tested locally
  ```bash
  act -W .github/workflows/deployment-validation.yml --input action=validate
  ```
- [ ] Rollback procedure tested
  ```bash
  act -W .github/workflows/deployment-validation.yml --input action=rollback
  ```
- [ ] Blue-green deployment configured
- [ ] Health checks implemented

### Post-Deployment Validation
- [ ] Health endpoint returns 200 OK
- [ ] All critical features tested
- [ ] Performance metrics within thresholds
- [ ] No errors in application logs

## ✅ Next.js Specific Validation

### React 19 & Server Components
- [ ] React 19 is correctly installed
- [ ] Server Components render without errors
- [ ] Client Components properly marked with 'use client'
- [ ] No hydration mismatches

### App Router
- [ ] All routes have proper error boundaries
- [ ] Loading states implemented
- [ ] Metadata properly configured
- [ ] Dynamic routes work correctly

### Build Output
- [ ] Static pages are pre-rendered
- [ ] API routes respond correctly
- [ ] Image optimization working
- [ ] Fonts optimized

### Prisma Integration
- [ ] Database connection pool configured
- [ ] Queries optimized (no N+1 issues)
- [ ] Migrations tested
- [ ] Seed data works correctly

## ✅ Monitoring & Observability

### Application Insights
- [ ] Application Insights configured
- [ ] Custom events tracked
- [ ] Performance metrics collected
- [ ] Error tracking enabled

### Logging
- [ ] Structured logging implemented
- [ ] Log levels appropriate
- [ ] No sensitive data in logs
- [ ] Log retention configured

### Alerts
- [ ] High error rate alert configured
- [ ] Performance degradation alert set
- [ ] Deployment failure notifications enabled
- [ ] Health check alerts active

## ✅ Documentation

### Code Documentation
- [ ] README is up to date
- [ ] API documentation complete
- [ ] Environment setup documented
- [ ] Troubleshooting guide available

### Deployment Documentation
- [ ] Deployment process documented
- [ ] Rollback procedures clear
- [ ] Emergency contacts listed
- [ ] Runbook created

## 📊 Final Validation Metrics

| Metric | Required | Actual | Pass |
|--------|----------|--------|------|
| Build Success Rate | 100% | ___% | [ ] |
| Test Coverage | ≥80% | ___% | [ ] |
| Unit Tests Passing | 100% | ___% | [ ] |
| E2E Tests Passing | 100% | ___% | [ ] |
| Memory Usage | <1536MB | ___MB | [ ] |
| Bundle Size | <50MB | ___MB | [ ] |
| Build Time | <5min | ___min | [ ] |
| Security Vulnerabilities | 0 High/Critical | ___ | [ ] |
| TypeScript Errors | 0 | ___ | [ ] |
| Lint Errors | 0 | ___ | [ ] |

## 🚦 Deployment Decision

### Go/No-Go Criteria
- [ ] All automated tests pass
- [ ] No critical security vulnerabilities
- [ ] Performance within Azure B1 limits
- [ ] All checklist items validated

### Approval
- **Technical Lead**: _____________ Date: _______
- **Security Review**: _____________ Date: _______
- **Operations**: _____________ Date: _______

### Deployment Window
- **Date**: _______________
- **Time**: _______________
- **Duration**: _______________
- **Rollback Window**: _______________

## 📝 Notes

_Add any additional notes, concerns, or observations here:_

---

**Checklist Version**: 1.0.0  
**Last Updated**: December 2024  
**Next Review**: _____________