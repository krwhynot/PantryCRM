---
description: Implement Food Service CRM features incrementally using NextCRM foundation. Develops complete vertical slices from iPad UI through API to Azure SQL Database, ensuring each feature is fully tested before proceeding.
---

# Food Service CRM - Feature Development

## Description
Implement individual CRM features as complete vertical slices from iPad UI through API to Azure SQL Database, ensuring NextCRM foundation compliance.

## Prerequisites
- Foundation setup completed
- Blueprint planning approved
- Development environment configured
- Feature requirements prioritized

## Steps

### 1. Select Feature from Backlog
Choose prioritized feature slice:
- **Foundation**: Authentication, Navigation, Dashboard
- **Core**: Organizations, Contacts, Interactions
- **Advanced**: Pipeline, Reporting, Settings
- **Migration**: Excel Import, Production Optimization

### 2. Implement Database Layer
-- Example: Organization feature
CREATE TABLE organizations (
id INT IDENTITY(1,1) PRIMARY KEY,
name NVARCHAR(255) UNIQUE NOT NULL,
priority_id INT FOREIGN KEY REFERENCES setting_options(id),
segment_id INT FOREIGN KEY REFERENCES setting_options(id),
distributor_id INT FOREIGN KEY REFERENCES setting_options(id),
account_manager_id INT FOREIGN KEY REFERENCES setting_options(id),
created_at DATETIME2 DEFAULT GETDATE(),
updated_at DATETIME2 DEFAULT GETDATE()
);

text

### 3. Create API Endpoints
// app/api/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const organizationSchema = z.object({
name: z.string().min(1).max(255),
priorityId: z.number(),
segmentId: z.number(),
distributorId: z.number(),
accountManagerId: z.number(),
});

export async function POST(request: NextRequest) {
try {
const body = await request.json();
const validatedData = organizationSchema.parse(body);

text
const organization = await prisma.organization.create({
  data: validatedData,
});

return NextResponse.json(organization);
} catch (error) {
return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
}
}

text

### 4. Build iPad-Optimized Components
// components/OrganizationForm.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function OrganizationForm() {
return (
<form className="space-y-6">
<Input
placeholder="Organization Name"
className="min-h-11 text-lg" // iPad optimization
/>
<Select>
<SelectTrigger className="min-h-11">
<SelectValue placeholder="Select Priority" />
</SelectTrigger>
</Select>
<Button
type="submit"
className="min-h-11 min-w-24 text-lg" // iPad touch targets
>
Save Organization
</Button>
</form>
);
}

text

### 5. Implement Search Functionality
// hooks/useOrganizationSearch.ts
import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function useOrganizationSearch() {
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(false);

const debouncedSearch = useDebouncedCallback(async (searchQuery) => {
if (!searchQuery) return;

text
setLoading(true);
const response = await fetch(`/api/organizations/search?q=${searchQuery}`);
const data = await response.json();
setResults(data);
setLoading(false);
}, 300); // 300ms debounce for performance

useEffect(() => {
debouncedSearch(query);
}, [query, debouncedSearch]);

return { query, setQuery, results, loading };
}

text

### 6. Add Settings Integration
// hooks/useSettings.ts
export function useSettings() {
const { data: priorities } = useSWR('/api/settings/priorities');
const { data: segments } = useSWR('/api/settings/segments');
const { data: distributors } = useSWR('/api/settings/distributors');

return {
priorities: priorities || [],
segments: segments || [],
distributors: distributors || [],
};
}

text

### 7. Test iPad Compatibility
- Test on actual iPad devices (iPad Air, iPad Pro)
- Validate landscape orientation layouts
- Verify touch target sizes (44px minimum)
- Test auto-complete performance (<500ms)
- Validate form submission flows

### 8. Performance Optimization
// Implement caching and optimization
const organizationCache = new Map();

export async function getOrganizations() {
const cacheKey = 'organizations';

if (organizationCache.has(cacheKey)) {
return organizationCache.get(cacheKey);
}

const organizations = await prisma.organization.findMany({
include: {
priority: true,
segment: true,
distributor: true,
},
});

organizationCache.set(cacheKey, organizations);
return organizations;
}

text

### 9. Integration Testing
- Test feature with existing components
- Validate data relationships
- Confirm error handling
- Test edge cases and validation

### 10. Documentation Update
Document completed feature:
- API endpoint specifications
- Component usage examples
- Database schema changes
- Performance benchmarks
- iPad optimization notes

## Success Criteria
- Feature implemented as complete vertical slice
- iPad optimization verified on actual devices
- Performance targets met (<1s search, <10s reports)
- Integration testing passed
- Documentation complete and current
4. Production Deployment Workflow

