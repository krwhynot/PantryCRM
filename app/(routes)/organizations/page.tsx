'use client';

import { OrganizationSearch } from '@/components/organizations/OrganizationSearch';

export default function OrganizationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Organizations</h1>
      <OrganizationSearch />
    </div>
  );
}
