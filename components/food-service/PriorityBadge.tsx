import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'A' | 'B' | 'C' | 'D';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colorClass = cn({
    'bg-green-500': priority === 'A',
    'bg-yellow-500': priority === 'B',
    'bg-orange-500': priority === 'C',
    'bg-red-500': priority === 'D',
  });

  return (
    <span
      className={cn(
        'px-2 py-1 rounded-full text-xs font-semibold text-white',
        colorClass
      )}
    >
      {priority}
    </span>
  );
}
