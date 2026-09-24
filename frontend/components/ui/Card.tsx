import { cn } from '@/lib/format';
import type { ReactNode } from 'react';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-muted-fg">{label}</p>
        <p className="mt-1 truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight sm:text-2xl">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-fg">{hint}</p>}
      </div>
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
          {icon}
        </div>
      )}
    </Card>
  );
}
