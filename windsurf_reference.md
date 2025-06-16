# Windsurf Reference Guide - PantryCRM Migration

## 🚀 Project Overview

**PantryCRM** is a food service industry CRM built with Next.js 14, currently migrating from Azure SQL Database + Prisma ORM to PostgreSQL + Drizzle ORM with React 19 compatibility.

### Current Migration Status ✅
- **Infrastructure**: PostgreSQL + Drizzle ORM operational
- **Data Migration**: Complete (2 orgs, 2 contacts, 28 settings)
- **Core API Routes**: Converted (organizations, contacts, interactions, leads)
- **Chart Library**: @tremor/react installed and working
- **Budget**: Azure B1 tier ($18/month constraint)

### Next Phase Tasks for Windsurf
Focus on remaining API routes, component updates, and React 19 compatibility.

---

## 🛠️ Key Technologies & Architecture

### Current Stack
- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **UI**: shadcn/ui (50+ components), @tremor/react charts
- **Backend**: Next.js API routes, Server Actions
- **Database**: PostgreSQL (Azure Flexible Server B1), Drizzle ORM
- **Auth**: NextAuth.js with multiple providers
- **Hosting**: Azure App Service B1

### Database Schema (Drizzle)
Located in `lib/db/schema/` with these core tables:
- `users`, `accounts`, `sessions` (NextAuth)
- `organizations`, `contacts`, `interactions`
- `opportunities`, `leads`, `contracts`, `tasks`
- `systemSettings` (dynamic configuration)

### File Structure
```
/PantryCRM/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API routes (25+ files to convert)
│   │   ├── organizations/        # ✅ Converted to Drizzle
│   │   ├── contacts/             # ✅ Converted to Drizzle  
│   │   ├── interactions/         # ✅ Converted to Drizzle
│   │   ├── settings/             # ✅ Converted to Drizzle
│   │   └── crm/                  # 🔄 NEEDS CONVERSION (15+ files)
│   └── (routes)/                 # Page components
├── components/                   # UI components (75+ files)
│   ├── ui/                       # shadcn/ui components (50+ files)
│   ├── charts/                   # 🔄 NEEDS React 19 chart migration
│   ├── organizations/            # 🔄 NEEDS Drizzle API updates
│   ├── contacts/                 # 🔄 NEEDS Drizzle API updates
│   ├── food-service/             # Industry-specific components
│   └── nextcrm/                  # NextCRM integration
├── lib/                          # Utilities and services
│   ├── db/                       # ✅ Drizzle schema and connection
│   ├── services/                 # ✅ Settings service completed
│   └── types/                    # TypeScript definitions
└── scripts/                      # Migration and setup scripts
```

---

## 🎯 Priority Tasks for Windsurf

### 1. API Routes Conversion (HIGH PRIORITY)
**Location**: `app/api/crm/` directory (15+ files)

#### Pattern for Converting Prisma to Drizzle:

**Before (Prisma)**:
```typescript
import { prismadb } from '@/lib/prisma';

// Query
const results = await prismadb.organization.findMany({
  where: { name: { contains: query } }
});
```

**After (Drizzle)**:
```typescript
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { ilike } from 'drizzle-orm';

// Query
const results = await db
  .select()
  .from(organizations)
  .where(ilike(organizations.name, `%${query}%`));
```

#### Files to Convert:
- `app/api/crm/account/route.ts`
- `app/api/crm/account/[accountId]/route.ts`
- `app/api/crm/contacts/route.ts`
- `app/api/crm/contacts/[contactId]/route.ts`
- `app/api/crm/opportunity/route.ts`
- `app/api/crm/opportunity/[opportunityId]/route.ts`
- `app/api/crm/tasks/route.ts`
- `app/api/crm/organizations-optimized/route.ts`

#### Conversion Checklist:
1. Replace Prisma imports with Drizzle imports
2. Convert `findMany()` to `db.select().from(table)`
3. Convert `create()` to `db.insert(table).values()`
4. Convert `update()` to `db.update(table).set().where()`
5. Convert `delete()` to `db.delete(table).where()`
6. Update WHERE clauses using Drizzle operators (`eq`, `ilike`, `and`, `or`)
7. Add B1 performance limits (`.limit(50)`)
8. Test API endpoints

### 2. Chart Library Migration (HIGH PRIORITY)
**Issue**: Current @tremor/react may have React 19 incompatibilities

#### Option A: Update Tremor Implementation
1. Check `package.json` for @tremor/react version
2. Update to latest: `npm install @tremor/react@latest`
3. Test existing charts in `components/charts/`
4. Fix any React 19 compatibility issues

#### Option B: Migrate to TanStack Charts (if Tremor fails)
1. Install: `npm install @tanstack/react-charts`
2. Create new chart components in `components/charts/tanstack/`
3. Replace Tremor imports in dashboard components

#### Current Chart Components to Update:
- `components/charts/optimized/TremorAreaChart.tsx`
- `components/charts/optimized/TremorBarChart.tsx`
- `components/charts/optimized/TremorDonutChart.tsx`

### 3. Component Database Integration Updates (MEDIUM PRIORITY)
Update components to use new Drizzle API endpoints:

#### Form Components:
- `components/organizations/OrganizationForm.tsx`
- `components/contacts/ContactForm.tsx`
- `components/interactions/QuickInteractionEntry.tsx`

#### List Components:
- `components/organizations/OrganizationList.tsx`
- `components/contacts/ContactList.tsx`
- `components/organizations/EnhancedOrganizationCard.tsx`

#### Pattern for Component Updates:
```typescript
// Before
const response = await fetch('/api/organizations', {
  method: 'POST',
  body: JSON.stringify(data)
});

// After (should remain the same - API routes handle the conversion)
// No changes needed if API routes are properly converted
```

### 4. React 19 Compatibility (MEDIUM PRIORITY)

#### Check for Deprecated Patterns:
```bash
# Find React.FC usage (deprecated in React 19)
grep -r "React.FC\|React.FunctionComponent" components/

# Update to direct function typing
const Component: React.FC<Props> = ({ prop }) => { // ❌ Old
const Component = ({ prop }: Props) => {          // ✅ New
```

#### Update Next.js Configuration:
```typescript
// next.config.js
const nextConfig = {
  experimental: {
    reactCompiler: true, // Enable React 19 compiler
  },
};
```

---

## 🔧 Development Workflow

### Database Operations
```bash
# Generate Drizzle migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# View database in Drizzle Studio
npm run db:studio
```

### Testing
```bash
# Run all tests
npm test

# Test specific API endpoint
npm run test -- --grep "organizations"

# Test chart components
npm run test:charts
```

### Build and Deploy
```bash
# Local development
npm run dev

# Production build (with memory optimization)
npm run build

# Check for build errors
npm run lint
npm run typecheck
```

---

## 📊 Food Service Industry Context

### Priority Levels (A-D System)
- **A**: Highest priority customers (fine dining, large contracts)
- **B**: High priority (established restaurants, good volume)
- **C**: Medium priority (casual dining, standard accounts)
- **D**: Low priority (small accounts, infrequent orders)

### Market Segments
- `FINE_DINING`: High-end restaurants
- `FAST_FOOD`: Quick service restaurants
- `CASUAL_DINING`: Family restaurants
- `CATERING`: Event catering companies
- `INSTITUTIONAL`: Schools, hospitals
- `HEALTHCARE`: Healthcare facilities
- `EDUCATION`: Educational institutions
- `CORPORATE`: Corporate dining

### Interaction Types
- Email, Call, In-Person, Demo/Sampled, Quoted Price, Follow-up
- **30-second entry target**: Quick interaction logging is critical

---

## 🚨 Critical Constraints & Guidelines

### Performance (Azure B1 Tier)
- **Database**: Max 2-4 connections, optimize queries
- **API**: Limit responses to 50 records max
- **Memory**: 1.75GB RAM limit, optimize build process
- **Budget**: Must stay under $18/month total

### Database Connection
```typescript
// Always use the centralized connection
import { db } from '@/lib/db';

// Connection pooling is configured for B1 limits
// Do not create additional connections
```

### Error Handling Pattern
```typescript
// Use consistent error handling
import { createErrorResponse, createSuccessResponse } from '@/lib/types/api-helpers';

try {
  const result = await db.select()...;
  return createSuccessResponse(result);
} catch (error) {
  console.error('Database error:', error);
  return createErrorResponse('Operation failed', 500);
}
```

### Type Safety
```typescript
// Always use Drizzle-generated types
import type { Organization } from '@/lib/db/schema';

// For API responses
import type { APIResponse } from '@/types/crm';
```

---

## 🔍 Common Issues & Solutions

### 1. Database Connection Errors
**Issue**: `connection terminated` or `too many connections`
**Solution**: 
- Check connection pooling in `lib/db/index.ts`
- Ensure connections are properly closed
- Verify Azure PostgreSQL firewall rules

### 2. TypeScript Errors After Migration
**Issue**: Type mismatches between Prisma and Drizzle
**Solution**:
- Update imports from `@prisma/client` to Drizzle schema
- Check `lib/types/` for updated type definitions
- Run `npm run typecheck` to identify issues

### 3. Chart Rendering Issues
**Issue**: Charts not displaying or React 19 errors
**Solution**:
- Check console for specific error messages
- Verify @tremor/react version compatibility
- Consider TanStack Charts migration if needed

### 4. Build Timeouts
**Issue**: Next.js build exceeding memory limits
**Solution**:
- Use provided npm script with memory optimization
- Check for circular imports
- Optimize image and asset sizes

---

## 📋 Testing Checklist

Before marking any task complete, verify:

### API Route Conversion:
- [ ] API endpoint responds correctly
- [ ] Data types match expected schema
- [ ] Error handling works properly
- [ ] Performance is acceptable (<200ms)
- [ ] TypeScript compiles without errors

### Component Updates:
- [ ] Component renders without errors
- [ ] Form submissions work correctly
- [ ] Data fetching displays proper results
- [ ] Loading states work properly
- [ ] Error states display correctly

### Chart Migration:
- [ ] Charts render with sample data
- [ ] React 19 compatibility confirmed
- [ ] Performance is acceptable
- [ ] Responsive design maintained
- [ ] Accessibility features preserved

---

## 🚀 Quick Start Commands

```bash
# Start development server
npm run dev

# Convert an API route to Drizzle (example pattern)
# 1. Update imports
# 2. Replace Prisma queries with Drizzle
# 3. Test endpoint
# 4. Check TypeScript compilation

# Test the application
npm run test
npm run build

# Check database status
npm run db:studio
```

---

## 📞 Project Continuation Notes

When Claude Code runs out of tokens and Windsurf takes over:

1. **Current Status**: Infrastructure migration complete, focus on remaining API routes
2. **Next Priority**: Convert `app/api/crm/` directory (15+ files)
3. **Testing Required**: Each converted API route needs testing
4. **Performance**: Maintain B1 tier optimizations (50 record limits)
5. **Documentation**: Update completion status in master migration plan

The migration is in excellent shape - core infrastructure is working, data is migrated, and the foundation is solid. Focus on systematic conversion of remaining components while maintaining the established patterns and performance constraints.

---

*Last Updated: June 16, 2025 - Migration Infrastructure Complete*