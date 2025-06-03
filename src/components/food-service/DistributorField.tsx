import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DistributorFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const DistributorField: React.FC<DistributorFieldProps> = ({ value, onValueChange, className = '' }) => {
  const distributors = ['Sysco', 'USF', 'PFG', 'Direct', 'Other'];

  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger className={`w-full p-3 border border-gray-300 rounded-lg ${className}`} style={{ minHeight: '44px' }} data-testid="distributor-field">
        <SelectValue placeholder="Select Distributor" />
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
};
