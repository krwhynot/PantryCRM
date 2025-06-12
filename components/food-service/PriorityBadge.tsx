import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/lib/utils';

const priorityVariants = cva(
  "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset touch-target",
  {
    variants: {
      priority: {
        A: "bg-priority-a text-priority-a-foreground ring-priority-a/20",
        B: "bg-priority-b text-priority-b-foreground ring-priority-b/20",
        C: "bg-priority-c text-priority-c-foreground ring-priority-c/20",
        D: "bg-priority-d text-priority-d-foreground ring-priority-d/20",
      },
    },
    defaultVariants: {
      priority: "A",
    },
  }
)

export interface PriorityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof priorityVariants> {
  priority: 'A' | 'B' | 'C' | 'D';
}

export function PriorityBadge({ 
  className, 
  priority, 
  ...props 
}: PriorityBadgeProps) {
  return (
    <span
      className={cn(priorityVariants({ priority }), className)}
      {...props}
    >
      {priority}
    </span>
  );
}
