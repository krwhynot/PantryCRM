# Kitchen Pantry CRM - Bundle Optimization Guide

## Performance Requirements

- **Bundle Size Target**: < 800KB initial load
- **Page Load Time**: < 3 seconds on 3G connections
- **Touch Targets**: Minimum 44px for iPad Safari compatibility
- **Search Response**: Sub-second for organization and contact searches
- **Report Generation**: < 10 seconds for simple reports, < 30 seconds for complex analytical reports
- **Interaction Entry**: Under 30-second target time
- **Budget Constraint**: $18/month total Azure costs ($5 SQL + $13 App Service)

## Current Bundle Analysis

The Kitchen Pantry CRM project uses Next.js 15 with React 18.2.0 and is optimized for performance while maintaining a rich user experience. Our current bundle optimization focuses on:

1. **Route-based Code Splitting**: Leveraging Next.js App Router
2. **Component-level Code Splitting**: Using dynamic imports
3. **Tree-shakable Dependencies**: Selecting libraries that support tree-shaking
4. **Image Optimization**: Using Next.js Image component
5. **Font Optimization**: Using Next.js Font optimization

## Optimization Techniques

### 1. Dynamic Imports

Use dynamic imports for components that aren't needed on initial page load:

```typescript
// Before
import { ComplexChart } from '@/components/charts';

// After
import dynamic from 'next/dynamic';
const ComplexChart = dynamic(() => import('@/components/charts'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false // Use this for components that rely on browser APIs
});
```

### 2. Route Segment Configuration

Optimize page loading with route segment configuration:

```typescript
// app/dashboard/layout.tsx
export const dynamic = 'force-dynamic'; // Always fetch fresh data
export const revalidate = 60; // Revalidate cache every 60 seconds
export const fetchCache = 'force-cache'; // Force using cache
export const runtime = 'edge'; // Use Edge runtime for faster performance
```

### 3. Image Optimization

Always use the Next.js Image component for optimized images:

```typescript
import Image from 'next/image';

// Good - optimized image with proper sizing
<Image 
  src="/images/logo.png" 
  width={200} 
  height={100} 
  alt="Logo" 
  priority={true} // For above-the-fold images
/>

// Avoid - unoptimized image
<img src="/images/logo.png" alt="Logo" />
```

### 4. Dependency Alternatives

| Large Dependency | Size | Recommended Alternative | Size | Savings |
|------------------|------|-------------------------|------|---------|
| moment.js | ~232KB | date-fns | ~13KB | ~219KB |
| aws-sdk | ~400KB+ | @azure/storage-blob | ~80KB | ~320KB |
| chart.js | ~170KB | @tremor/react | ~30-80KB | ~90-140KB |
| lodash | ~70KB | lodash-es (tree-shakable) | ~20KB | ~50KB |
| @mui/material | ~300KB+ | shadcn/ui | ~0KB runtime | ~300KB |
| bootstrap | ~160KB | tailwindcss | ~10KB | ~150KB |
| jquery | ~90KB | Native DOM APIs | 0KB | ~90KB |

### 5. Server Components

Leverage React Server Components to reduce client-side JavaScript:

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // This component runs on the server
  // Any code here won't be sent to the client
  const data = await fetchDashboardData();
  
  return (
    <div>
      <DashboardHeader /> {/* Server Component */}
      <ClientSideChart data={data} /> {/* Client Component */}
    </div>
  );
}
```

### 6. Import Optimization

Optimize imports to reduce bundle size:

```typescript
// Bad - imports entire library
import { Button, Card, Table, Form, Modal } from 'some-ui-library';

// Good - granular imports
import Button from 'some-ui-library/Button';
import Card from 'some-ui-library/Card';
```

## Monitoring Bundle Size

### 1. Bundle Analysis

Run the bundle analyzer to identify large dependencies:

```bash
# Use the built-in analyzer
npm run analyze

# Use our simple analyzer
npm run analyze:simple
```

### 2. Lighthouse Performance Audits

Regularly run Lighthouse audits to check:
- First Contentful Paint (FCP): target < 1.8s
- Largest Contentful Paint (LCP): target < 2.5s
- First Input Delay (FID): target < 100ms
- Cumulative Layout Shift (CLS): target < 0.1

### 3. Performance Budget

Set a performance budget in your Next.js config:

```javascript
// next.config.js
module.exports = {
  experimental: {
    performanceBudget: {
      // Set size limits for different asset types
      assets: {
        total: 800 * 1024, // 800KB total
        js: 500 * 1024, // 500KB JavaScript
        css: 100 * 1024, // 100KB CSS
      },
    },
  },
};
```

## Azure SQL Optimization

To maintain performance within the $5/month Azure SQL Basic tier:

1. **Proper Indexing**: Create indexes on frequently queried columns
2. **Connection Pooling**: Use Prisma's connection pooling
3. **Query Optimization**: Use Prisma's select to fetch only needed fields
4. **Pagination**: Always paginate large result sets
5. **Caching**: Implement SWR for client-side data fetching with caching

## iPad Optimization

For optimal iPad experience:

1. **Touch Targets**: Minimum 44px × 44px for all interactive elements
2. **Responsive Design**: Test all views in iPad portrait and landscape modes
3. **Safari Compatibility**: Test specifically with Safari on iPad
4. **Offline Support**: Implement service workers for offline capabilities
5. **Input Optimization**: Optimize forms for touch input and virtual keyboard

## Deployment Checklist

Before deploying to production:

1. Run `npm run optimize` to deduplicate and prune dependencies
2. Run `npm run analyze` to check final bundle size
3. Test on actual iPad device to verify touch target sizes
4. Verify Azure SQL connection with minimal query times
5. Check that all critical paths work with slow 3G connection simulation

## Conclusion

By following these optimization guidelines, the Kitchen Pantry CRM project can maintain excellent performance while staying within the $18/month Azure budget constraints. Regular monitoring and optimization should be part of the development workflow to ensure continued performance as new features are added.