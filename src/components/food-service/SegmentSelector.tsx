import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SegmentSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const SegmentSelector: React.FC<SegmentSelectorProps> = ({ value, onValueChange, className = '' }) => {
  const segments = [
    'Fine Dining',
    'Fast Food',
    'Healthcare',
    'Catering',
    'Institutional'
  ];

  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger className={`w-full p-3 border border-gray-300 rounded-lg ${className}`} style={{ minHeight: '44px' }} data-testid="segment-selector">
        <SelectValue placeholder="Select Segment" />
      </SelectTrigger>
      <SelectContent>
        {segments.map(segment => (
          <SelectItem key={segment} value={segment}>
            {segment}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
