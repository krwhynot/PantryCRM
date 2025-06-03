---
description: Conduct systematic development review for Food Service CRM project phases. Ensures NextCRM compliance, iPad optimization, Azure deployment readiness, and quality gates throughout 8-week development cycle.
---

# Food Service CRM - Development Review

## Description
Conduct systematic development review for Food Service CRM project phases. Ensures NextCRM compliance, iPad optimization, Azure deployment readiness, and quality gates throughout 8-week development cycle.

---

## Steps

### 1. Identify Current Development Phase
```bash
# Check git branch and current development phase
git branch --show-current
echo "Current Phase: [Foundation Setup | Core CRM | Pipeline/Reporting | Data Migration]"
```

### 2. Review Phase-Specific Requirements
For each phase, verify deliverables:
```bash
# Phase 1: Foundation Setup checklist
ls -la .windsurf/workflows/
cat docs/foundation-checklist.md

# Phase 2: Core CRM checklist  
cat docs/core-crm-checklist.md

# Phase 3: Pipeline checklist
cat docs/pipeline-checklist.md

# Phase 4: Migration checklist
cat docs/migration-checklist.md
```

### 3. Validate NextCRM Foundation Compliance
```bash
# Check NextCRM component usage
grep -r "shadcn/ui" src/components/ | wc -l
grep -r "Tremor" src/components/ | wc -l

# Verify Prisma schema for SQL Server
grep "provider.*sqlserver" prisma/schema.prisma

# Check Auth.js configuration
ls -la src/lib/auth.ts
```

### 4. Test iPad Optimization
```bash
# Check touch target specifications
grep -r "min-h-11\|44px" src/components/

# Test responsive layouts
npm run build
npm run start

# Manual iPad Safari testing required:
echo "Test on actual iPad device at localhost:3000"
echo "Verify landscape orientation optimization"
echo "Confirm 44px touch targets on all interactive elements"
```

### 5. Validate Azure Infrastructure
```bash
# Check Azure costs
az consumption usage list --billing-period [current-period]

# Verify database connection
npx prisma db push --preview-feature

# Test Azure App Service deployment
curl -I https://[app-name].azurewebsites.net/
```

### 6. Run Performance Tests
```bash
# Database query performance
npx prisma studio
# Test search queries under 1 second

# Report generation timing
npm run test:performance
# Verify <10 second report generation
```

### 7. Code Quality Review
```bash
# TypeScript compliance
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Unit test coverage
npm run test
npm run test:coverage
```

### 8. Food Service Requirements Validation
```bash
# Verify priority system implementation
grep -r "priority.*A\|B\|C\|D" src/

# Check market segments
grep -r "Fine Dining\|Fast Food" src/

# Validate 11 principals
grep -r "Kaufholds\|Frites Street" src/

# Test 5-stage pipeline
grep -r "Lead-discovery\|Contacted" src/
```

### 9. Security and Authentication Review
```bash
# Check environment variables
cat .env.local | grep -v "PASSWORD\|SECRET"

# Verify authentication flows
npm run test:auth

# Review API security
grep -r "middleware\|auth" src/app/api/
```

### 10. Multi-Agent Review Process
Document findings in `docs/review-[date].md`:
```markdown
## Self-Review Results
- NextCRM compliance: [Pass/Fail]
- iPad optimization: [Pass/Fail]  
- Performance targets: [Pass/Fail]
- Code quality: [Pass/Fail]

## Critical Issues Found
- [List any critical issues]

## Recommendations
- [List improvement recommendations]
```

### 11. Quality Gate Decision
```bash
# Generate quality gate report
echo "Phase: [Current Phase]"
echo "Pass/Fail Criteria Met: [Yes/No]"
echo "Critical Issues: [Count]"
echo "Performance: [Pass/Fail]"
echo "Ready for Next Phase: [Yes/No]"
```

### 12. Update Documentation and Planning
```bash
# Update progress tracking
git add docs/review-[date].md
git commit -m "Phase [X] review complete - [Pass/Fail]"

# Plan next phase if passing
echo "Next Phase Planning:"
echo "- Dependencies satisfied: [Yes/No]"
echo "- Timeline on track: [Yes/No]"
echo "- Team ready: [Yes/No]"
```

---

## Success Criteria
- All phase-specific requirements verified
- NextCRM foundation compliance confirmed
- iPad Safari compatibility tested on actual devices
- Performance targets met (<1s search, <10s reports)
- Azure costs within $18/month budget
- Code quality standards maintained
- Ready for next development phase