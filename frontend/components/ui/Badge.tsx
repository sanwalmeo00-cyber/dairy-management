import { cn } from '@/lib/format';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-sky-100 text-sky-800',
  neutral: 'bg-muted text-muted-fg',
};

export function Badge({ children, tone = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeProps['tone'] {
  const map: Record<string, BadgeProps['tone']> = {
    Active: 'success',
    Healthy: 'success',
    Ill: 'danger',
    Sick: 'danger',
    'Under Treatment': 'warning',
    Recovering: 'info',
    Pregnant: 'info',
    Sold: 'info',
    Deceased: 'neutral',
    Pending: 'warning',
    Completed: 'success',
    Failed: 'danger',
    Planned: 'neutral',
    Paid: 'success',
    Unpaid: 'danger',
    Partial: 'warning',
    'In Stock': 'success',
    'Low Stock': 'warning',
    'Out of Stock': 'danger',
    Expired: 'danger',
    'Expiring soon': 'warning',
    Ok: 'success',
    Inactive: 'neutral',
    'Up to Date': 'success',
    Due: 'warning',
    Overdue: 'danger',
    'Not Vaccinated': 'neutral',
  };
  return map[status] ?? 'default';
}
