'use client';

import { use } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Organization } from '@/lib/organizations';

interface OrganizationSelectProps {
  organizationsPromise: Promise<Organization[]>;
  preselectedOrganizationId?: string;
  disabled?: boolean;
}

export function OrganizationSelect({ 
  organizationsPromise, 
  preselectedOrganizationId, 
  disabled 
}: OrganizationSelectProps) {
  const organizations = use(organizationsPromise);

  return (
    <div className="space-y-2">
      <Label htmlFor="organizationId">Organization *</Label>
      <Select 
        name="organizationId"
        defaultValue={preselectedOrganizationId || ''}
        disabled={disabled || !!preselectedOrganizationId}
        required
      >
        <SelectTrigger className="min-h-[44px]">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}