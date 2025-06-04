---
description: Implement Food Service CRM features incrementally using NextCRM foundation. Develops complete vertical slices from iPad UI through API to Azure SQL Database, ensuring each feature is fully tested before proceeding.
---

# Kitchen Pantry CRM - Enhanced Feature Development

## Current Status
- **Phase 1**: ✅ COMPLETED (NextCRM + Azure SQL operational)
- **Phase 2**: 🚀 READY (Core CRM + Enhanced Features)
- **Budget**: $18/month Azure constraint

## Implementation Steps

### 1. Select Enhanced Feature
**Phase 2**: Organizations (revenue tracking), Contacts (role hierarchy), Interactions (30-sec entry), Global Search, Settings (9 categories)
**Phase 3**: Pipeline (drag-drop), Value Tracking, Enhanced Reporting

### 2. Database with Settings Integration
```sql
CREATE TABLE organizations (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) UNIQUE NOT NULL,
  priority_id INT FOREIGN KEY REFERENCES setting_options(id),
  revenue_tracking DECIMAL(10,2), -- NEW: Enhanced
  created_at DATETIME2 DEFAULT GETDATE()
);
```

### 3. API with NextCRM Patterns
```typescript
// app/api/organizations/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const org = await prisma.organization.create({
    data: body,
    include: { priority: true } // NextCRM pattern
  });
  return NextResponse.json(org);
}
```

### 4. Multi-Device Components
```typescript
// components/food-service/OrganizationForm.tsx
export function OrganizationForm() {
  return (
    <form className="space-y-6">
      <Input className="min-h-[44px] text-lg" placeholder="Name" />
      <Input className="min-h-[44px]" placeholder="Revenue" type="number" />
      <Button className="min-h-[44px] min-w-[88px]">Save</Button>
    </form>
  );
}
```

### 5. Enhanced Global Search
```typescript
// hooks/useGlobalSearch.ts - NEW
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const search = useDebouncedCallback(async (q) => {
    const res = await fetch(`/api/search/global?q=${q}`);
    setResults(await res.json());
  }, 300);
  
  return { query, setQuery, results, search };
}
```

### 6. Settings Integration (9 Categories)
```typescript
export function useSettings() {
  return {
    priorities: useSWR('/api/settings/priorities').data,
    segments: useSWR('/api/settings/segments').data,
    distributors: useSWR('/api/settings/distributors').data
  };
}
```

### 7. Multi-Device Testing
- **Touch Laptop**: Primary testing device
- **44px Touch Targets**: All interactive elements
- **Performance**: <1s search, <2s global search, <10s reports
- **Input Switching**: Touch/mouse transitions

### 8. Azure Optimization
```typescript
const cache = new Map();
export async function getCachedOrgs() {
  if (cache.has('orgs')) return cache.get('orgs');
  const orgs = await prisma.organization.findMany();
  cache.set('orgs', orgs, 300000);
  return orgs;
}
```

### 9. Quality Gate Validation
- ✅ Multi-device functionality verified
- ✅ Performance targets met
- ✅ NextCRM patterns preserved
- ✅ Azure cost under $18/month
- ✅ Food service requirements satisfied

### 10. Integration Testing
- Feature integration with NextCRM
- Data relationship validation
- Error handling and edge cases
- Performance regression testing
- Multi-device workflow verification

## Success Criteria
- ✅ Complete vertical slice implementation
- ✅ Multi-device optimization verified
- ✅ Performance targets achieved
- ✅ NextCRM foundation compliance
- ✅ Azure budget maintained
- ✅ Quality gate requirements passed

## Food Service Requirements
- **11 Principals**: Kaufholds, Frites Street, Better Balance, VAF, Ofk, Annasea, Wicks, RJC, Kayco, Abdale, Land Lovers
- **6 Interaction Types**: Email, Call, In Person, Demo/sampled, Quoted price, Follow-up
- **5-Stage Pipeline**: Lead-discovery → Contacted → Sampled/Visited → Follow-up → Close
- **9 Settings**: Priority, Segment, Distributor, Account Manager, Stage, Position, Reason, Source, Interaction

## Enhanced Features
- ✨ Global Search across all entities
- ✨ Revenue tracking and organization values
- ✨ Drag-and-drop pipeline management
- ✨ Enhanced dashboard with exports
- ✨ Cross-browser compatibility testing

## NextCRM Compliance
- Preserve shadcn/ui + Tremor charts integration
- Maintain SWR data fetching patterns
- Use established component structure
- Follow Azure SQL optimization strategies