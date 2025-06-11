'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { LoadingComponent } from '@/components/LoadingComponent';

// Dynamically import the heavy OrganizationSearch component
const OrganizationSearch = dynamic(
  () => import('@/components/organizations/OrganizationSearch').then(mod => ({ default: mod.OrganizationSearch })),
  {
    loading: () => <LoadingComponent />,
    ssr: false, // Disable SSR for this component to improve initial page load
  }
);

export default function OrganizationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Organizations</h1>
      <Suspense fallback={<LoadingComponent />}>
        <OrganizationSearch />
      </Suspense>
    </div>
  );
}
