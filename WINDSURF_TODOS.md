# Kitchen Pantry CRM - Windsurf Cascade TODOs

## TODO-WS-001: Fix TypeScript Errors in API Routes
**Priority**: High  
**Estimated Time**: 8 hours  
**Pattern Location**: `/lib/types/validation.ts`, `/lib/types/api-helpers.ts`

### Task
Fix all TypeScript errors in API routes using the new comprehensive type system. Focus on the most critical routes first.

### Steps
1. **Fix app/api/crm/account/route.ts (Priority 1)**
   - Import validation functions: `import { validateCreateOrganization, validateUpdateOrganization } from '@/lib/types/validation'`
   - Import API helpers: `import { parseRequestBody, createSuccessResponse, handleValidationError, handlePrismaError } from '@/lib/types/api-helpers'`
   - Replace manual validation with: `const { success, data, error } = await parseRequestBody(req, validateCreateOrganization)`
   - Fix missing fields: Add `segment` field to organization creation (required field)
   - Remove `isActive` field usage (not in schema)
   - Fix property access: Use `organization.zipCode` instead of `organization.postalCode`

2. **Fix app/api/crm/contacts/route.ts**
   - Import: `import { validateCreateContact } from '@/lib/types/validation'`
   - Remove `title` field (use `position` instead)
   - Add proper error handling with `handlePrismaError`

3. **Fix app/api/contacts/by-organization/[orgId]/route.ts**
   - Fix route params: `const { orgId } = await context.params`
   - Add type annotation: `Promise<NextResponse<APIResponse<ContactWithDetails[]>>>`

### Validation
- [ ] TypeScript compiles without errors in API routes
- [ ] All API routes return proper `APIResponse<T>` format
- [ ] Validation errors are properly formatted
- [ ] No usage of `any` type in route handlers

### Example
```typescript
// Before
export async function POST(req: NextRequest) {
  const body = await req.json();
  const newAccount = await prismadb.organization.create({
    data: {
      name: body.name,
      // Missing required fields, improper validation
    }
  });
}

// After  
export async function POST(req: NextRequest): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
  const { success, data, error } = await parseRequestBody(req, validateCreateOrganization);
  if (!success) return handleValidationError([{ field: 'body', message: error.message }]);
  
  try {
    const newAccount = await prismadb.organization.create({ data });
    return createSuccessResponse(newAccount);
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

---

## TODO-WS-002: Replace 'any' Types with Proper Interfaces
**Priority**: Medium  
**Estimated Time**: 6 hours  
**Pattern Location**: `/types/crm.ts`

### Task
Replace all instances of 'any' type with proper TypeScript interfaces across the codebase.

### Steps
1. **Search for 'any' usage**: Use VS Code search `any` in `.ts` and `.tsx` files
2. **Replace in component props**:
   - Import types: `import type { OrganizationSummary, ContactWithDetails } from '@/types/crm'`
   - Replace: `props: any` → `props: { organizations: OrganizationSummary[] }`
3. **Replace in API responses**:
   - Replace: `data: any` → `data: OrganizationWithDetails[]`
4. **Replace in form handling**:
   - Replace: `values: any` → `values: CreateOrganizationRequest`

### Files to Update (Priority Order)
1. `app/api/*/route.ts` files
2. `components/organizations/*.tsx`
3. `components/contacts/*.tsx`  
4. `actions/crm/*.ts`
5. `lib/*.ts` utilities

### Validation
- [ ] No 'any' types in API routes
- [ ] All component props properly typed
- [ ] Form values have proper interfaces
- [ ] Event handlers have correct parameter types

---

## TODO-WS-003: Update API Routes to Use Validation Helpers
**Priority**: High  
**Estimated Time**: 5 hours  
**Pattern Location**: `/lib/types/api-helpers.ts`

### Task
Update all API routes to use the new validation helpers and response builders for consistent error handling.

### Steps
1. **Import helpers in each route file**:
   ```typescript
   import { 
     parseRequestBody, 
     createSuccessResponse, 
     createErrorResponse,
     handleValidationError,
     handlePrismaError
   } from '@/lib/types/api-helpers';
   ```

2. **Replace manual JSON parsing**:
   ```typescript
   // Before
   const body = await req.json();
   
   // After
   const { success, data, error } = await parseRequestBody(req, validateCreateOrganization);
   if (!success) return handleValidationError(error.details.errors);
   ```

3. **Replace manual response creation**:
   ```typescript
   // Before
   return NextResponse.json({ data: result });
   
   // After
   return createSuccessResponse(result);
   ```

4. **Add proper error handling**:
   ```typescript
   try {
     const result = await prismadb.organization.create({ data });
     return createSuccessResponse(result);
   } catch (error) {
     return handlePrismaError(error);
   }
   ```

### Route Files to Update
1. `app/api/crm/account/route.ts`
2. `app/api/crm/contacts/route.ts`
3. `app/api/crm/opportunity/route.ts`
4. `app/api/crm/leads/route.ts`
5. All other CRUD routes

### Validation
- [ ] All routes use validation helpers
- [ ] Consistent error response format
- [ ] Proper TypeScript return types
- [ ] No manual JSON parsing

---

## TODO-WS-004: Fix Prisma Model Property Errors
**Priority**: High  
**Estimated Time**: 4 hours  
**Pattern Location**: `/types/crm.ts`, Prisma schema

### Task
Fix all property access errors where code references fields that don't exist in the Prisma schema.

### Steps
1. **Common Property Fixes**:
   - `description` → `notes` (Organization model)
   - `addressLine1` → `address` (Organization model)  
   - `postalCode` → `zipCode` (Organization model)
   - `country` → Remove (not in schema)
   - `accountManagerId` → Remove (not in schema)
   - `isActive` → Remove (use `status` field)
   - `title` → `position` (Contact model)

2. **Update API Route Files**:
   - Search for each incorrect property name
   - Replace with correct schema field
   - Remove references to non-existent fields

3. **Update Component Files**:
   - Fix property access in JSX: `organization.description` → `organization.notes`
   - Update form fields to match schema
   - Fix TypeScript interfaces

### Schema Reference
```typescript
// Organization model has:
{ name, priority, segment, type, address, city, state, zipCode, phone, email, website, notes, estimatedRevenue, employeeCount, primaryContact, lastContactDate, nextFollowUpDate, status }

// Contact model has:
{ firstName, lastName, email, phone, position, isPrimary, notes, organizationId }
```

### Validation
- [ ] No property access errors in TypeScript
- [ ] All database queries use correct field names
- [ ] Forms submit with valid field names
- [ ] Components display correct data

---

## TODO-WS-005: Add Return Types to All API Route Handlers  
**Priority**: Medium  
**Estimated Time**: 3 hours  
**Pattern Location**: `/types/api.ts`, `/types/crm.ts`

### Task
Add explicit return types to all API route handler functions for better type safety.

### Steps
1. **Import return types**:
   ```typescript
   import type { APIResponse, OrganizationWithDetails, ContactWithDetails } from '@/types/crm';
   import { NextResponse } from 'next/server';
   ```

2. **Add return types to handlers**:
   ```typescript
   // Before
   export async function GET(request: NextRequest, context: RouteContext) {
   
   // After
   export async function GET(
     request: NextRequest, 
     context: RouteContext
   ): Promise<NextResponse<APIResponse<OrganizationWithDetails[]>>> {
   ```

3. **Pattern for each HTTP method**:
   - `GET` single item: `Promise<NextResponse<APIResponse<ModelWithDetails>>>`
   - `GET` list: `Promise<NextResponse<APIResponse<ModelSummary[]>>>`
   - `POST` create: `Promise<NextResponse<APIResponse<ModelWithDetails>>>`
   - `PUT/PATCH` update: `Promise<NextResponse<APIResponse<ModelWithDetails>>>`
   - `DELETE`: `Promise<NextResponse<APIResponse<{ success: boolean }>>>`

### Route Files to Update
1. Organization routes: `OrganizationWithDetails` / `OrganizationSummary[]`
2. Contact routes: `ContactWithDetails` / `ContactSummary[]`
3. Interaction routes: `InteractionWithDetails` / `InteractionSummary[]`
4. Opportunity routes: `OpportunityWithDetails` / `OpportunitySummary[]`

### Validation
- [ ] All route handlers have explicit return types
- [ ] Return types match actual response data
- [ ] TypeScript provides proper autocomplete
- [ ] Error responses properly typed

---

## TODO-WS-006: Migrate Chart Components to SSRChartWrapper
**Priority**: High  
**Estimated Time**: 4 hours  
**Pattern Location**: `/components/charts/SSRChartWrapper.tsx`

### Task
Replace all direct chart library usage with the new SSRChartWrapper for better performance and SSR safety.

### Steps
1. **Find existing chart components**:
   - Search for: `import.*recharts`, `import.*tremor`, `<BarChart`, `<LineChart`, `<AreaChart`, `<DonutChart`
   - Files to check: `components/tremor/*`, `src/components/charts/*`, dashboard components

2. **Replace with SSRChartWrapper**:
   ```typescript
   // Before
   import { BarChart } from '@tremor/react';
   <BarChart data={data} index="name" categories={["value"]} />
   
   // After
   import SSRChartWrapper from '@/components/charts/SSRChartWrapper';
   <SSRChartWrapper type="bar" data={chartData} height={300} />
   ```

3. **Transform data to ChartDataPoint format**:
   ```typescript
   // Transform organization data to chart format
   const chartData: ChartDataPoint[] = organizations.map(org => ({
     name: org.name,
     value: org.estimatedRevenue || 0,
     category: org.segment
   }));
   ```

4. **Update specific chart types**:
   - Bar charts: `type="bar"`
   - Line charts: `type="line"`  
   - Area charts: `type="area"`
   - Pie/Donut charts: `type="donut"`

### Files to Update
1. `components/tremor/OptimizedBarChart.tsx`
2. `components/tremor/OptimizedAreaChart.tsx`
3. `components/tremor/OptimizedDonutChart.tsx`
4. `src/components/charts/OptimizedDonutChart.tsx`
5. Dashboard components using charts

### Validation
- [ ] No direct recharts/tremor imports in components
- [ ] All charts render without hydration errors
- [ ] Loading states display properly
- [ ] Charts work in both SSR and client modes

---

## TODO-WS-007: Update Chart Imports and Remove Direct Dependencies
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Pattern Location**: `/components/charts/SSRChartWrapper.tsx`

### Task
Remove all direct imports of chart libraries and update import statements to use the new chart system.

### Steps
1. **Remove direct chart library imports**:
   ```typescript
   // Remove these imports
   import { BarChart, LineChart, AreaChart, DonutChart } from '@tremor/react';
   import { BarChart, XAxis, YAxis } from 'recharts';
   ```

2. **Update to use SSR wrapper and pre-built components**:
   ```typescript
   // Add these imports instead
   import SSRChartWrapper, { CRMCharts } from '@/components/charts/SSRChartWrapper';
   import type { ChartDataPoint } from '@/types/crm';
   ```

3. **Use pre-configured CRM chart components**:
   ```typescript
   // For common CRM use cases
   <CRMCharts.PriorityDistribution data={priorityData} />
   <CRMCharts.ActivityTimeline data={activityData} />
   <CRMCharts.PipelineFunnel data={pipelineData} />
   <CRMCharts.SegmentPerformance data={segmentData} />
   ```

### Files to Update
1. All files in `components/tremor/` directory
2. All files in `src/components/charts/` directory  
3. Dashboard and reporting components
4. Any component with chart imports

### Validation
- [ ] No direct chart library imports remain
- [ ] All charts use SSRChartWrapper or CRMCharts
- [ ] Bundle size reduced (check with `npm run analyze`)
- [ ] Charts maintain same functionality

---

## TODO-WS-008: Apply Consistent Chart Styling and Loading States
**Priority**: Low  
**Estimated Time**: 3 hours  
**Pattern Location**: `/components/charts/SSRChartWrapper.tsx`

### Task
Ensure all charts have consistent styling, loading states, and error handling.

### Steps
1. **Standardize chart containers**:
   ```typescript
   <div className="chart-container bg-white rounded-lg shadow-sm border p-4">
     <SSRChartWrapper
       type="bar"
       data={data}
       height={300}
       className="w-full"
     />
   </div>
   ```

2. **Add loading states for data fetching**:
   ```typescript
   {isLoading ? (
     <div className="h-[300px] bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
       <span className="text-gray-500">Loading chart...</span>
     </div>
   ) : (
     <SSRChartWrapper type="bar" data={data} height={300} />
   )}
   ```

3. **Add error boundaries**:
   ```typescript
   <ErrorBoundary fallback={<ChartError />}>
     <SSRChartWrapper type="bar" data={data} height={300} />
   </ErrorBoundary>
   ```

4. **Consistent color schemes**:
   - Priority colors: A=Green, B=Yellow, C=Orange, D=Red
   - Segment colors: Use consistent brand colors
   - Status colors: Active=Blue, Inactive=Gray

### Files to Update
1. All dashboard components with charts
2. Reporting page components
3. Organization detail pages
4. Analytics components

### Validation
- [ ] All charts have loading states
- [ ] Consistent color schemes applied
- [ ] Error boundaries in place
- [ ] Responsive design maintained

---

## Completion Checklist

When all TODOs are completed, verify:

- [ ] `npm run typecheck` passes without errors
- [ ] `npm run build` succeeds
- [ ] All charts render properly in production build
- [ ] No console errors related to charts or types
- [ ] API responses follow consistent format
- [ ] Performance improved (faster TypeScript compilation)

## Notes for Windsurf Cascade

1. **Work in Priority Order**: Complete high-priority TODOs first as they unblock other work
2. **Test Incrementally**: Run `npm run typecheck` after each major change
3. **Preserve Functionality**: Ensure existing features work after type updates
4. **Document Issues**: If you encounter schema mismatches, note them for architectural review
5. **Performance Focus**: Watch bundle size during chart migration (`npm run analyze`)

Each TODO is designed to be independent and can be worked on in parallel where possible. The type system and validation helpers provide the foundation for all other improvements.