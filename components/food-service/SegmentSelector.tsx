import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SegmentSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function SegmentSelector({ value, onValueChange }: SegmentSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12">
        <SelectValue placeholder="Select market segment" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Fine Dining">Fine Dining</SelectItem>
        <SelectItem value="Fast Food">Fast Food</SelectItem>
        <SelectItem value="Healthcare">Healthcare</SelectItem>
        <SelectItem value="Catering">Catering</SelectItem>
        <SelectItem value="Institutional">Institutional</SelectItem>
      </SelectContent>
    </Select>
  );
}
