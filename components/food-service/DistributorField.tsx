import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DistributorFieldProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function DistributorField({ value, onValueChange }: DistributorFieldProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12">
        <SelectValue placeholder="Select primary distributor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Sysco">Sysco</SelectItem>
        <SelectItem value="USF">USF</SelectItem>
        <SelectItem value="PFG">PFG</SelectItem>
        <SelectItem value="Direct">Direct</SelectItem>
        <SelectItem value="Other">Other</SelectItem>
      </SelectContent>
    </Select>
  );
}
