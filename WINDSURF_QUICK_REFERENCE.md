# Windsurf Quick Reference Guide

## Essential Imports for Common Tasks

### API Route Development
```typescript
// Core imports for API routes
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Validation and helpers
import { validateCreateOrganization, validateUpdateOrganization } from '@/lib/types/validation';
import { 
  parseRequestBody,
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  handlePrismaError,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';

// Performance optimized Prisma
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';

// Types
import type { APIResponse, OrganizationWithDetails } from '@/types/crm';
```

### Component Development
```typescript
// React essentials
import React, { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Form handling
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Types
import type { OrganizationSummary, ContactWithDetails } from '@/types/crm';
```

### Chart Migration
```typescript
// Chart system
import SSRChartWrapper, { CRMCharts } from '@/components/charts/SSRChartWrapper';
import type { ChartDataPoint } from '@/types/crm';

// Replace all direct chart imports with SSRChartWrapper
```

---

## Common Fix Patterns

### 1. API Route TypeScript Fixes

**Problem**: TypeScript errors in API routes
**Solution**: Follow this exact pattern

```typescript
export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
  const startTime = performance.now();
  
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    // 2. Validation
    const { success, data, error } = await parseRequestBody(
      request, 
      validateCreateOrganization
    );
    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // 3. Database operation
    const prisma = getOptimizedPrisma();
    const result = await prisma.createOrganization(data);

    // 4. Response
    const response = createSuccessResponse(result);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}
```

### 2. Prisma Schema Field Fixes

**Common Errors and Fixes**:
```typescript
// ❌ Wrong field names
organization.description     // Use: organization.notes
organization.addressLine1    // Use: organization.address  
organization.postalCode      // Use: organization.zipCode
organization.isActive        // Remove: doesn't exist in schema
organization.accountManagerId // Remove: doesn't exist in schema
contact.title               // Use: contact.position

// ✅ Correct field usage
organization.notes
organization.address
organization.zipCode
contact.position
```

### 3. Chart Component Migration

**Before** (Remove this pattern):
```typescript
import { BarChart, LineChart, DonutChart } from '@tremor/react';

<BarChart 
  data={data} 
  index="name" 
  categories={["value"]}
/>
```

**After** (Use this pattern):
```typescript
import SSRChartWrapper from '@/components/charts/SSRChartWrapper';
import type { ChartDataPoint } from '@/types/crm';

// Transform data to ChartDataPoint format
const chartData: ChartDataPoint[] = data.map(item => ({
  name: item.name,
  value: item.value,
  category: item.category || 'default'
}));

<SSRChartWrapper 
  type="bar" 
  data={chartData} 
  height={300}
  enableVirtualization={true}
/>
```

### 4. Type Replacements

**Replace these `any` types**:
```typescript
// ❌ Before
props: any
data: any
response: any
error: any

// ✅ After
props: { organizations: OrganizationSummary[] }
data: OrganizationWithDetails[]
response: APIResponse<OrganizationWithDetails>
error: AppError
```

---

## Required Field Mapping

### Organization Model Fields (Prisma Schema)
```typescript
// ✅ Available fields in Prisma schema
{
  id: string;
  name: string;
  priority: string;        // A, B, C, D
  segment: string;         // REQUIRED! (FINE_DINING, FAST_FOOD, etc.)
  type: string;           // PROSPECT, CUSTOMER, INACTIVE
  address?: string;       // NOT addressLine1
  city?: string;
  state?: string;
  zipCode?: string;       // NOT postalCode
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;         // NOT description
  estimatedRevenue?: number;
  employeeCount?: number;
  primaryContact?: string;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  status: string;         // ACTIVE, INACTIVE, LEAD
  createdAt: Date;
  updatedAt: Date;
}

// ❌ Fields that DON'T exist
// isActive (use status instead)
// description (use notes instead)
// addressLine1 (use address instead)
// postalCode (use zipCode instead)
// country (not in schema)
// accountManagerId (not in schema)
```

### Contact Model Fields
```typescript
// ✅ Available fields
{
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;      // NOT title
  isPrimary: boolean;
  notes?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ❌ Fields that DON'T exist
// title (use position instead)
```

---

## Validation Schema Usage

### Organization Creation
```typescript
import { validateCreateOrganization } from '@/lib/types/validation';

const { success, data, errors } = validateCreateOrganization({
  name: "Restaurant Name",
  priority: "A",
  segment: "FINE_DINING",  // REQUIRED!
  type: "PROSPECT",
  address: "123 Main St",
  zipCode: "12345",        // NOT postalCode
  notes: "Description"     // NOT description
});
```

### Contact Creation
```typescript
import { validateCreateContact } from '@/lib/types/validation';

const { success, data, errors } = validateCreateContact({
  firstName: "John",
  lastName: "Doe", 
  position: "Manager",     // NOT title
  organizationId: "org-id"
});
```

---

## Performance Requirements

### Touch Targets (Mobile)
```typescript
// ✅ Minimum 44px height for interactive elements
<Button className="min-h-[44px]">Click Me</Button>
<Input className="min-h-[44px]" />

// ✅ Proper spacing between touch targets
<div className="space-y-2"> {/* 8px minimum */}
```

### Chart Performance
```typescript
// ✅ Limit data points for Azure B1
const optimizedData = data.slice(0, 100); // Max 100 points

// ✅ Use virtualization for large datasets
<SSRChartWrapper 
  enableVirtualization={true}
  maxDataPoints={100}
/>
```

---

## Testing Commands

```bash
# Check TypeScript errors
npm run typecheck

# Test specific component
npm run test -- ComponentName

# Build verification
npm run build

# Check bundle size
npm run analyze

# Performance testing
npm run test:performance
```

---

## Common Error Solutions

### 1. "Property 'segment' is missing"
**Fix**: Add segment field to organization creation
```typescript
const organizationData = {
  ...otherFields,
  segment: "CASUAL_DINING" // Required field
};
```

### 2. "Property 'isActive' does not exist"
**Fix**: Remove isActive usage, use status instead
```typescript
// ❌ Remove
data.isActive = true;

// ✅ Use
data.status = "ACTIVE";
```

### 3. "Type 'any' is not assignable"
**Fix**: Import proper types
```typescript
import type { OrganizationWithDetails } from '@/types/crm';

const data: OrganizationWithDetails = result;
```

### 4. Chart import errors
**Fix**: Replace with SSRChartWrapper
```typescript
// ❌ Remove direct imports
import { BarChart } from '@tremor/react';

// ✅ Use SSRChartWrapper
import SSRChartWrapper from '@/components/charts/SSRChartWrapper';
```

---

## File Locations Reference

```
Types and Validation:
├── /types/crm.ts                      # All CRM types
├── /lib/types/validation.ts           # Zod schemas
└── /lib/types/api-helpers.ts          # API utilities

Performance:
├── /lib/performance/optimized-prisma.ts   # Database client
├── /lib/performance/azure-b1-cache.ts     # Caching system
└── /lib/performance/azure-b1-optimizer.ts # Query optimization

Charts:
├── /components/charts/SSRChartWrapper.tsx # Main chart component
├── /components/charts/fallback/           # Fallback components
└── /components/charts/optimized/          # Optimized implementations

Examples:
├── /app/api/crm/organizations-optimized/route.ts # Reference API route
└── /components/food-service/              # Reference components
```

---

## Quick Checklist for Each TODO

### Before Starting a TODO:
- [ ] Read the TODO description completely
- [ ] Check the pattern location file
- [ ] Import required dependencies
- [ ] Follow the exact pattern shown

### While Working:
- [ ] Run `npm run typecheck` frequently
- [ ] Follow TypeScript strict mode (no `any` types)
- [ ] Use proper field names from schema
- [ ] Maintain 44px minimum touch targets

### Before Completing:
- [ ] Test with `npm run typecheck`
- [ ] Verify build with `npm run build`
- [ ] Check pattern compliance
- [ ] Update TODO status

This quick reference should cover 90% of the patterns you'll need while working on the TODOs.