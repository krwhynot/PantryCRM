import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DistributorFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function DistributorField({ value, onValueChange, className = '' }: DistributorFieldProps) {
  const distributors = ['Sysco', 'USF', 'PFG', 'Direct', 'Other'];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger 
        className={`h-12 ${className}`} 
        style={{ minHeight: '44px' }} 
        data-testid="distributor-field"
      >
        <SelectValue placeholder="Select primary distributor" />
      </SelectTrigger>
      <SelectContent>
        {distributors.map(distributor => (
          <SelectItem key={distributor} value={distributor}>
            {distributor}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
