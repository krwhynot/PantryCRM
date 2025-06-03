import React from 'react';
import { Badge } from "@/components/ui/badge"; // Assuming shadcn/ui is available

// Define color mapping outside component to prevent recreation on each render
const PRIORITY_COLOR_MAP = {
  'A': 'bg-green-500 text-white',
  'B': 'bg-yellow-500 text-black',
  'C': 'bg-orange-500 text-white',
  'D': 'bg-red-500 text-white'
} as const;

interface PriorityBadgeProps {
  priority: keyof typeof PRIORITY_COLOR_MAP;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className = ''
}) => {
  return (
    <Badge
      className={`inline-flex items-center justify-center rounded-full text-sm font-bold ${PRIORITY_COLOR_MAP[priority]} ${className}`}
      style={{ minWidth: '44px', minHeight: '44px' }}
      data-testid={`priority-badge-${priority}`}
    >
      {priority}
    </Badge>
  );
};
