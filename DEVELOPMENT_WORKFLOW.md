# Kitchen Pantry CRM - Development Workflow Guide

## Claude Code + Windsurf Cascade Integration

This document outlines the development workflow between Claude Code (architectural design) and Windsurf Cascade (implementation execution) for maximum parallel development efficiency.

---

## Current Project State

### ✅ Architecture Complete (Claude Code)
- **Type System**: Comprehensive TypeScript types with runtime validation
- **Performance Framework**: Azure B1 optimized caching and query patterns  
- **Chart System**: SSR-safe chart wrapper with fallback support
- **Component Architecture**: Food service CRM components with iPad optimization
- **Reference Implementation**: Complete example API route with all patterns

### 🔄 In Progress (Windsurf Cascade)
- **TypeScript Fixes**: Resolving 200+ type errors using new type system
- **Chart Migration**: Converting existing charts to SSRChartWrapper
- **API Route Updates**: Implementing validation helpers and error handling
- **Component Integration**: Applying new architectural patterns

---

## Workflow Protocol

### Phase 1: Critical Path Resolution (Current)

**Claude Code Focus**: Architecture refinement and complex problem solving
**Windsurf Focus**: TypeScript strict mode compliance and pattern application

#### Active Tasks Distribution

**Windsurf Critical Path** (Must complete in order):
1. `TODO-WS-001`: Fix TypeScript errors in API routes (8 hours) 
2. `TODO-WS-004`: Fix Prisma model property errors (4 hours)
3. `TODO-WS-003`: Update API routes to use validation helpers (5 hours)
4. `TODO-WS-006`: Migrate chart components to SSRChartWrapper (4 hours)

**Claude Code Parallel Work**:
- Monitor Windsurf progress and provide guidance
- Create additional reference implementations as needed
- Design advanced features (data migration, Excel import, etc.)
- Performance optimization and monitoring setup

### Phase 2: Feature Implementation (Next)

**Claude Code**: Complex feature architecture
**Windsurf**: Implementation of designed patterns

---

## File Change Coordination

### Shared Files (Coordination Required)
```
⚠️  COORDINATION NEEDED - Check before editing:
/types/crm.ts                    - Core type definitions
/lib/types/validation.ts         - Validation schemas  
/lib/types/api-helpers.ts        - API utilities
/components/charts/SSRChartWrapper.tsx - Chart system
```

### Windsurf Exclusive Files (Safe to modify)
```
✅ WINDSURF SAFE ZONE:
app/api/*/route.ts              - API route implementations
components/tremor/*             - Chart component migrations
components/ui/*                 - UI component fixes
actions/*/                      - Action implementations
Any file with TypeScript errors - Type fixing
```

### Claude Code Exclusive Files (Architecture)
```
🏗️ CLAUDE ARCHITECTURE ZONE:
/lib/performance/*              - Performance optimization
/components/food-service/*      - Food service components
ARCHITECTURE.md                 - Documentation
DEVELOPMENT_WORKFLOW.md         - This file
```

---

## Communication Protocol

### Daily Sync Pattern

**Windsurf Reports**:
```markdown
## Daily Progress Report

### Completed
- [x] Fixed TypeScript errors in app/api/crm/account/route.ts
- [x] Migrated BarChart components to SSRChartWrapper

### In Progress  
- [ ] TODO-WS-003: Updating validation helpers (60% complete)

### Blocked/Issues
- Schema mismatch in Contact model: `title` field doesn't exist
- Need clarification on caching strategy for user-specific data

### Next 24 Hours
- Complete TODO-WS-003: API validation helpers
- Start TODO-WS-006: Chart migration (remaining components)
```

**Claude Code Responses**:
```markdown
## Architecture Guidance

### Issue Resolution
- Contact model: Use `position` field instead of `title` (see Prisma schema line 125)
- User caching: Use `userId` as cache key prefix (see optimized-prisma.ts:245)

### New Patterns Created
- Created ContactQueryOptimizer for complex contact queries
- Added user-specific caching helper in cache manager

### Next Architecture Focus
- Excel import pipeline design
- Advanced reporting components
- Mobile performance optimization
```

---

## Quality Gates

### Before Any Merge/Commit

#### Windsurf Checklist
```bash
# TypeScript compliance
npm run typecheck          # Must pass with 0 errors

# Build verification  
npm run build             # Must complete successfully

# Component integration
npm run test              # Core tests must pass

# Performance check
npm run analyze           # Bundle size within limits
```

#### Claude Code Checklist
```bash
# Architecture validation
- [ ] Patterns follow established conventions
- [ ] Performance optimizations implemented
- [ ] Error boundaries and fallbacks in place
- [ ] Mobile optimization compliance (44px touch targets)
- [ ] Azure B1 constraints respected
```

---

## Common Integration Patterns

### 1. Adding New API Routes

**Step 1**: Windsurf creates basic route structure
```typescript
// app/api/new-feature/route.ts
export async function GET(request: NextRequest) {
  // Basic implementation
}
```

**Step 2**: Claude Code reviews and optimizes
```typescript
// Enhanced with full architectural patterns
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';
import { validateGetRequest } from '@/lib/types/validation';
// ... full pattern implementation
```

### 2. Component Development

**Step 1**: Windsurf implements basic component
```typescript
// Basic component with proper types
const Component = ({ data }: { data: OrganizationSummary }) => {
  return <div>{data.name}</div>;
};
```

**Step 2**: Claude Code enhances with mobile optimization
```typescript
// Enhanced with touch targets, haptic feedback, etc.
const Component = memo(function Component({ data }: ComponentProps) {
  return (
    <div className="min-h-[44px] hover:shadow-md transition-all">
      {/* Mobile-optimized implementation */}
    </div>
  );
});
```

### 3. Chart Integration

**Windsurf Pattern** (Apply to all chart migrations):
```typescript
// Before
import { BarChart } from '@tremor/react';
<BarChart data={data} index="name" categories={["value"]} />

// After  
import SSRChartWrapper from '@/components/charts/SSRChartWrapper';
const chartData: ChartDataPoint[] = data.map(item => ({
  name: item.name,
  value: item.value,
  category: item.category
}));
<SSRChartWrapper type="bar" data={chartData} height={300} />
```

---

## Error Resolution Process

### TypeScript Errors (Windsurf)

1. **Schema Mismatches**: Check Prisma schema first, use existing fields
2. **Missing Types**: Import from `/types/crm.ts`, don't create new types
3. **Validation Errors**: Use schemas from `/lib/types/validation.ts`
4. **API Responses**: Follow patterns in `/lib/types/api-helpers.ts`

### Performance Issues (Claude Code)

1. **Slow Queries**: Add to optimization framework
2. **Memory Usage**: Enhance cache management
3. **Chart Performance**: Update SSRChartWrapper optimizations
4. **Mobile Issues**: Create new mobile patterns

### Integration Conflicts

1. **File Conflicts**: Use communication protocol above
2. **Pattern Discrepancies**: Claude Code provides guidance
3. **Architecture Questions**: Schedule sync session

---

## Testing Strategy

### Windsurf Testing Focus
```bash
# Type safety validation
npm run typecheck

# Component functionality
npm run test -- ComponentName

# Build verification
npm run build:ci

# Basic performance
npm run lighthouse
```

### Claude Code Testing Focus
```bash
# Architecture validation
npm run test:architecture

# Performance benchmarking  
npm run test:performance

# Mobile optimization
npm run test:mobile

# Azure B1 validation
npm run test:azure-constraints
```

---

## Deployment Coordination

### Pre-Deployment Checklist

**Windsurf Responsibilities**:
- [ ] All TypeScript errors resolved
- [ ] All TODO-WS tasks completed
- [ ] Components follow established patterns
- [ ] No direct chart library imports remaining

**Claude Code Responsibilities**:
- [ ] Performance optimizations active
- [ ] Monitoring systems configured
- [ ] Cache systems operational
- [ ] Mobile optimizations validated

### Deployment Process

1. **Windsurf**: Complete current TODO phase
2. **Claude Code**: Validate architectural compliance
3. **Joint**: Run full test suite
4. **Deploy**: To staging environment
5. **Validate**: Performance and functionality
6. **Production**: Deploy with monitoring

---

## Success Metrics

### Phase Completion Targets

**Phase 1 Complete When**:
- [ ] `npm run typecheck` passes with 0 errors
- [ ] All TODO-WS-001 through TODO-WS-006 completed
- [ ] Charts migrated to SSRChartWrapper
- [ ] API routes use validation helpers
- [ ] Build succeeds without warnings

**Architecture Integration Success**:
- [ ] 95%+ type safety coverage
- [ ] <1000ms API response times
- [ ] >70% cache hit rates
- [ ] All touch targets ≥44px
- [ ] Zero production errors

**Performance Targets**:
- [ ] Bundle size <500KB main chunk
- [ ] Memory usage <85% of 1.75GB
- [ ] DTU usage <80% of 5 DTU limit
- [ ] Chart render time <2 seconds

---

## Next Phase Preview

### Phase 2: Advanced Features (Upcoming)

**Claude Code Architecture Tasks**:
- Excel import pipeline design
- Advanced reporting system
- Data migration utilities
- Production monitoring dashboard

**Windsurf Implementation Tasks**:
- Excel import UI components
- Report generation workflows  
- Data validation forms
- Dashboard improvements

This workflow ensures maximum parallel efficiency while maintaining architectural integrity and code quality throughout the development process.