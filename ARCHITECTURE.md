# Kitchen Pantry CRM - Architecture Documentation

## Overview

This document describes the comprehensive architecture designed for Kitchen Pantry CRM, a food service industry CRM optimized for Azure B1 constraints and iPad-first usage. The architecture follows strict TypeScript patterns, performance optimization principles, and mobile-first design patterns.

## Architecture Principles

### 1. Azure B1 Optimization First
- **Memory Constraint**: 1.75GB RAM with 700MB allocated for caching
- **Database Constraint**: Azure SQL Basic (5 DTU, 30 concurrent sessions)
- **Cost Constraint**: $18/month total budget
- **Performance Target**: <1000ms API response times

### 2. TypeScript Strict Mode Compliance
- Zero `any` types in production code
- Runtime validation with Zod schemas
- Comprehensive type safety from API to UI
- Type-driven development patterns

### 3. iPad-First Mobile Optimization
- 44px minimum touch targets
- Landscape-first responsive design
- Haptic feedback where supported
- Food service industry specific workflows

### 4. Performance & Reliability
- SSR-safe component architecture
- Intelligent caching with LRU eviction
- Error boundaries at every level
- Performance monitoring and optimization

---

## Core Architecture Components

### 1. Type System (`/types/crm.ts`)

**Purpose**: Comprehensive TypeScript types for the entire application.

**Key Features**:
- Food service industry specific enums and constants
- API request/response types with error handling
- Prisma model extensions with computed fields
- Search, filtering, and pagination types

**Usage Pattern**:
```typescript
import type { 
  OrganizationWithDetails,
  CreateOrganizationRequest,
  APIResponse 
} from '@/types/crm';

// API Response
const response: APIResponse<OrganizationWithDetails[]> = {
  success: true,
  data: organizations,
  meta: { total: 247, page: 1, hasMore: true }
};
```

**Integration Points**:
- All API routes must use these types
- All components must use these interfaces
- All forms must validate against these schemas

### 2. Runtime Validation (`/lib/types/validation.ts`)

**Purpose**: Zod-based runtime validation for API boundaries.

**Key Features**:
- Schema validation for all CRM entities
- Food service specific field validation
- Environment variable validation
- Error transformation utilities

**Usage Pattern**:
```typescript
import { validateCreateOrganization } from '@/lib/types/validation';

const { success, data, errors } = validateCreateOrganization(requestBody);
if (!success) {
  return handleValidationError(errors);
}
```

**Integration Rules**:
- All API routes must validate input with these functions
- All forms should use these schemas for client-side validation
- Never trust data without validation

### 3. API Response Helpers (`/lib/types/api-helpers.ts`)

**Purpose**: Consistent API response formatting and error handling.

**Key Features**:
- Standardized response builders
- Prisma error handling
- Performance monitoring utilities
- Azure B1 specific optimizations

**Usage Pattern**:
```typescript
import { 
  parseRequestBody,
  createSuccessResponse,
  handlePrismaError 
} from '@/lib/types/api-helpers';

// In API route
const { success, data, error } = await parseRequestBody(req, validateCreateOrganization);
if (!success) return handleValidationError(error);

try {
  const result = await prisma.create({ data });
  return createSuccessResponse(result);
} catch (err) {
  return handlePrismaError(err);
}
```

### 4. Performance Optimization (`/lib/performance/`)

#### Azure B1 Optimizer (`azure-b1-optimizer.ts`)
- Query complexity analysis
- Connection pool management  
- Intelligent query batching
- Performance monitoring

#### Cache Manager (`azure-b1-cache.ts`)
- LRU cache with memory pressure handling
- 700MB allocation strategy
- Cache hit rate optimization
- Compressed chart data storage

#### Optimized Prisma (`optimized-prisma.ts`)
- Performance-monitored database operations
- Automatic caching with smart invalidation
- Food service specific query optimizations
- Azure B1 constraint handling

**Usage Pattern**:
```typescript
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';

const prisma = getOptimizedPrisma();
const result = await prisma.getOrganizations(filters); // Auto-cached, optimized
```

### 5. Chart System (`/components/charts/`)

#### SSR Chart Wrapper (`SSRChartWrapper.tsx`)
- Universal chart component for all chart types
- Dynamic imports with fallbacks
- Performance optimization for Azure B1
- Error boundaries and loading states

#### Pre-configured CRM Charts
- `CRMCharts.PriorityDistribution`
- `CRMCharts.ActivityTimeline` 
- `CRMCharts.PipelineFunnel`
- `CRMCharts.SegmentPerformance`

**Usage Pattern**:
```typescript
import SSRChartWrapper, { CRMCharts } from '@/components/charts/SSRChartWrapper';

// Generic chart
<SSRChartWrapper 
  type="bar" 
  data={chartData} 
  height={300} 
  enableVirtualization={true}
/>

// Pre-configured CRM chart
<CRMCharts.PriorityDistribution data={priorityData} />
```

### 6. Food Service Components (`/components/food-service/`)

#### Core Components
- **FoodServiceLayout**: Main application layout with iPad optimization
- **OrganizationCard**: Industry-specific organization display
- **ResponsiveDataTable**: Performance-optimized data tables
- **QuickInteractionForm**: Rapid interaction logging

#### Design Patterns
- 44px minimum touch targets
- Haptic feedback integration
- Industry-specific color coding
- Accessibility compliance

---

## Development Patterns

### API Route Pattern

**File**: Follow `/app/api/crm/organizations-optimized/route.ts` pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateCreateOrganization } from '@/lib/types/validation';
import { 
  parseRequestBody,
  createSuccessResponse,
  handlePrismaError 
} from '@/lib/types/api-helpers';
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';
import type { APIResponse, OrganizationWithDetails } from '@/types/crm';

export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
  const startTime = performance.now();
  
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
    }

    // 2. Validation
    const { success, data, error } = await parseRequestBody(request, validateCreateOrganization);
    if (!success) return handleValidationError(error);

    // 3. Business Logic
    const prisma = getOptimizedPrisma();
    const result = await prisma.createOrganization(data);

    // 4. Response with Performance Headers
    const response = createSuccessResponse(result);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;
  } catch (error) {
    return handlePrismaError(error);
  }
}
```

### Component Pattern

**File**: Follow food service component patterns

```typescript
'use client';

import React, { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { OrganizationSummary } from '@/types/crm';

interface ComponentProps {
  data: OrganizationSummary;
  onAction?: (action: string, data: any) => void;
  className?: string;
}

const Component = memo(function Component({ data, onAction, className }: ComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Haptic feedback for touch interactions
  const handleTouch = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div 
      className={cn(
        'bg-white rounded-lg border transition-all duration-200',
        'hover:shadow-md active:shadow-lg',
        'min-h-[44px]', // Touch target compliance
        className
      )}
      onClick={handleTouch}
    >
      {/* Component content */}
    </div>
  );
});

export default Component;
```

### Form Pattern

**File**: Follow QuickInteractionForm pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { validateCreateOrganization } from '@/lib/types/validation';
import type { CreateOrganizationRequest } from '@/types/crm';

const Component = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<CreateOrganizationRequest>({
    resolver: zodResolver(validateCreateOrganization),
    mode: 'onChange'
  });

  const onSubmit = async (data: CreateOrganizationRequest) => {
    // Form submission with proper error handling
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields with 44px minimum height */}
    </form>
  );
};
```

---

## Performance Guidelines

### Database Queries

1. **Always use OptimizedPrisma client**
2. **Limit include depth to 3 levels maximum**
3. **Use pagination for results > 50 items**
4. **Monitor query complexity scores**
5. **Cache frequently accessed data**

### Memory Management

1. **Total cache allocation: 700MB maximum**
2. **Monitor memory usage percentage**
3. **Use virtual scrolling for large lists**
4. **Implement aggressive cleanup under pressure**

### Chart Performance

1. **Use SSRChartWrapper for all charts**
2. **Limit data points to 100 for Azure B1**
3. **Implement loading states and error boundaries**
4. **Use chart data compression for caching**

---

## Mobile Optimization

### Touch Targets
- **Minimum 44px height/width for all interactive elements**
- **8px minimum spacing between touch targets**
- **Large form inputs with 16px+ font size**

### Responsive Design
- **Landscape-first for iPad optimization**
- **Progressive enhancement for mobile**
- **Priority-based column hiding on small screens**

### Performance
- **Haptic feedback for touch interactions**
- **Smooth transitions under 300ms**
- **Lazy loading for off-screen content**

---

## Error Handling

### API Errors
```typescript
// Use standardized error responses
return createErrorResponse({
  code: ErrorCode.VALIDATION_ERROR,
  message: 'Invalid input data',
  field: 'organizationName',
  details: { validationErrors: errors }
}, 400);
```

### Component Errors
```typescript
// Wrap components in error boundaries
<ErrorBoundary
  fallback={<ComponentError />}
  onError={(error) => console.error('Component error:', error)}
>
  <YourComponent />
</ErrorBoundary>
```

### Chart Errors
```typescript
// Charts have built-in fallbacks
<SSRChartWrapper
  type="bar"
  data={data}
  fallbackComponent={CustomFallback}
/>
```

---

## Testing Patterns

### API Route Testing
```typescript
// Test with validation schemas
import { validateCreateOrganization } from '@/lib/types/validation';

test('creates organization with valid data', async () => {
  const validData = { /* valid organization data */ };
  const { success } = validateCreateOrganization(validData);
  expect(success).toBe(true);
});
```

### Component Testing
```typescript
// Test touch targets and accessibility
import { render, screen } from '@testing-library/react';
import { TouchTargetTest } from '@/components/testing/TouchTargetTest';

test('meets touch target requirements', () => {
  render(<YourComponent />);
  const buttons = screen.getAllByRole('button');
  buttons.forEach(button => {
    expect(button).toHaveMinimumSize(44);
  });
});
```

---

## Security Considerations

### Input Validation
- **Never trust client data without validation**
- **Use Zod schemas for all API boundaries**
- **Sanitize inputs for database operations**

### Authentication
- **Check session on every API route**
- **Use proper HTTP status codes**
- **Implement rate limiting for sensitive operations**

### Data Protection
- **No sensitive data in logs**
- **Secure Azure SQL connections**
- **Implement proper CORS policies**

---

## Deployment & Monitoring

### Azure B1 Monitoring
- **Track DTU usage < 80%**
- **Monitor memory usage < 85%**
- **Watch query performance > 1000ms**
- **Cache hit rates > 70%**

### Performance Metrics
- **API response times**
- **Chart render times**
- **Database query performance**
- **Memory allocation efficiency**

### Health Checks
- **Database connectivity**
- **Cache system status**
- **Chart library availability**
- **Performance thresholds**

---

## Next Steps

1. **Windsurf completes TypeScript migration** using established patterns
2. **Chart system migration** to SSRChartWrapper
3. **Performance optimization** implementation
4. **Mobile testing** on actual iPad devices
5. **Production deployment** with monitoring

This architecture provides a solid foundation for a production-ready Food Service CRM optimized for Azure B1 constraints and iPad-first usage patterns.